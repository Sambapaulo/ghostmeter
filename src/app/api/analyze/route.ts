import { NextRequest, NextResponse } from 'next/server';
import { addUserLog } from '@/lib/localStore';
import OpenAI from 'openai';

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

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { conversation, context } = await request.json();

    if (!conversation || typeof conversation !== 'string') {
      return NextResponse.json({ error: 'Conversation requise' }, { status: 400 });
    }

    const systemPrompt = `Tu es un expert en analyse de conversations romantiques. Analyse les conversations pour détecter les signes de ghosting, intérêt, réciprocité et manipulation.

RÈGLES CRITIQUES:
1. Les expressions d'amour ("je t'aime", "love you", "moi aussi je t'aime") indiquent un FORT INTÉRÊT MUTUEL - score d'intérêt TRÈS ÉLEVÉ (85-98%)
2. La réciprocité est un signe TRÈS POSITIF
3. Le ghosting signifie ABSENCE DE RÉPONSE pendant longtemps, PAS des réponses courtes

Réponds UNIQUEMENT avec un JSON valide (sans markdown, sans backticks):
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

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Analyse cette conversation (contexte: ${context || 'crush'}):\n\n${conversation}` }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) throw new Error('Pas de réponse');

    let analysis: AnalysisResult = JSON.parse(responseContent);

    // Validation et sanitisation
    analysis.interestScore = Math.max(0, Math.min(100, Number(analysis.interestScore) || 50));
    analysis.manipulationScore = Math.max(0, Math.min(100, Number(analysis.manipulationScore) || 0));
    analysis.ghostingScore = Math.max(0, Math.min(100, Number(analysis.ghostingScore) || 0));
    analysis.overallScore = Math.max(0, Math.min(100, Number(analysis.overallScore) || 50));

    if (!analysis.advice) analysis.advice = 'Continue à observer les signaux.';
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