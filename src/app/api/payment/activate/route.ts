import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

interface User {
  email: string;
  password: string;
  isPremium: boolean;
  premiumSince: string | null;
  premiumExpiry: string | null;
  analysesCount: number;
  createdAt: string;
  lastActive: string;
  transactionId?: string;
  paymentProvider?: string;
}

// Pack durations in days
const PACK_DURATIONS: Record<string, number> = {
  '1month': 30,
  '3months': 90,
  '12months': 365,
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, packId, transactionId, provider } = body;

    if (!email || !packId || !transactionId) {
      return NextResponse.json({
        success: false,
        error: 'Paramètres manquants'
      }, { status: 400 });
    }

    // Validate pack ID
    if (!PACK_DURATIONS[packId]) {
      return NextResponse.json({
        success: false,
        error: 'Pack invalide'
      }, { status: 400 });
    }

    // Get user
    const user = await kv.get<User>('user:' + email.toLowerCase());
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Utilisateur non trouvé'
      }, { status: 400 });
    }

    // Check if already premium with same transaction
    if (user.transactionId === transactionId && user.isPremium) {
      return NextResponse.json({
        success: true,
        message: 'Premium déjà activé',
        expiry: user.premiumExpiry
      });
    }

    // Calculate expiry date
    const durationDays = PACK_DURATIONS[packId];
    const now = new Date();

    // If already premium, extend from current expiry
    let startDate = now;
    if (user.premiumExpiry) {
      const currentExpiry = new Date(user.premiumExpiry);
      if (currentExpiry > now) {
        startDate = currentExpiry;
      }
    }

    const expiryDate = new Date(startDate);
    expiryDate.setDate(expiryDate.getDate() + durationDays);

    // Update user
    const updatedUser: User = {
      ...user,
      isPremium: true,
      premiumSince: user.premiumSince || now.toISOString(),
      premiumExpiry: expiryDate.toISOString(),
      transactionId,
      paymentProvider: provider || 'unknown',
      lastActive: now.toISOString()
    };

    await kv.set('user:' + email.toLowerCase(), updatedUser);

    console.log('[Payment] Premium activated:', {
      email,
      packId,
      transactionId,
      provider,
      expiry: expiryDate.toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Premium activé avec succès',
      expiry: expiryDate.toISOString()
    });

  } catch (error: any) {
    console.error('[Payment] Activation error:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de l\'activation: ' + error.message
    }, { status: 500 });
  }
}
