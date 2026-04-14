import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomBytes } from 'crypto';
import { addUserLog } from '@/lib/localStore';
import { isKVAvailable, getUser, setUser, User } from '@/lib/localStore';

function hashPassword(password: string): string {
  return createHash('sha256').update(password + 'ghostmeter_salt_2024').digest('hex');
}

function generateSessionId(): string {
  return randomBytes(32).toString('hex');
}

async function verifyGoogleToken(accessToken: string) {
  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=' + accessToken);
    if (!response.ok) return null;
    const tokenInfo = await response.json();
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (tokenInfo.aud !== clientId) return null;
    return { email: tokenInfo.email, emailVerified: tokenInfo.email_verified, expiresAt: tokenInfo.exp };
  } catch (error) {
    return null;
  }
}

function checkPremiumValid(user: User): { isPremium: boolean; expired: boolean } {
  if (!user.isPremium) return { isPremium: false, expired: false };
  
  // Admin granted premium n'expire jamais
  if (user.adminGranted) return { isPremium: true, expired: false };
  
  // Verifier la date d'expiration
  if (user.premiumExpiresAt) {
    const expiresAt = new Date(user.premiumExpiresAt);
    if (expiresAt < new Date()) {
      return { isPremium: false, expired: true };
    }
  }
  
  return { isPremium: true, expired: false };
}

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('email');
  const sessionId = request.nextUrl.searchParams.get('sessionId');
  if (!email) return NextResponse.json({ error: 'Email requis' }, { status: 400 });
  
  const user = await getUser(email);
  if (!user) return NextResponse.json({ exists: false, isPremium: false });
  
  // Verifier si l'abonnement a expire
  const premiumCheck = checkPremiumValid(user);
  if (premiumCheck.expired) {
    user.isPremium = false;
    user.referralPremium = false;
    await setUser(email, user);
  }
  
  const sessionValid = sessionId && user.sessionId === sessionId;
  if (sessionId && !sessionValid && user.sessionId) {
    return NextResponse.json({ exists: true, isPremium: false, sessionValid: false, error: 'SESSION_INVALID' });
  }

  let isPremium = premiumCheck.isPremium && (!!user.paypalOrderId || !!user.adminGranted || !!user.referralPremium);

  // FALLBACK: Si le User record n'indique pas referralPremium, verifier la cle Redis
  // Cela couvre le cas ou le claim route a echoue a mettre a jour le User record
  if (!isPremium) {
    try {
      const { kv } = await import('@vercel/kv');
      const redisExpiry = await kv.get(`referral:premium_until:${email.toLowerCase()}`) as string | null;
      if (redisExpiry && new Date(redisExpiry) > new Date()) {
        // La cle Redis indique un premium actif - l'activer dans le User record
        user.isPremium = true;
        user.referralPremium = true;
        user.premiumExpiresAt = redisExpiry;
        if (!user.premiumSince) user.premiumSince = new Date().toISOString();
        await setUser(email, user);
        isPremium = true;
        console.log(`[AUTH FALLBACK] Activated referral premium for ${email} from Redis key until ${redisExpiry}`);
      } else if (redisExpiry && new Date(redisExpiry) <= new Date()) {
        // Cle Redis expiree - la nettoyer
        try { await kv.del(`referral:premium_until:${email.toLowerCase()}`); } catch(e) {}
      }
    } catch (err) {
      console.error('[AUTH FALLBACK] Error checking Redis referral premium:', err);
    }
  }

  return NextResponse.json({ exists: true, isPremium, premiumSince: isPremium ? user.premiumSince : null, premiumPlan: user.premiumPlan || null, premiumExpiresAt: (isPremium ? user.premiumExpiresAt : null) || null, referralPremium: !!user.referralPremium, analysesCount: user.analysesCount, sessionValid: true });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, action, sessionId: clientSessionId, accessToken, name } = body;

    if (!isKVAvailable()) {
      console.log('Mode local: utilisation du stockage en memoire');
    }

    if (action === 'google') {
      if (!accessToken) return NextResponse.json({ error: 'Access token required' }, { status: 400 });
      const tokenInfo = await verifyGoogleToken(accessToken);
      if (!tokenInfo) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
      const googleEmail = tokenInfo.email.toLowerCase();
      const existingUser = await getUser(googleEmail);
      const now = new Date().toISOString();
      const newSessionId = generateSessionId();
      if (existingUser) {
        existingUser.sessionId = newSessionId;
        existingUser.sessionCreatedAt = now;
        existingUser.lastActive = now;
        
        const premiumCheck = checkPremiumValid(existingUser);
        if (premiumCheck.expired) {
          existingUser.isPremium = false;
        }
        
        await setUser(googleEmail, existingUser);
        const hasValidPremium = premiumCheck.isPremium && (!!existingUser.paypalOrderId || !!existingUser.adminGranted || !!existingUser.referralPremium);
        return NextResponse.json({ success: true, user: { email: existingUser.email, isPremium: hasValidPremium, premiumPlan: existingUser.premiumPlan, premiumExpiresAt: existingUser.premiumExpiresAt, referralPremium: !!existingUser.referralPremium }, sessionId: newSessionId });
      } else {
        const newUser: User = { email: googleEmail, password: '', isPremium: false, premiumSince: null, analysesCount: 0, createdAt: now, lastActive: now, sessionId: newSessionId, sessionCreatedAt: now };
        await setUser(googleEmail, newUser);
        return NextResponse.json({ success: true, user: { email: newUser.email, isPremium: false }, sessionId: newSessionId, isNew: true });
      }
    }

    if (!email) return NextResponse.json({ error: 'Email requis' }, { status: 400 });
    const existingUser = await getUser(email);
    const now = new Date().toISOString();

    if (action === 'register') {
      if (!password || password.length < 4) return NextResponse.json({ error: 'Le mot de passe doit contenir au moins 4 caracteres' }, { status: 400 });
      if (existingUser) return NextResponse.json({ error: 'Un compte existe deja avec cet email' }, { status: 400 });
      const hashedPassword = hashPassword(password);
      const newSessionId = generateSessionId();
      const newUser: User = { email: email.toLowerCase(), password: hashedPassword, isPremium: false, premiumSince: null, analysesCount: 0, createdAt: now, lastActive: now, sessionId: newSessionId, sessionCreatedAt: now };
      await setUser(email, newUser);
      await addUserLog(email, 'register', 'Nouveau compte cree');
      return NextResponse.json({ success: true, user: { email: newUser.email, isPremium: newUser.isPremium }, sessionId: newSessionId, isNew: true });
    }

    if (action === 'login') {
      if (!password) return NextResponse.json({ error: 'Mot de passe requis' }, { status: 400 });
      if (!existingUser) return NextResponse.json({ error: 'Aucun compte trouve avec cet email' }, { status: 400 });
      const hashedPassword = hashPassword(password);
      if (existingUser.password !== hashedPassword) return NextResponse.json({ error: 'Mot de passe incorrect' }, { status: 400 });
      const newSessionId = generateSessionId();
      existingUser.sessionId = newSessionId;
      existingUser.sessionCreatedAt = now;
      existingUser.lastActive = now;
      
      const premiumCheck = checkPremiumValid(existingUser);
      if (premiumCheck.expired) {
        existingUser.isPremium = false;
      }
      
      await setUser(email, existingUser);
      await addUserLog(email, 'login', 'Connexion reussie');
      const hasValidPremium = premiumCheck.isPremium && (!!existingUser.paypalOrderId || !!existingUser.adminGranted || !!existingUser.referralPremium);
      return NextResponse.json({ success: true, user: { email: existingUser.email, isPremium: hasValidPremium, premiumPlan: existingUser.premiumPlan, premiumExpiresAt: existingUser.premiumExpiresAt, referralPremium: !!existingUser.referralPremium }, sessionId: newSessionId, isNew: false });
    }

    if (action === 'checkSession') {
      if (!existingUser) return NextResponse.json({ valid: false, error: 'USER_NOT_FOUND' });
      if (!clientSessionId || existingUser.sessionId !== clientSessionId) return NextResponse.json({ valid: false, error: 'SESSION_INVALID', message: 'Votre compte a ete connecte sur un autre appareil' });
      existingUser.lastActive = now;
      
      const premiumCheck = checkPremiumValid(existingUser);
      if (premiumCheck.expired) {
        existingUser.isPremium = false;
      }
      
      await setUser(email, existingUser);
      const hasValidPremium = premiumCheck.isPremium && (!!existingUser.paypalOrderId || !!existingUser.adminGranted || !!existingUser.referralPremium);
      return NextResponse.json({ valid: true, isPremium: hasValidPremium, premiumPlan: existingUser.premiumPlan, premiumExpiresAt: existingUser.premiumExpiresAt, referralPremium: !!existingUser.referralPremium });
    }

    if (action === 'checkExists') {
      if (existingUser) return NextResponse.json({ exists: true, hasPassword: !!existingUser.password && existingUser.password.length > 0 });
      return NextResponse.json({ exists: false });
    }

    if (action === 'incrementAnalyses') {
      if (existingUser) {
        if (clientSessionId && existingUser.sessionId !== clientSessionId) return NextResponse.json({ error: 'SESSION_INVALID', success: false }, { status: 401 });
        existingUser.analysesCount = (existingUser.analysesCount || 0) + 1;
        existingUser.lastActive = now;
        await setUser(email, existingUser);
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Action invalide' }, { status: 400 });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
