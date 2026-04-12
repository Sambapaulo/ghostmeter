import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const SECRET_KEY = process.env.JWT_SECRET || 'ghostmeter-super-secret-key-change-in-production'
const key = new TextEncoder().encode(SECRET_KEY)

// Routes protégées
const protectedRoutes = ['/admin']
const protectedApiRoutes = ['/api/admin/']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Vérifier si c'est une route protégée
  const isProtectedPage = protectedRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))
  const isProtectedApi = protectedApiRoutes.some(route => pathname.startsWith(route))
  
  // Exclure la route d'authentification de la protection
  if (pathname === '/api/admin/auth') {
    return NextResponse.next()
  }
  
  if (isProtectedPage || isProtectedApi) {
    const token = request.cookies.get('admin_session')?.value
    
    if (!token) {
      // Pour les pages, rediriger vers login
      if (isProtectedPage) {
        const loginUrl = new URL('/admin/login', request.url)
        return NextResponse.redirect(loginUrl)
      }
      // Pour les API, retourner 401
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    
    try {
      await jwtVerify(token, key, { algorithms: ['HS256'] })
      return NextResponse.next()
    } catch (error) {
      // Token invalide ou expiré
      if (isProtectedPage) {
        const loginUrl = new URL('/admin/login', request.url)
        const response = NextResponse.redirect(loginUrl)
        response.cookies.delete('admin_session')
        return response
      }
      
      const response = NextResponse.json({ error: 'Session expirée' }, { status: 401 })
      response.cookies.delete('admin_session')
      return response
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*'
  ]
}
