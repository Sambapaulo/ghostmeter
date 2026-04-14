import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@vercel/kv'
import { getUser } from '@/lib/localStore'

// GET - Returns the bonus analyses/days a user has from referrals
export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get('email')

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Email requis' },
        { status: 400 }
      )
    }

    // Get bonus analyses
    const bonusAnalyses = (await kv.get(`referral:bonus:${email}:analyses`)) as number | null

    // Get premium days (statistique uniquement, le vrai premium est dans le User record)
    const premiumDays = (await kv.get(`referral:bonus:${email}:premium_days`)) as number | null

    // Get user's own referral code
    const userData = await kv.get(`referral:user:${email}`)
    let referralCode: string | null = null
    let referralStats = { usedCount: 0, convertedCount: 0 }

    if (userData && typeof userData === 'object' && 'code' in userData) {
      referralCode = (userData as { code: string }).code

      // Get referral stats for the user's code
      const codeData = await kv.get(`referral:code:${referralCode}`)
      if (codeData && typeof codeData === 'object' && 'usedCount' in codeData) {
        const codeInfo = codeData as { usedCount: number; convertedCount: number }
        referralStats = {
          usedCount: codeInfo.usedCount || 0,
          convertedCount: codeInfo.convertedCount || 0
        }
      }
    }

    // Verifier si le User a un premium actif via parrainage
    let referralPremiumExpiresAt: string | null = null
    let isReferralPremium = false
    try {
      const user = await getUser(email.toLowerCase())
      if (user && user.referralPremium && user.premiumExpiresAt) {
        const expiresAt = new Date(user.premiumExpiresAt)
        if (expiresAt > new Date()) {
          referralPremiumExpiresAt = user.premiumExpiresAt
          isReferralPremium = true
        }
      }
    } catch (err) {
      // Non bloquant
    }

    return NextResponse.json({
      bonusAnalyses: bonusAnalyses || 0,
      premiumDays: premiumDays || 0,
      referralCode,
      referralStats,
      referralPremiumExpiresAt,
      isReferralPremium
    })
  } catch (error) {
    console.error('[REFERRAL BONUS] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
