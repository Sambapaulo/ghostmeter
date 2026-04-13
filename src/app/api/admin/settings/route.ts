import { NextRequest, NextResponse } from 'next/server'
import { getSettings, saveSettings, getAdminPassword } from '@/lib/kv'

// GET - Fetch settings (without password for security)
export async function GET() {
  try {
    const settings = await getSettings()
    return NextResponse.json({
      success: true,
      settings: {
        ...settings,
        adminPassword: '••••••••' // Hide password in response
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
    const currentSettings = await getSettings()
    const adminPassword = getAdminPassword()

    // LOGIN ACTION
    if (body.action === 'login') {
      // Priorite : mot de passe stocke dans les settings (change par l'admin)
      // Fallback : variable d'environnement ADMIN_PASSWORD, puis mot de passe par defaut
      const envPassword = adminPassword !== 'ghostmeter2024' ? adminPassword : null
      const validPassword = currentSettings.adminPassword || envPassword || 'ghostmeter2024'

      if (body.password === validPassword) {
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
      const newSettings = body.settings

      // Preserve the password if not changed
      if (newSettings.adminPassword === '••••••••' || !newSettings.adminPassword) {
        newSettings.adminPassword = currentSettings.adminPassword
      }

      await saveSettings(newSettings)
      return NextResponse.json({ success: true })
    }

    // CHANGE PASSWORD
    if (body.action === 'changePassword') {
      // Priorite : mot de passe stocke dans les settings, puis env var, puis default
      const envPassword = adminPassword !== 'ghostmeter2024' ? adminPassword : null
      const currentValidPassword = currentSettings.adminPassword || envPassword || 'ghostmeter2024'
      
      if (body.currentPassword === currentValidPassword) {
        currentSettings.adminPassword = body.newPassword
        await saveSettings(currentSettings)
        return NextResponse.json({ success: true })
      } else {
        return NextResponse.json({ success: false, error: 'Mot de passe actuel incorrect' }, { status: 401 })
      }
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
