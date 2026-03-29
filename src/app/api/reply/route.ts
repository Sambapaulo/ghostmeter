import { NextRequest, NextResponse } from 'next/server';

// Reply Generator API - Build v1.5.5 - Better prompts and parsing

interface ReplyRequest {
  receivedMessage: string;
  replyType: string;
  context?: string;
  language?: string; // fr, en, de, es
}

export async function POST(request: NextRequest) {
  let receivedMessage = '';
  let replyType = 'interested_warm';
  
  try {
    const body: ReplyRequest = await request.json();
    receivedMessage = body.receivedMessage || '';
    replyType = body.replyType || 'interested_warm';
    const context = body.context || 'crush';
    const language = body.language || 'fr';

    if (receivedMessage.trim().length < 3) {
      return NextResponse.json({ error: 'Message trop court' }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.error('GROQ_API_KEY non configurée');
      return NextResponse.json({ 
        success: true, 
        replies: generateContextualReplies(receivedMessage, replyType, language),
        replyType: getReplyTypeName(replyType, language),
        fallback: true
      });
    }

    const styleGuide = getStyleGuide(replyType, language);
    const contextLabel = getContextLabel(context, language);

    // Language instruction for AI
    const languageInstruction: Record<string, string> = {
      fr: "en français",
      en: "in English",
      de: "auf Deutsch",
      es: "en español"
    };

    // Prompt très direct et simple
    const systemPrompt = `Tu dois générer 3 réponses SMS ${languageInstruction[language] || 'en français'} pour un message reçu.

RÈGLES:
1. Réponds DIRECTEMENT au contenu du message (lieux, temps, actions mentionnés)
2. Chaque réponse doit être DIFFÉRENTE (pas juste reformulée)
3. Utilise un langage naturel (okk, tkt, mdr, super)
4. 1-3 phrases par réponse, 1-2 emojis
5. IMPORTANT: Toutes les réponses doivent être ${languageInstruction[language] || 'en français'}

FORMAT DE RÉPONSE (RESPECTE EXACTEMENT):
1. [première réponse]
2. [deuxième réponse]
3. [troisième réponse]

EXEMPLE:
Message: "Je suis en retard, j'arrive dans 20 min"
1. Tkt pas de souci ! J't'attends 😊
2. Okk prends ton temps, je suis là !
3. 20 min ça va, à tout à l'heure 👍`;

    const userPrompt = `Message reçu: "${receivedMessage}"

Style: ${styleGuide}
Destinataire: ${contextLabel}

Génère 3 réponses différentes:`;

    console.log('Calling Groq API...');
    console.log('Message:', receivedMessage);

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
        max_tokens: 300
      })
    });

    if (!response.ok) {
      console.error('Groq error:', response.status);
      return NextResponse.json({ 
        success: true, 
        replies: generateContextualReplies(receivedMessage, replyType),
        replyType: getReplyTypeName(replyType),
        fallback: true
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim() || '';
    
    console.log('Groq raw response:', content);
    
    // Parser les réponses
    const replies = parseReplies(content);
    console.log('Parsed replies:', replies);
    
    // Vérifier la qualité des réponses
    const validReplies = replies.filter(r => r.length > 15 && !isGeneric(r));
    
    if (validReplies.length >= 2) {
      return NextResponse.json({
        success: true,
        replies: validReplies.slice(0, 3),
        replyType: getReplyTypeName(replyType)
      });
    }

    // Si pas assez de réponses valides, utiliser le fallback
    console.log('Not enough valid replies, using fallback');
    return NextResponse.json({ 
      success: true, 
      replies: generateContextualReplies(receivedMessage, replyType),
      replyType: getReplyTypeName(replyType),
      fallback: true
    });

  } catch (error) {
    console.error('Reply error:', error);
    return NextResponse.json({ 
      success: true, 
      replies: generateContextualReplies(receivedMessage, replyType),
      replyType: getReplyTypeName(replyType),
      fallback: true
    });
  }
}

function parseReplies(content: string): string[] {
  const replies: string[] = [];
  
  // Essayer de parser "1. 2. 3." format
  const lines = content.split('\n').filter(l => l.trim());
  
  for (const line of lines) {
    // Enlever les numéros au début
    let cleaned = line.replace(/^\d+[\.\)]\s*/, '').trim();
    cleaned = cleaned.replace(/^["«\s]+|["»\s]+$/g, '');
    
    if (cleaned.length > 10 && !cleaned.startsWith('[')) {
      replies.push(cleaned);
    }
  }
  
  // Si on a pas réussi, essayer un autre parsing
  if (replies.length < 2) {
    const match1 = content.match(/1\.\s*(.+?)(?=2\.|$)/);
    const match2 = content.match(/2\.\s*(.+?)(?=3\.|$)/);
    const match3 = content.match(/3\.\s*(.+?)$/);
    
    if (match1?.[1]) replies.push(match1[1].trim());
    if (match2?.[1]) replies.push(match2[1].trim());
    if (match3?.[1]) replies.push(match3[1].trim());
  }
  
  return replies;
}

