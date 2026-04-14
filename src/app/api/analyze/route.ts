import { NextRequest, NextResponse } from 'next/server';
import { addUserLog } from '@/lib/localStore';
import OpenAI from 'openai';

// Empêcher le pre-render au build (requiert la clé API OpenAI)
export const dynamic = 'force-dynamic'

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
    const { conversation, context, email } = await request.json();

    if (!conversation || typeof conversation !== 'string') {
      return NextResponse.json({ error: 'Conversation requise' }, { status: 400 });
    }

    const systemPrompt = `Tu es un expert en psychologie relationnelle et analyse de conversations romantiques. Tu detectes les signaux de ghosting, d'interet, de reciprocite et de manipulation emotionnelle.

=== REGLES CRITIQUES ===

INTERET (interestScore):
- Expressions d'amour directes ("je t'aime", "love you") = TRES ELEVE (85-98%)
- Reciprocite dans les messages = POSITIF
- Propositions de rendez-vous, questions sur l'autre = INTERESSE (60-80%)
- Reponses evasives ("on verra", "je te redis", "laisse tomber") = FAIBLE INTERET (10-30%)
- Absence d'engagement ou de questions = DESINTERET

GHOSTING (ghostingScore):
- Ghosting = ABSENCE DE REPONSE pendant longtemps, PAS des reponses courtes
- "Je te redis" sans suite = soft ghosting = score eleve (40-60%)
- Reponses systematiquement plus courtes et retardees = ghosting progressif (30-50%)

MANIPULATION (manipulationScore) - TRES IMPORTANT:
- Chantage emotionnel ("si tu m'aimais vraiment...", "si tu me connaissais tu saurais...") = 60-80%
- Injonctions culpabilisantes ("si tu me aimais tu ferais...", "une personne qui t'aime ferait...") = 60-80%
- Retournement de culpabilite ("c'est de ta faute si...", "tu me pousses a...") = 70-85%
- Menaces emotionnelles ("je vais me sentir mal", "tu vas le regretter") = 75-90%
- Silent treatment puni (ne plus parler pour punir l'autre) = 50-70%
- Minimisation des sentiments de l'autre ("tu exageres", "c'est rien", "tu es trop sensible", "tu abuses", "t'es serieuse la ?") = 55-75%
- Invalidation emotionnelle (repondre "t'es serieuse ?" a une question legitime au lieu d'y repondre) = 50-65%
- Love bombing excessif (trop de declarations rapides) = 40-60%
- Comparaisons degradeantes ("mon ex faisait mieux", "tu n'es pas comme...") = 65-80%
- "Laisse tomber" apres avoir culpabilise = evitement toxique = 40-55% de manipulation
- Esquiver une question legitime sur les limites ou la confiance (ex: "pourquoi t'as like sa photo ?") = 45-65%
- Reponses normales, honnetes, respectueuses = 0-10%

IDENTIFIER LE BON BOURREAUX / LA BONNE VICTIME - CRUCIAL:
- Quand une personne pose une question legitime sur les limites, la confiance ou un comportement qui la blesse (ex: "pourquoi t'as like sa photo ?"), c'est une DEMANDE DE CLARTE, pas de la culpabilisation
- Quand l'autre personne esquive la question, minimise ("tu abuses", "t'es serieuse ?") ou retourne la culpabilite, C'EST LUI/MOI qui est toxique, pas celui/celle qui pose la question
- Le conseil doit TOUJOURS s'adresser a la personne qui a le comportement sain (celle qui pose des questions, qui exprime ses sentiments)
- NE JAMAIS dire a quelqu'un qui exprime un sentiment ou pose une question legitime de "ne pas culpabiliser l'autre" — c'est l'inverse qui est vrai

SCORE GLOBAL (overallScore):
- C'est un indicateur de SANTE RELATIONNELLE, pas de compatibilite
- 0-30 = dynamique toxique ou desequilibree
- 30-60 = communication insuffisante ou problématique
- 60-80 = dynamique saine avec des points d'amelioration
- 80-100 = excellente dynamique, reciprocite et respect

CONSEILS ET HIGHLIGHTS:
- Les "positif" et "negatif" doivent identifier QUI fait QUOI (ex: "Il utilise le chantage emotionnel" et non "Sa part")
- Le conseil doit s'adresser a la personne qui subit un comportement toxique ou qui essaie de communiquer sainement
- Le punchline doit capturer l'essentiel en une phrase percutante

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

    // Log l'analyse dans le journal utilisateur
    if (email) {
      await addUserLog(email, 'analyze', `Analyse conversation (contexte: ${context || 'crush'}, score: ${analysis.overallScore})`);
    }

    return NextResponse.json({ success: true, analysis });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json({ error: 'Erreur lors de l\'analyse' }, { status: 500 });
  }
}