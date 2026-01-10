import { NextRequest, NextResponse } from 'next/server';
import { constructWebhookEvent } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Vytvor Supabase klienta s service role (má prístup ku všetkým RLS politikám)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Stripe Webhook Handler
 * POST /api/stripe/webhook
 *
 * Spracováva Stripe eventy:
 * - checkout.session.completed - Úspešná platba
 * - customer.subscription.updated - Aktualizácia subscription
 * - customer.subscription.deleted - Zrušenie subscription
 * - invoice.paid - Úspešná platba faktúry
 * - invoice.payment_failed - Neúspešná platba faktúry
 */
export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('STRIPE_WEBHOOK_SECRET is not set');
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    // Overiť Stripe signature
    event = constructWebhookEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  console.log(`[Webhook] Received event: ${event.type}`);

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(`[Webhook] Error processing ${event.type}:`, error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Spracovanie úspešného checkout
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('[Webhook] Processing checkout.session.completed:', session.id);

  const metadata = session.metadata || {};

  // Kontrola či ide o PDF konverziu alebo subscription
  if (metadata.type === 'pdf_conversion') {
    // PDF konverzia - ulož do payment_history
    await supabaseAdmin.from('payment_history').insert({
      payment_type: 'pdf_conversion',
      amount: (session.amount_total || 0) / 100, // Stripe používa centy
      currency: session.currency || 'eur',
      stripe_payment_intent_id: session.payment_intent as string,
      stripe_session_id: session.id,
      status: 'succeeded',
      metadata: {
        fileName: metadata.fileName,
      },
    });

    console.log('[Webhook] PDF conversion payment recorded');
  } else if (session.mode === 'subscription') {
    // Subscription - aktualizuj user_subscriptions
    const userId = metadata.user_id;
    const subscriptionId = session.subscription as string;

    if (!userId) {
      console.error('[Webhook] Missing user_id in session metadata');
      return;
    }

    // Získaj subscription detaily zo Stripe
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    // Zisti aký tier používateľ kúpil
    const priceId = subscription.items.data[0].price.id;
    let tierId = 'free';

    if (priceId === process.env.STRIPE_PRICE_BASIC) {
      tierId = 'basic';
    } else if (priceId === process.env.STRIPE_PRICE_PREMIUM) {
      tierId = 'premium';
    }

    // Aktualizuj user_subscriptions
    const { error } = await supabaseAdmin
      .from('user_subscriptions')
      .update({
        tier_id: tierId,
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: subscriptionId,
        stripe_subscription_status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
      })
      .eq('user_id', userId);

    if (error) {
      console.error('[Webhook] Error updating subscription:', error);
      throw error;
    }

    // Ulož do payment_history
    await supabaseAdmin.from('payment_history').insert({
      user_id: userId,
      payment_type: 'subscription',
      amount: (session.amount_total || 0) / 100,
      currency: session.currency || 'eur',
      stripe_payment_intent_id: session.payment_intent as string,
      stripe_session_id: session.id,
      status: 'succeeded',
      metadata: {
        tier: tierId,
        subscription_id: subscriptionId,
      },
    });

    console.log(`[Webhook] Subscription updated for user ${userId} to tier ${tierId}`);
  }
}

/**
 * Spracovanie aktualizácie subscription
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('[Webhook] Processing subscription.updated:', subscription.id);

  const userId = subscription.metadata.user_id;

  if (!userId) {
    console.error('[Webhook] Missing user_id in subscription metadata');
    return;
  }

  // Zisti tier
  const priceId = subscription.items.data[0].price.id;
  let tierId = 'free';

  if (priceId === process.env.STRIPE_PRICE_BASIC) {
    tierId = 'basic';
  } else if (priceId === process.env.STRIPE_PRICE_PREMIUM) {
    tierId = 'premium';
  }

  // Aktualizuj user_subscriptions
  const { error } = await supabaseAdmin
    .from('user_subscriptions')
    .update({
      tier_id: tierId,
      stripe_subscription_status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
    })
    .eq('user_id', userId);

  if (error) {
    console.error('[Webhook] Error updating subscription:', error);
    throw error;
  }

  console.log(`[Webhook] Subscription updated for user ${userId}`);
}

/**
 * Spracovanie zrušenia subscription
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('[Webhook] Processing subscription.deleted:', subscription.id);

  const userId = subscription.metadata.user_id;

  if (!userId) {
    console.error('[Webhook] Missing user_id in subscription metadata');
    return;
  }

  // Vráť používateľa na free tier
  const { error } = await supabaseAdmin
    .from('user_subscriptions')
    .update({
      tier_id: 'free',
      stripe_subscription_status: 'canceled',
      cancel_at_period_end: false,
    })
    .eq('user_id', userId);

  if (error) {
    console.error('[Webhook] Error canceling subscription:', error);
    throw error;
  }

  console.log(`[Webhook] Subscription canceled for user ${userId}, reverted to free tier`);
}

/**
 * Spracovanie úspešnej platby faktúry
 */
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  console.log('[Webhook] Processing invoice.paid:', invoice.id);

  const userId = invoice.subscription_details?.metadata?.user_id;

  if (!userId) {
    console.log('[Webhook] No user_id in invoice metadata, skipping');
    return;
  }

  // Ulož do payment_history
  await supabaseAdmin.from('payment_history').insert({
    user_id: userId,
    payment_type: 'subscription',
    amount: (invoice.amount_paid || 0) / 100,
    currency: invoice.currency || 'eur',
    stripe_payment_intent_id: invoice.payment_intent as string,
    stripe_charge_id: invoice.charge as string,
    status: 'succeeded',
    metadata: {
      invoice_id: invoice.id,
      subscription_id: invoice.subscription as string,
    },
  });

  console.log(`[Webhook] Invoice payment recorded for user ${userId}`);
}

/**
 * Spracovanie neúspešnej platby faktúry
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log('[Webhook] Processing invoice.payment_failed:', invoice.id);

  const userId = invoice.subscription_details?.metadata?.user_id;

  if (!userId) {
    console.log('[Webhook] No user_id in invoice metadata, skipping');
    return;
  }

  // Aktualizuj subscription status
  const { error } = await supabaseAdmin
    .from('user_subscriptions')
    .update({
      stripe_subscription_status: 'past_due',
    })
    .eq('user_id', userId);

  if (error) {
    console.error('[Webhook] Error updating subscription status:', error);
  }

  // Ulož do payment_history
  await supabaseAdmin.from('payment_history').insert({
    user_id: userId,
    payment_type: 'subscription',
    amount: (invoice.amount_due || 0) / 100,
    currency: invoice.currency || 'eur',
    stripe_payment_intent_id: invoice.payment_intent as string,
    status: 'failed',
    metadata: {
      invoice_id: invoice.id,
      subscription_id: invoice.subscription as string,
      failure_reason: 'Payment failed',
    },
  });

  console.log(`[Webhook] Invoice payment failure recorded for user ${userId}`);
}

// Vypni Next.js body parsing aby sme mohli získať raw body pre Stripe signature verification
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
