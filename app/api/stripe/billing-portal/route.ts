import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/utils';
import { createBillingPortalSession } from '@/lib/stripe';

const supabase = createServiceRoleClient();

/**
 * API endpoint pre vytvorenie Stripe Billing Portal Session
 * POST /api/stripe/billing-portal
 *
 * Response: {
 *   url: string // URL na Stripe Billing Portal
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

    // Získaj customer ID z databázy
    const { data: subscription, error } = await supabase
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (error || !subscription || !subscription.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No Stripe customer found' },
        { status: 404 }
      );
    }

    // Získaj origin pre return URL
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Vytvor Billing Portal Session
    const session = await createBillingPortalSession({
      customerId: subscription.stripe_customer_id,
      returnUrl: `${origin}/profile`,
    });

    return NextResponse.json({
      url: session.url,
    });
  } catch (error) {
    console.error('Error creating billing portal session:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to create billing portal session',
      },
      { status: 500 }
    );
  }
}
