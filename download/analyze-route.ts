import { NextRequest, NextResponse } from 'next/server';

// Types
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
  highlights: {
    positive: string[];
    negative: string[];
    neutral: string[];
  };
  vibe: string;
  badges: string[];
  conversationStats: ConversationStats;
  evolutionScore: {
    start: number;
    middle: number;
    end: number;
    trend: 'improving' | 'stable' | 'declining';
  };
  redFlagsDetected: string[];
  greenFlagsDetected: string[];
  personalityInsight: string;
}

// Calculate overall score
function calculateOverallScore(interest: number, ghosting: number, manipulation: number): number {
  const score = (interest * 0.5) - (ghosting * 0.3) - (manipulation * 0.2);
  return Math.max(0, Math.min(100, Math.round(score)));
}

// Analyze conversation stats
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
      userMessages++;
      userTotalLength += cleanLine.length;
      userQuestions += questions;
      userEmojis += emojis;
      if (index === 0) userInitiated = true;
    } else {
      otherMessages++;
      otherTotalLength += cleanLine.length;
      otherQuestions += questions;
      otherEmojis += emojis;
    }
  });

  return {
    totalMessages: userMessages + otherMessages,
    userMessages,
    otherMessages,
    averageUserLength: userMessages > 0 ? Math.round(userTotalLength / userMessages) : 0,
    averageOtherLength: otherMessages > 0 ? Math.round(otherTotalLength / otherMessages) : 0,
    whoInitiates: userInitiated ? 'user' : 'other',
    userQuestionCount: userQuestions,
    otherQuestionCount: otherQuestions,
    emojiUsage: { user: userEmojis, other: otherEmojis }
  };
}

