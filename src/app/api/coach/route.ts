import { NextRequest, NextResponse } from 'next/server';
import { addUserLog } from '@/lib/localStore';

// AI Coach API - GhostMeter v1.6.1
// Fixes:
//  - Bug fallback catch passait message vide → toujours réponse default
//  - userPrompt figé (contexte collé au message) → réponses répétitives
//  - Fallback à texte unique → maintenant variants + random
//  - Ajout logs visibles côté serveur quand fallback déclenché

interface CoachRequest {
  message: string;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  context?: {
    relationshipType?: string;
    currentSituation?: string;
    analysisScore?: number;
    analysisPunchline?: string;
    analysisScores?: { interest: number; manipulation: number; ghosting: number; toxicity: number };
    isReceivedMessage?: boolean;
  };
  language?: string; // fr, en, de, es
}

// Helper: piocher un élément au hasard dans un tableau
function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
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

RÈGLE ANTI-RÉPÉTITION (TRÈS IMPORTANTE):
- Ne JAMAIS te répéter d'un message à l'autre au sein d'une même conversation.
- Varie la structure de tes réponses (parfois direct, parfois question d'abord, parfois analogie, parfois exemple concret).
- Si l'utilisateur repose une question similaire, fais un rappel court de ce que tu as déjà dit, puis creuse un angle nouveau.
- Change de ton, d'exemples, de longueur. N'utilise pas les mêmes formulations.
- Adapte-toi au fil de la conversation : si tu as déjà donné un conseil, ne le redonne pas tel quel, propose la prochaine étape.

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

ANTI-REPETITION RULE (VERY IMPORTANT):
- NEVER repeat yourself from one message to another within the same conversation.
- Vary the structure of your responses (sometimes direct, sometimes question first, sometimes analogy, sometimes concrete example).
- If the user asks a similar question again, briefly recall what you said, then dig into a new angle.
- Change tone, examples, length. Do not use the same formulations.
- Adapt to the flow of the conversation: if you already gave advice, don't repeat it verbatim, propose the next step.

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
    const body: CoachRequest & { email?: string } = await request.json();
    const { message, conversationHistory = [], context, language = 'fr', email } = body;

    if (!message || message.trim().length < 2) {
      return NextResponse.json({ error: 'Message trop court' }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.warn('[coach] GROQ_API_KEY is not set — falling back to local reply. Set GROQ_API_KEY in .env.local to enable LLM responses.');
      return NextResponse.json({ 
        success: true, 
        reply: getFallbackCoachReply(message, context, language),
        fallback: true,
        fallbackReason: 'missing_api_key'
      });
    }

    const contextInfo = buildContextInfo(context, language);
    const systemPrompt = systemPrompts[language] || systemPrompts['fr'];

    // Construire les messages:
    // 1. system prompt (rôle + style)
    // 2. system prompt secondaire (contexte GhostMeter, séparé du message utilisateur)
    // 3. historique de conversation
    // 4. message utilisateur brut (sans préambule figé)
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt }
    ];

    // Contexte GhostMeter en message système secondaire (et non collé au user prompt)
    if (contextInfo) {
      messages.push({ role: 'system', content: contextInfo });
    }

    // Ajouter l'historique (max 10 messages précédents)
    const recentHistory = conversationHistory.slice(-10);
    for (const msg of recentHistory) {
      messages.push(msg);
    }

    // Message utilisateur brut — c'est LA question posée par l'utilisateur, sans préambule figé
    messages.push({ role: 'user', content: message });

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: messages,
        temperature: 0.9,
        max_tokens: 800,
        presence_penalty: 0.6,
        frequency_penalty: 0.4
      })
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      console.error(`[coach] Groq error ${response.status}: ${errorBody.substring(0, 500)}`);
      return NextResponse.json({ 
        success: true, 
        reply: getFallbackCoachReply(message, context, language),
        fallback: true,
        fallbackReason: `groq_error_${response.status}`
      });
    }

    const data = await response.json();
    let reply = data.choices?.[0]?.message?.content?.trim() || '';

    if (!reply || reply.length < 10) {
      console.warn('[coach] Empty or too-short LLM reply, falling back.');
      return NextResponse.json({ 
        success: true, 
        reply: getFallbackCoachReply(message, context, language),
        fallback: true,
        fallbackReason: 'empty_llm_reply'
      });
    }

    // Log la question coach dans le journal utilisateur
    if (email) {
      await addUserLog(email, 'coach_question', `Question coach: ${message.substring(0, 80)}${message.length > 80 ? '...' : ''}`);
    }

    return NextResponse.json({
      success: true,
      reply: reply
    });

  } catch (error) {
    console.error('[coach] Unhandled error:', error);
    return NextResponse.json({ 
      success: true, 
      reply: getFallbackCoachReply(message || '', context || {}, language || 'fr'),
      fallback: true,
      fallbackReason: 'unhandled_exception'
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
  
  if (context.analysisScores) {
    const s = context.analysisScores;
    info += "\n- Analyse GhostMeter:";
    info += "\n  Interet: " + Math.round(s.interest) + "%";
    info += "\n  Manipulation: " + Math.round(s.manipulation) + "%";
    info += "\n  Ghosting: " + Math.round(s.ghosting) + "%";
    info += "\n  Niveau de toxicite: " + Math.round(s.toxicity) + "%";
  }
  if (context.analysisPunchline) {
    info += "\n- Diagnostic GhostMeter: " + context.analysisPunchline;
  }
  if (context.isReceivedMessage) {
    info += "\n- IMPORTANT: C est un message que l utilisateur a RECUS, pas envoyes. Aide-le a reagir.";
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
      whatDo: [
        "Pour te répondre précisément, j'ai besoin d'un peu plus de contexte. Raconte-moi : depuis combien de temps vous parlez, qu'est-ce qu'il/elle fait qui te fait douter, et qu'est-ce que tu aimerais obtenir au final ?",
        "Je veux bien t'aider, mais il me manque des infos. Qu'est-ce qui s'est passé concrètement ces derniers jours ? Tu as initié le dernier échange ?",
        "Donne-moi un peu de matière : tu cherches quoi exactement — comprendre où ça en est, relancer, ou prendre du recul ?"
      ],
      ghost: [
        "Le ghosting, c'est bouleversant. Depuis combien de temps sans nouvelle ? Et c'était quoi votre dernier échange avant le silence ?",
        "Silence radio — ok. Tu lui as écrit quoi dernièrement ? Et avant ça, c'était régulier entre vous ou sporadique ?",
        "Pour analyser ce ghosting, j'ai besoin de deux choses : la durée du silence, et le dernier message que tu as envoyé. Dis-moi."
      ],
      reply: [
        "Pour t'aider à répondre, j'ai besoin du contenu exact : qu'est-ce qu'il/elle t'a envoyé ? Et quelle est la vibe générale de votre conversation ces derniers jours ?",
        "Copie-colle son message et dis-moi depuis combien de temps vous vous parlez. Je te proposerai 2 ou 3 angles de réponse.",
        "Donne-moi le contexte : son dernier message + ce que tu veux obtenir (le/la faire réagir, rester cool, relancer clairement ?)."
      ],
      signals: [
        "Les signaux sont subtils ! Raconte-moi vos conversations : c'est lui/elle qui initie ? Les réponses sont longues ou courtes ? Il/elle pose des questions sur toi ?",
        "Pour décoder les signaux, j'ai besoin de détails concrets : fréquence de vos échanges, qui relance le plus, et est-ce qu'il/elle propose des trucs en face-à-face ?",
        "Donne-moi 2-3 exemples récents de ses messages et je te dirai ce que je lis comme signal."
      ],
      ex: [
        "Parler d'ex, c'est délicat. Tu veux reconquérir ton ex ou tu essaies de tourner la page ? Et depuis combien de temps c'est terminé ?",
        "Pour bien t'aider : tu es en contact avec ton ex en ce moment ? Et qu'est-ce qui t'amène à en parler aujourd'hui ?",
        "Ex = toujours chargé émotionnellement. Dis-moi où tu en es : rupture récente, tentative de retour, ou simple nostalgie ?"
      ],
      meet: [
        "Tu veux le/la rencontrer ? Bonne étape. Depuis combien de temps vous parlez ? Et avez-vous déjà évoqué l'idée de vous voir ?",
        "Avant de proposer un date, j'ai besoin de savoir : combien de temps ça dure, et est-ce que vous avez déjà parlé de vous rencontrer ?",
        "Pour calibrer ma réponse : vous êtes au stade talking stage ou vous vous connaissez déjà un peu ? Et tu veux quoi comme rendez-vous — casual, date, activité précise ?"
      ],
      default: [
        "Je suis là pour t'aider. Raconte-moi ta situation : tu parles avec qui, depuis combien de temps, et qu'est-ce qui te pose question ?",
        "Donne-moi un peu de contexte : qui est la personne, où vous en êtes, et qu'est-ce qui te bloque ?",
        "Ok, je t'écoute. C'est quoi la situation — crush, ex, situationship, talking stage ? Et qu'est-ce que tu veux comme conseil ?",
        "Parle-moi un peu plus : qu'est-ce qui s'est passé récemment, et qu'est-ce que tu essaies de comprendre ou de décider ?"
      ]
    },
    en: {
      whatDo: [
        "To answer precisely, I need more context. Tell me: how long have you been talking, what signals are you getting, and what outcome do you want?",
        "I'd love to help, but I need more. What concretely happened in the last few days? Did you initiate the last exchange?",
        "Give me something to work with: what are you after — understanding where things stand, reigniting, or taking a step back?"
      ],
      ghost: [
        "Ghosting is tough. How long has the silence lasted? And what was your last exchange before it went quiet?",
        "Radio silence — ok. What did you send last? And before that, was it regular or sporadic between you two?",
        "To analyze this ghosting, I need two things: how long the silence has lasted, and the last message you sent."
      ],
      reply: [
        "To help you reply, I need the exact content: what did he/she send you? And what's the general vibe of your conversation lately?",
        "Paste their message and tell me how long you've been talking. I'll suggest 2-3 reply angles.",
        "Give me context: their last message + what you want to get out of it (make them react, play it cool, clearly reignite?)."
      ],
      signals: [
        "Signals are subtle! Tell me how your conversations go: who initiates? Are the replies long or short? Does he/she ask about you?",
        "To decode signals, I need concrete details: how often you talk, who initiates more, and have they suggested meeting up?",
        "Give me 2-3 recent examples of their messages and I'll tell you what I read in them."
      ],
      ex: [
        "Talking about an ex is delicate. Do you want to win them back or move on? And how long ago did it end?",
        "To help well: are you in contact with your ex right now? And what brings them up today?",
        "Ex = always emotionally loaded. Tell me where you stand: recent breakup, attempting a comeback, or just nostalgia?"
      ],
      meet: [
        "You want to meet them? Good step. How long have you been talking? And have you already brought up the idea of meeting?",
        "Before suggesting a date, I need to know: how long this has been going on, and have you already talked about meeting?",
        "To calibrate my reply: are you at the talking stage or do you already know each other a bit? And what kind of meet do you want — casual, date, specific activity?"
      ],
      default: [
        "I'm here to help. Tell me your situation: who are you talking to, how long, and what's bothering you?",
        "Give me some context: who's the person, where things stand, and what's blocking you?",
        "Ok, I'm listening. What's the situation — crush, ex, situationship, talking stage? And what kind of advice do you want?",
        "Tell me more: what happened recently, and what are you trying to understand or decide?"
      ]
    },
    de: {
      whatDo: [
        "Um dir genau zu antworten, brauche ich mehr Kontext. Erzähl mir: Wie lange redet ihr schon, welche Signale erhältst du und was möchtest du erreichen?",
        "Ich helfe dir gern, aber ich brauche mehr. Was ist in den letzten Tagen konkret passiert? Hast du den letzten Austausch initiiert?",
        "Gib mir etwas zum Arbeiten: Worauf willst du hinaus — verstehen, wo ihr steht, wieder anstoßen oder Abstand nehmen?"
      ],
      ghost: [
        "Ghosting ist hart. Wie lange dauert das Schweigen schon? Und was war euer letzter Austausch davor?",
        "Funkstille — ok. Was hast du zuletzt geschrieben? Und davor war es regelmäßig oder sporadisch?",
        "Um dieses Ghosting zu analysieren, brauche ich zwei Dinge: die Dauer des Schweigens und deine letzte Nachricht."
      ],
      reply: [
        "Um dir bei der Antwort zu helfen, brauche ich den genauen Inhalt: Was hat er/sie dir geschickt? Und wie ist die Stimmung eurer Unterhaltung lately?",
        "Füge die Nachricht ein und sag mir, wie lange ihr schon redet. Ich schlage 2-3 Antwortwinkel vor.",
        "Gib mir Kontext: die letzte Nachricht + was du erreichen willst (Reaktion, cool bleiben, klar anstoßen?)."
      ],
      signals: [
        "Signale sind subtil! Erzähl mir, wie eure Gespräche laufen: Wer initiiert? Sind die Antworten lang oder kurz? Stellt er/sie Fragen zu dir?",
        "Um Signale zu deuten, brauche ich konkrete Details: Wie oft redet ihr, wer initiiert mehr, und hat er/sie ein Treffen vorgeschlagen?",
        "Gib mir 2-3 aktuelle Beispiele seiner/ihrer Nachrichten und ich sage dir, was ich herauslese."
      ],
      ex: [
        "Über einen Ex zu sprechen ist heikel. Willst du deinen Ex zurück oder möchtest du weiterziehen? Und wie lange ist es her?",
        "Um gut zu helfen: Bist du gerade in Kontakt mit deinem Ex? Und was bringt dich heute dazu, darüber zu sprechen?",
        "Ex = immer emotional geladen. Sag mir, wo du stehst: frische Trennung, Rückeroberungsversuch oder nur Nostalgie?"
      ],
      meet: [
        "Du willst ihn/sie treffen? Guter Schritt. Wie lange redet ihr schon? Und habt ihr schon über ein Treffen gesprochen?",
        "Bevor ich einen Termin vorschlage, brauche ich: Wie lange läuft das schon, und habt ihr schon über ein Treffen gesprochen?",
        "Um meine Antwort zu kalibrieren: Seid ihr in der Talking Stage oder kennt ihr euch schon etwas? Und was für ein Treffen willst du — casual, Date, konkrete Aktivität?"
      ],
      default: [
        "Ich bin hier, um zu helfen. Erzähl mir deine Situation: Mit wem redest du, seit wann und was beschäftigt dich?",
        "Gib mir etwas Kontext: Wer ist die Person, wo ihr steht, und was blockiert dich?",
        "Ok, ich höre zu. Was ist die Situation — Crush, Ex, Situationship, Talking Stage? Und was für einen Rat willst du?",
        "Erzähl mir mehr: Was ist in letzter Zeit passiert, und was versuchst du zu verstehen oder zu entscheiden?"
      ]
    },
    es: {
      whatDo: [
        "Para responderte con precisión, necesito más contexto. Cuéntame: hace cuánto están hablando, qué señales recibes y qué quieres lograr?",
        "Me encantaría ayudarte, pero necesito más. Qué pasó concretamente en los últimos días? Iniciaste tú el último intercambio?",
        "Dame algo con qué trabajar: qué buscas — entender dónde están, reactivar, o tomar distancia?"
      ],
      ghost: [
        "El ghosting es duro. Cuánto lleva el silencio? Y cuál fue el último intercambio antes de que se cortara?",
        "Radio silencio — ok. Qué le escribiste último? Y antes, era regular o esporádico entre ustedes?",
        "Para analizar este ghosting, necesito dos cosas: cuánto tiempo lleva el silencio y cuál fue tu último mensaje."
      ],
      reply: [
        "Para ayudarte a responder, necesito el contenido exacto: qué te envió él/ella? Y cuál es la vibra general de su conversación últimamente?",
        "Pega su mensaje y dime desde cuándo están hablando. Te propongo 2-3 ángulos de respuesta.",
        "Dame contexto: su último mensaje + qué quieres obtener (hacerle reaccionar, mantener la calma, reactivar claramente?)."
      ],
      signals: [
        "Las señales son sutiles! Cuéntame cómo son sus conversaciones: quién inicia? Las respuestas son largas o cortas? Hace preguntas sobre ti?",
        "Para decodificar señales, necesito detalles concretos: con qué frecuencia hablan, quién inicia más, y ha propuesto verse?",
        "Dame 2-3 ejemplos recientes de sus mensajes y te diré qué leo en ellos."
      ],
      ex: [
        "Hablar de un ex es delicado. Quieres reconquistar a tu ex o intentar pasar página? Y hace cuánto terminó?",
        "Para ayudarte bien: Estás en contacto con tu ex ahora? Y qué te lleva a hablar de eso hoy?",
        "Ex = siempre cargado emocionalmente. Dime dónde estás: ruptura reciente, intento de regreso, o simple nostalgia?"
      ],
      meet: [
        "Quieres conocerle/la? Buen paso. Desde cuándo están hablando? Y ya hablaron de verse?",
        "Antes de sugerir una cita, necesito saber: hace cuánto duran, y ya hablaron de verse?",
        "Para calibrar mi respuesta: Están en talking stage o ya se conocen un poco? Y qué tipo de encuentro quieres — casual, cita, actividad concreta?"
      ],
      default: [
        "Estoy aquí para ayudarte. Cuéntame tu situación: con quién hablas, desde cuándo y qué te preocupa?",
        "Dame algo de contexto: quién es la persona, dónde están, y qué te bloquea?",
        "Ok, te escucho. Cuál es la situación — crush, ex, situationship, talking stage? Y qué tipo de consejo quieres?",
        "Cuéntame más: qué pasó últimamente, y qué intentas entender o decidir?"
      ]
    }
  };
  
  const langFallbacks = fallbacks[language] || fallbacks['fr'];
  
  if (lower.includes('dois faire') || lower.includes('dois-je faire') || lower.includes("qu'est-ce que je") || lower.includes('should i') || lower.includes('what should') || lower.includes('was soll') || lower.includes('qué debo') || lower.includes('qué debería')) {
    return pickRandom(langFallbacks.whatDo);
  }
  
  if (lower.includes('ghost') || lower.includes('répond pas') || lower.includes('silence') || lower.includes('reply') || lower.includes('respond') || lower.includes('antwortet nicht') || lower.includes('no responde')) {
    return pickRandom(langFallbacks.ghost);
  }
  
  if (lower.includes('répondre') || lower.includes('réponse') || lower.includes('reply') || lower.includes('respond') || lower.includes('antworten') || lower.includes('responder')) {
    return pickRandom(langFallbacks.reply);
  }
  
  if (lower.includes('signe') || lower.includes('signal') || lower.includes('intéressé') || lower.includes('sign') || lower.includes('interest') || lower.includes('signal') || lower.includes('interessiert') || lower.includes('señal') || lower.includes('interesado')) {
    return pickRandom(langFallbacks.signals);
  }
  
  if (lower.includes('ex') || lower.includes('break') || lower.includes('trennung') || lower.includes('rotura')) {
    return pickRandom(langFallbacks.ex);
  }
  
  if (lower.includes('rencontrer') || lower.includes('voir') || lower.includes('rendez-vous') || lower.includes('meet') || lower.includes('see') || lower.includes('treffen') || lower.includes('encontrar') || lower.includes('ver')) {
    return pickRandom(langFallbacks.meet);
  }
  
  return pickRandom(langFallbacks.default);
}
