import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const SECRET_KEY = process.env.JWT_SECRET || 'ghostmeter-super-secret-key-change-in-production'
const key = new TextEncoder().encode(SECRET_KEY)

// Routes protegees
const protectedRoutes = ['/admin']
const protectedApiRoutes = ['/api/admin/']

// Routes a exclure de la protection (pas de redirect/cookie check)
const excludedRoutes = ['/api/admin/auth', '/api/admin/setup']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Exclure les routes publiques
  if (excludedRoutes.some(route => pathname === route)) {
    return NextResponse.next()
  }

  // Verifier si c'est une route protegee
  const isProtectedPage = protectedRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))
  const isProtectedApi = protectedApiRoutes.some(route => pathname.startsWith(route))

  if (isProtectedPage || isProtectedApi) {
    const token = request.cookies.get('admin_session')?.value

    if (!token) {
      // La page /admin gere elle-meme l'affichage du login
      // On ne redirige pas, on laisse la page gerer
      if (pathname === '/admin') {
        return NextResponse.next()
      }
      // Pour les sous-pages admin, rediriger vers /admin
      if (isProtectedPage) {
        return NextResponse.redirect(new URL('/admin', request.url))
      }
      // Pour les API, retourner 401
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    try {
      await jwtVerify(token, key, { algorithms: ['HS256'] })
      return NextResponse.next()
    } catch (error) {
      // Token invalide ou expire
      if (pathname === '/admin') {
        // Laisser la page /admin gerer le re-login
        return NextResponse.next()
      }
      if (isProtectedPage) {
        const response = NextResponse.redirect(new URL('/admin', request.url))
        response.cookies.delete('admin_session')
        return response
      }

      const response = NextResponse.json({ error: 'Session expiree' }, { status: 401 })
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
