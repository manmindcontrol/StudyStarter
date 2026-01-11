import { NextRequest, NextResponse } from 'next/server';
import { createSubscriptionCheckout, getOrCreateCustomer, STRIPE_PRICES } from '@/lib/stripe';
import { getCurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

/**
 * API endpoint pre vytvorenie Stripe Checkout Session pre subscription
 * POST /api/stripe/create-subscription-checkout
 *
 * Body: {
 *   tier: 'basic' | 'premium'
 * }
 *
 * Response: {
 *   sessionId: string
 *   url: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Získaj aktuálneho používateľa
    const { user } = await getCurrentUser();

    if (!user || !user.email) {
      return NextResponse.json(
        { error: 'Unauthorized - User must be logged in' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { tier, tierId } = body;

    // Accept either 'tier' or 'tierId' parameter
    const selectedTier = tier || tierId;

    // Validuj tier
    if (!selectedTier || (selectedTier !== 'basic' && selectedTier !== 'premium')) {
      return NextResponse.json(
        { error: 'Invalid tier. Must be "basic" or "premium"' },
        { status: 400 }
      );
    }

    // Získaj alebo vytvor Stripe Customer
    const customer = await getOrCreateCustomer({
      email: user.email,
      userId: user.id,
      name: user.user_metadata?.full_name || undefined,
    });

    // Získaj Price ID podľa tier
    const priceId = selectedTier === 'basic' ? STRIPE_PRICES.BASIC : STRIPE_PRICES.PREMIUM;

    if (!priceId) {
      return NextResponse.json(
        { error: `Price ID not configured for tier: ${selectedTier}` },
        { status: 500 }
      );
    }

    // Získaj origin pre success/cancel URLs
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Vytvor Stripe Checkout Session
    const session = await createSubscriptionCheckout({
      priceId,
      customerId: customer.id,
      userId: user.id,
      successUrl: `${origin}/profile?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}/profile?canceled=true`,
    });

    // Ulož customer_id do databázy ak ešte nebol uložený
    const { data: existingSubscription } = await supabase
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (existingSubscription && !existingSubscription.stripe_customer_id) {
      await supabase
        .from('user_subscriptions')
        .update({ stripe_customer_id: customer.id })
        .eq('user_id', user.id);
    }

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Error creating subscription checkout session:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to create checkout session',
      },
      { status: 500 }
    );
  }
}
