import { NextRequest, NextResponse } from 'next/server';

// Reply Generator API - Build v1.5.5 - Better prompts and parsing

interface ReplyRequest {
  receivedMessage: string;
  replyType: string;
  context?: string;
}

export async function POST(request: NextRequest) {
  let receivedMessage = '';
  let replyType = 'interested_warm';
  
  try {
    const body: ReplyRequest = await request.json();
    receivedMessage = body.receivedMessage || '';
    replyType = body.replyType || 'interested_warm';
    const context = body.context || 'crush';

    if (receivedMessage.trim().length < 3) {
      return NextResponse.json({ error: 'Message trop court' }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.error('GROQ_API_KEY non configurée');
      return NextResponse.json({ 
        success: true, 
        replies: generateContextualReplies(receivedMessage, replyType),
        replyType: getReplyTypeName(replyType),
        fallback: true
      });
    }

    const styleGuide = getStyleGuide(replyType);
    const contextLabel = getContextLabel(context);

    // Prompt très direct et simple
    const systemPrompt = `Tu dois générer 3 réponses SMS en français pour un message reçu.

RÈGLES:
1. Réponds DIRECTEMENT au contenu du message (lieux, temps, actions mentionnés)
2. Chaque réponse doit être DIFFÉRENTE (pas juste reformulée)
3. Utilise un langage naturel (okk, tkt, mdr, super)
4. 1-3 phrases par réponse, 1-2 emojis

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

function getContextLabel(context: string): string {
  const labels: Record<string, string> = {
    crush: "mon crush", ex: "mon ex", new: "quelqu'un de nouveau",
    talking: "ma talking stage", situationship: "ma situationship",
    friend: "mon ami(e)", other: "une connaissance"
  };
  return labels[context] || "quelqu'un";
}

function getStyleGuide(type: string): string {
  const styles: Record<string, string> = {
    interested_warm: "Chaleureux, enthousiaste, bienveillant",
    interested_mysterious: "Mystérieux, intriguant, sous-entendus",
    distant_polite: "Poli, distant, réservé",
    evasive: "Flou, évasif, pas engageant",
    direct_honest: "Direct, franc, honnête",
    flirty_playful: "Taquin, charmant, flirty",
    indifferent: "Indifférent, froid, détaché",
    soft_ghost: "Court, clôt le sujet"
  };
  return styles[type] || styles.interested_warm;
}

function getReplyTypeName(type: string): string {
  const names: Record<string, string> = {
    interested_warm: "Intéressé(e) & chaleureux",
    interested_mysterious: "Intéressé(e) mais mystérieux",
    distant_polite: "Distant & poli",
    evasive: "Évasif",
    direct_honest: "Direct & honnête",
    flirty_playful: "Joueur / Flirty",
    indifferent: "Indifférent",
    soft_ghost: "Ghosting doux"
  };
  return names[type] || names.interested_warm;
}

// Génération de réponses contextuelles basées sur le contenu
function generateContextualReplies(message: string, replyType: string): string[] {
  const lower = message.toLowerCase();
  
  // Analyser le contenu
  const hasRetard = lower.includes('retard') || lower.includes('désolé') || lower.includes('desole') || lower.includes('sorry');
  const hasMarseille = lower.includes('marseille');
  const hasMinutes = /\d+\s*min/.test(message);
  const minMatch = message.match(/(\d+)\s*min/);
  const minutes = minMatch ? minMatch[1] : '';
  const hasArrive = lower.includes('arrive') || lower.includes('arrivé') || lower.includes('suis là') || lower.includes('suis la');
  const hasPars = lower.includes('pars') || lower.includes('part');
  const hasAldi = lower.includes('aldi');
  const hasRepos = lower.includes('repos') || lower.includes('congé');
  const hasFormation = lower.includes('formation');
  const hasTrain = lower.includes('train');
  const hasPertuis = lower.includes('pertuis');
  const hasSamedi = lower.includes('samedi');
  const hasVendredi = lower.includes('vendredi');
  const hasAujourd = lower.includes("aujourd'hui") || lower.includes("aujourd");
  const hasDemain = lower.includes('demain');
  const hasQuestion = message.includes('?');
  
  // Contexte: retard + temps d'arrivée
  if (hasRetard && hasMinutes && hasArrive) {
    return getRepliesFor('retard_temps', replyType, { minutes });
  }
  
  // Contexte: départ de ville + temps
  if (hasPars && hasMarseille && hasMinutes) {
    return getRepliesFor('depart_ville_temps', replyType, { ville: 'Marseille', minutes });
  }
  
  // Contexte: arrivée avec temps
  if (hasArrive && hasMinutes) {
    return getRepliesFor('arrivee_temps', replyType, { minutes });
  }
  
  // Contexte: retard simple
  if (hasRetard) {
    return getRepliesFor('retard', replyType);
  }
  
  // Contexte: repos
  if (hasRepos && (hasAujourd || hasDemain)) {
    return getRepliesFor('repos_jours', replyType);
  }
  
  // Contexte: formation + ville
  if (hasFormation && hasMarseille) {
    return getRepliesFor('formation_ville', replyType, { ville: 'Marseille' });
  }
  
  // Contexte: samedi
  if (hasSamedi) {
    return getRepliesFor('samedi', replyType);
  }
  
  // Contexte: question
  if (hasQuestion) {
    return getRepliesFor('question', replyType);
  }
  
  // Défaut
  return getRepliesFor('default', replyType);
}

function getRepliesFor(context: string, replyType: string, params: Record<string, string> = {}): string[] {
  const allReplies: Record<string, Record<string, string[]>> = {
    'retard_temps': {
      interested_warm: [
        `Tkt pas de souci pour le retard ! ${params.minutes || 40} min c'est rapide, je t'attends 😊`,
        `Pas grave ! Prends ton temps, dans ${params.minutes || 40} min je serai prêt(e) !`,
        `Okk tkt ! À dans ${params.minutes || 40} min alors, safe journey ! 😊`
      ],
      interested_mysterious: [
        `Hmm ${params.minutes || 40} min... J'patienterai 😏`,
        `Le retard rend les retrouvailles plus intenses... 😏`,
        `Ok ${params.minutes || 40} min, je serai là...`
      ],
      distant_polite: [
        `C'est noté. À dans ${params.minutes || 40} min.`,
        `Ok pour le retard. J'attends.`,
        `Entendu, à tout à l'heure.`
      ],
      evasive: [
        `Ah mince le retard... C'est pas grave tu sais...`,
        `Ok ${params.minutes || 40} min, on verra...`,
        `Tkt pour le retard, ça arrive...`
      ],
      direct_honest: [
        `Pas de souci pour le retard. À dans ${params.minutes || 40} min exactement ?`,
        `Ok retard accepté. ${params.minutes || 40} min, je compte.`,
        `C'est bon pour le retard. J't'attends dans ${params.minutes || 40} min.`
      ],
      flirty_playful: [
        `En retard ? Tu me fais attendre 😏 ${params.minutes || 40} min c'est long !`,
        `Mince le retard... J'étais impatient(e) 😏 À dans ${params.minutes || 40} min !`,
        `Tu me fais languir 😏 ${params.minutes || 40} min, je compte chaque seconde !`
      ],
      indifferent: [
        `Ok.`,
        `${params.minutes || 40} min, noté.`,
        `Pas grave.`
      ],
      soft_ghost: [
        `Okk 👍`,
        `Tkt 👍`,
        `C'est noté`
      ]
    },
    'depart_ville_temps': {
      interested_warm: [
        `Super tu pars de ${params.ville || 'là-bas'} ! ${params.minutes || 40} min et t'es là, je t'attends 😊`,
        `Ah tu es en route depuis ${params.ville || 'là-bas'} ! Dans ${params.minutes || 40} min on se voit !`,
        `Parfait ! ${params.minutes || 40} min de trajet, route safe ! À tout à l'heure 😊`
      ],
      interested_mysterious: [
        `Hmm tu viens de ${params.ville || 'là-bas'}... ${params.minutes || 40} min d'attente 😏`,
        `${params.ville || 'Là-bas'}... J'imagine le trajet 😏 À dans ${params.minutes || 40} min`,
        `En route... J'serai là quand tu arrives 😏`
      ],
      distant_polite: [
        `D'accord, à dans ${params.minutes || 40} min.`,
        `Noté. Bon trajet depuis ${params.ville || 'là-bas'}.`,
        `Ok, je t'attends.`
      ],
      evasive: [
        `Ah ${params.ville || 'là-bas'}... C'est loin tu sais...`,
        `${params.minutes || 40} min... On verra...`,
        `Ok en route, ça marche...`
      ],
      direct_honest: [
        `${params.minutes || 40} min depuis ${params.ville || 'là-bas'}, ça marche. À tout à l'heure.`,
        `Parfait. Je suis prêt(e) pour ${params.minutes || 40} min.`,
        `Ok. À dans ${params.minutes || 40} min précises.`
      ],
      flirty_playful: [
        `Tu viens de ${params.ville || 'là-bas'} juste pour moi ? 😏 ${params.minutes || 40} min !`,
        `${params.minutes || 40} min avant de te voir... J'ai hâte 😏`,
        `En route ! J'compte les minutes 😏`
      ],
      indifferent: [
        `Ok.`,
        `${params.minutes || 40} min.`,
        `Noté.`
      ],
      soft_ghost: [
        `Okk 👍`,
        `Safe 👍`,
        `À plus`
      ]
    },
    'arrivee_temps': {
      interested_warm: [
        `Super ! Dans ${params.minutes || 40} min je serai prêt(e) ! 😊`,
        `Parfait ! ${params.minutes || 40} min, j'attends avec impatience !`,
        `Okk ! À dans ${params.minutes || 40} min alors ! 😊`
      ],
      interested_mysterious: [
        `Hmm ${params.minutes || 40} min... J'patienterai 😏`,
        `${params.minutes || 40} min... Ça va être long 😏`,
        `J't'attends... 😏`
      ],
      distant_polite: [
        `D'accord, à dans ${params.minutes || 40} min.`,
        `C'est noté. J'attends.`,
        `Ok.`
      ],
      evasive: [
        `Ah ${params.minutes || 40} min... On verra...`,
        `Ok ça marche...`,
        `C'est noté...`
      ],
      direct_honest: [
        `${params.minutes || 40} min, je serai là.`,
        `Parfait. À dans ${params.minutes || 40} min.`,
        `Ok. Je t'attends.`
      ],
      flirty_playful: [
        `${params.minutes || 40} min avant de te voir ! J'ai hâte 😏`,
        `J'compte les minutes 😏 ${params.minutes || 40}...`,
        `Vite ! 😏`
      ],
      indifferent: [
        `Ok.`,
        `${params.minutes || 40} min.`,
        `Noté.`
      ],
      soft_ghost: [
        `Okk 👍`,
        `À plus`,
        `👍`
      ]
    },
    'retard': {
      interested_warm: [
        `Tkt pas de souci ! Prends ton temps 😊`,
        `Pas grave ! Ça arrive à tout le monde !`,
        `C'est bon tkt ! J'suis pas pressé(e) 😊`
      ],
      interested_mysterious: [
        `Hmm le retard... Pas grave 😏`,
        `Tu me fais attendre... J'aime ça 😏`,
        `C'est noté... 😏`
      ],
      distant_polite: [
        `Ce n'est pas grave.`,
        `Pas de problème.`,
        `C'est noté.`
      ],
      evasive: [
        `Ah le retard... C'est pas grave tu sais...`,
        `Ok pas de souci...`,
        `Tkt c'est comme ça...`
      ],
      direct_honest: [
        `Pas de souci. Tu arrives quand ?`,
        `Ok pour le retard. On se voit à quelle heure ?`,
        `C'est bon. Dis-moi quand t'es là.`
      ],
      flirty_playful: [
        `En retard ? Tu veux me faire languir 😏`,
        `Mince... J'avais hâte ! 😏`,
        `Tu me fais attendre... J'aime ça 😏`
      ],
      indifferent: [
        `Ok.`,
        `Pas grave.`,
        `C'est noté.`
      ],
      soft_ghost: [
        `Okk 👍`,
        `Tkt`,
        `C'est bon`
      ]
    },
    'repos_jours': {
      interested_warm: [
        `Ah super t'es en repos ! On pourrait se voir 😊`,
        `Repos ! Top, on fait quelque chose ensemble ?`,
        `Chanceux(se) ! Profites-en bien ! 😊`
      ],
      interested_mysterious: [
        `Hmm repos... Intéressant 😏`,
        `Du temps libre... J'ai des idées 😏`,
        `Quoi de prévu ? 😏`
      ],
      distant_polite: [
        `C'est bien d'avoir du repos.`,
        `Profites-en.`,
        `Ok.`
      ],
      evasive: [
        `Ah repos... C'est bien tu sais...`,
        `Cool le repos...`,
        `Ok sympa...`
      ],
      direct_honest: [
        `Super ! On se voit quand ?`,
        `Repos = dispo. Tu fais quoi ?`,
        `Ok. Tu es libre du coup ?`
      ],
      flirty_playful: [
        `Repos ? Parfait pour se voir 😏`,
        `Tu as du temps pour moi ? 😏`,
        `Repos ensemble ? 😏`
      ],
      indifferent: [
        `Ok.`,
        `Cool.`,
        `Sympa.`
      ],
      soft_ghost: [
        `Okk 👍`,
        `Cool`,
        `Super`
      ]
    },
    'formation_ville': {
      interested_warm: [
        `Oh formation à ${params.ville || 'cette ville'} ! Ça va te changer 😊`,
        `Super ! Tu rentres quand ?`,
        `${params.ville || 'Là-bas'} c'est sympa ! Profites-en ! 😊`
      ],
      interested_mysterious: [
        `Hmm ${params.ville || 'là-bas'}... Intéressant 😏`,
        `Formation... J'imagine 😏`,
        `Bon voyage... 😏`
      ],
      distant_polite: [
        `Bonne formation.`,
        `Bon voyage.`,
        `Ok.`
      ],
      evasive: [
        `Ah ${params.ville || 'là-bas'}... C'est loin tu sais...`,
        `Formation... C'est bien...`,
        `Ok...`
      ],
      direct_honest: [
        `Formation à ${params.ville || 'là-bas'}, c'est sur quoi ?`,
        `Tu rentres quand de ${params.ville || 'là-bas'} ?`,
        `Ok. C'est où exactement ?`
      ],
      flirty_playful: [
        `${params.ville || 'Là-bas'} ? Ramène-moi un souvenir 😏`,
        `Formation ? J'suis jaloux(se) 😏`,
        `Bon voyage ! Pense à moi 😏`
      ],
      indifferent: [
        `Ok.`,
        `Bonne formation.`,
        `Noté.`
      ],
      soft_ghost: [
        `Okk 👍`,
        `Cool`,
        `Bon voyage`
      ]
    },
    'samedi': {
      interested_warm: [
        `Samedi ça me va ! On fait quoi ? 😊`,
        `Super ! Samedi c'est parfait pour se voir !`,
        `Okk samedi ! Tu as quelque chose en tête ? 😊`
      ],
      interested_mysterious: [
        `Hmm samedi... Ça me tente 😏`,
        `Samedi... J'ai des idées 😏`,
        `Pourquoi pas... 😏`
      ],
      distant_polite: [
        `Samedi c'est possible.`,
        `Je vérifie mon planning.`,
        `Ok.`
      ],
      evasive: [
        `Ah samedi... On verra...`,
        `Peut-être samedi...`,
        `À voir...`
      ],
      direct_honest: [
        `Samedi ça marche. À quelle heure ?`,
        `Ok. On se voit où samedi ?`,
        `Parfait. Samedi, dis-moi l'heure.`
      ],
      flirty_playful: [
        `Samedi = notre jour 😏`,
        `C'est un rencard samedi ? 😏`,
        `J'ai hâte 😏`
      ],
      indifferent: [
        `Ok.`,
        `Samedi.`,
        `Noté.`
      ],
      soft_ghost: [
        `Okk 👍`,
        `Samedi ça marche`,
        `👍`
      ]
    },
    'question': {
      interested_warm: [
        `Bonne question ! Laisse-moi réfléchir 😊`,
        `Hmm intéressant ! Je te redis ça !`,
        `Ça dépend, et toi t'en penses quoi ? 😊`
      ],
      interested_mysterious: [
        `Hmm bonne question... 😏`,
        `Ça dépend de plusieurs choses 😏`,
        `Tu veux vraiment savoir ? 😏`
      ],
      distant_polite: [
        `C'est une bonne question.`,
        `Je vais y réfléchir.`,
        `C'est noté.`
      ],
      evasive: [
        `Ah bonne question... C'est compliqué...`,
        `Ça dépend tu sais...`,
        `À voir...`
      ],
      direct_honest: [
        `Pour répondre franchement : oui.`,
        `La vraie réponse : ça me va.`,
        `En vrai : pourquoi pas.`
      ],
      flirty_playful: [
        `Tu veux tout savoir hein ? 😏`,
        `Mmmh tu m'intrigues avec cette question 😏`,
        `La réponse va te surprendre 😏`
      ],
      indifferent: [
        `J'sais pas.`,
        `Bof.`,
        `Ok.`
      ],
      soft_ghost: [
        `Bonne question 😅`,
        `Hmm...`,
        `Okk`
      ]
    },
    'default': {
      interested_warm: [
        `Ah super ! Dis-m'en plus 😊`,
        `Cool ! Je suis curieux(se) !`,
        `Intéressant ! Raconte ! 😊`
      ],
      interested_mysterious: [
        `Hmm tu m'intrigues... 😏`,
        `Intéressant... Continue 😏`,
        `Dis-m'en plus... 😏`
      ],
      distant_polite: [
        `C'est noté.`,
        `Ok.`,
        `Entendu.`
      ],
      evasive: [
        `Ah ouais... C'est comme ça...`,
        `Ok... On verra...`,
        `C'est noté...`
      ],
      direct_honest: [
        `Ok je vois. Tu veux quoi ?`,
        `C'est clair. Et après ?`,
        `Entendu. C'est tout ?`
      ],
      flirty_playful: [
        `Tu m'intrigues... 😏`,
        `Dis-m'en plus ! 😏`,
        `J'aime ça 😏`
      ],
      indifferent: [
        `Ok.`,
        `C'est noté.`,
        `Bof.`
      ],
      soft_ghost: [
        `Okk 👍`,
        `Cool`,
        `👍`
      ]
    }
  };
  
  const contextReplies = allReplies[context] || allReplies['default'];
  return contextReplies[replyType] || contextReplies.interested_warm;
}
