import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

interface User {
  email: string;
  isPremium: boolean;
  premiumSince: string | null;
  analysesCount: number;
  createdAt: string;
  lastActive: string;
}

// GET - Récupérer les infos utilisateur
export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('email');
  
  if (!email) {
    return NextResponse.json({ error: 'Email requis' }, { status: 400 });
  }

  const user = await kv.get<User>('user:' + email.toLowerCase());
  
  if (!user) {
    return NextResponse.json({ exists: false, isPremium: false });
  }

  return NextResponse.json({ 
    exists: true, 
    isPremium: user.isPremium,
    premiumSince: user.premiumSince,
    analysesCount: user.analysesCount
  });
}

// POST - Actions utilisateur
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, action } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email requis' }, { status: 400 });
    }

    const key = 'user:' + email.toLowerCase();
    const existingUser = await kv.get<User>(key);
    const now = new Date().toISOString();

    if (action === 'login') {
      if (existingUser) {
        // Update last active
        existingUser.lastActive = now;
        await kv.set(key, existingUser);
        return NextResponse.json({ 
          success: true, 
          user: existingUser,
          isNew: false 
        });
      } else {
        const newUser: User = {
          email: email.toLowerCase(),
          isPremium: false,
          premiumSince: null,
          analysesCount: 0,
          createdAt: now,
          lastActive: now
        };
        await kv.set(key, newUser);
        return NextResponse.json({ 
          success: true, 
          user: newUser,
          isNew: true 
        });
      }
    }

    if (action === 'activatePremium') {
      const user = existingUser || {
        email: email.toLowerCase(),
        isPremium: false,
        premiumSince: null,
        analysesCount: 0,
        createdAt: now,
        lastActive: now
      };
      user.isPremium = true;
      user.premiumSince = now;
      user.lastActive = now;
      await kv.set(key, user);
      return NextResponse.json({ success: true, user });
    }

    if (action === 'incrementAnalyses') {
      if (existingUser) {
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
