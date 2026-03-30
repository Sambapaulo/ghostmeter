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
  language?: string; // fr, en, de, es
}

// System prompts in different languages
const systemPrompts: Record<string, string> = {
  fr: `Tu es un coach en relations sentimentales expérimenté, empathique et direct. Tu aides les gens à naviguer dans leurs relations amoureuses et leurs situations compliquées (crush, ex, situationship, talking stage, etc.).

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
- "Cette personne t'envoie des signaux contradictoires. Demande-lui ce qu'elle veut vraiment"

IMPORTANT: Réponds TOUJOURS en français.`,

  en: `You are an experienced relationship coach, empathetic and direct. You help people navigate their romantic relationships and complicated situations (crush, ex, situationship, talking stage, etc.).

YOUR STYLE:
- Direct but caring
- You give ACTIONABLE advice
- You ask questions to better understand
- You never judge
- You use natural and accessible language
- You can be a bit playful if appropriate

YOUR MISSIONS:
1. Help understand signals (interest, ghosting, manipulation)
2. Give advice on actions to take
3. Analyze specific situations
4. Boost confidence when needed
5. Be realistic about difficult situations

EXAMPLE ADVICE:
- "Clearly, he/she is playing with you. My advice: take a step back"
- "You should propose something concrete. You've been talking for 2 weeks, make a move!"
- "The signal is positive! Go for it, propose a date"
- "Don't worry, 3 days of ghosting is nothing. Wait a bit more"
- "This person is sending mixed signals. Ask them what they really want"

IMPORTANT: ALWAYS respond in English.`,

  de: `Du bist ein erfahrener Beziehungscoach, empathisch und direkt. Du hilfst Menschen, ihre romantischen Beziehungen und komplizierten Situationen zu navigieren (Schwarm, Ex, Situationship, Talking Stage usw.).

DEIN STIL:
- Direkt aber fürsorglich
- Du gibst UMSETZBARE Ratschläge
- Du stellst Fragen, um besser zu verstehen
- Du verurteilst nie
- Du verwendest eine natürliche und zugängliche Sprache
- Du kannst etwas verspielt sein, wenn angebracht

DEINE MISSIONEN:
1. Helfen, Signale zu verstehen (Interesse, Ghosting, Manipulation)
2. Ratschläge zu Handlungen geben
3. Spezifische Situationen analysieren
4. Selbstvertrauen stärken, wenn nötig
5. Realistisch bei schwierigen Situationen sein

BEISPIELRATSCHLÄGE:
- "Klar, er/sie spielt mit dir. Mein Rat: Nimm etwas Abstand"
- "Du solltest etwas Konkretes vorschlagen. Ihr redet seit 2 Wochen, mach einen Zug!"
- "Das Signal ist positiv! Geh drauf zu, schlag ein Treffen vor"
- "Keine Sorge, 3 Tage Ghosting ist nichts. Warte noch etwas"
- "Diese Person sendet gemischte Signale. Frag sie, was sie wirklich will"

WICHTIG: Antworte IMMER auf Deutsch.`,

  es: `Eres un coach de relaciones experimentado, empático y directo. Ayudas a las personas a navegar sus relaciones románticas y situaciones complicadas (crush, ex, situationship, talking stage, etc.).

TU ESTILO:
- Directo pero cariñoso
- Das consejos ACCIONABLES
- Haces preguntas para entender mejor
- Nunca juzgas
- Usas un lenguaje natural y accesible
- Puedes ser un poco juguetón si es apropiado

TUS MISIONES:
1. Ayudar a entender señales (interés, ghosting, manipulación)
2. Dar consejos sobre acciones a tomar
3. Analizar situaciones específicas
4. Aumentar la confianza cuando sea necesario
5. Ser realista sobre situaciones difíciles

EJEMPLOS DE CONSEJOS:
- "Claramente, él/ella está jugando contigo. Mi consejo: toma un paso atrás"
- "Deberías proponer algo concreto. Llevan 2 semanas hablando, ¡haz un movimiento!"
- "¡La señal es positiva! Ve por ello, propón una cita"
- "No te preocupes, 3 días de ghosting no es nada. Espera un poco más"
- "Esta persona está enviando señales mixtas. Pregúntale qué quiere realmente"

IMPORTANTE: Responde SIEMPRE en español.`
};

