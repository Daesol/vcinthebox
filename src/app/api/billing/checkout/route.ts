import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID; // Price ID for credit pack
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

interface CheckoutResponse {
  checkoutUrl: string;
}

/**
 * POST /api/billing/checkout
 * 
 * Creates a Stripe Checkout session for purchasing credits.
 * Redirects user to Stripe's hosted checkout page.
 */
export async function POST() {
  try {
    // Verify authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!STRIPE_SECRET_KEY) {
      console.error('[Checkout] STRIPE_SECRET_KEY not configured');
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 500 }
      );
    }

    if (!STRIPE_PRICE_ID) {
      console.error('[Checkout] STRIPE_PRICE_ID not configured');
      return NextResponse.json(
        { error: 'Stripe price not configured' },
        { status: 500 }
      );
    }

    // Create Stripe Checkout session
    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'mode': 'payment',
        'success_url': `${APP_URL}/app?checkout=success`,
        'cancel_url': `${APP_URL}/app?checkout=cancelled`,
        'line_items[0][price]': STRIPE_PRICE_ID,
        'line_items[0][quantity]': '1',
        'metadata[userId]': userId,
        'client_reference_id': userId,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[Checkout] Stripe error:', error);
      return NextResponse.json(
        { error: 'Failed to create checkout session' },
        { status: 500 }
      );
    }

    const session = await response.json();

    const checkoutResponse: CheckoutResponse = {
      checkoutUrl: session.url,
    };

    console.log('[Checkout] Session created:', session.id);

    return NextResponse.json(checkoutResponse);
  } catch (error) {
    console.error('[Checkout] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

