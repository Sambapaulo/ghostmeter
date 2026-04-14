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

// Calcule la nouvelle date d'expiration premium
function calculateNewExpiry(currentExpiresAt: string | null | undefined, daysToAdd: number): string {
  const now = new Date()
  let newExpiresAt: Date
  if (currentExpiresAt && new Date(currentExpiresAt) > now) {
    newExpiresAt = new Date(currentExpiresAt)
  } else {
    newExpiresAt = new Date()
  }
  newExpiresAt.setDate(newExpiresAt.getDate() + daysToAdd)
  return newExpiresAt.toISOString()
}

// Active le premium dans le User record ET dans une cle Redis dediee (double securite)
async function activateReferralPremium(
  email: string,
  currentExpiresAt: string | null | undefined,
  daysToAdd: number,
  label: string
): Promise<string | null> {
  const newExpiresAt = calculateNewExpiry(currentExpiresAt, daysToAdd)
  
  // 1. Stocker dans la cle Redis dediee (toujours reussit car on utilise kv directement)
  try {
    await kv.set(`referral:premium_until:${email.toLowerCase()}`, newExpiresAt)
    console.log(`[REFERRAL] ${label} Redis key set: referral:premium_until:${email.toLowerCase()} = ${newExpiresAt}`)
  } catch (err) {
    console.error(`[REFERRAL] ${label} Failed to set Redis key:`, err)
  }

  // 2. Mettre a jour le User record (peut echouer si le compte n'existe pas encore)
  try {
    const user = await getUser(email.toLowerCase())
    if (user) {
      // Si le user a deja un premium admin ou paypal non-expire, on ne l'ecrase pas
      if (user.adminGranted) {
        console.log(`[REFERRAL] ${label} User has adminGranted premium, skipping User record update`)
        return newExpiresAt // On retourne quand meme la date pour le Redis
      }
      if (user.paypalOrderId && !user.referralPremium) {
        console.log(`[REFERRAL] ${label} User has PayPal premium, skipping User record update`)
        return newExpiresAt
      }

      user.isPremium = true
      user.referralPremium = true
      user.premiumExpiresAt = newExpiresAt
      if (!user.premiumSince) {
        user.premiumSince = new Date().toISOString()
      }
      await setUser(email.toLowerCase(), user)
      console.log(`[REFERRAL] ${label} User record updated: ${email} premium until ${newExpiresAt}`)
    } else {
      console.log(`[REFERRAL] ${label} User ${email} not found in auth store, Redis key is the fallback`)
    }
  } catch (err) {
    console.error(`[REFERRAL] ${label} Error updating User record:`, err)
    // Non bloquant : la cle Redis sert de fallback
  }

  return newExpiresAt
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

    // === REFERRER REWARD ===
    if (config.referrerRewardType === 'free_analyses') {
      await kv.incrby(`referral:bonus:${referrerEmail}:analyses`, config.referrerRewardAmount)
    } else if (config.referrerRewardType === 'premium_days') {
      await kv.incrby(`referral:bonus:${referrerEmail}:premium_days`, config.referrerRewardAmount)

      // Lire l'expiration actuelle du parrain (depuis Redis ou User record)
      let currentReferrerExpiry: string | null = null
      try {
        const existingRedisExpiry = await kv.get(`referral:premium_until:${referrerEmail.toLowerCase()}`)
        if (existingRedisExpiry) currentReferrerExpiry = existingRedisExpiry as string
      } catch (e) {}
      if (!currentReferrerExpiry) {
        try {
          const referrerUser = await getUser(referrerEmail.toLowerCase())
          if (referrerUser?.premiumExpiresAt) currentReferrerExpiry = referrerUser.premiumExpiresAt
        } catch (e) {}
      }

      await activateReferralPremium(
        referrerEmail,
        currentReferrerExpiry,
        config.referrerRewardAmount,
        'REFERRER'
      )
    }

    // === REFERRED REWARD ===
    if (config.referredRewardType === 'free_analyses') {
      await kv.incrby(`referral:bonus:${email}:analyses`, config.referredRewardAmount)
    } else if (config.referredRewardType === 'premium_days') {
      await kv.incrby(`referral:bonus:${email}:premium_days`, config.referredRewardAmount)

      let currentReferredExpiry: string | null = null
      try {
        const existingRedisExpiry = await kv.get(`referral:premium_until:${email.toLowerCase()}`)
        if (existingRedisExpiry) currentReferredExpiry = existingRedisExpiry as string
      } catch (e) {}
      if (!currentReferredExpiry) {
        try {
          const referredUser = await getUser(email.toLowerCase())
          if (referredUser?.premiumExpiresAt) currentReferredExpiry = referredUser.premiumExpiresAt
        } catch (e) {}
      }

      await activateReferralPremium(
        email,
        currentReferredExpiry,
        config.referredRewardAmount,
        'REFERRED'
      )
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
