import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@vercel/kv'

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
    }

    // Increment referred bonus
    if (config.referredRewardType === 'free_analyses') {
      await kv.incrby(`referral:bonus:${email}:analyses`, config.referredRewardAmount)
    } else if (config.referredRewardType === 'premium_days') {
      await kv.incrby(`referral:bonus:${email}:premium_days`, config.referredRewardAmount)
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
