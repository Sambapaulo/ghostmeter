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
      // Use environment variable password if set, otherwise use stored password
      const validPassword = adminPassword !== 'ghostmeter2024' ? adminPassword : currentSettings.adminPassword

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
      // Utiliser le mot de passe stocke dans les settings
      const storedPassword = currentSettings.adminPassword || 'ghostmeter2024'
      
      // Verifier si le mot de passe actuel est correct
      // Accepter soit le mot de passe stocke, soit le mot de passe d'environnement
      const isCorrectPassword = body.currentPassword === storedPassword || 
                                 (adminPassword !== 'ghostmeter2024' && body.currentPassword === adminPassword)
      
      if (isCorrectPassword) {
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
