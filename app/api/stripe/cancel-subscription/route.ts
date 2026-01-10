import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { cancelSubscription } from '@/lib/stripe';

/**
 * API endpoint pre zrušenie subscription
 * POST /api/stripe/cancel-subscription
 *
 * Response: {
 *   success: boolean
 *   message: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Získaj aktuálneho používateľa
    const { user } = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - User must be logged in' },
        { status: 401 }
      );
    }

    // Získaj subscription info z databázy
    const { data: subscription, error } = await supabase
      .from('user_subscriptions')
      .select('stripe_subscription_id, tier_id')
      .eq('user_id', user.id)
      .single();

    if (error || !subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    if (subscription.tier_id === 'free') {
      return NextResponse.json(
        { error: 'You are already on the free plan' },
        { status: 400 }
      );
    }

    if (!subscription.stripe_subscription_id) {
      return NextResponse.json(
        { error: 'No active Stripe subscription found' },
        { status: 400 }
      );
    }

    // Zruš subscription v Stripe
    await cancelSubscription(subscription.stripe_subscription_id);

    return NextResponse.json({
      success: true,
      message: 'Your subscription will be canceled at the end of the billing period',
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to cancel subscription',
      },
      { status: 500 }
    );
  }
}
