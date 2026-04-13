import { NextRequest, NextResponse } from 'next/server'
import { generateAdminToken, isAdminAuthenticated } from '@/lib/jwt'
import { getSettings } from '@/lib/kv'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, password } = body
    
    // Action: Login
    if (action === 'login') {
      // Lire les settings depuis kv.ts (cle ghostmeter:settings)
      // meme source que settings/route.ts
      const settings = await getSettings()
      
      if (!settings?.adminPassword) {
        return NextResponse.json({ error: 'Admin non configure' }, { status: 500 })
      }
      
      if (password !== settings.adminPassword) {
        return NextResponse.json({ error: 'Mot de passe incorrect' }, { status: 401 })
      }
      
      // Generer le token JWT
      const token = await generateAdminToken()
      
      // Creer la reponse avec le cookie HTTP-only
      const response = NextResponse.json({ 
        success: true, 
        message: 'Connexion reussie' 
      })
      
      response.cookies.set('admin_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24, // 24 heures
        path: '/'
      })
      
      return response
    }
    
    // Action: Logout
    if (action === 'logout') {
      const response = NextResponse.json({ success: true })
      response.cookies.delete('admin_session')
      return response
    }
    
    // Action: Verify
    if (action === 'verify') {
      const isAuthenticated = await isAdminAuthenticated()
      return NextResponse.json({ 
        success: true, 
        authenticated: isAuthenticated 
      })
    }
    
    return NextResponse.json({ error: 'Action non reconnue' }, { status: 400 })
    
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function GET() {
  const isAuthenticated = await isAdminAuthenticated()
  return NextResponse.json({ 
    success: true, 
    authenticated: isAuthenticated 
  })
}
