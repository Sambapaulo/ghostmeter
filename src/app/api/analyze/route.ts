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

INTERET (interestScore) - GLOBAL, mais reflechir QUI est interesse:
- Compliments ("t'es sympa", "t'es belle") = signe d'interet de celui qui le dit
- Questions ouvertes ("tu fais quoi ce week-end ?") = INTERESSE (60-80%) de la part de celui qui pose
- Propositions de rendez-vous ("tu veux qu'on se voie ?") = FORTEMENT INTERESSE (70-85%) de la part de celui qui propose
- "Je te dis ça", "je te redis", "on verra" = la personne qui dit ça RETARDE et est EVASIF = faible engagement (20-35%)
- "ok" ou "d'accord" en reponse a une reponse evasive ("je te dis ça") = reponse NORMALE, PAS du desinteret — c'est l'autre qui n'a pas donne de reponse claire
- Reponses uniques sans rebond ("merci", "ok", "rien de special", "ah ok") = FAIBLE INTERET ou DESINTERET (5-20%) UNIQUEMENT si l'autre avait initie quelque chose d'engageant (compliment, question ouverte)
- IMPORTANT: une reponse "ok" APRES une reponse evasive ou retardatrice n'est PAS du desinteret — ne pas le compter comme negatif
- Si quelqu'un revient plus tard (ex: "2h plus tard") pour relancer = il EST interesse malgre un debut evasif
- Reciprocite dans les messages = les DEUX sont interesses
- Si UN SEUL initie/complimente/pose des questions et l'autre repond de facon minimale, l'interet global est DESSEQUILIBRE (30-45%)

GHOSTING (ghostingScore):
- Ghosting = ABSENCE DE REPONSE pendant longtemps, PAS des reponses courtes
- "Je te redis" / "je te dis ça" sans donner de reponse claire = soft ghosting (40-60%)
- "Je te dis ça" + silence de plusieurs heures avant de relancer = ghosting passif-agressif (50-65%)
- Revenir apres un long silence pour relancer ne RESET PAS le score ghosting — le silence compte
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

IDENTIFIER QUI INITIE vs QUI BLOQUE - CRUCIAL:
- Celui/celle qui pose des questions, complimente ou propose = montre de l interet = comportement ACTIF/POSITIF
- Celui/celle qui repond par des mots seuls ("ok", "merci", "ah ok", "rien de special") = BLOQUE la conversation = comportement PASSIF/NEGATIF
- MAIS "ok" apres une reponse evasive ("je te dis ca", "on verra") = reponse normale, le BLOCAGE vient de celui qui a ete evasif
- Celui qui dit "je te dis ca" / "je te redis" = RETARDEUR, c est LUI qui ne s engage pas
- Prendre en compte le CONTEXTE TEMPOREL: si quelqu un revient apres un delai pour relancer, il est interesse
- Quand une personne pose une question legitime sur les limites ou la confiance = DEMANDE DE CLARTE
- Le conseil doit identifier clairement QUI ne s investit pas et s adresser a la personne qui essaie
- Ne JAMAIS dire a quelqu un qui a propose de se voir qu il "bloque" parce qu il a dit "ok" a une reponse evasive
- Le punchline doit refleter la dynamique REELLE, pas un resume generique

SCORE GLOBAL (overallScore):
- C'est un indicateur de SANTE RELATIONNELLE et de RECIPROCITE
- Desequilibre fort (un initie, l'autre bloque) = score 20-40
- Dynamique ou l'un est evade/esquive puis revient plus tard = score 45-60 (pas 80+, c'est un signal mitigé)
- 0-30 = dynamique toxique ou completement desequilibree
- 30-60 = communication insuffisante ou a sens unique
- 60-80 = dynamique saine avec des points d'amelioration
- 80-100 = excellente dynamique, reciprocite ET engagement IMMEDIAT (pas apres des heures de silence)

CONSEILS ET HIGHLIGHTS:
- Les "positif" et "negatif" doivent identifier QUI fait QUOI (ex: "Il pose des questions mais elle repond de facon fermee")
- Le conseil doit etre PRECIS et cible: dire QUI ne s'investit pas et pourquoi
- Si un seul s'investit, le conseil doit l'aider a voir que l'autre n'est peut-etre pas interesse
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