export async function POST(request: NextRequest) {
  try {
    const body: CoachRequest = await request.json();
    const { message, conversationHistory = [], context, language = 'fr' } = body;

    if (!message || message.trim().length < 2) {
      return NextResponse.json({ error: 'Message trop court' }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ 
        success: true, 
        reply: getFallbackCoachReply(message, context, language),
        fallback: true
      });
    }

    const contextInfo = buildContextInfo(context, language);
    const systemPrompt = systemPrompts[language] || systemPrompts['fr'];

    const userPrompt = `${contextInfo}

${language === 'fr' ? "Message de l'utilisateur" : language === 'en' ? "User's message" : language === 'de' ? "Nachricht des Benutzers" : "Mensaje del usuario"}: "${message}"`;

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
        reply: getFallbackCoachReply(message, context, language),
        fallback: true
      });
    }

    const data = await response.json();
    let reply = data.choices?.[0]?.message?.content?.trim() || '';

    if (!reply || reply.length < 10) {
      return NextResponse.json({ 
        success: true, 
        reply: getFallbackCoachReply(message, context, language),
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
      reply: getFallbackCoachReply('', {}, 'fr'),
      fallback: true
    });
  }
}

function buildContextInfo(context?: CoachRequest['context'], language: string = 'fr'): string {
  if (!context) {
    return language === 'fr' ? "Contexte: Première conversation avec l'utilisateur." 
      : language === 'en' ? "Context: First conversation with the user."
      : language === 'de' ? "Kontext: Erste Unterhaltung mit dem Benutzer."
      : "Contexto: Primera conversación con el usuario.";
  }
  
  const labels = {
    fr: {
      context: "Contexte de l'utilisateur:",
      relationType: "- Type de relation:",
      currentSit: "- Situation actuelle:",
      recentScore: "- Score d'analyse récent:",
      positive: "(signaux positifs)",
      mixed: "(signaux mitigés)",
      negative: "(signaux négatifs)"
    },
    en: {
      context: "User's context:",
      relationType: "- Relationship type:",
      currentSit: "- Current situation:",
      recentScore: "- Recent analysis score:",
      positive: "(positive signals)",
      mixed: "(mixed signals)",
      negative: "(negative signals)"
    },
    de: {
      context: "Kontext des Benutzers:",
      relationType: "- Beziehungsart:",
      currentSit: "- Aktuelle Situation:",
      recentScore: "- Letzter Analyse-Score:",
      positive: "(positive Signale)",
      mixed: "(gemischte Signale)",
      negative: "(negative Signale)"
    },
    es: {
      context: "Contexto del usuario:",
      relationType: "- Tipo de relación:",
      currentSit: "- Situación actual:",
      recentScore: "- Puntuación de análisis reciente:",
      positive: "(señales positivas)",
      mixed: "(señales mixtas)",
      negative: "(señales negativas)"
    }
  };
  
  const l = labels[language] || labels['fr'];
  let info = l.context;
  
  if (context.relationshipType) {
    const types: Record<string, Record<string, string>> = {
      fr: { crush: "il/elle a un crush", ex: "il/elle parle de son/sa ex", new: "nouvelle relation qui débute", talking: "talking stage", situationship: "situationship", friend: "relation amicale" },
      en: { crush: "he/she has a crush", ex: "he/she is talking about their ex", new: "new relationship starting", talking: "talking stage", situationship: "situationship", friend: "friendship" },
      de: { crush: "er/sie hat einen Schwarm", ex: "er/sie spricht über seinen/ihren Ex", new: "neue Beziehung beginnt", talking: "Talking Stage", situationship: "Situationship", friend: "Freundschaft" },
      es: { crush: "tiene un amor secreto", ex: "habla de su ex", new: "nueva relación comenzando", talking: "talking stage", situationship: "situationship", friend: "amistad" }
    };
    const typeLabels = types[language] || types['fr'];
    info += `\n${l.relationType} ${typeLabels[context.relationshipType] || context.relationshipType}`;
  }
  
  if (context.currentSituation) {
    info += `\n${l.currentSit} ${context.currentSituation}`;
  }
  
  if (context.analysisScore !== undefined) {
    info += `\n${l.recentScore} ${context.analysisScore}/100`;
    if (context.analysisScore >= 70) {
      info += ` ${l.positive}`;
    } else if (context.analysisScore >= 40) {
      info += ` ${l.mixed}`;
    } else {
      info += ` ${l.negative}`;
    }
  }
  
  return info;
}

