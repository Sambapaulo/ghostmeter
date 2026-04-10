import { NextRequest, NextResponse } from 'next/server';

interface ConversationStats {
  totalMessages: number;
  userMessages: number;
  otherMessages: number;
  averageUserLength: number;
  averageOtherLength: number;
  whoInitiates: 'user' | 'other' | 'balanced';
  userQuestionCount: number;
  otherQuestionCount: number;
  emojiUsage: { user: number; other: number };
}

interface AnalysisResult {
  interestScore: number;
  manipulationScore: number;
  ghostingScore: number;
  overallScore: number;
  advice: string;
  punchline: string;
  highlights: { positive: string[]; negative: string[]; neutral: string[]; };
  vibe: string;
  badges: string[];
  conversationStats: ConversationStats;
  evolutionScore: { start: number; middle: number; end: number; trend: 'improving' | 'stable' | 'declining'; };
  redFlagsDetected: string[];
  greenFlagsDetected: string[];
  personalityInsight: string;
}

function calculateOverallScore(interest: number, ghosting: number, manipulation: number): number {
  const score = (interest * 0.5) - (ghosting * 0.3) - (manipulation * 0.2);
  return Math.max(0, Math.min(100, Math.round(score)));
}

function analyzeConversationStats(conversation: string): ConversationStats {
  const lines = conversation.split('\n').filter(line => line.trim().length > 0);
  let userMessages = 0, otherMessages = 0, userTotalLength = 0, otherTotalLength = 0;
  let userQuestions = 0, otherQuestions = 0, userEmojis = 0, otherEmojis = 0;
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
  const questionRegex = /\?/g;
  const userPatterns = /^(moi|toi|me|moi:|je |j'|hey|salut|coucou)/i;
  const otherPatterns = /^(lui|elle|him|her|il |elle |il:|elle:)/i;
  let userInitiated = false;

  lines.forEach((line, index) => {
    const cleanLine = line.replace(/^(moi|toi|lui|elle|him|her|me):\s*/i, '').trim();
    const isUser = userPatterns.test(line) || (!otherPatterns.test(line) && index % 2 === 0);
    const isOther = otherPatterns.test(line);
    const emojis = (cleanLine.match(emojiRegex) || []).length;
    const questions = (cleanLine.match(questionRegex) || []).length;

    if (isUser || (!isOther && index % 2 === 0)) {
      userMessages++; userTotalLength += cleanLine.length; userQuestions += questions; userEmojis += emojis;
      if (index === 0) userInitiated = true;
    } else {
      otherMessages++; otherTotalLength += cleanLine.length; otherQuestions += questions; otherEmojis += emojis;
    }
  });

  return {
    totalMessages: userMessages + otherMessages, userMessages, otherMessages,
    averageUserLength: userMessages > 0 ? Math.round(userTotalLength / userMessages) : 0,
    averageOtherLength: otherMessages > 0 ? Math.round(otherTotalLength / otherMessages) : 0,
    whoInitiates: userInitiated ? 'user' : 'other', userQuestionCount: userQuestions, otherQuestionCount: otherQuestions,
    emojiUsage: { user: userEmojis, other: otherEmojis }
  };
}

function generateAnalysis(conversation: string, stats: ConversationStats, context: string, platform: string): AnalysisResult {
  const lowerConv = conversation.toLowerCase();
  
  // === DÉTECTION DES SIGNAUX POSITIFS FORTS ===
  const hasLoveWords = /je t'aime|je taime|i love you|love|adore|amoureux|amoureuse|b<3/i.test(conversation);
  const hasReciprocity = /moi aussi|pareil|de même|same here|too|aussi/i.test(conversation);
  const hasAffection = /b<3|❤️|💕|💖|💗|💘|😘|🥰|😍|amour|coeur|heart/i.test(conversation);
  const hasCompliments = /beau|belle|mignon|mignonne|gentil|super|génial|magnifique|parfait/i.test(conversation);
  const hasFuturePlans = /bientôt|ensemble|date|rendez-vous|sortir|vacances|weekend/i.test(conversation);
  const hasEnthusiasm = /(!+|super|génial|top|haha|mdr|lol|hâte|excité)/i.test(conversation);
  
  // === DÉTECTION DES SIGNAUX NÉGATIFS ===
  const hasShortReplies = /\b(ok|k|oui|non|maybe|peut-être|bof|okk|dacc)\b/i.test(conversation);
  const hasGhostingSignals = /désolé|pas pu|un truc|plus tard|peut-être|maybe|pas disponible|occupé|busy|pas le temps/i.test(conversation);
  const hasHotCold = (lowerConv.match(/maybe|peut-être|euh|hmm|bon|bref/gi) || []).length > 2;
  const hasDoubleText = /toi.*toi|moi.*moi/i.test(conversation);
  const hasOneWordReplies = /\b(ok|oui|non|k|okk|cool)\b[^a-z]*$/gim.test(conversation);
  
  // === DÉTECTION DES SIGNAUX NEUTRES ===
  const hasQuestions = stats.otherQuestionCount > 0;
  const hasEmojis = stats.emojiUsage.other > 0;
  const userDominant = stats.userMessages > stats.otherMessages * 1.5;
  const balanced = Math.abs(stats.userMessages - stats.otherMessages) <= 1;

  // === CALCUL DES SCORES ===
  let interestScore = 50;
  let ghostingScore = 10; // Plus bas par défaut
  let manipulationScore = 5; // Plus bas par défaut

  // Bonus positifs forts
  if (hasLoveWords) { interestScore += 30; ghostingScore = Math.max(0, ghostingScore - 10); }
  if (hasReciprocity) { interestScore += 25; ghostingScore = Math.max(0, ghostingScore - 5); }
  if (hasAffection) { interestScore += 20; }
  if (hasCompliments) { interestScore += 15; }
  if (hasFuturePlans) { interestScore += 15; ghostingScore = Math.max(0, ghostingScore - 5); }
  
  // Bonus positifs modérés
  if (hasQuestions) interestScore += 12;
  if (hasEmojis) interestScore += 8;
  if (hasEnthusiasm) interestScore += 10;
  if (balanced) interestScore += 8;
  if (stats.averageOtherLength > 30) interestScore += 5;

  // Malus négatifs
  if (userDominant) { interestScore -= 10; ghostingScore += 10; }
  if (hasShortReplies) { interestScore -= 8; ghostingScore += 8; }
  if (hasOneWordReplies) { interestScore -= 10; ghostingScore += 10; }
  if (hasGhostingSignals) { ghostingScore += 20; }
  if (hasDoubleText) { ghostingScore += 10; }
  if (hasHotCold) { manipulationScore += 15; }

  // Plafonner les scores
  interestScore = Math.max(5, Math.min(98, interestScore));
  ghostingScore = Math.max(0, Math.min(85, ghostingScore));
  manipulationScore = Math.max(0, Math.min(60, manipulationScore));

  // Ajustement contextuel
  const contextMult: Record<string, { interest: number; ghosting: number }> = {
    'ex': { interest: -5, ghosting: 10 },
    'situationship': { interest: 0, ghosting: 5 },
    'talking': { interest: 5, ghosting: 0 },
    'new': { interest: 10, ghosting: -5 },
    'crush': { interest: 5, ghosting: 0 }
  };
  const mult = contextMult[context] || { interest: 0, ghosting: 0 };
  interestScore = Math.max(5, Math.min(98, interestScore + mult.interest));
  ghostingScore = Math.max(0, Math.min(85, ghostingScore + mult.ghosting));

  const overallScore = calculateOverallScore(interestScore, ghostingScore, manipulationScore);
  
  const contextLabels: Record<string, string> = { 
    'crush': 'Crush', 'ex': 'Ex', 'new': 'Nouvelle relation', 
    'talking': 'Talking stage', 'situationship': 'Situationship', 
    'friend': 'Ami(e)', 'other': 'Autre' 
  };
  const contextLabel = contextLabels[context] || 'Relation';

  // === GÉNÉRATION DES MESSAGES ===
  let punchline: string, advice: string;
  
  if (hasLoveWords && hasReciprocity) {
    punchline = 'Amour réciproque ! 💕';
    advice = 'C\'est officiel, ça matche ! Profitez-en ! 🥰';
  } else if (overallScore >= 75) {
    punchline = contextLabel + ' ? Ça sent bon ! 💕';
    advice = 'Signaux très positifs ! Continue sur cette voie. 💪';
  } else if (overallScore >= 55) {
    punchline = contextLabel + '... Intérêt détecté 👀';
    advice = 'Signaux positifs. Reste naturel(le). 😊';
  } else if (overallScore >= 35) {
    punchline = contextLabel + '... Mixed signals 🤷';
    advice = 'Signaux mitigés. Prends du recul. 🔍';
  } else {
    punchline = contextLabel + ' ? Red flag... 👻';
    advice = 'Attention, signaux négatifs. Protège-toi. 🛡️';
  }

  // === HIGHLIGHTS ===
  const positive: string[] = [], negative: string[] = [], neutral: string[] = [];
  
  if (hasLoveWords) positive.push('💕 Mots d\'amour détectés');
  if (hasReciprocity) positive.push('🔄 Réciprocité dans les messages');
  if (hasAffection) positive.push('❤️ Signes d\'affection');
  if (hasCompliments) positive.push('✨ Compliments échangés');
  if (hasQuestions) positive.push('❓ Pose des questions = intérêt');
  if (hasEmojis) positive.push('😊 Utilise des emojis');
  if (balanced) positive.push('⚖️ Conversation équilibrée');
  if (hasEnthusiasm) positive.push('⚡ Enthousiasme détecté');
  
  if (userDominant) negative.push('⚠️ Tu fais la plupart de la conversation');
  if (hasShortReplies) negative.push('💬 Réponses courtes');
  if (hasGhostingSignals) negative.push('👻 Signaux de ghosting');
  if (!hasQuestions && stats.otherMessages > 2) negative.push('❌ Ne pose pas de questions');
  if (hasOneWordReplies) negative.push('😶 Réponses d\'un mot');
  
  neutral.push('📊 ' + stats.totalMessages + ' messages analysés');

  // === BADGES ===
  const badges: string[] = [];
  if (overallScore >= 75) badges.push('💕 Match');
  else if (overallScore >= 55) badges.push('👍 Intérêt');
  else if (overallScore >= 35) badges.push('🤷 Mitigé');
  else badges.push('🚩 Risk');
  
  if (hasLoveWords) badges.push('❤️ Amour');
  if (hasReciprocity) badges.push('🔄 Réciproque');
  if (hasEmojis && !hasShortReplies) badges.push('😊 Chaleureux');
  if (userDominant) badges.push('💔 Déséquilibré');

  return {
    interestScore,
    manipulationScore,
    ghostingScore,
    overallScore,
    advice,
    punchline,
    highlights: { positive, negative, neutral },
    vibe: overallScore >= 60 ? 'Positif' : overallScore >= 40 ? 'Mitigé' : 'Négatif',
    badges,
    conversationStats: stats,
    evolutionScore: { 
      start: Math.min(95, interestScore + 10), 
      middle: interestScore, 
      end: Math.max(5, interestScore - 5), 
      trend: interestScore > 60 ? 'improving' : interestScore < 40 ? 'declining' : 'stable' 
    },
    redFlagsDetected: negative.slice(0, 3),
    greenFlagsDetected: positive.slice(0, 3),
    personalityInsight: overallScore >= 70 ? 'Profil engagé et intéressé' : overallScore >= 50 ? 'Profil réservé mais ouvert' : 'Profil distant ou indécis'
  };
}

export async function POST(request: NextRequest) {
  try {
    const { conversation, context, platform } = await request.json();
    if (!conversation || conversation.length < 10) {
      return NextResponse.json({ error: 'Conversation trop courte' }, { status: 400 });
    }
    const stats = analyzeConversationStats(conversation);
    const analysis = generateAnalysis(conversation, stats, context || 'crush', platform || 'whatsapp');
    return NextResponse.json({ success: true, analysis });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Erreur lors de l\'analyse', 
      details: error instanceof Error ? error.message : 'Unknown' 
    }, { status: 500 });
  }
}