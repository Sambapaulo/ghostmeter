import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

interface AnalysisResult {
  interestScore: number
  manipulationScore: number
  ghostingScore: number
  overallScore: number
  advice: string
  punchline: string
  highlights: {
    positive: string[]
    negative: string[]
    neutral: string[]
  }
  vibe: string
  badges: string[]
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { conversation, context, platform } = body

    // Validation
    if (!conversation || typeof conversation !== 'string') {
      return NextResponse.json({ error: 'Conversation requise' }, { status: 400 })
    }

    if (conversation.length < 20) {
      return NextResponse.json({ error: 'Conversation trop courte (min 20 caractères)' }, { status: 400 })
    }

    if (conversation.length > 8000) {
      return NextResponse.json({ error: 'Conversation trop longue (max 8000 caractères)' }, { status: 400 })
    }

    // Contexte et plateforme
    const contextLabels: Record<string, string> = {
      'crush': 'Crush secret',
      'ex': 'Ex',
      'new': 'Nouvelle relation',
      'talking': 'Talking stage',
      'situationship': 'Situationship'
    }
    const contextLabel = contextLabels[context] || 'Relation'

    // Initialiser l'IA
    const zai = await ZAI.create()

    // Prompt pour l'IA
    const systemPrompt = `Tu es un expert en analyse de conversations romantiques et de relations. Tu analyses les conversations de dating avec bienveillance et perspicacité.

Tu dois analyser la conversation et retourner UN UNIQUEMENT un JSON valide avec ce format exact:
{
  "interestScore": <nombre entre 0-100>,
  "manipulationScore": <nombre entre 0-100>,
  "ghostingScore": <nombre entre 0-100>,
  "overallScore": <nombre entre 0-100>,
  "punchline": "<phrase courte et catchy résumant la situation>",
  "advice": "<conseil personnalisé de 2-3 phrases>",
  "highlights": {
    "positive": ["<point positif 1>", "<point positif 2>"],
    "negative": ["<point négatif 1>", "<point négatif 2>"],
    "neutral": ["<info neutre 1>"]
  },
  "vibe": "<Positif/Mitigé/Négatif>",
  "badges": ["<badge 1>", "<badge 2>"]
}

RÈGLES DE SCORING:
- interestScore: 0-100 (0=aucun intérêt, 100=très intéressé)
- manipulationScore: 0-100 (0=pas manipulant, 100=très manipulant)
- ghostingScore: 0-100 (0=pas de ghosting, 100=ghosting certain)
- overallScore: score global de santé de la relation

ANALYSE APPROFONDIE:
- Détecte le ton, l'enthousiasme, l'effort
- Identifie les comportements red flag (réponses courtes, délais, excuses vagues)
- Détecte les green flags (questions, emojis, propositions)
- Analyse l'équilibre de la conversation
- Identifie le hot/cold behavior
- Détecte le sarcasme et le double sens

BADGES POSSIBLES:
💕 Intérêt mutuel | 🤷 Mixed Signals | 🚩 Red Flag | 👻 Ghost Risk
😊 Communique bien | 💔 Déséquilibré | 🥶 Cold behavior | ✨ Équilibré
🎭 Hot & Cold | 🔥 Chaud bouillant | ❄️ Glacial | 💬 Bavard

Sois direct, moderne, et utilise des emojis. Réponds UNIQUEMENT avec le JSON, sans texte avant ou après.`

    const userPrompt = `Analyse cette conversation ${contextLabel} sur ${platform}:

"""
 ${conversation}
"""

Donne-moi l'analyse complète en JSON.`

    // Appel à l'IA
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 1000
    })

    const aiResponse = completion.choices[0]?.message?.content || ''

    // Parser la réponse JSON
    let analysis: AnalysisResult
    
    try {
      // Extraire le JSON de la réponse (au cas où il y a du texte autour)
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found')
      }
    } catch (parseError) {
      // Fallback: analyse basique si l'IA échoue
      console.error('JSON Parse Error:', parseError)
      analysis = generateFallbackAnalysis(conversation, contextLabel)
    }

    // Valider et corriger les scores
    analysis.interestScore = Math.max(0, Math.min(100, Number(analysis.interestScore) || 50))
    analysis.manipulationScore = Math.max(0, Math.min(100, Number(analysis.manipulationScore) || 15))
    analysis.ghostingScore = Math.max(0, Math.min(100, Number(analysis.ghostingScore) || 25))
    analysis.overallScore = Math.max(0, Math.min(100, Number(analysis.overallScore) || 50))

    // Recalculer le score global si nécessaire
    if (!analysis.overallScore || analysis.overallScore === 50) {
      analysis.overallScore = Math.round(
        (analysis.interestScore * 0.5) - 
        (analysis.ghostingScore * 0.3) - 
        (analysis.manipulationScore * 0.2) + 50
      )
      analysis.overallScore = Math.max(0, Math.min(100, analysis.overallScore))
    }

    return NextResponse.json({ success: true, analysis })

  } catch (error) {
    console.error('Analysis Error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'analyse', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}

// Fallback analysis si l'IA échoue
function generateFallbackAnalysis(conversation: string, context: string): AnalysisResult {
  const lowerConv = conversation.toLowerCase()
  
  const hasQuestions = (conversation.match(/\?/g) || []).length > 0
  const hasEmojis = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu.test(conversation)
  const hasEnthusiasm = /!|❤️|💕|😘|😍|🥰|love|adore|super|génial/i.test(conversation)
  const hasShortReplies = /\b(ok|k|oui|non|maybe|bof)\b/i.test(conversation)
  const hasGhostingSignals = /désolé|pas pu|plus tard|peut-être|occupé|busy/i.test(conversation)
  
  let interestScore = 50
  let ghostingScore = 25
  let manipulationScore = 15
  
  if (hasQuestions) interestScore += 15
  if (hasEmojis) interestScore += 10
  if (hasEnthusiasm) interestScore += 12
  if (hasShortReplies) interestScore -= 10
  if (hasGhostingSignals) ghostingScore += 25
  
  interestScore = Math.max(10, Math.min(95, interestScore))
  ghostingScore = Math.max(5, Math.min(90, ghostingScore))
  
  const overallScore = Math.round((interestScore * 0.5) - (ghostingScore * 0.3) - (manipulationScore * 0.2) + 50)
  
  let punchline = ''
  if (overallScore >= 70) punchline = `${context} ? Il/elle est interested ! 💕`
  else if (overallScore >= 50) punchline = `${context}... Mixed signals 🤷`
  else if (overallScore >= 30) punchline = `${context} ? Red flag alert 🚩`
  else punchline = `${context} ? Ghost imminent... 👻`
  
  return {
    interestScore,
    manipulationScore,
    ghostingScore,
    overallScore: Math.max(0, Math.min(100, overallScore)),
    punchline,
    advice: "L'analyse détaillée n'est pas disponible pour le moment. Voici une analyse basique.",
    highlights: {
      positive: hasQuestions ? ["Pose des questions"] : [],
      negative: hasShortReplies ? ["Réponses courtes"] : [],
      neutral: ["Analyse basique"]
    },
    vibe: overallScore >= 60 ? "Positif" : overallScore >= 40 ? "Mitigé" : "Négatif",
    badges: overallScore >= 50 ? ["🤷 Mixed Signals"] : ["🚩 Red Flag"]
  }
}