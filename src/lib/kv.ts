import { Redis } from '@upstash/redis'

export interface Settings {
  premiumPrice: number
  premiumCurrency: string
  premiumPeriod: string
  freeAnalysesPerDay: number
  adminPassword: string
  promoCodes: PromoCode[]
  // Pack pricing
  pack1Month: number
  pack3Months: number
  pack12Months: number
  // Maintenance mode
  maintenanceMode: boolean
  maintenanceMessage: string
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
  premiumPrice: 1.99,
  premiumCurrency: '€',
  premiumPeriod: 'mois',
  freeAnalysesPerDay: 3,
  adminPassword: 'ghostmeter2024',
  promoCodes: [],
  pack1Month: 1.99,
  pack3Months: 4.99,
  pack12Months: 14.99,
  maintenanceMode: false,
  maintenanceMessage: 'Maintenance en cours. Veuillez réessayer dans quelques minutes.'
}

function getRedis(): Redis | null {
  // Vercel/Upstash uses these variable names
  const url = process.env.KV_REST_API_URL
  const token = process.env.KV_REST_API_TOKEN
  
  if (!url || !token) {
    console.log('Redis not configured - missing KV_REST_API_URL or KV_REST_API_TOKEN')
    return null
  }
  
  return new Redis({ url, token })
}

export async function getSettings(): Promise<Settings> {
  const redis = getRedis()
  
  if (redis) {
    try {
      const settings = await redis.get(KV_SETTINGS_KEY)
      if (settings) {
        console.log('Settings loaded from Redis')
        // Merge with defaults to ensure all properties exist
        return { ...defaultSettings, ...settings as Settings }
      }
    } catch (error) {
      console.error('Redis get error:', error)
    }
  }

  console.log('Using default settings')
  return { ...defaultSettings }
}

export async function saveSettings(settings: Settings): Promise<boolean> {
  const redis = getRedis()
  
  if (redis) {
    try {
      await redis.set(KV_SETTINGS_KEY, settings)
      console.log('Settings saved to Redis')
      return true
    } catch (error) {
      console.error('Redis set error:', error)
    }
  }
  
  console.log('Redis not available, settings NOT saved')
  return false
}

export function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD || 'ghostmeter2024'
}