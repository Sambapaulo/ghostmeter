import { NextRequest, NextResponse } from 'next/server'
import { updateSettings, getSettings } from '@/lib/localStore'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { adminPassword } = body

    if (!adminPassword || adminPassword.length < 6) {
      return NextResponse.json({ error: 'Le mot de passe doit contenir au moins 6 caracteres' }, { status: 400 })
    }

    await updateSettings({ adminPassword })

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
    hasPassword: !!settings?.adminPassword
  })
}
