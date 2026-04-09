import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { createHash, randomBytes } from 'crypto';

interface User {
  email: string;
  password: string;
  isPremium: boolean;
  premiumSince: string | null;
  analysesCount: number;
  createdAt: string;
  lastActive: string;
  paypalOrderId?: string;
  adminGranted?: boolean;
  sessionId?: string;
  sessionCreatedAt?: string;
}

function hashPassword(password: string): string {
  return createHash('sha256').update(password + 'ghostmeter_salt_2024').digest('hex');
}

function generateSessionId(): string {
  return randomBytes(32).toString('hex');
}

async function verifyGoogleToken(accessToken: string) {
  try {
    const response = await fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${accessToken}`);
    if (!response.ok) return null;
    const tokenInfo = await response.json();
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (tokenInfo.aud !== clientId) return null;
    return { email: tokenInfo.email, emailVerified: tokenInfo.email_verified, expiresAt: tokenInfo.exp };
  } catch (error) {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('email');
  const sessionId = request.nextUrl.searchParams.get('sessionId');
  if (!email) return NextResponse.json({ error: 'Email requis' }, { status: 400 });
  const user = await kv.get<User>('user:' + email.toLowerCase());
  if (!user) return NextResponse.json({ exists: false, isPremium: false });
  const sessionValid = sessionId && user.sessionId === sessionId;
  if (sessionId && !sessionValid && user.sessionId) {
    return NextResponse.json({ exists: true, isPremium: false, sessionValid: false, error: 'SESSION_INVALID' });
  }
  const hasValidPremium = user.isPremium && (!!user.paypalOrderId || !!user.adminGranted);
  return NextResponse.json({ exists: true, isPremium: hasValidPremium, premiumSince: hasValidPremium ? user.premiumSince : null, analysesCount: user.analysesCount, sessionValid: true });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, action, sessionId: clientSessionId, accessToken, name } = body;

    if (action === 'google') {
      if (!accessToken) return NextResponse.json({ error: 'Access token required' }, { status: 400 });
      const tokenInfo = await verifyGoogleToken(accessToken);
      if (!tokenInfo) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
      const googleEmail = tokenInfo.email.toLowerCase();
      const key = 'user:' + googleEmail;
      const existingUser = await kv.get<User>(key);
      const now = new Date().toISOString();
      const newSessionId = generateSessionId();
      if (existingUser) {
        existingUser.sessionId = newSessionId;
        existingUser.sessionCreatedAt = now;
        existingUser.lastActive = now;
        await kv.set(key, existingUser);
        const hasValidPremium = existingUser.isPremium && (!!existingUser.paypalOrderId || !!existingUser.adminGranted);
        return NextResponse.json({ success: true, user: { email: existingUser.email, isPremium: hasValidPremium }, sessionId: newSessionId });
      } else {
        const newUser: User = { email: googleEmail, password: '', isPremium: false, premiumSince: null, analysesCount: 0, createdAt: now, lastActive: now, sessionId: newSessionId, sessionCreatedAt: now };
        await kv.set(key, newUser);
        return NextResponse.json({ success: true, user: { email: newUser.email, isPremium: false }, sessionId: newSessionId, isNew: true });
      }
    }

    if (!email) return NextResponse.json({ error: 'Email requis' }, { status: 400 });
    const key = 'user:' + email.toLowerCase();
    const existingUser = await kv.get<User>(key);
    const now = new Date().toISOString();

    if (action === 'register') {
      if (!password || password.length < 4) return NextResponse.json({ error: 'Le mot de passe doit contenir au moins 4 caracteres' }, { status: 400 });
      if (existingUser) return NextResponse.json({ error: 'Un compte existe deja avec cet email' }, { status: 400 });
      const hashedPassword = hashPassword(password);
      const newSessionId = generateSessionId();
      const newUser: User = { email: email.toLowerCase(), password: hashedPassword, isPremium: false, premiumSince: null, analysesCount: 0, createdAt: now, lastActive: now, sessionId: newSessionId, sessionCreatedAt: now };
      await kv.set(key, newUser);
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
      await kv.set(key, existingUser);
      const hasValidPremium = existingUser.isPremium && (!!existingUser.paypalOrderId || !!existingUser.adminGranted);
      return NextResponse.json({ success: true, user: { email: existingUser.email, isPremium: hasValidPremium }, sessionId: newSessionId, isNew: false });
    }

    if (action === 'checkSession') {
      if (!existingUser) return NextResponse.json({ valid: false, error: 'USER_NOT_FOUND' });
      if (!clientSessionId || existingUser.sessionId !== clientSessionId) return NextResponse.json({ valid: false, error: 'SESSION_INVALID', message: 'Votre compte a ete connecte sur un autre appareil' });
      existingUser.lastActive = now;
      await kv.set(key, existingUser);
      const hasValidPremium = existingUser.isPremium && (!!existingUser.paypalOrderId || !!existingUser.adminGranted);
      return NextResponse.json({ valid: true, isPremium: hasValidPremium });
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
        await kv.set(key, existingUser);
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Action invalide' }, { status: 400 });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
