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

// GET - Returns the current referral configuration (public)
export async function GET() {
  try {
    const rawConfig = await kv.get('referral:config')
    const config: ReferralConfig = rawConfig && typeof rawConfig === 'object'
      ? { ...defaultConfig, ...(rawConfig as Partial<ReferralConfig>) }
      : defaultConfig

    const totalReferrals = (await kv.get('referral:stats:total_referrals')) as number | null
    const totalConverted = (await kv.get('referral:stats:total_converted')) as number | null

    return NextResponse.json({
      enabled: config.enabled,
      referrerRewardType: config.referrerRewardType,
      referrerRewardAmount: config.referrerRewardAmount,
      referredRewardType: config.referredRewardType,
      referredRewardAmount: config.referredRewardAmount,
      totalReferrals: totalReferrals || 0,
      totalConverted: totalConverted || 0
    })
  } catch (error) {
    console.error('[REFERRAL CONFIG GET] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// PUT - Updates referral configuration (admin)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { enabled, referrerRewardType, referrerRewardAmount, referredRewardType, referredRewardAmount } = body

    const config: ReferralConfig = {
      enabled: typeof enabled === 'boolean' ? enabled : true,
      referrerRewardType: (referrerRewardType === 'free_analyses' || referrerRewardType === 'premium_days')
        ? referrerRewardType
        : 'free_analyses',
      referrerRewardAmount: typeof referrerRewardAmount === 'number' ? referrerRewardAmount : 2,
      referredRewardType: (referredRewardType === 'free_analyses' || referredRewardType === 'premium_days')
        ? referredRewardType
        : 'free_analyses',
      referredRewardAmount: typeof referredRewardAmount === 'number' ? referredRewardAmount : 1
    }

    await kv.set('referral:config', config)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[REFERRAL CONFIG PUT] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
