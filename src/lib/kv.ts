import { NextRequest, NextResponse } from 'next/server'
import { getSettings, saveSettings, Settings } from '@/lib/kv'

// Get admin password from environment variable
function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD || 'ghostmeter2024'
}

// GET - Fetch settings
export async function GET() {
  try {
    const settings = await getSettings()
    return NextResponse.json({
      success: true,
      settings: {
        ...settings,
        adminPassword: '••••••••'
      }
    })
  } catch (error) {
    console.error('GET Settings Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to load settings' 
    }, { status: 500 })
  }
}

// POST - Login or update settings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const currentSettings = await getSettings()
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
        return NextResponse.json({ 
          success: false, 
          error: 'Mot de passe incorrect' 
        }, { status: 401 })
      }
    }

    // UPDATE SETTINGS
    if (body.action === 'update') {
      const newSettings = body.settings as Settings
      
      const saved = await saveSettings(newSettings)
      
      if (saved) {
        return NextResponse.json({ success: true })
      } else {
        return NextResponse.json({ 
          success: false, 
          error: 'Impossible de sauvegarder (KV non configuré)' 
        }, { status: 500 })
      }
    }

    return NextResponse.json({ 
      success: false, 
      error: 'Action invalide' 
    }, { status: 400 })
    
  } catch (error) {
    console.error('POST Settings Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Erreur serveur' 
    }, { status: 500 })
  }
}