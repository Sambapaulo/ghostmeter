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

    const systemPrompt = `Tu es un expert en analyse de conversations romantiques. Analyse les conversations pour detecter les signes de ghosting, interet, reciprocite et manipulation.

REGLES CRITIQUES:
1. Les expressions d'amour ("je t'aime", "love you", "moi aussi je t'aime") indiquent un FORT INTERET MUTUEL - score d'interet TRES ELEVE (85-98%)
2. La reciprocite est un signe TRES POSITIF
3. Le ghosting signifie ABSENCE DE REPONSE pendant longtemps, PAS des reponses courtes

Reponds UNIQUEMENT avec un JSON valide (sans markdown, sans backticks):
{
  "interestScore": 0-100,
  "manipulationScore": 0-100,
  "ghostingScore": 0-100,
  "overallScore": 0-100,
  "advice": "conseil",
  "punchline": "phrase courte",
  "highlights": {"positive": [], "negative": [], "neutral": []},
  "vibe": "ambiance",
  "badges": ["badge"]
}`;

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Analyse: ${conversation}` }
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
console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return NextResponse.json({ error: 'Erreur lors de l\'analyse' }, { status: 500 });
  }
}