function isGeneric(reply: string): boolean {
  const lower = reply.toLowerCase();
  const genericPhrases = [
    'tu m\'intrigues',
    'dis-m\'en plus',
    'c\'est intéressant',
    'je comprends',
    'raconte-moi'
  ];
  return genericPhrases.some(p => lower.includes(p));
}

function getContextLabel(context: string, language: string = 'fr'): string {
  const labels: Record<string, Record<string, string>> = {
    fr: { crush: "mon crush", ex: "mon ex", new: "quelqu'un de nouveau", talking: "ma talking stage", situationship: "ma situationship", friend: "mon ami(e)", other: "une connaissance" },
    en: { crush: "my crush", ex: "my ex", new: "someone new", talking: "my talking stage", situationship: "my situationship", friend: "my friend", other: "an acquaintance" },
    de: { crush: "mein Schwarm", ex: "mein Ex", new: "jemand Neues", talking: "meine Talking Stage", situationship: "meine Situationship", friend: "mein(e) Freund(in)", other: "eine Bekanntschaft" },
    es: { crush: "mi crush", ex: "mi ex", new: "alguien nuevo", talking: "mi talking stage", situationship: "mi situationship", friend: "mi amigo/a", other: "un conocido" }
  };
  const langLabels = labels[language] || labels['fr'];
  return langLabels[context] || langLabels['crush'];
}

function getStyleGuide(type: string, language: string = 'fr'): string {
  const styles: Record<string, Record<string, string>> = {
    fr: {
      interested_warm: "Chaleureux, enthousiaste, bienveillant",
      interested_mysterious: "Mystérieux, intriguant, sous-entendus",
      distant_polite: "Poli, distant, réservé",
      evasive: "Flou, évasif, pas engageant",
      direct_honest: "Direct, franc, honnête",
      flirty_playful: "Taquin, charmant, flirty",
      indifferent: "Indifférent, froid, détaché",
      soft_ghost: "Court, clôt le sujet"
    },
    en: {
      interested_warm: "Warm, enthusiastic, caring",
      interested_mysterious: "Mysterious, intriguing, hints",
      distant_polite: "Polite, distant, reserved",
      evasive: "Vague, evasive, unengaging",
      direct_honest: "Direct, frank, honest",
      flirty_playful: "Teasing, charming, flirty",
      indifferent: "Indifferent, cold, detached",
      soft_ghost: "Short, closes the topic"
    },
    de: {
      interested_warm: "Herzlich, begeistert, fürsorglich",
      interested_mysterious: "Mysteriös, faszinierend, Andeutungen",
      distant_polite: "Höflich, distanziert, reserviert",
      evasive: "Vage, ausweichend, nicht ansprechend",
      direct_honest: "Direkt, offen, ehrlich",
      flirty_playful: "Verspielt, charmant, flirty",
      indifferent: "Gleichgültig, kalt, distanziert",
      soft_ghost: "Kurz, beendet das Thema"
    },
    es: {
      interested_warm: "Cálido, entusiasta, cariñoso",
      interested_mysterious: "Misterioso, intrigante, indirecto",
      distant_polite: "Educado, distante, reservado",
      evasive: "Vago, evasivo, poco atractivo",
      direct_honest: "Directo, franco, honesto",
      flirty_playful: "Juguetón, encantador, flirty",
      indifferent: "Indiferente, frío, distante",
      soft_ghost: "Corto, cierra el tema"
    }
  };
  const langStyles = styles[language] || styles['fr'];
  return langStyles[type] || langStyles.interested_warm;
}

function getReplyTypeName(type: string, language: string = 'fr'): string {
  const names: Record<string, Record<string, string>> = {
    fr: {
      interested_warm: "Intéressé(e) & chaleureux",
      interested_mysterious: "Intéressé(e) mais mystérieux",
      distant_polite: "Distant & poli",
      evasive: "Évasif",
      direct_honest: "Direct & honnête",
      flirty_playful: "Joueur / Flirty",
      indifferent: "Indifférent",
      soft_ghost: "Ghosting doux"
    },
    en: {
      interested_warm: "Interested & warm",
      interested_mysterious: "Interested but mysterious",
      distant_polite: "Distant & polite",
      evasive: "Evasive",
      direct_honest: "Direct & honest",
      flirty_playful: "Flirty & playful",
      indifferent: "Indifferent",
      soft_ghost: "Soft ghost"
    },
    de: {
      interested_warm: "Interessiert & herzlich",
      interested_mysterious: "Interessiert aber mysteriös",
      distant_polite: "Distanziert & höflich",
      evasive: "Ausweichend",
      direct_honest: "Direkt & ehrlich",
      flirty_playful: "Flirtend & verspielt",
      indifferent: "Gleichgültig",
      soft_ghost: "Soft Ghost"
    },
    es: {
      interested_warm: "Interesado y cálido",
      interested_mysterious: "Interesado pero misterioso",
      distant_polite: "Distante y educado",
      evasive: "Evasivo",
      direct_honest: "Directo y honesto",
      flirty_playful: "Coqueto y juguetón",
      indifferent: "Indiferente",
      soft_ghost: "Ghosting suave"
    }
  };
  const langNames = names[language] || names['fr'];
  return langNames[type] || langNames.interested_warm;
}

