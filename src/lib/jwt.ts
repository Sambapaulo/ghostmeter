import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const SECRET_KEY = process.env.JWT_SECRET || 'ghostmeter-super-secret-key-change-in-production'
const key = new TextEncoder().encode(SECRET_KEY)

export interface AdminSession {
  isAdmin: boolean
  loginTime: number
  [key: string]: unknown
}

// Générer un token JWT
export async function generateAdminToken(): Promise<string> {
  const session: AdminSession = {
    isAdmin: true,
    loginTime: Date.now()
  }
  
  const token = await new SignJWT(session)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h') // Token expire après 24h
    .sign(key)
  
  return token
}

// Vérifier un token JWT
export async function verifyAdminToken(token: string): Promise<AdminSession | null> {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['HS256']
    })
    return payload as AdminSession
  } catch (error) {
    return null
  }
}

// Obtenir la session admin depuis les cookies
export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_session')?.value
  
  if (!token) return null
  
  return verifyAdminToken(token)
}

// Vérifier si l'utilisateur est authentifié admin
export async function isAdminAuthenticated(): Promise<boolean> {
  const session = await getAdminSession()
  return session?.isAdmin === true
}
