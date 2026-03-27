import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { getSettings } from '@/lib/kv';

interface User {
  email: string;
  password: string;
  isPremium: boolean;
  premiumSince: string | null;
  analysesCount: number;
  createdAt: string;
  lastActive: string;
  paypalOrderId?: string;
}

async function getPayPalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    throw new Error('PayPal non configuré. Vérifiez PAYPAL_CLIENT_ID et PAYPAL_CLIENT_SECRET dans Vercel.');
  }

  const useSandbox = process.env.PAYPAL_SANDBOX === 'true';
  const baseUrl = useSandbox 
    ? 'https://api-m.sandbox.paypal.com'
    : 'https://api-m.paypal.com';
  
  console.log('PayPal mode:', useSandbox ? 'SANDBOX' : 'LIVE');

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  
  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('PayPal auth failed:', response.status, errorText);
    throw new Error(`Erreur auth PayPal (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return { accessToken: data.access_token, baseUrl };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, price } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email requis' }, { status: 400 });
    }

    const user = await kv.get<User>('user:' + email.toLowerCase());
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé.' }, { status: 400 });
    }

    if (user.isPremium) {
      return NextResponse.json({ error: 'Vous êtes déjà Premium !' }, { status: 400 });
    }

    const settings = await getSettings();
    const finalPrice = price || settings.premiumPrice;
    const formattedPrice = finalPrice.toFixed(2);

    const { accessToken, baseUrl } = await getPayPalAccessToken();

    const orderResponse = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: 'EUR',
            value: formattedPrice,
          },
          description: 'GhostMeter Premium',
          custom_id: email.toLowerCase(),
        }],
        application_context: {
          brand_name: 'GhostMeter',
          user_action: 'PAY_NOW',
          return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://ghostmeter.vercel.app'}/?payment=success`,
          cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://ghostmeter.vercel.app'}/?payment=canceled`,
        },
      }),
    });

    if (!orderResponse.ok) {
      const errorData = await orderResponse.json();
      const errorMessage = errorData.message || JSON.stringify(errorData);
      throw new Error(`Erreur PayPal: ${errorMessage}`);
    }

    const order = await orderResponse.json();
    const approvalUrl = order.links?.find((link: any) => link.rel === 'approve')?.href;

    return NextResponse.json({ orderId: order.id, approvalUrl, price: formattedPrice });

  } catch (error: any) {
    console.error('PayPal error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}