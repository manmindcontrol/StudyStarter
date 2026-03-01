import { NextRequest, NextResponse } from 'next/server';
import { stripe, constructWebhookEvent, SUBSCRIPTION_TIERS } from '@/lib/stripe';
import { createServiceRoleClient } from '@/lib/utils';
import Stripe from 'stripe';

type StripeSubscriptionWithPeriod = Stripe.Subscription & {
  current_period_start?: number;
  current_period_end?: number;
};

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured');
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = constructWebhookEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  const supabase = createServiceRoleClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.mode === 'subscription' && session.subscription) {
          const userId = session.metadata?.user_id;

          if (!userId) {
            console.error('No user_id in session metadata');
            break;
          }

          // Get subscription details
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );

          const priceId = subscription.items.data[0]?.price.id;

          // Determine tier based on price ID
          let tier: 'free' | 'basic' | 'premium' = SUBSCRIPTION_TIERS.FREE;
          if (priceId === process.env.STRIPE_PRICE_BASIC) {
            tier = SUBSCRIPTION_TIERS.BASIC;
          } else if (priceId === process.env.STRIPE_PRICE_PREMIUM) {
            tier = SUBSCRIPTION_TIERS.PREMIUM;
          }

          // Update user subscription in database
          const subData = subscription as StripeSubscriptionWithPeriod;
          const periodStart = subData.current_period_start
            ? new Date(subData.current_period_start * 1000).toISOString()
            : null;
          const periodEnd = subData.current_period_end
            ? new Date(subData.current_period_end * 1000).toISOString()
            : null;

          const { error: updateError } = await supabase
            .from('user_subscriptions')
            .update({
              tier_id: tier,
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: subscription.id,
              stripe_price_id: priceId,
              stripe_subscription_status: 'active',
              ...(periodStart && { current_period_start: periodStart }),
              ...(periodEnd && { current_period_end: periodEnd }),
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId);

          if (updateError) {
            console.error('Error updating subscription:', updateError);
          }

          // Reset usage tracking for new subscription period
          if (periodEnd) {
            await supabase
              .from('usage_tracking')
              .update({
                materials_uploaded: 0,
                notes_generations_used: 0,
                questions_generations_used: 0,
                pdf_conversions_used: 0,
                period_start: new Date().toISOString(),
                period_end: periodEnd,
              })
              .eq('user_id', userId);
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.user_id;

        if (!userId) {
          console.error('No user_id in subscription metadata');
          break;
        }

        const priceId = subscription.items.data[0]?.price.id;

        let tier: 'free' | 'basic' | 'premium' = SUBSCRIPTION_TIERS.FREE;
        if (priceId === process.env.STRIPE_PRICE_BASIC) {
          tier = SUBSCRIPTION_TIERS.BASIC;
        } else if (priceId === process.env.STRIPE_PRICE_PREMIUM) {
          tier = SUBSCRIPTION_TIERS.PREMIUM;
        }

        const status = subscription.status === 'active' ? 'active' :
                       subscription.status === 'past_due' ? 'past_due' :
                       subscription.status === 'canceled' ? 'canceled' : 'inactive';

        const subData = subscription as StripeSubscriptionWithPeriod;
        const periodStart = subData.current_period_start
          ? new Date(subData.current_period_start * 1000).toISOString()
          : null;
        const periodEnd = subData.current_period_end
          ? new Date(subData.current_period_end * 1000).toISOString()
          : null;

        await supabase
          .from('user_subscriptions')
          .update({
            tier_id: tier,
            stripe_price_id: priceId,
            stripe_subscription_status: status,
            ...(periodStart && { current_period_start: periodStart }),
            ...(periodEnd && { current_period_end: periodEnd }),
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.user_id;

        if (!userId) {
          // Try to find user by stripe_subscription_id
          const { data: sub } = await supabase
            .from('user_subscriptions')
            .select('user_id')
            .eq('stripe_subscription_id', subscription.id)
            .single();

          if (sub) {
            await supabase
              .from('user_subscriptions')
              .update({
                tier_id: SUBSCRIPTION_TIERS.FREE,
                stripe_subscription_status: 'canceled',
                stripe_subscription_id: null,
                stripe_price_id: null,
                updated_at: new Date().toISOString(),
              })
              .eq('user_id', sub.user_id);

          }
        } else {
          await supabase
            .from('user_subscriptions')
            .update({
              tier_id: SUBSCRIPTION_TIERS.FREE,
              stripe_subscription_status: 'canceled',
              stripe_subscription_id: null,
              stripe_price_id: null,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId);

        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const invoiceSubscriptionId = (invoice as unknown as { subscription?: string }).subscription;

        if (invoiceSubscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(
            invoiceSubscriptionId
          );

          const userId = subscription.metadata?.user_id;

          if (userId) {
            // Reset usage for new billing period
            const subData = subscription as StripeSubscriptionWithPeriod;
            const pStart = subData.current_period_start
              ? new Date(subData.current_period_start * 1000).toISOString()
              : new Date().toISOString();
            const pEnd = subData.current_period_end
              ? new Date(subData.current_period_end * 1000).toISOString()
              : null;

            if (pEnd) {
              await supabase
                .from('usage_tracking')
                .update({
                  materials_uploaded: 0,
                  notes_generations_used: 0,
                  questions_generations_used: 0,
                  pdf_conversions_used: 0,
                  period_start: pStart,
                  period_end: pEnd,
                })
                .eq('user_id', userId);

            }
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const failedInvoiceSubscriptionId = (invoice as unknown as { subscription?: string }).subscription;

        if (failedInvoiceSubscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(
            failedInvoiceSubscriptionId
          );

          const userId = subscription.metadata?.user_id;

          if (userId) {
            await supabase
              .from('user_subscriptions')
              .update({
                stripe_subscription_status: 'past_due',
                updated_at: new Date().toISOString(),
              })
              .eq('user_id', userId);

          }
        }
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
