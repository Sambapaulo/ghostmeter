import { NextRequest, NextResponse } from 'next/server'
import Tesseract from 'tesseract.js'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // 🧠 OCR
    const result = await Tesseract.recognize(buffer, 'eng')
    let text = result.data.text

    // 🧼 Nettoyage
    text = text.replace(/\n+/g, '\n').trim()

    // 💬 Parsing simple
    const messages = text
      .split('\n')
      .filter(l => l.length > 2)
      .map((line, i) => ({
        sender: i % 2 === 0 ? 'user' : 'other',
        text: line
      }))

    // 🎯 Analyse simple
    let score = 50

    messages.forEach(m => {
      const t = m.text.toLowerCase()

      if (t.includes('love') || t.includes('miss')) score += 10
      if (t.includes('busy') || t.includes('later')) score -= 5
      if (t.length < 5) score -= 3
    })

    score = Math.max(0, Math.min(100, score))

    return NextResponse.json({
      success: true,
      score,
      verdict:
        score > 70 ? "🔥 Très intéressé"
        : score > 40 ? "😐 Mitigé"
        : "❄️ Peu d’intérêt",
      messages
    })

  } catch (err) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}