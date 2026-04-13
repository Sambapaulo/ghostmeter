import { NextRequest, NextResponse } from 'next/server'
import { getSettings, saveSettings } from '@/lib/kv'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { adminPassword } = body

    if (!adminPassword || adminPassword.length < 6) {
      return NextResponse.json({ error: 'Le mot de passe doit contenir au moins 6 caracteres' }, { status: 400 })
    }

    // Lire les settings actuels depuis kv.ts (cle ghostmeter:settings)
    // et y merge le nouveau mot de passe
    const currentSettings = await getSettings()
    currentSettings.adminPassword = adminPassword
    const saved = await saveSettings(currentSettings)

    if (!saved) {
      console.error('[SETUP] Erreur: saveSettings a echoue')
      return NextResponse.json({ error: 'Erreur de sauvegarde' }, { status: 500 })
    }

    console.log('[SETUP] Mot de passe admin configure avec succes via kv.ts')
    return NextResponse.json({
      success: true,
      message: 'Mot de passe admin configure'
    })
  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function GET() {
  const settings = await getSettings()
  return NextResponse.json({
    hasPassword: !!settings?.adminPassword && settings.adminPassword !== 'ghostmeter2024'
  })
}
