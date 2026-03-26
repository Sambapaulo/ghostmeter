import { NextRequest, NextResponse } from 'next/server';

// AI Coach API - GhostMeter v1.6.0

interface CoachRequest {
  message: string;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  context?: {
    relationshipType?: string;
    currentSituation?: string;
    analysisScore?: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: CoachRequest = await request.json();
    const { message, conversationHistory = [], context } = body;

    if (!message || message.trim().length < 2) {
      return NextResponse.json({ error: 'Message trop court' }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ 
        success: true, 
        reply: getFallbackCoachReply(message, context),
        fallback: true
      });
    }

    const contextInfo = buildContextInfo(context);

    const systemPrompt = `Tu es un coach en relations sentimentales expérimenté, empathique et direct. Tu aides les gens à naviguer dans leurs relations amoureuses et leurs situations compliquées (crush, ex, situationship, talking stage, etc.).

TON STYLE:
- Direct mais bienveillant
- Tu donnes des conseils ACTIONNABLES
- Tu poses des questions pour mieux comprendre
- Tu ne juges jamais
- Tu utilises un langage naturel et accessible
- Tu peux être un peu taquin si approprié

TES MISSIONS:
1. Aider à comprendre les signaux (intérêts, ghosting, manipulation)
2. Donner des conseils sur les actions à entreprendre
3. Analyser des situations spécifiques
4. Boost la confiance en soi quand nécessaire
5. Être réaliste sur les situations difficiles

EXEMPLES DE CONSEILS:
- "Là clairement, il/elle joue avec toi. Mon conseil : prends du recul"
- "Tu devrais lui proposer quelque chose de concret. Ça fait 2 semaines que vous parlez, bouge !"
- "Le signal est positif ! Fonce, propose un rendez-vous"
- "T'inquiète pas, le ghosting de 3 jours c'est rien. Attends encore un peu"
- "Cette personne t'envoie des signaux contradictoires. Demande-lui ce qu'elle veut vraiment"`;

    const userPrompt = `${contextInfo}

Message de l'utilisateur: "${message}"

Réponds en tant que coach relationnel:`;

    // Construire l'historique de conversation
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt }
    ];

    // Ajouter l'historique (max 10 messages précédents)
    const recentHistory = conversationHistory.slice(-10);
    for (const msg of recentHistory) {
      messages.push(msg);
    }

    messages.push({ role: 'user', content: userPrompt });

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: messages,
        temperature: 0.85,
        max_tokens: 400
      })
    });

    if (!response.ok) {
      console.error('Groq error:', response.status);
      return NextResponse.json({ 
        success: true, 
        reply: getFallbackCoachReply(message, context),
        fallback: true
      });
    }

    const data = await response.json();
    let reply = data.choices?.[0]?.message?.content?.trim() || '';

    if (!reply || reply.length < 10) {
      return NextResponse.json({ 
        success: true, 
        reply: getFallbackCoachReply(message, context),
        fallback: true
      });
    }

    return NextResponse.json({
      success: true,
      reply: reply
    });

  } catch (error) {
    console.error('Coach error:', error);
    return NextResponse.json({ 
      success: true, 
      reply: getFallbackCoachReply('', {}),
      fallback: true
    });
  }
}

function buildContextInfo(context?: CoachRequest['context']): string {
  if (!context) return "Contexte: Première conversation avec l'utilisateur.";
  
  let info = "Contexte de l'utilisateur:";
  
  if (context.relationshipType) {
    const types: Record<string, string> = {
      crush: "il/elle a un crush",
      ex: "il/elle parle de son/sa ex",
      new: "nouvelle relation qui débute",
      talking: "talking stage",
      situationship: "situationship",
      friend: "relation amicale"
    };
    info += `\n- Type de relation: ${types[context.relationshipType] || context.relationshipType}`;
  }
  
  if (context.currentSituation) {
    info += `\n- Situation actuelle: ${context.currentSituation}`;
  }
  
  if (context.analysisScore !== undefined) {
    info += `\n- Score d'analyse récent: ${context.analysisScore}/100`;
    if (context.analysisScore >= 70) {
      info += " (signaux positifs)";
    } else if (context.analysisScore >= 40) {
      info += " (signaux mitigés)";
    } else {
      info += " (signaux négatifs)";
    }
  }
  
  return info;
}

function getFallbackCoachReply(message: string, context?: CoachRequest['context']): string {
  const lower = message.toLowerCase();
  
  // Réponses contextuelles basiques
  if (lower.includes('dois faire') || lower.includes('dois-je faire') || lower.includes("qu'est-ce que je")) {
    return "Là je peux pas te dire précisément sans plus de contexte. Raconte-moi ce qui se passe exactement : depuis combien de temps vous parlez, quels signaux tu reçois, et ce qui t'inquiète ?";
  }
  
  if (lower.includes('ghost') || lower.includes('répond pas') || lower.includes('silence')) {
    return "Ah le ghosting... C'est jamais évident. Combien de temps ça dure ? Et c'était quoi votre dernier échange ? Donne-moi plus de détails et je te dirai ce que je pense de la situation.";
  }
  
  if (lower.includes('répondre') || lower.includes('réponse')) {
    return "Pour t'aider à répondre, j'ai besoin de savoir : qu'est-ce qu'il/elle t'a envoyé ? Et quelle est la vibe générale de votre conversation ?";
  }
  
  if (lower.includes('signe') || lower.includes('signal') || lower.includes('intéressé')) {
    return "Les signaux c'est subtil ! Raconte-moi comment se passent vos conversations : c'est lui/elle qui initie ? Les réponses sont longues ? Il/elle pose des questions ?";
  }
  
  if (lower.includes('ex') || lower.includes('break')) {
    return "Parler d'ex c'est toujours délicat. Tu veux reconquérir ton ex ou tu essaies de tourner la page ? Dis-moi en plus.";
  }
  
  if (lower.includes('rencontrer') || lower.includes('voir') || lower.includes('rendez-vous')) {
    return "Tu veux le/la rencontrer ? C'est une bonne étape ! Depuis combien de temps vous parlez ? Et vous avez déjà évoqué le fait de vous voir ?";
  }
  
  // Défaut
  return "Je suis là pour t'aider ! Dis-moi ce qui se passe dans ta situation : tu parles avec qui ? Qu'est-ce qui t'inquiète ou t'embête ?";
}
