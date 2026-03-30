import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { kv } from '@vercel/kv';

// Lazy initialize Stripe to avoid build-time errors
let stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    stripe = new Stripe(key, {
      apiVersion: '2025-02-24.acacia' as any,
    });
  }
  return stripe;
}

interface User {
  email: string;
  password: string;
  isPremium: boolean;
  premiumSince: string | null;
  analysesCount: number;
  createdAt: string;
  lastActive: string;
  stripeCustomerId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email requis' }, { status: 400 });
    }

    // Verify user exists
    const user = await kv.get<User>('user:' + email.toLowerCase());
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé. Veuillez créer un compte d\'abord.' }, { status: 400 });
    }

    // Check if already premium
    if (user.isPremium) {
      return NextResponse.json({ error: 'Vous êtes déjà Premium !' }, { status: 400 });
    }

    const stripeClient = getStripe();

    // Get or create Stripe customer
    let customerId = user.stripeCustomerId;
    
    if (!customerId) {
      const customer = await stripeClient.customers.create({
        email: email.toLowerCase(),
        metadata: {
          ghostmeter_email: email.toLowerCase()
        }
      });
      customerId = customer.id;
      
      // Save customer ID to user
      user.stripeCustomerId = customerId;
      await kv.set('user:' + email.toLowerCase(), user);
    }

    // Get the base URL for success/cancel URLs
    const origin = request.headers.get('origin') || 'https://ghostmeter.vercel.app';

    // Create checkout session for one-time payment
    const session = await stripeClient.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'payment', // One-time payment
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'GhostMeter Premium',
              description: 'Accès illimité à toutes les analyses de conversations',
              images: [`${origin}/ghost-icon.png`],
            },
            unit_amount: 499, // 4.99 EUR in cents
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?payment=canceled`,
      metadata: {
        email: email.toLowerCase()
      }
    });

    return NextResponse.json({ 
      url: session.url,
      sessionId: session.id 
    });

  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la création du paiement' 
    }, { status: 500 });
  }
}
