import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { getSettings, getAdminPassword } from '@/lib/kv';

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
}

// This endpoint fixes old accounts that have isPremium=true but no payment proof
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminPassword } = body;

    // Verify admin password (same logic as settings API)
    const currentSettings = await getSettings()
    const envPassword = getAdminPassword()
    const validPassword = envPassword !== 'ghostmeter2024' ? envPassword : currentSettings.adminPassword
    
    if (adminPassword !== validPassword) {
      return NextResponse.json({ error: 'Mot de passe admin incorrect' }, { status: 401 });
    }

    // Check if KV is available
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      return NextResponse.json({ error: 'KV not configured' }, { status: 500 });
    }

    // Get all user keys
    const keys = await kv.keys('user:*');
    
    if (!keys || keys.length === 0) {
      return NextResponse.json({ message: 'No users found', fixed: 0 });
    }

    let fixedCount = 0;
    const fixedUsers: string[] = [];

    for (const key of keys) {
      const user = await kv.get<User>(key);
      if (user && user.isPremium) {
        const hasValidProof = user.paypalOrderId || user.adminGranted;
        
        if (!hasValidProof) {
          user.isPremium = false;
          user.premiumSince = null;
          await kv.set(key, user);
          
          fixedCount++;
          fixedUsers.push(key.replace('user:', ''));
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Fixed ${fixedCount} account(s) with invalid Premium status`,
      fixedCount,
      fixedUsers
    });

  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}