// Generate analysis with context awareness
function generateAnalysis(conversation: string, stats: ConversationStats, context: string, platform: string): AnalysisResult {
  const lines = conversation.split('\n').filter(line => line.trim().length > 0);
  const lowerConv = conversation.toLowerCase();

  // Pattern detection
  const hasEnthusiasm = /(!|❤️|💕|😘|😍|🥰|love|adore|super|génial|top|haha|mdr|lol)/i.test(conversation);
  const hasShortReplies = /\b(ok|k|oui|non|maybe|peut-être|bof|okk|dacc)\b/i.test(conversation);
  const hasQuestions = stats.otherQuestionCount > 0;
  const hasEmojis = stats.emojiUsage.other > 0;
  const userDominant = stats.userMessages > stats.otherMessages * 1.5;
  const balanced = Math.abs(stats.userMessages - stats.otherMessages) <= 1;
  const hasGhostingSignals = /désolé|pas pu|un truc|plus tard|peut-être|maybe|pas disponible|occupé|busy/i.test(conversation);
  const hasInterestSignals = /tu veux|on pourrait|ça te dit|bientôt|hâte|envie|avec plaisir/i.test(conversation);
  const hasDelayedReplies = /...|⋅⋅⋅|attendu|attendre/i.test(conversation);
  const hasHotCold = (lowerConv.match(/maybe|peut-être|euh|hmm|bon|bref/gi) || []).length > 2;
  const hasDoubleText = /toi.*toi|moi.*moi/i.test(conversation);
  const hasOneWordReplies = /\b(ok|oui|non|k|okk|cool)\b[^a-z]*$/gim.test(conversation);

  // Calculate scores
  let interestScore = 50;
  let ghostingScore = 25;
  let manipulationScore = 15;

  // Interest adjustments
  if (hasQuestions) interestScore += 15;
  if (hasEmojis) interestScore += 10;
  if (hasEnthusiasm) interestScore += 12;
  if (balanced) interestScore += 10;
  if (hasInterestSignals) interestScore += 15;
  if (stats.averageOtherLength > 30) interestScore += 8;
  if (stats.otherQuestionCount > 1) interestScore += 5;

  // Negative adjustments
  if (userDominant) interestScore -= 15;
  if (hasShortReplies) interestScore -= 10;
  if (hasOneWordReplies) interestScore -= 8;
  if (stats.averageOtherLength < 15) interestScore -= 10;

  // Ghosting score
  if (userDominant) ghostingScore += 20;
  if (hasShortReplies) ghostingScore += 15;
  if (!hasQuestions) ghostingScore += 12;
  if (hasGhostingSignals) ghostingScore += 25;
  if (hasDelayedReplies) ghostingScore += 10;
  if (hasDoubleText) ghostingScore += 15;

  // Manipulation score
  if (hasHotCold) manipulationScore += 20;
  if (hasGhostingSignals && hasInterestSignals) manipulationScore += 15;
  if (userDominant && stats.userMessages > stats.otherMessages * 2) manipulationScore += 10;

  // Context-based adjustments
  const contextMultipliers: Record<string, { interest: number; ghosting: number }> = {
    'ex': { interest: -10, ghosting: 15 },
    'situationship': { interest: -5, ghosting: 10 },
    'talking': { interest: 0, ghosting: 5 },
    'new': { interest: 10, ghosting: -5 },
    'crush': { interest: 5, ghosting: 0 }
  };

  const mult = contextMultipliers[context] || { interest: 0, ghosting: 0 };
  interestScore += mult.interest;
  ghostingScore += mult.ghosting;

  // Clamp scores
  interestScore = Math.max(10, Math.min(95, interestScore));
  ghostingScore = Math.max(5, Math.min(90, ghostingScore));
  manipulationScore = Math.max(5, Math.min(75, manipulationScore));

  const overallScore = calculateOverallScore(interestScore, ghostingScore, manipulationScore);

  // Context labels
  const contextLabels: Record<string, string> = {
    'crush': 'Crush secret',
    'ex': 'Ex',
    'new': 'Nouvelle relation',
    'talking': 'Talking stage',
    'situationship': 'Situationship'
  };
  const contextLabel = contextLabels[context] || 'Relation';

  // Generate punchline
  let punchline = '';
  if (overallScore >= 70) {
    punchline = `${contextLabel} ? Il/elle est interested ! 💕`;
  } else if (overallScore >= 50) {
    punchline = `${contextLabel}... Mixed signals 🤷`;
  } else if (overallScore >= 30) {
    punchline = `${contextLabel} ? Red flag alert 🚩`;
  } else {
    punchline = `${contextLabel} ? Ghost imminent... 👻`;
  }

  // Generate advice
  let advice = '';
  if (overallScore >= 70) {
    advice = `Pour ce ${contextLabel.toLowerCase()}, les signaux sont très positifs ! Continue à proposer des activités et vois comment ça évolue en vrai. Tu es sur la bonne voie ! 💪`;
  } else if (overallScore >= 50) {
    advice = `Les signaux sont mitigés pour ce ${contextLabel.toLowerCase()}. Prends du recul, laisse-le/la venir vers toi et vois si l'effort devient réciproque. Ne t'investis pas plus que lui/elle. 🔍`;
  } else if (overallScore >= 30) {
    advice = `Attention, les signaux ne sont pas bons. ${userDominant ? 'Tu fais tout le travail conversationnel. ' : ''}${hasGhostingSignals ? 'Les signes de ghosting sont présents. ' : ''}Protège ton énergie et envisage de passer à autre chose. 🛡️`;
  } else {
    advice = `Gros red flag ! ${hasGhostingSignals ? 'Le ghosting est imminent. ' : ''}${userDominant ? 'Tu t\'investis beaucoup plus que lui/elle. ' : ''}On te conseille de stopper les efforts et de te concentrer sur quelqu\'un qui mérite ton attention. 🚫`;
  }

  // Generate highlights
  const positive: string[] = [];
  const negative: string[] = [];
  const neutral: string[] = [];

  if (hasQuestions) positive.push(`Pose des questions (${stats.otherQuestionCount} détectée${stats.otherQuestionCount > 1 ? 's' : ''}) = montre de l'intérêt`);
  if (hasEmojis) positive.push(`Utilise des emojis (${stats.emojiUsage.other} détecté${stats.emojiUsage.other > 1 ? 's' : ''}) = communication chaleureuse`);
  if (balanced) positive.push("Conversation équilibrée = investissement mutuel");
  if (hasEnthusiasm) positive.push("Enthousiasme détecté dans les réponses");
  if (hasInterestSignals) positive.push("Signaux d'intérêt présents (propositions, etc.)");
  if (stats.averageOtherLength > 25) positive.push(`Messages longs (moyenne ${stats.averageOtherLength} car.) = effort`);

  if (userDominant) negative.push(`Tu fais ${Math.round((stats.userMessages / stats.totalMessages) * 100)}% de la conversation`);
  if (hasShortReplies) negative.push("Réponses courtes = effort minimal");
  if (hasGhostingSignals) negative.push("Signaux de ghosting potentiels (excuses vagues, délais)");
  if (!hasQuestions) negative.push("Ne pose pas de questions sur toi");
  if (hasOneWordReplies) negative.push("Réponses monosyllabiques détectées");
  if (hasHotCold) negative.push("Comportement hot/cold détecté");
  if (hasDoubleText) negative.push("Tu doubles tes messages (signe d'investissement excessif)");

  neutral.push(`${stats.totalMessages} messages analysés`);
  neutral.push(`Contexte: ${contextLabel}`);
  neutral.push(`Plateforme: ${platform}`);

  // Generate badges
  const badges: string[] = [];

  if (overallScore >= 70) badges.push("💕 Intérêt mutuel");
  else if (overallScore >= 50) badges.push("🤷 Mixed Signals");
  else if (overallScore >= 30) badges.push("🚩 Red Flag");
  else badges.push("👻 Ghost Risk");

  if (hasEmojis) badges.push("😊 Communique bien");
  if (userDominant) badges.push("💔 Déséquilibré");
  if (hasGhostingSignals) badges.push("🥶 Cold behavior");
  if (balanced && overallScore >= 50) badges.push("✨ Équilibré");
  if (hasHotCold) badges.push("🎭 Hot & Cold");

  // Evolution score
  const evolutionScore = {
    start: Math.min(95, interestScore + 15),
    middle: interestScore,
    end: Math.max(5, interestScore - (hasGhostingSignals ? 20 : 10)),
    trend: (interestScore > 60 ? 'stable' : hasGhostingSignals ? 'declining' : 'stable') as 'improving' | 'stable' | 'declining'
  };

  // Personality insight
  let personalityInsight = '';
  if (overallScore >= 70) {
    personalityInsight = "Profil engagé et intéressé. Cette personne semble vouloir poursuivre la relation. Continue sur cette dynamique positive !";
  } else if (overallScore >= 50) {
    personalityInsight = "Profil réservé ou indécis. Peut-être timide, ou simplement pas encore sûr de ses sentiments. À observer davantage.";
  } else {
    personalityInsight = "Profil distant avec peu d'investissement. Attention au ghosting et aux comportements avoidant. Protège-toi.";
  }

  return {
    interestScore,
    manipulationScore,
    ghostingScore,
    overallScore,
    advice,
    punchline,
    highlights: { positive, negative, neutral },
    vibe: overallScore >= 60 ? "Positif" : overallScore >= 40 ? "Mitigé" : "Négatif",
    badges,
    conversationStats: stats,
    evolutionScore,
    redFlagsDetected: negative.slice(0, 3),
    greenFlagsDetected: positive.slice(0, 3),
    personalityInsight
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversation, context, platform } = body;

    // Validation
    if (!conversation || typeof conversation !== 'string') {
      return NextResponse.json({ error: 'Conversation requise' }, { status: 400 });
    }

    if (conversation.length < 20) {
      return NextResponse.json({ error: 'Conversation trop courte (min 20 caractères)' }, { status: 400 });
    }

    if (conversation.length > 8000) {
      return NextResponse.json({ error: 'Conversation trop longue (max 8000 caractères)' }, { status: 400 });
    }

    // Analyze (purely algorithmic, no AI SDK needed)
    const stats = analyzeConversationStats(conversation);
    const analysis = generateAnalysis(conversation, stats, context || 'crush', platform || 'whatsapp');

    return NextResponse.json({ success: true, analysis });

  } catch (error) {
    console.error('Analysis Error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'analyse', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
