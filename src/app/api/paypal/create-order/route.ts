import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { getSettings } from '@/lib/kv';

interface User {
  email: string;
  password: string;
  isPremium: boolean;
  premiumSince: string | null;
  premiumPlan?: '1month' | '3months' | '12months' | null;
  premiumExpiresAt?: string | null;
  analysesCount: number;
  createdAt: string;
  lastActive: string;
  paypalOrderId?: string;
}

async function getPayPalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('PayPal non configure.');
  }

  const useSandbox = process.env.PAYPAL_SANDBOX === 'true';
  const baseUrl = useSandbox
    ? 'https://api-m.sandbox.paypal.com'
    : 'https://api-m.paypal.com';

  console.log('PayPal mode:', useSandbox ? 'SANDBOX' : 'LIVE');

  const auth = Buffer.from(clientId + ':' + clientSecret).toString('base64');

  const response = await fetch(baseUrl + '/v1/oauth2/token', {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + auth,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('PayPal auth failed:', response.status, errorText);
    throw new Error('Erreur auth PayPal (' + response.status + '): ' + errorText);
  }

  const data = await response.json();
  return { accessToken: data.access_token, baseUrl };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, price, plan } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email requis' }, { status: 400 });
    }

    const user = await kv.get<User>('user:' + email.toLowerCase());
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouve.' }, { status: 400 });
    }

    if (user.isPremium && user.premiumExpiresAt) {
      const expiresAt = new Date(user.premiumExpiresAt);
      if (expiresAt > new Date()) {
        return NextResponse.json({ error: 'Vous avez deja un abonnement actif !' }, { status: 400 });
      }
    }

    const settings = await getSettings();
    
    let finalPrice = price;
    let planName = '3months';
    
    if (plan === '1month') {
      finalPrice = settings.pack1Month;
      planName = '1month';
    } else if (plan === '3months') {
      finalPrice = settings.pack3Months;
      planName = '3months';
    } else if (plan === '12months') {
      finalPrice = settings.pack12Months;
      planName = '12months';
    } else {
      finalPrice = settings.pack3Months;
      planName = '3months';
    }
    
    const formattedPrice = finalPrice.toFixed(2);

    const { accessToken, baseUrl } = await getPayPalAccessToken();

    const orderResponse = await fetch(baseUrl + '/v2/checkout/orders', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: 'EUR',
            value: formattedPrice,
          },
          description: 'GhostMeter Premium - ' + planName,
          custom_id: JSON.stringify({ email: email.toLowerCase(), plan: planName }),
        }],
        application_context: {
          brand_name: 'GhostMeter',
          user_action: 'PAY_NOW',
          return_url: (process.env.NEXT_PUBLIC_APP_URL || 'https://ghostmeter.vercel.app') + '/?payment=success',
          cancel_url: (process.env.NEXT_PUBLIC_APP_URL || 'https://ghostmeter.vercel.app') + '/?payment=canceled',
        },
      }),
    });

    if (!orderResponse.ok) {
      const errorData = await orderResponse.json();
      const errorMessage = errorData.message || JSON.stringify(errorData);
      throw new Error('Erreur PayPal: ' + errorMessage);
    }

    const order = await orderResponse.json();
    const approvalUrl = order.links?.find((link: any) => link.rel === 'approve')?.href;

    return NextResponse.json({ orderId: order.id, approvalUrl, price: formattedPrice, plan: planName });

  } catch (error: any) {
    console.error('PayPal error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
