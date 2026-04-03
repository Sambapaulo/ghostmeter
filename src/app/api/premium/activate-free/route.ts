import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { getSettings, saveSettings } from '@/lib/kv';

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
  freePremiumReason?: string;
  sessionId?: string;
  sessionCreatedAt?: string;
}

// Settings interface is now imported from @/lib/kv

// POST - Activate free premium via promo code 100%
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, promoCode } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email requis' }, { status: 400 });
    }

    if (!promoCode) {
      return NextResponse.json({ error: 'Code promo requis' }, { status: 400 });
    }

    // Verify the promo code exists and is valid (100% discount)
    const settings = await getSettings();

    if (!settings?.promoCodes || settings.promoCodes.length === 0) {
      return NextResponse.json({ error: 'Erreur de configuration' }, { status: 500 });
    }

    const promo = settings.promoCodes.find(
      p => p.code.toUpperCase() === promoCode.toUpperCase() && p.active
    );

    if (!promo) {
      return NextResponse.json({ error: 'Code promo invalide' }, { status: 400 });
    }

    // Verify it's a 100% discount
    if (promo.discount !== 100 || promo.discountType !== 'percent') {
      return NextResponse.json({ error: 'Ce code ne donne pas un accès gratuit' }, { status: 400 });
    }

    // Check usage limit
    if (promo.currentUses >= promo.maxUses) {
      return NextResponse.json({ error: 'Code promo épuisé' }, { status: 400 });
    }

    // Get or create user
    const key = 'user:' + email.toLowerCase();
    const existingUser = await kv.get<User>(key);
    const now = new Date().toISOString();

    if (existingUser) {
      // Update existing user to premium
      existingUser.isPremium = true;
      existingUser.premiumSince = now;
      existingUser.adminGranted = true;
      existingUser.freePremiumReason = `Promo code: ${promoCode}`;
      existingUser.lastActive = now;
      await kv.set(key, existingUser);
    } else {
      // Create new user with premium
      const newUser: User = {
        email: email.toLowerCase(),
        password: '',
        isPremium: true,
        premiumSince: now,
        analysesCount: 0,
        createdAt: now,
        lastActive: now,
        adminGranted: true,
        freePremiumReason: `Promo code: ${promoCode}`
      };
      await kv.set(key, newUser);
    }

    // Increment promo code usage
    const promoIndex = settings.promoCodes.findIndex(
      p => p.code.toUpperCase() === promoCode.toUpperCase()
    );
    if (promoIndex !== -1) {
      settings.promoCodes[promoIndex].currentUses += 1;
      await saveSettings(settings);
    }

    return NextResponse.json({
      success: true,
      isPremium: true,
      message: '🎉 Premium activé gratuitement !'
    });

  } catch (error) {
    console.error('Free premium activation error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
