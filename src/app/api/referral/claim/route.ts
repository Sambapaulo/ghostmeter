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

const DAY_MS = 86400000

/**
 * Active le premium de parrainage de maniere atomique (sans race condition).
 * 
 * Logique : on utilise un compteur atomique (kv.incrby) pour le nombre total de jours
 * et un timestamp de depart (referral:premium_start). L'expiration est calculée comme:
 *   start + totalDays * 24h
 * 
 * Si le premium precedent a expire, on reinitialise le compteur et le start.
 */
async function activateReferralPremium(
  email: string,
  daysToAdd: number,
  label: string
): Promise<string> {
  const emailKey = email.toLowerCase()

  // 1. Le compteur a deja ete incremente par kv.incrby dans l'appelant (operation atomique)
  // On lit le total actuel des jours premium accumules
  const totalDays = Number(await kv.get(`referral:bonus:${emailKey}:premium_days`)) || daysToAdd

  // 2. Lire ou initialiser le timestamp de depart
  let startTs = Number(await kv.get(`referral:premium_start:${emailKey}`))
  if (!startTs) {
    // Premiere activation - definir le start
    startTs = Date.now()
    await kv.set(`referral:premium_start:${emailKey}`, String(startTs))
  } else {
    // Verifier si le premium precedent a expire
    const prevDays = totalDays - daysToAdd
    if (prevDays > 0) {
      const prevExpiry = startTs + prevDays * DAY_MS
      if (prevExpiry <= Date.now()) {
        // Premium expire - reinitialiser
        startTs = Date.now()
        await kv.set(`referral:premium_start:${emailKey}`, String(startTs))
        await kv.set(`referral:bonus:${emailKey}:premium_days`, String(daysToAdd))
      }
    }
  }

  // 3. Relire le compteur pour etre sur (en cas de reinitialisation)
  const finalDays = Number(await kv.get(`referral:bonus:${emailKey}:premium_days`)) || daysToAdd
  const finalStart = Number(await kv.get(`referral:premium_start:${emailKey}`)) || Date.now()

  // 4. Calculer la nouvelle expiration
  const newExpiryDate = new Date(finalStart + finalDays * DAY_MS)
  const newExpiryStr = newExpiryDate.toISOString()

  console.log(`[REFERRAL] ${label} ${emailKey}: ${finalDays} days from ${new Date(finalStart).toISOString()} → expires ${newExpiryStr}`)

  // 5. Stocker l'expiration dans Redis
  await kv.set(`referral:premium_until:${emailKey}`, newExpiryStr)

  // 6. Mettre a jour le User record (best effort)
  try {
    const user = await getUser(emailKey)
    if (user) {
      if (user.adminGranted) {
        console.log(`[REFERRAL] ${label} User has adminGranted premium, skipping User record (Redis keys updated)`)
        return newExpiryStr
      }
      if (user.paypalOrderId && !user.referralPremium) {
        console.log(`[REFERRAL] ${label} User has PayPal premium, skipping User record (Redis keys updated)`)
        return newExpiryStr
      }

      user.isPremium = true
      user.referralPremium = true
      user.premiumExpiresAt = newExpiryStr
      if (!user.premiumSince) {
        user.premiumSince = new Date().toISOString()
      }
      await setUser(emailKey, user)
      console.log(`[REFERRAL] ${label} User record updated: ${emailKey} premium until ${newExpiryStr}`)
    } else {
      console.log(`[REFERRAL] ${label} User ${emailKey} not found, Redis keys are the fallback`)
    }
  } catch (err) {
    console.error(`[REFERRAL] ${label} Error updating User record:`, err)
  }

  return newExpiryStr
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
        { success: false, error: 'Le systeme de parrainage est desactive' },
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
        { success: false, error: 'Vous avez deja utilise un code de parrainage' },
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
      // Incrby est atomique - le compteur sera toujours correct meme avec des claims simultanes
      await kv.incrby(`referral:bonus:${referrerEmail}:premium_days`, config.referrerRewardAmount)
      // La fonction activeReferralPremium lit le compteur et calcule l'expiration de maniere cumulative
      await activateReferralPremium(referrerEmail, config.referrerRewardAmount, 'REFERRER')
    }

    // === REFERRED REWARD ===
    if (config.referredRewardType === 'free_analyses') {
      await kv.incrby(`referral:bonus:${email}:analyses`, config.referredRewardAmount)
    } else if (config.referredRewardType === 'premium_days') {
      await kv.incrby(`referral:bonus:${email}:premium_days`, config.referredRewardAmount)
      await activateReferralPremium(email, config.referredRewardAmount, 'REFERRED')
    }

    // Increment global stats
    await kv.incrby('referral:stats:total_referrals', 1)
    await kv.incrby('referral:stats:total_converted', 1)

    return NextResponse.json({
      success: true,
      message: 'Recompenses obtenues !',
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