// Génération de réponses contextuelles basées sur le contenu
function generateContextualReplies(message: string, replyType: string, language: string = 'fr'): string[] {
  const lower = message.toLowerCase();
  
  // Réponses par défaut dans chaque langue
  const defaultReplies: Record<string, Record<string, string[]>> = {
    fr: {
      interested_warm: ["Ah super ! Dis-m'en plus 😊", "Cool ! Je suis curieux(se) !", "Intéressant ! Raconte ! 😊"],
      interested_mysterious: ["Hmm tu m'intrigues... 😏", "Intéressant... Continue 😏", "Dis-m'en plus... 😏"],
      distant_polite: ["C'est noté.", "Ok.", "Entendu."],
      evasive: ["Ah ouais... C'est comme ça...", "Ok... On verra...", "C'est noté..."],
      direct_honest: ["Ok je vois. Tu veux quoi ?", "C'est clair. Et après ?", "Entendu. C'est tout ?"],
      flirty_playful: ["Tu m'intrigues... 😏", "Dis-m'en plus ! 😏", "J'aime ça 😏"],
      indifferent: ["Ok.", "C'est noté.", "Bof."],
      soft_ghost: ["Okk 👍", "Cool", "👍"]
    },
    en: {
      interested_warm: ["That's great! Tell me more 😊", "Cool! I'm curious!", "Interesting! Do tell! 😊"],
      interested_mysterious: ["Hmm you intrigue me... 😏", "Interesting... Go on 😏", "Tell me more... 😏"],
      distant_polite: ["Noted.", "Ok.", "Understood."],
      evasive: ["Oh yeah... I see...", "Ok... We'll see...", "Noted..."],
      direct_honest: ["Ok I see. What do you want?", "That's clear. And then?", "Understood. Is that all?"],
      flirty_playful: ["You intrigue me... 😏", "Tell me more! 😏", "I like that 😏"],
      indifferent: ["Ok.", "Noted.", "Whatever."],
      soft_ghost: ["Okk 👍", "Cool", "👍"]
    },
    de: {
      interested_warm: ["Super! Erzähl mehr 😊", "Cool! Ich bin neugierig!", "Interessant! Erzähl! 😊"],
      interested_mysterious: ["Hmm du faszinierst mich... 😏", "Interessant... Weiter 😏", "Erzähl mehr... 😏"],
      distant_polite: ["Notiert.", "Ok.", "Verstanden."],
      evasive: ["Ach so... Ich verstehe...", "Ok... Mal sehen...", "Notiert..."],
      direct_honest: ["Ok ich verstehe. Was willst du?", "Klar. Und dann?", "Verstanden. Das alles?"],
      flirty_playful: ["Du faszinierst mich... 😏", "Erzähl mehr! 😏", "Das mag ich 😏"],
      indifferent: ["Ok.", "Notiert.", "Egal."],
      soft_ghost: ["Okk 👍", "Cool", "👍"]
    },
    es: {
      interested_warm: ["¡Genial! Cuéntame más 😊", "¡Cool! Tengo curiosidad!", "¡Interesante! ¡Cuénta! 😊"],
      interested_mysterious: ["Hmm me intriguas... 😏", "Interesante... Continúa 😏", "Cuéntame más... 😏"],
      distant_polite: ["Notado.", "Ok.", "Entendido."],
      evasive: ["Ah sí... Ya veo...", "Ok... Veremos...", "Notado..."],
      direct_honest: ["Ok entiendo. ¿Qué quieres?", "Claro. ¿Y después?", "Entendido. ¿Eso es todo?"],
      flirty_playful: ["Me intriguas... 😏", "¡Cuéntame más! 😏", "Me gusta 😏"],
      indifferent: ["Ok.", "Notado.", "Da igual."],
      soft_ghost: ["Okk 👍", "Cool", "👍"]
    }
  };
  
  const langReplies = defaultReplies[language] || defaultReplies['fr'];
  return langReplies[replyType] || langReplies.interested_warm;
}
