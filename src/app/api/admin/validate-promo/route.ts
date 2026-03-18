import { NextRequest, NextResponse } from 'next/server'
import { getSettings, saveSettings, Settings, PromoCode } from '@/lib/kv'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code } = body
    
    if (!code) {
      return NextResponse.json({ 
        success: false, 
        error: 'Code manquant' 
      }, { status: 400 })
    }

    const settings = await getSettings()
    const promoIndex = settings.promoCodes.findIndex(
      p => p.code.toUpperCase() === code.toUpperCase()
    )

    if (promoIndex === -1) {
      return NextResponse.json({ 
        success: false, 
        error: 'Code promo invalide' 
      }, { status: 404 })
    }

    const promo = settings.promoCodes[promoIndex]

    if (!promo.active) {
      return NextResponse.json({ 
        success: false, 
        error: 'Ce code promo n\'est plus actif' 
      }, { status: 400 })
    }

    if (promo.currentUses >= promo.maxUses) {
      return NextResponse.json({ 
        success: false, 
        error: 'Ce code promo a atteint sa limite' 
      }, { status: 400 })
    }

    // Calculate discounted price
    let discountedPrice = settings.premiumPrice
    let discountAmount = 0

    if (promo.discountType === 'percent') {
      discountAmount = settings.premiumPrice * (promo.discount / 100)
      discountedPrice = settings.premiumPrice - discountAmount
    } else {
      discountAmount = promo.discount
      discountedPrice = Math.max(0, settings.premiumPrice - promo.discount)
    }

    // Increment usage
    settings.promoCodes[promoIndex].currentUses += 1
    await saveSettings(settings)

    return NextResponse.json({
      success: true,
      originalPrice: settings.premiumPrice,
      discountedPrice: Math.round(discountedPrice * 100) / 100,
      discount: promo.discount,
      discountType: promo.discountType,
      discountAmount: Math.round(discountAmount * 100) / 100,
      currency: settings.premiumCurrency,
      message: promo.discount === 100 
        ? '🎉 Premium gratuit !' 
        : `✨ ${promo.discount}${promo.discountType === 'percent' ? '%' : settings.premiumCurrency} de réduction !`
    })
    
  } catch (error) {
    console.error('Validate Promo Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Erreur serveur' 
    }, { status: 500 })
  }
}