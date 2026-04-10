import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

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
}

export async function POST(request: NextRequest) {
  try {
    const { conversation, context } = await request.json();

    if (!conversation || typeof conversation !== 'string') {
      return NextResponse.json({ error: 'Conversation requise' }, { status: 400 });
    }

    const zai = await ZAI.create();

    const systemPrompt = `Tu es un expert en analyse de conversations romantiques et de relations. Analyse les conversations pour detecter les signes de ghosting, interet, reciprocite et manipulation.

REGLES CRITIQUES:
1. Les expressions d'amour ("je t'aime", "love you", "moi aussi je t'aime", etc.) indiquent un FORT INTERET MUTUEL - score d'interet TRES ELEVE (85-98%), PAS faible!
2. La reciprocite (les deux personnes s'expriment de maniere egale) est un signe TRES POSITIF
3. Les messages courts ne sont PAS toujours negatifs - ils peuvent etre normaux
4. Les reponses rapides et enthousiastes indiquent un fort interet
5. Le ghosting signifie ABSENCE DE REPONSE pendant longtemps, PAS des reponses courtes
6. Le context est: crush, ex, new, talking, situationship, friend, other

Reponds UNIQUEMENT avec un JSON valide (sans markdown, sans backticks):
{
  "interestScore": 0-100,
  "manipulationScore": 0-100,
  "ghostingScore": 0-100,
  "overallScore": 0-100,
  "advice": "conseil personnalise",
  "punchline": "phrase courte et percutante",
  "highlights": {
    "positive": ["point positif 1"],
    "negative": ["point negatif 1"],
    "neutral": []
  },
  "vibe": "description de l'ambiance",
  "badges": ["badge1", "badge2"]
}

EXEMPLES D'ANALYSE CORRECTE:

1. "Toi: je t'aime\nLui/Elle: moi aussi je t'aime"
   - interestScore: 95
   - ghostingScore: 3
   - punchline: "Crush confirmee !"
   - badges: ["Amour mutuel", "Reciproque"]

2. "Toi: salut\nLui/Elle: (pas de reponse depuis 3 jours)"
   - interestScore: 10
   - ghostingScore: 90
   - punchline: "Ghost imminent..."
   - badges: ["Ghosting"]`;

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Analyse cette conversation (context: ${context || 'crush'}):\n\n${conversation}` }
      ],
      temperature: 0.3,
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) throw new Error('Pas de reponse');

    let analysis: AnalysisResult;
    let cleanedResponse = responseContent.trim();
    if (cleanedResponse.startsWith('```json')) cleanedResponse = cleanedResponse.slice(7);
    if (cleanedResponse.startsWith('```')) cleanedResponse = cleanedResponse.slice(3);
    if (cleanedResponse.endsWith('```')) cleanedResponse = cleanedResponse.slice(0, -3);
    
    analysis = JSON.parse(cleanedResponse.trim());

    // Clamp values
    analysis.interestScore = Math.max(0, Math.min(100, Number(analysis.interestScore) || 50));
    analysis.manipulationScore = Math.max(0, Math.min(100, Number(analysis.manipulationScore) || 0));
    analysis.ghostingScore = Math.max(0, Math.min(100, Number(analysis.ghostingScore) || 0));
    analysis.overallScore = Math.max(0, Math.min(100, Number(analysis.overallScore) || 50));
    
    if (!analysis.advice) analysis.advice = 'Continue a observer les signaux.';
    if (!analysis.punchline) analysis.punchline = 'Analyse en cours...';
    if (!analysis.vibe) analysis.vibe = 'Neutre';
    if (!analysis.badges) analysis.badges = [];
    if (!analysis.highlights) analysis.highlights = { positive: [], negative: [], neutral: [] };
    if (!Array.isArray(analysis.highlights.positive)) analysis.highlights.positive = [];
    if (!Array.isArray(analysis.highlights.negative)) analysis.highlights.negative = [];
    if (!Array.isArray(analysis.highlights.neutral)) analysis.highlights.neutral = [];

    return NextResponse.json({ success: true, analysis });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json({ error: 'Erreur lors de l\'analyse' }, { status: 500 });
  }
}
