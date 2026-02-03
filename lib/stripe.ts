// Stripe konfigurácia a helper funkcie
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}

// Inicializácia Stripe s API verziou
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2026-01-28.clover',
  typescript: true,
});

// Stripe Price IDs z environment variables
export const STRIPE_PRICES = {
  PDF_CONVERSION: process.env.STRIPE_PRICE_PDF_CONVERSION || '',
  BASIC: process.env.STRIPE_PRICE_BASIC || '',
  PREMIUM: process.env.STRIPE_PRICE_PREMIUM || '',
} as const;

// Subscription tier mapping
export const SUBSCRIPTION_TIERS = {
  FREE: 'free',
  BASIC: 'basic',
  PREMIUM: 'premium',
} as const;

// Usage limits pre každý tier
export const TIER_LIMITS = {
  [SUBSCRIPTION_TIERS.FREE]: {
    pdf_conversions: 0, // PDF konverzie sú vždy spoplatnené
    materials: 1,
    notes_generations: 1,
    questions_generations: 1,
  },
  [SUBSCRIPTION_TIERS.BASIC]: {
    pdf_conversions: 20,
    materials: 10,
    notes_generations: 10,
    questions_generations: 10,
  },
  [SUBSCRIPTION_TIERS.PREMIUM]: {
    pdf_conversions: null, // null = unlimited
    materials: null,
    notes_generations: null,
    questions_generations: null,
  },
} as const;

// Helper funkcie

/**
 * Vytvorí Stripe Checkout Session pre jednorázovú platbu (PDF konverzia)
 */
export async function createPdfConversionCheckout(params: {
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}) {
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        price: STRIPE_PRICES.PDF_CONVERSION,
        quantity: 1,
      },
    ],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: params.metadata || {},
  });

  return session;
}

/**
 * Vytvorí Stripe Checkout Session pre subscription (Basic/Premium)
 */
export async function createSubscriptionCheckout(params: {
  priceId: string;
  customerId?: string;
  customerEmail?: string;
  userId: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'subscription',
    line_items: [
      {
        price: params.priceId,
        quantity: 1,
      },
    ],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: {
      user_id: params.userId,
    },
    subscription_data: {
      metadata: {
        user_id: params.userId,
      },
    },
  };

  // Pridaj customer ID ak existuje, inak email
  if (params.customerId) {
    sessionParams.customer = params.customerId;
  } else if (params.customerEmail) {
    sessionParams.customer_email = params.customerEmail;
  }

  const session = await stripe.checkout.sessions.create(sessionParams);

  return session;
}

/**
 * Získa alebo vytvorí Stripe Customer pre používateľa
 */
export async function getOrCreateCustomer(params: {
  email: string;
  userId: string;
  name?: string;
}): Promise<Stripe.Customer> {
  // Najprv skús nájsť existujúceho customera podľa emailu
  const existingCustomers = await stripe.customers.list({
    email: params.email,
    limit: 1,
  });

  if (existingCustomers.data.length > 0) {
    return existingCustomers.data[0];
  }

  // Ak neexistuje, vytvor nového
  const customer = await stripe.customers.create({
    email: params.email,
    name: params.name,
    metadata: {
      user_id: params.userId,
    },
  });

  return customer;
}

/**
 * Zruší subscription
 */
export async function cancelSubscription(subscriptionId: string) {
  return await stripe.subscriptions.cancel(subscriptionId);
}

/**
 * Aktualizuje subscription na iný plán
 */
export async function updateSubscription(params: {
  subscriptionId: string;
  newPriceId: string;
}) {
  const subscription = await stripe.subscriptions.retrieve(params.subscriptionId);

  return await stripe.subscriptions.update(params.subscriptionId, {
    items: [
      {
        id: subscription.items.data[0].id,
        price: params.newPriceId,
      },
    ],
    proration_behavior: 'create_prorations', // Prepočíta rozdiel v cene
  });
}

/**
 * Vytvorí Billing Portal Session pre správu subscription
 */
export async function createBillingPortalSession(params: {
  customerId: string;
  returnUrl: string;
}) {
  const session = await stripe.billingPortal.sessions.create({
    customer: params.customerId,
    return_url: params.returnUrl,
  });

  return session;
}

/**
 * Overí Stripe webhook signature
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string,
  webhookSecret: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}
