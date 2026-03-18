import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const SETTINGS_PATH = path.join(process.cwd(), 'data', 'settings.json')

interface PromoCode {
  code: string
  discount: number
  discountType: 'percent' | 'fixed'
  active: boolean
  maxUses: number
  currentUses: number
  createdAt: string
}

interface Settings {
  premiumPrice: number
  premiumCurrency: string
  premiumPeriod: string
  freeAnalysesPerDay: number
  adminPassword: string
  promoCodes: PromoCode[]
}

function getSettings(): Settings {
  try {
    const data = fs.readFileSync(SETTINGS_PATH, 'utf-8')
    return JSON.parse(data)
  } catch {
    return {
      premiumPrice: 4,
      premiumCurrency: '€',
      premiumPeriod: 'mois',
      freeAnalysesPerDay: 3,
      adminPassword: 'ghostmeter2024',
      promoCodes: []
    }
  }
}

function saveSettings(settings: Settings) {
  const dir = path.dirname(SETTINGS_PATH)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2))
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code } = body
    
    if (!code) {
      return NextResponse.json({ success: false, error: 'Code manquant' }, { status: 400 })
    }

    const settings = getSettings()
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

    let discountedPrice = settings.premiumPrice
    let discountAmount = 0

    if (promo.discountType === 'percent') {
      discountAmount = settings.premiumPrice * (promo.discount / 100)
      discountedPrice = settings.premiumPrice - discountAmount
    } else {
      discountAmount = promo.discount
      discountedPrice = Math.max(0, settings.premiumPrice - promo.discount)
    }

    settings.promoCodes[promoIndex].currentUses += 1
    saveSettings(settings)

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
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 })
  }
}