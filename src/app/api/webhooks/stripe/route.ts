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
  stripePaymentId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const stripeClient = getStripe();
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripeClient.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET || ''
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Handle the event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      // Get email from metadata or customer
      let email = session.metadata?.email;
      
      if (!email && session.customer) {
        // Get customer email from Stripe
        const customer = await stripeClient.customers.retrieve(session.customer as string);
        if (customer && !('deleted' in customer)) {
          email = customer.email || customer.metadata?.ghostmeter_email;
        }
      }

      if (!email) {
        console.error('No email found in session');
        return NextResponse.json({ error: 'No email' }, { status: 400 });
      }

      // Activate premium for user
      const key = 'user:' + email.toLowerCase();
      const user = await kv.get<User>(key);

      if (user) {
        const now = new Date().toISOString();
        user.isPremium = true;
        user.premiumSince = now;
        user.lastActive = now;
        user.stripePaymentId = session.payment_intent as string || session.id;
        await kv.set(key, user);
        
        console.log(`Premium activated for ${email}`);
      } else {
        console.error(`User not found: ${email}`);
      }
    }

    // Handle other payment-related events
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log('Payment intent succeeded:', paymentIntent.id);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 });
  }
}
