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
  promoCodes: PromoCode[]
}

// Get admin password from environment variable (secure)
function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD || 'ghostmeter2024'
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

// GET - Fetch settings
export async function GET() {
  try {
    const settings = getSettings()
    return NextResponse.json({
      success: true,
      settings: {
        ...settings,
        adminPassword: '••••••••'
      }
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to load settings' }, { status: 500 })
  }
}

// POST - Login or update settings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const currentSettings = getSettings()
    const adminPassword = getAdminPassword()

    // LOGIN ACTION
    if (body.action === 'login') {
      if (body.password === adminPassword) {
        return NextResponse.json({
          success: true,
          settings: {
            ...currentSettings,
            adminPassword: '••••••••'
          }
        })
      } else {
        return NextResponse.json({ success: false, error: 'Invalid password' }, { status: 401 })
      }
    }

    // UPDATE SETTINGS
    if (body.action === 'update') {
      saveSettings(body.settings)
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}