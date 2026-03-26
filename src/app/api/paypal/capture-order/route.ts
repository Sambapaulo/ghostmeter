import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

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

async function getPayPalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  // Debug logging
  console.log('PayPal capture env check:', {
    hasClientId: !!clientId,
    hasClientSecret: !!clientSecret,
    clientIdLength: clientId?.length || 0,
    clientSecretLength: clientSecret?.length || 0
  });

  if (!clientId || !clientSecret) {
    console.error('PayPal capture env vars missing:', {
      PAYPAL_CLIENT_ID: clientId ? 'SET' : 'MISSING',
      PAYPAL_CLIENT_SECRET: clientSecret ? 'SET' : 'MISSING'
    });
    throw new Error('PayPal non configuré');
  }

  const useSandbox = process.env.PAYPAL_SANDBOX === 'true';
  const baseUrl = useSandbox
    ? 'https://api-m.sandbox.paypal.com'
    : 'https://api-m.paypal.com';

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  
  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = await response.json();
  return { accessToken: data.access_token, baseUrl };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, email } = body;

    if (!orderId || !email) {
      return NextResponse.json({ error: 'Order ID et email requis' }, { status: 400 });
    }

    const { accessToken, baseUrl } = await getPayPalAccessToken();

    const captureResponse = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const captureData = await captureResponse.json();

    if (captureData.status === 'COMPLETED') {
      const userKey = 'user:' + email.toLowerCase();
      const user = await kv.get<User>(userKey);
      
      if (user) {
        user.isPremium = true;
        user.premiumSince = new Date().toISOString();
        user.paypalOrderId = orderId;
        user.adminGranted = false;
        await kv.set(userKey, user);
      }

      return NextResponse.json({ success: true, isPremium: true });
    } else {
      return NextResponse.json({ error: 'Paiement non complété' }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Capture error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}