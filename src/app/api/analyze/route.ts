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
  const hasEnthusiasm = /(!|❤️|💕|😘|😍|🥰|love|adore|super|génial|top|haha|mdr|lol)/i.test(conversation);
  const hasShortReplies = /\b(ok|k|oui|non|maybe|peut-être|bof|okk|dacc)\b/i.test(conversation);
  const hasQuestions = stats.otherQuestionCount > 0;
  const hasEmojis = stats.emojiUsage.other > 0;
  const userDominant = stats.userMessages > stats.otherMessages * 1.5;
  const balanced = Math.abs(stats.userMessages - stats.otherMessages) <= 1;
  const hasGhostingSignals = /désolé|pas pu|un truc|plus tard|peut-être|maybe|pas disponible|occupé|busy/i.test(conversation);
  const hasInterestSignals = /tu veux|on pourrait|ça te dit|bientôt|hâte|envie|avec plaisir/i.test(conversation);
  const hasHotCold = (lowerConv.match(/maybe|peut-être|euh|hmm|bon|bref/gi) || []).length > 2;
  const hasDoubleText = /toi.*toi|moi.*moi/i.test(conversation);
  const hasOneWordReplies = /\b(ok|oui|non|k|okk|cool)\b[^a-z]*$/gim.test(conversation);

  let interestScore = 50, ghostingScore = 25, manipulationScore = 15;
  if (hasQuestions) interestScore += 15; if (hasEmojis) interestScore += 10; if (hasEnthusiasm) interestScore += 12;
  if (balanced) interestScore += 10; if (hasInterestSignals) interestScore += 15; if (stats.averageOtherLength > 30) interestScore += 8;
  if (userDominant) interestScore -= 15; if (hasShortReplies) interestScore -= 10; if (hasOneWordReplies) interestScore -= 8;
  if (userDominant) ghostingScore += 20; if (hasShortReplies) ghostingScore += 15; if (!hasQuestions) ghostingScore += 12;
  if (hasGhostingSignals) ghostingScore += 25; if (hasDoubleText) ghostingScore += 15;
  if (hasHotCold) manipulationScore += 20; if (hasGhostingSignals && hasInterestSignals) manipulationScore += 15;

  const contextMult: Record<string, { interest: number; ghosting: number }> = {
    'ex': { interest: -10, ghosting: 15 }, 'situationship': { interest: -5, ghosting: 10 },
    'talking': { interest: 0, ghosting: 5 }, 'new': { interest: 10, ghosting: -5 }, 'crush': { interest: 5, ghosting: 0 }
  };
  const mult = contextMult[context] || { interest: 0, ghosting: 0 };
  interestScore = Math.max(10, Math.min(95, interestScore + mult.interest));
  ghostingScore = Math.max(5, Math.min(90, ghostingScore + mult.ghosting));
  manipulationScore = Math.max(5, Math.min(75, manipulationScore));

  const overallScore = calculateOverallScore(interestScore, ghostingScore, manipulationScore);
  const contextLabels: Record<string, string> = { 'crush': 'Crush', 'ex': 'Ex', 'new': 'Nouvelle relation', 'talking': 'Talking stage', 'situationship': 'Situationship', 'friend': 'Ami(e)', 'other': 'Autre' };
  const contextLabel = contextLabels[context] || 'Relation';

  let punchline = overallScore >= 70 ? contextLabel + ' ? Interested ! 💕' : overallScore >= 50 ? contextLabel + '... Mixed signals 🤷' : overallScore >= 30 ? contextLabel + ' ? Red flag 🚩' : contextLabel + ' ? Ghost imminent... 👻';
  let advice = overallScore >= 70 ? 'Signaux positifs ! Continue sur cette voie. 💪' : overallScore >= 50 ? 'Signaux mitigés. Prends du recul. 🔍' : overallScore >= 30 ? 'Attention, signaux négatifs. Protège-toi. 🛡️' : 'Red flag ! Passe à autre chose. 🚫';

  const positive: string[] = [], negative: string[] = [], neutral: string[] = [];
  if (hasQuestions) positive.push('Pose des questions = intérêt');
  if (hasEmojis) positive.push('Utilise des emojis = chaleureux');
  if (balanced) positive.push('Conversation équilibrée');
  if (hasEnthusiasm) positive.push('Enthousiasme détecté');
  if (userDominant) negative.push('Tu fais la plupart de la conversation');
  if (hasShortReplies) negative.push('Réponses courtes');
  if (hasGhostingSignals) negative.push('Signaux de ghosting');
  if (!hasQuestions) negative.push('Ne pose pas de questions');
  neutral.push(stats.totalMessages + ' messages analysés');

  const badges: string[] = [];
  if (overallScore >= 70) badges.push('💕 Intérêt'); else if (overallScore >= 50) badges.push('🤷 Mixed'); else if (overallScore >= 30) badges.push('🚩 Red Flag'); else badges.push('👻 Ghost Risk');
  if (hasEmojis) badges.push('😊 Chaleureux');
  if (userDominant) badges.push('💔 Déséquilibré');

  return {
    interestScore, manipulationScore, ghostingScore, overallScore, advice, punchline,
    highlights: { positive, negative, neutral }, vibe: overallScore >= 60 ? 'Positif' : overallScore >= 40 ? 'Mitigé' : 'Négatif', badges,
    conversationStats: stats,
    evolutionScore: { start: Math.min(95, interestScore + 15), middle: interestScore, end: Math.max(5, interestScore - 10), trend: 'stable' },
    redFlagsDetected: negative.slice(0, 3), greenFlagsDetected: positive.slice(0, 3),
    personalityInsight: overallScore >= 70 ? 'Profil engagé' : overallScore >= 50 ? 'Profil réservé' : 'Profil distant'
  };
}

export async function POST(request: NextRequest) {
  try {
    const { conversation, context, platform } = await request.json();
    if (!conversation || conversation.length < 20) return NextResponse.json({ error: 'Conversation trop courte' }, { status: 400 });
    const stats = analyzeConversationStats(conversation);
    const analysis = generateAnalysis(conversation, stats, context || 'crush', platform || 'whatsapp');
    return NextResponse.json({ success: true, analysis });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de l\'analyse', details: error instanceof Error ? error.message : 'Unknown' }, { status: 500 });
  }
}
