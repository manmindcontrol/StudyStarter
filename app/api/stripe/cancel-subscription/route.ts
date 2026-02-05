import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/utils';
import { cancelSubscription } from '@/lib/stripe';

const supabase = createServiceRoleClient();

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
    // Získaj token z Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized - No authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
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
