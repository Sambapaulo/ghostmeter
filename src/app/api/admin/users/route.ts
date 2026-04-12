import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { kv } from '@vercel/kv'
import { getSettings, getAdminPassword } from '@/lib/kv'

interface UserData {
  email: string
  isPremium: boolean
  premiumSince: string | null
  premiumPlan: string | null
  premiumExpiresAt: string | null
  premiumSource: 'paypal' | 'admin' | null
  analysesCount: number
  createdAt: string
  lastActive: string
}

export async function GET() {
  try {
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      return NextResponse.json({
        success: true,
        users: [],
        message: 'KV not configured'
      })
    }

    const keys = await kv.keys('user:*')

    if (!keys || keys.length === 0) {
      return NextResponse.json({
        success: true,
        users: []
      })
    }

    const users: UserData[] = []

    for (const key of keys) {
      const userData = await kv.get(key) as any
      if (userData) {
        let premiumSource: 'paypal' | 'admin' | null = null
        if (userData.isPremium) {
          if (userData.adminGranted) {
            premiumSource = 'admin'
          } else if (userData.paypalOrderId) {
            premiumSource = 'paypal'
          }
        }

        // Verifier si l'abonnement a expire
        let isActuallyPremium = userData.isPremium
        if (userData.premiumExpiresAt && !userData.adminGranted) {
          const expiresAt = new Date(userData.premiumExpiresAt)
          if (expiresAt < new Date()) {
            isActuallyPremium = false
          }
        }

        users.push({
          email: key.replace('user:', ''),
          isPremium: isActuallyPremium,
          premiumSince: userData.premiumSince || null,
          premiumPlan: userData.premiumPlan || null,
          premiumExpiresAt: userData.premiumExpiresAt || null,
          premiumSource,
          analysesCount: userData.analysesCount || 0,
          createdAt: userData.createdAt || 'N/A',
          lastActive: userData.lastActive || 'N/A'
        })
      }
    }

    users.sort((a, b) => {
      if (a.createdAt === 'N/A') return 1
      if (b.createdAt === 'N/A') return -1
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    return NextResponse.json({
      success: true,
      users
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch users'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, action, adminPassword } = body

    const currentSettings = await getSettings()
    const envPassword = getAdminPassword()
    const validPassword = envPassword !== 'ghostmeter2024' ? envPassword : currentSettings.adminPassword

    if (adminPassword !== validPassword) {
      return NextResponse.json({ error: 'Mot de passe admin incorrect' }, { status: 401 })
    }

    if (!email) {
      return NextResponse.json({ error: 'Email requis' }, { status: 400 })
    }

    const key = 'user:' + email.toLowerCase()
    const user = await kv.get(key) as any

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouve' }, { status: 404 })
    }

    if (action === 'removePremium') {
      user.isPremium = false
      user.premiumSince = null
      user.premiumPlan = null
      user.premiumExpiresAt = null
      user.adminGranted = false
      await kv.set(key, user)
      return NextResponse.json({
        success: true,
        message: 'Premium desactive pour ' + email
      })
    }

    if (action === 'addPremium') {
      user.isPremium = true
      user.premiumSince = new Date().toISOString()
      user.adminGranted = true
      user.premiumPlan = 'admin'
      user.premiumExpiresAt = null
      await kv.set(key, user)
      return NextResponse.json({
        success: true,
        message: 'Premium active pour ' + email + ' (par admin - illimite)'
      })
    }

    if (action === 'deleteUser') {
      await kv.del(key)
      return NextResponse.json({
        success: true,
        message: 'Utilisateur ' + email + ' supprime'
      })
    }

    return NextResponse.json({ error: 'Action invalide' }, { status: 400 })

  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la mise a jour'
    }, { status: 500 })
  }
}