function getFallbackCoachReply(message: string, context?: CoachRequest['context'], language: string = 'fr'): string {
  const lower = message.toLowerCase();
  
  const fallbacks: Record<string, Record<string, string[]>> = {
    fr: {
      whatDo: ["Là je peux pas te dire précisément sans plus de contexte. Raconte-moi ce qui se passe exactement : depuis combien de temps vous parlez, quels signaux tu reçois, et ce qui t'inquiète ?"],
      ghost: ["Ah le ghosting... C'est jamais évident. Combien de temps ça dure ? Et c'était quoi votre dernier échange ? Donne-moi plus de détails et je te dirai ce que je pense de la situation."],
      reply: ["Pour t'aider à répondre, j'ai besoin de savoir : qu'est-ce qu'il/elle t'a envoyé ? Et quelle est la vibe générale de votre conversation ?"],
      signals: ["Les signaux c'est subtil ! Raconte-moi comment se passent vos conversations : c'est lui/elle qui initie ? Les réponses sont longues ? Il/elle pose des questions ?"],
      ex: ["Parler d'ex c'est toujours délicat. Tu veux reconquérir ton ex ou tu essaies de tourner la page ? Dis-moi en plus."],
      meet: ["Tu veux le/la rencontrer ? C'est une bonne étape ! Depuis combien de temps vous parlez ? Et vous avez déjà évoqué le fait de vous voir ?"],
      default: ["Je suis là pour t'aider ! Dis-moi ce qui se passe dans ta situation : tu parles avec qui ? Qu'est-ce qui t'inquiète ou t'embête ?"]
    },
    en: {
      whatDo: ["I can't tell you precisely without more context. Tell me exactly what's happening: how long have you been talking, what signals are you receiving, and what's worrying you?"],
      ghost: ["Ah ghosting... It's never easy. How long has it been? And what was your last exchange? Give me more details and I'll tell you what I think about the situation."],
      reply: ["To help you reply, I need to know: what did he/she send you? And what's the general vibe of your conversation?"],
      signals: ["Signals are subtle! Tell me how your conversations go: does he/she initiate? Are the replies long? Does he/she ask questions?"],
      ex: ["Talking about an ex is always delicate. Do you want to win your ex back or are you trying to move on? Tell me more."],
      meet: ["You want to meet him/her? That's a good step! How long have you been talking? And have you already talked about meeting up?"],
      default: ["I'm here to help! Tell me what's going on in your situation: who are you talking to? What's worrying or bothering you?"]
    },
    de: {
      whatDo: ["Ich kann dir ohne mehr Kontext nichts Genaueres sagen. Erzähl mir genau, was passiert: Wie lange redet ihr schon, welche Signale erhältst du und was macht dir Sorgen?"],
      ghost: ["Ah, Ghosting... Das ist nie einfach. Wie lange dauert es schon? Und was war euer letzter Austausch? Gib mir mehr Details und ich sage dir, was ich von der Situation halte."],
      reply: ["Um dir bei der Antwort zu helfen, muss ich wissen: Was hat er/sie dir geschickt? Und wie ist die allgemeine Stimmung eurer Unterhaltung?"],
      signals: ["Signale sind subtil! Erzähl mir, wie eure Gespräche laufen: Initiiert er/sie? Sind die Antworten lang? Stellt er/sie Fragen?"],
      ex: ["Über einen Ex zu sprechen ist immer heikel. Willst du deinen Ex zurückgewinnen oder versuchst du, weiterzuziehen? Erzähl mir mehr."],
      meet: ["Du willst ihn/sie treffen? Das ist ein guter Schritt! Wie lange redet ihr schon? Und habt ihr schon darüber gesprochen, euch zu treffen?"],
      default: ["Ich bin hier, um zu helfen! Sag mir, was in deiner Situation passiert: Mit wem redest du? Was macht dir Sorgen oder ärgert dich?"]
    },
    es: {
      whatDo: ["No puedo decirte precisamente sin más contexto. Cuéntame exactamente qué pasa: hace cuánto tiempo están hablando, qué señales recibes y qué te preocupa."],
      ghost: ["Ah, el ghosting... Nunca es fácil. ¿Cuánto tiempo lleva? ¿Y cuál fue su último intercambio? Dame más detalles y te diré qué pienso de la situación."],
      reply: ["Para ayudarte a responder, necesito saber: ¿qué te envió él/ella? ¿Y cuál es la vibra general de vuestra conversación?"],
      signals: ["¡Las señales son sutiles! Cuéntame cómo son vuestras conversaciones: ¿él/ella inicia? ¿Las respuestas son largas? ¿Hace preguntas?"],
      ex: ["Hablar de un ex siempre es delicado. ¿Quieres reconquistar a tu ex o estás intentando pasar página? Cuéntame más."],
      meet: ["¿Quieres conocerle/la? ¡Es un buen paso! ¿Desde cuándo están hablando? ¿Y ya han hablado de verse?"],
      default: ["¡Estoy aquí para ayudar! Cuéntame qué pasa en tu situación: ¿con quién hablas? ¿Qué te preocupa o molesta?"]
    }
  };
  
  const langFallbacks = fallbacks[language] || fallbacks['fr'];
  
  if (lower.includes('dois faire') || lower.includes('dois-je faire') || lower.includes("qu'est-ce que je") || lower.includes('should i') || lower.includes('what should') || lower.includes('was soll') || lower.includes('qué debo') || lower.includes('qué debería')) {
    return langFallbacks.whatDo[0];
  }
  
  if (lower.includes('ghost') || lower.includes('répond pas') || lower.includes('silence') || lower.includes('reply') || lower.includes('respond') || lower.includes('antwortet nicht') || lower.includes('no responde')) {
    return langFallbacks.ghost[0];
  }
  
  if (lower.includes('répondre') || lower.includes('réponse') || lower.includes('reply') || lower.includes('respond') || lower.includes('antworten') || lower.includes('responder')) {
    return langFallbacks.reply[0];
  }
  
  if (lower.includes('signe') || lower.includes('signal') || lower.includes('intéressé') || lower.includes('sign') || lower.includes('interest') || lower.includes('signal') || lower.includes('interessiert') || lower.includes('señal') || lower.includes('interesado')) {
    return langFallbacks.signals[0];
  }
  
  if (lower.includes('ex') || lower.includes('break') || lower.includes('trennung') || lower.includes('rotura')) {
    return langFallbacks.ex[0];
  }
  
  if (lower.includes('rencontrer') || lower.includes('voir') || lower.includes('rendez-vous') || lower.includes('meet') || lower.includes('see') || lower.includes('treffen') || lower.includes('encontrar') || lower.includes('ver')) {
    return langFallbacks.meet[0];
  }
  
  return langFallbacks.default[0];
}
