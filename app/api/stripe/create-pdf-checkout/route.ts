import { NextRequest, NextResponse } from 'next/server';
import { createPdfConversionCheckout } from '@/lib/stripe';

/**
 * API endpoint pre vytvorenie Stripe Checkout Session pre PDF konverziu
 * POST /api/stripe/create-pdf-checkout
 *
 * Body: {
 *   fileName?: string // Voliteľné - názov súboru na konverziu
 * }
 *
 * Response: {
 *   sessionId: string // Stripe Checkout Session ID
 *   url: string // URL na Stripe Checkout
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileName } = body;

    // Získaj origin pre success/cancel URLs
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Vytvor Stripe Checkout Session
    const session = await createPdfConversionCheckout({
      successUrl: `${origin}/pdf-converter?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}/pdf-converter?canceled=true`,
      metadata: {
        type: 'pdf_conversion',
        fileName: fileName || 'unknown',
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Error creating PDF checkout session:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to create checkout session',
      },
      { status: 500 }
    );
  }
}
