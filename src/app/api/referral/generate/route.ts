import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@vercel/kv'
import crypto from 'crypto'

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

function generateCode(): string {
  const bytes = crypto.randomBytes(4)
  let code = 'GHOST-'
  for (let i = 0; i < 4; i++) {
    code += CHARS[bytes[i] % CHARS.length]
  }
  return code
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Email requis' },
        { status: 400 }
      )
    }

    // Check if user already has a referral code
    const existingUser = await kv.get(`referral:user:${email}`)
    if (existingUser && typeof existingUser === 'object' && 'code' in existingUser) {
      const existingCode = (existingUser as { code: string }).code
      return NextResponse.json({
        success: true,
        code: existingCode,
        shareLink: `https://ghostmeter.vercel.app/?ref=${existingCode}`
      })
    }

    // Generate a unique code
    let code: string
    let attempts = 0
    do {
      code = generateCode()
      const existingCode = await kv.get(`referral:code:${code}`)
      if (!existingCode) break
      attempts++
    } while (attempts < 10)

    if (attempts >= 10) {
      return NextResponse.json(
        { success: false, error: 'Impossible de générer un code unique' },
        { status: 500 }
      )
    }

    const now = new Date().toISOString()

    // Store user -> code mapping
    await kv.set(`referral:user:${email}`, {
      code,
      email,
      createdAt: now
    })

    // Store code -> info mapping
    await kv.set(`referral:code:${code}`, {
      email,
      createdAt: now,
      usedCount: 0,
      convertedCount: 0
    })

    return NextResponse.json({
      success: true,
      code,
      shareLink: `https://ghostmeter.vercel.app/?ref=${code}`
    })
  } catch (error) {
    console.error('[REFERRAL GENERATE] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
