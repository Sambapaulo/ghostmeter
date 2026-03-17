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
  highlights: { positive: string[]; negative: string[]; neutral: string[] };
  vibe: string;
  badges: string[];
  conversationStats: ConversationStats;
  evolutionScore: { start: number; middle: number; end: number; trend: 'improving' | 'stable' | 'declining' };
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
      userMessages++; userTotalLength += cleanLine.length;
      userQuestions += questions; userEmojis += emojis;
      if (index === 0) userInitiated = true;
    } else {
      otherMessages++; otherTotalLength += cleanLine.length;
      otherQuestions += questions; otherEmojis += emojis;
    }
  });
  
  return {
    totalMessages: userMessages + otherMessages, userMessages, otherMessages,
    averageUserLength: userMessages > 0 ? Math.round(userTotalLength / userMessages) : 0,
    averageOtherLength: otherMessages > 0 ? Math.round(otherTotalLength / otherMessages) : 0,
    whoInitiates: userInitiated ? 'user' : 'other',
    userQuestionCount: userQuestions, otherQuestionCount: otherQuestions,
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
  const hasOneWordReplies = /\b(ok|oui|non|k|okk|cool)\b[^a-z]*$/gim.test(conversation);
  
  let interestScore = 50, ghostingScore = 25, manipulationScore = 15;
  
  if (hasQuestions) interestScore += 15;
  if (hasEmojis) interestScore += 10;
  if (hasEnthusiasm) interestScore += 12;
  if (balanced) interestScore += 10;
  if (hasInterestSignals) interestScore += 15;
  if (stats.averageOtherLength > 30) interestScore += 8;
  if (userDominant) interestScore -= 15;
  if (hasShortReplies) interestScore -= 10;
  if (hasOneWordReplies) interestScore -= 8;
  
  if (userDominant) ghostingScore += 20;
  if (hasShortReplies) ghostingScore += 15;
  if (!hasQuestions) ghostingScore += 12;
  if (hasGhostingSignals) ghostingScore += 25;
  
  if (hasHotCold) manipulationScore += 20;
  if (hasGhostingSignals && hasInterestSignals) manipulationScore += 15;
  
  const contextLabels: Record<string, string> = { 'crush': 'Crush secret', 'ex': 'Ex', 'new': 'Nouvelle relation', 'talking': 'Talking stage', 'situationship': 'Situationship' };
  const contextLabel = contextLabels[context] || 'Relation';
  
  interestScore = Math.max(10, Math.min(95, interestScore));
  ghostingScore = Math.max(5, Math.min(90, ghostingScore));
  manipulationScore = Math.max(5, Math.min(75, manipulationScore));
  
  const overallScore = calculateOverallScore(interestScore, ghostingScore, manipulationScore);
  
  let punchline = overallScore >= 70 ? `${contextLabel} ? Il/elle est interested ! 💕` : overallScore >= 50 ? `${contextLabel}... Mixed signals 🤷` : overallScore >= 30 ? `${contextLabel} ? Red flag 🚩` : `${contextLabel} ? Ghost imminent... 👻`;
  
  let advice = overallScore >= 70 ? `Pour ce ${contextLabel.toLowerCase()}, les signaux sont très positifs ! Continue sur cette lancée. 💪` : overallScore >= 50 ? `Les signaux sont mitigés. Prends du recul et laisse-le/la venir vers toi. 🔍` : overallScore >= 30 ? `Attention, les signaux ne sont pas bons. Protège ton énergie. 🛡️` : `Gros red flag ! On te conseille de passer à autre chose. 🚫`;
  
  const positive: string[] = [], negative: string[] = [], neutral: string[] = [];
  if (hasQuestions) positive.push(`Pose des questions (${stats.otherQuestionCount} détectée${stats.otherQuestionCount > 1 ? 's' : ''})`);
  if (hasEmojis) positive.push(`Utilise des emojis (${stats.emojiUsage.other})`);
  if (balanced) positive.push("Conversation équilibrée");
  if (hasEnthusiasm) positive.push("Enthousiasme détecté");
  if (hasInterestSignals) positive.push("Signaux d'intérêt présents");
  
  if (userDominant) negative.push(`Tu fais ${Math.round((stats.userMessages / stats.totalMessages) * 100)}% de la conversation`);
  if (hasShortReplies) negative.push("Réponses courtes");
  if (hasGhostingSignals) negative.push("Signaux de ghosting");
  if (!hasQuestions) negative.push("Ne pose pas de questions");
  if (hasHotCold) negative.push("Comportement hot/cold");
  
  neutral.push(`${stats.totalMessages} messages analysés`);
  neutral.push(`Contexte: ${contextLabel}`);
  
  const badges: string[] = [];
  badges.push(overallScore >= 70 ? "💕 Intérêt mutuel" : overallScore >= 50 ? "🤷 Mixed Signals" : overallScore >= 30 ? "🚩 Red Flag" : "👻 Ghost Risk");
  if (hasEmojis) badges.push("😊 Communique bien");
  if (userDominant) badges.push("💔 Déséquilibré");
  if (hasGhostingSignals) badges.push("🥶 Cold behavior");
  if (hasHotCold) badges.push("🎭 Hot & Cold");
  
  return {
    interestScore, manipulationScore, ghostingScore, overallScore, advice, punchline,
    highlights: { positive, negative, neutral },
    vibe: overallScore >= 60 ? "Positif" : overallScore >= 40 ? "Mitigé" : "Négatif",
    badges,
    conversationStats: stats,
    evolutionScore: { start: interestScore + 10, middle: interestScore, end: interestScore - 10, trend: 'stable' },
    redFlagsDetected: negative.slice(0, 3),
    greenFlagsDetected: positive.slice(0, 3),
    personalityInsight: overallScore >= 60 ? "Profil engagé et intéressé." : overallScore >= 40 ? "Profil réservé, difficile à lire." : "Profil distant. Attention au ghosting."
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversation, context, platform } = body;

    if (!conversation || conversation.length < 20) {
      return NextResponse.json({ error: 'Conversation trop courte (min 20 caractères)' }, { status: 400 });
    }

    const stats = analyzeConversationStats(conversation);
    const analysis = generateAnalysis(conversation, stats, context || 'crush', platform || 'whatsapp');

    return NextResponse.json({ success: true, analysis });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}