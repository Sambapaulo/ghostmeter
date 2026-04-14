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

      // Merge with current settings to avoid losing fields not in the form
      const mergedSettings = {
        ...currentSettings,
        ...newSettings,
        // Toujours preserver le mot de passe actuel (ne jamais l'ecraser)
        adminPassword: currentSettings.adminPassword
      }

      console.log('[UPDATE SETTINGS] Saving:', JSON.stringify(mergedSettings).substring(0, 200))

      const saved = await saveSettings(mergedSettings)
      if (!saved) {
        console.error('[UPDATE SETTINGS] Erreur: saveSettings a echoue')
        return NextResponse.json({ success: false, error: 'Erreur de sauvegarde' }, { status: 500 })
      }

      // Verify save by reading back
      const verify = await getSettings()
      console.log('[UPDATE SETTINGS] Verified freeAnalysesPerDay:', verify.freeAnalysesPerDay)

      return NextResponse.json({ success: true })
    }

    // CHANGE PASSWORD
    if (body.action === 'changePassword') {
      // Priorite : mot de passe stocke dans les settings, puis env var, puis default
      const envPassword = adminPassword !== 'ghostmeter2024' ? adminPassword : null
      const currentValidPassword = currentSettings.adminPassword || envPassword || 'ghostmeter2024'
      
      if (body.currentPassword === currentValidPassword) {
        currentSettings.adminPassword = body.newPassword
        const saved = await saveSettings(currentSettings)
        
        if (!saved) {
          console.error('[CHANGE PASSWORD] Erreur: saveSettings a echoue, le mot de passe n\'est PAS sauvegarde')
          return NextResponse.json({ success: false, error: 'Erreur de sauvegarde. Le mot de passe n\'a pas ete enregistre.' }, { status: 500 })
        }
        
        // Verifier que le mot de passe a bien ete sauvegarde en le relisant
        const verifySettings = await getSettings()
        if (verifySettings.adminPassword !== body.newPassword) {
          console.error('[CHANGE PASSWORD] Erreur de verification: le mot de passe lu ne correspond pas')
          return NextResponse.json({ success: false, error: 'Erreur de verification. Reessayez.' }, { status: 500 })
        }
        
        console.log('[CHANGE PASSWORD] Mot de passe change et verifie avec succes')
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
