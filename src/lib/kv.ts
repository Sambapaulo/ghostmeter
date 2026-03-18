import { NextResponse } from 'next/server'

// Types
export interface Settings {
  premiumPrice: number
  premiumCurrency: string
  premiumPeriod: string
  freeAnalysesPerDay: number
  adminPassword: string
  promoCodes: PromoCode[]
}

export interface PromoCode {
  code: string
  discount: number
  discountType: 'percent' | 'fixed'
  active: boolean
  maxUses: number
  currentUses: number
  createdAt: string
}

const KV_SETTINGS_KEY = 'ghostmeter:settings'

const defaultSettings: Settings = {
  premiumPrice: 4,
  premiumCurrency: '€',
  premiumPeriod: 'mois',
  freeAnalysesPerDay: 3,
  adminPassword: 'ghostmeter2024',
  promoCodes: []
}

// Check if we're on Vercel with KV available
function useKV(): boolean {
  return !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN
}

// Get KV client dynamically
async function getKV() {
  if (!useKV()) return null
  try {
    const { kv } = await import('@vercel/kv')
    return kv
  } catch {
    return null
  }
}

// Get settings from KV or return defaults
export async function getSettings(): Promise<Settings> {
  // Try Vercel KV
  if (useKV()) {
    try {
      const kv = await getKV()
      if (kv) {
        const settings = await kv.get(KV_SETTINGS_KEY)
        if (settings) {
          return settings as Settings
        }
      }
    } catch (error) {
      console.error('KV get error:', error)
    }
  }

  // Return defaults
  return { ...defaultSettings }
}

// Save settings to KV
export async function saveSettings(settings: Settings): Promise<boolean> {
  if (useKV()) {
    try {
      const kv = await getKV()
      if (kv) {
        await kv.set(KV_SETTINGS_KEY, settings)
        return true
      }
    } catch (error) {
      console.error('KV set error:', error)
    }
  }
  return false
}

// Get admin password from environment variable
export function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD || 'ghostmeter2024'
}