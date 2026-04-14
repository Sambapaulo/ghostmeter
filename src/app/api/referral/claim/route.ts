import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@vercel/kv'
import { getUser, setUser } from '@/lib/localStore'

interface ReferralConfig {
  enabled: boolean
  referrerRewardType: 'free_analyses' | 'premium_days'
  referrerRewardAmount: number
  referredRewardType: 'free_analyses' | 'premium_days'
  referredRewardAmount: number
}

const defaultConfig: ReferralConfig = {
  enabled: true,
  referrerRewardType: 'free_analyses',
  referrerRewardAmount: 2,
  referredRewardType: 'free_analyses',
  referredRewardAmount: 1
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, email } = body

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Code requis' },
        { status: 400 }
      )
    }

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Email requis' },
        { status: 400 }
      )
    }

    // Get referral config
    const rawConfig = await kv.get('referral:config')
    const config: ReferralConfig = rawConfig && typeof rawConfig === 'object'
      ? { ...defaultConfig, ...(rawConfig as Partial<ReferralConfig>) }
      : defaultConfig

    if (!config.enabled) {
      return NextResponse.json(
        { success: false, error: 'Le système de parrainage est désactivé' },
        { status: 403 }
      )
    }

    // Look up the referral code
    const codeData = await kv.get(`referral:code:${code}`)
    if (!codeData || typeof codeData !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Code de parrainage invalide' },
        { status: 404 }
      )
    }

    const codeInfo = codeData as { email: string; createdAt: string; usedCount: number; convertedCount: number }
    const referrerEmail = codeInfo.email

    // Check if the referred email already claimed
    const existingClaim = await kv.get(`referral:claimed:${email}`)
    if (existingClaim) {
      return NextResponse.json(
        { success: false, error: 'Vous avez déjà utilisé un code de parrainage' },
        { status: 400 }
      )
    }

    // Don't allow self-referral
    if (referrerEmail.toLowerCase() === email.toLowerCase()) {
      return NextResponse.json(
        { success: false, error: 'Vous ne pouvez pas utiliser votre propre code' },
        { status: 400 }
      )
    }

    // Update code stats
    const updatedUsedCount = codeInfo.usedCount + 1
    const updatedConvertedCount = codeInfo.convertedCount + 1
    await kv.set(`referral:code:${code}`, {
      ...codeInfo,
      usedCount: updatedUsedCount,
      convertedCount: updatedConvertedCount
    })

    // Store the claim
    await kv.set(`referral:claimed:${email}`, {
      code,
      referrerEmail,
      claimedAt: new Date().toISOString()
    })

    // Increment referrer bonus
    if (config.referrerRewardType === 'free_analyses') {
      await kv.incrby(`referral:bonus:${referrerEmail}:analyses`, config.referrerRewardAmount)
    } else if (config.referrerRewardType === 'premium_days') {
      await kv.incrby(`referral:bonus:${referrerEmail}:premium_days`, config.referrerRewardAmount)

      // Activer le premium du parrain directement dans son User record
      try {
        const referrerUser = await getUser(referrerEmail.toLowerCase())
        if (referrerUser) {
          const now = new Date()
          let newExpiresAt: Date

          // Si le parrain est deja premium (admin ou paypal), on ne touche pas
          if (referrerUser.adminGranted || (referrerUser.paypalOrderId && !referrerUser.referralPremium)) {
            console.log('[REFERRAL] Referrer already has premium (admin/paypal), skipping premium activation')
          } else {
            // Calculer la nouvelle date d'expiration
            if (referrerUser.referralPremium && referrerUser.premiumExpiresAt && new Date(referrerUser.premiumExpiresAt) > now) {
              // Premium referral deja actif et non expire : ajouter les jours a la date actuelle
              newExpiresAt = new Date(referrerUser.premiumExpiresAt)
              newExpiresAt.setDate(newExpiresAt.getDate() + config.referrerRewardAmount)
            } else {
              // Nouveau premium referral ou expire : partir de maintenant
              newExpiresAt = new Date()
              newExpiresAt.setDate(newExpiresAt.getDate() + config.referrerRewardAmount)
            }

            referrerUser.isPremium = true
            referrerUser.referralPremium = true
            referrerUser.premiumExpiresAt = newExpiresAt.toISOString()
            if (!referrerUser.premiumSince) {
              referrerUser.premiumSince = now.toISOString()
            }
            await setUser(referrerEmail.toLowerCase(), referrerUser)
            console.log(`[REFERRAL] Referrer ${referrerEmail} premium activated until ${newExpiresAt.toISOString()}`)
          }
        } else {
          console.log(`[REFERRAL] Referrer ${referrerEmail} not found in user store (may not have account yet)`)
        }
      } catch (err) {
        console.error('[REFERRAL] Error activating referrer premium:', err)
        // Non bloquant : le bonus est quand meme enregistre dans Redis
      }
    }

    // Increment referred bonus
    if (config.referredRewardType === 'free_analyses') {
      await kv.incrby(`referral:bonus:${email}:analyses`, config.referredRewardAmount)
    } else if (config.referredRewardType === 'premium_days') {
      await kv.incrby(`referral:bonus:${email}:premium_days`, config.referredRewardAmount)

      // Activer le premium du filleul aussi
      try {
        const referredUser = await getUser(email.toLowerCase())
        if (referredUser) {
          const now = new Date()
          let newExpiresAt: Date

          if (referredUser.adminGranted || (referredUser.paypalOrderId && !referredUser.referralPremium)) {
            console.log('[REFERRAL] Referred already has premium (admin/paypal), skipping')
          } else {
            if (referredUser.referralPremium && referredUser.premiumExpiresAt && new Date(referredUser.premiumExpiresAt) > now) {
              newExpiresAt = new Date(referredUser.premiumExpiresAt)
              newExpiresAt.setDate(newExpiresAt.getDate() + config.referredRewardAmount)
            } else {
              newExpiresAt = new Date()
              newExpiresAt.setDate(newExpiresAt.getDate() + config.referredRewardAmount)
            }

            referredUser.isPremium = true
            referredUser.referralPremium = true
            referredUser.premiumExpiresAt = newExpiresAt.toISOString()
            if (!referredUser.premiumSince) {
              referredUser.premiumSince = now.toISOString()
            }
            await setUser(email.toLowerCase(), referredUser)
            console.log(`[REFERRAL] Referred ${email} premium activated until ${newExpiresAt.toISOString()}`)
          }
        }
      } catch (err) {
        console.error('[REFERRAL] Error activating referred premium:', err)
      }
    }

    // Increment global stats
    await kv.incrby('referral:stats:total_referrals', 1)
    await kv.incrby('referral:stats:total_converted', 1)

    return NextResponse.json({
      success: true,
      message: 'Récompenses obtenues !',
      referrerReward: {
        type: config.referrerRewardType,
        amount: config.referrerRewardAmount
      },
      referredReward: {
        type: config.referredRewardType,
        amount: config.referredRewardAmount
      }
    })
  } catch (error) {
    console.error('[REFERRAL CLAIM] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
