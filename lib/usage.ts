// Usage tracking a limit checking funkcie
import { createClient } from '@supabase/supabase-js';

// Vytvor Supabase klienta s service role
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

export type UsageType = 'pdf_conversions' | 'materials' | 'lectures' | 'notes_generations' | 'questions_generations';

export interface SubscriptionTierLimits {
  id: string;
  name: string;
  pdf_conversions_limit: number | null;
  materials_limit: number | null;
  notes_generations_limit: number | null;
  questions_generations_limit: number | null;
}

/**
 * Získa aktuálny usage pre používateľa v tomto mesiaci
 */
export async function getCurrentUsage(userId: string) {
  const periodStart = new Date();
  periodStart.setDate(1); // Prvý deň mesiaca
  periodStart.setHours(0, 0, 0, 0);

  const periodEnd = new Date(periodStart);
  periodEnd.setMonth(periodEnd.getMonth() + 1); // Prvý deň budúceho mesiaca

  // Skús získať existujúci usage záznam
  const { data: usage, error } = await supabaseAdmin
    .from('usage_tracking')
    .select('*')
    .eq('user_id', userId)
    .eq('period_start', periodStart.toISOString())
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows returned
    console.error('Error fetching usage:', error);
    throw error;
  }

  // Ak neexistuje, vytvor nový záznam
  // Použijeme upsert pre handling race conditions
  if (!usage) {
    const { data: newUsage, error: insertError } = await supabaseAdmin
      .from('usage_tracking')
      .upsert(
        {
          user_id: userId,
          period_start: periodStart.toISOString(),
          period_end: periodEnd.toISOString(),
          pdf_conversions_used: 0,
          materials_uploaded: 0,
          notes_generations_used: 0,
          questions_generations_used: 0,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,period_start',
          ignoreDuplicates: false,
        }
      )
      .select()
      .single();

    if (insertError) {
      console.error('Error creating usage record:', insertError);
      throw insertError;
    }

    usage = newUsage;
  }

  return usage;
}

/**
 * Získa tier a limity pre používateľa
 */
export async function getUserTierAndLimits(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('user_subscriptions')
    .select(`
      tier_id,
      stripe_customer_id,
      stripe_subscription_id,
      subscription_tiers (
        id,
        name,
        pdf_conversions_limit,
        materials_limit,
        notes_generations_limit,
        questions_generations_limit
      )
    `)
    .eq('user_id', userId)
    .single();

  // If no subscription exists, create a default free tier subscription
  // This should rarely happen - trigger should create it automatically
  if (error && error.code === 'PGRST116') {
    console.warn(`No subscription found for user ${userId}, trigger may have failed. Creating fallback subscription.`);

    const { error: insertError } = await supabaseAdmin
      .from('user_subscriptions')
      .upsert(
        {
          user_id: userId,
          tier_id: 'free',
          stripe_subscription_status: 'active',
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id',
          ignoreDuplicates: false,
        }
      );

    if (insertError) {
      console.error('Error creating default subscription:', insertError);
      throw insertError;
    }

    // Retry fetching the subscription
    const { data: retryData, error: retryError } = await supabaseAdmin
      .from('user_subscriptions')
      .select(`
        tier_id,
        stripe_customer_id,
        stripe_subscription_id,
        subscription_tiers (
          id,
          name,
          pdf_conversions_limit,
          materials_limit,
          notes_generations_limit,
          questions_generations_limit
        )
      `)
      .eq('user_id', userId)
      .single();

    if (retryError) {
      console.error('Error fetching user tier after creation:', retryError);
      throw retryError;
    }

    return {
      tierId: retryData.tier_id,
      stripeCustomerId: retryData.stripe_customer_id,
      stripeSubscriptionId: retryData.stripe_subscription_id,
      limits: retryData.subscription_tiers as Record<string, unknown>,
    };
  }

  if (error) {
    console.error('Error fetching user tier:', error);
    throw error;
  }

  return {
    tierId: data.tier_id,
    stripeCustomerId: data.stripe_customer_id,
    stripeSubscriptionId: data.stripe_subscription_id,
    limits: data.subscription_tiers as Record<string, unknown>,
  };
}

// Admin emails s neobmedzeným prístupom
const ADMIN_EMAILS = ['info@studystarter.io'];

/**
 * Skontroluje či je používateľ admin podľa emailu
 */
export async function isAdmin(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .select('email')
      .eq('id', userId)
      .single();

    if (error || !data?.email) return false;
    return ADMIN_EMAILS.includes(data.email.toLowerCase());
  } catch {
    return false;
  }
}

/**
 * Skontroluje či používateľ môže použiť danú funkciu
 * @returns { allowed: boolean, reason?: string }
 */
export async function checkUsageLimit(
  userId: string,
  usageType: UsageType
): Promise<{ allowed: boolean; reason?: string; current?: number; limit?: number | null }> {
  try {
    // Admin bypass - neobmedzený prístup
    if (await isAdmin(userId)) {
      return { allowed: true, limit: null };
    }

    // Získaj tier a limity
    const { limits } = await getUserTierAndLimits(userId);

    // Mapovanie usageType na limit field
    const limitMapping: Record<UsageType, number | null> = {
      pdf_conversions: limits.pdf_conversions_limit,
      materials: limits.materials_limit,
      lectures: limits.materials_limit,
      notes_generations: limits.notes_generations_limit,
      questions_generations: limits.questions_generations_limit,
    };
    const limit = limitMapping[usageType];

    // Ak je limit NULL, znamená to unlimited
    if (limit === null) {
      return { allowed: true };
    }

    // Ak je limit 0, funkcia nie je dostupná v tomto tieri
    if (limit === 0) {
      return {
        allowed: false,
        reason: `This feature is not available in your current plan. Please upgrade to use this feature.`,
        current: 0,
        limit: 0,
      };
    }

    // Získaj aktuálne použitie
    const usage = await getCurrentUsage(userId);
    // Map usageType to actual column names
    const usageFieldMapping: Record<UsageType, string> = {
      pdf_conversions: 'pdf_conversions_used',
      materials: 'materials_uploaded',
      lectures: 'materials_uploaded',
      notes_generations: 'notes_generations_used',
      questions_generations: 'questions_generations_used',
    };
    const usedField = usageFieldMapping[usageType] as keyof typeof usage;
    const used = usage[usedField] as number;

    // Skontroluj či neprekročil limit
    if (used >= limit) {
      return {
        allowed: false,
        reason: `You have reached your monthly limit of ${limit} for this feature. Please upgrade your plan or wait until next month.`,
        current: used,
        limit: limit,
      };
    }

    return {
      allowed: true,
      current: used,
      limit: limit,
    };
  } catch (error) {
    console.error('Error checking usage limit:', error);
    // V prípade chyby povoľ operáciu (fail-open)
    return { allowed: true };
  }
}

/**
 * Inkrementuje usage counter pre danú funkciu
 */
export async function incrementUsage(
  userId: string,
  usageType: UsageType
): Promise<void> {
  try {
    const usage = await getCurrentUsage(userId);
    // Map usageType to actual column names
    const fieldMapping: Record<UsageType, string> = {
      pdf_conversions: 'pdf_conversions_used',
      materials: 'materials_uploaded',
      lectures: 'materials_uploaded', // lectures use same column as materials
      notes_generations: 'notes_generations_used',
      questions_generations: 'questions_generations_used',
    };
    const usedField = fieldMapping[usageType];

    const { error } = await supabaseAdmin
      .from('usage_tracking')
      .update({
        [usedField]: (usage[usedField as keyof typeof usage] as number) + 1,
      })
      .eq('id', usage.id);

    if (error) {
      console.error('Error incrementing usage:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in incrementUsage:', error);
    // Nehádzaj error aby sme nezastavili workflow používateľa
  }
}

/**
 * Získa usage summary pre používateľa (pre zobrazenie v UI)
 */
export async function getUsageSummary(userId: string) {
  try {
    const [usage, tierInfo] = await Promise.all([
      getCurrentUsage(userId),
      getUserTierAndLimits(userId),
    ]);

    const limits = tierInfo.limits;

    return {
      tierId: tierInfo.tierId,
      tierName: limits.name,
      hasStripeSubscription: !!(tierInfo.stripeCustomerId && tierInfo.stripeSubscriptionId),
      usage: {
        pdf_conversions: {
          used: usage.pdf_conversions_used,
          limit: limits.pdf_conversions_limit,
          unlimited: limits.pdf_conversions_limit === null,
        },
        materials: {
          used: usage.materials_uploaded,
          limit: limits.materials_limit,
          unlimited: limits.materials_limit === null,
        },
        notes_generations: {
          used: usage.notes_generations_used,
          limit: limits.notes_generations_limit,
          unlimited: limits.notes_generations_limit === null,
        },
        questions_generations: {
          used: usage.questions_generations_used,
          limit: limits.questions_generations_limit,
          unlimited: limits.questions_generations_limit === null,
        },
      },
      periodStart: usage.period_start,
      periodEnd: usage.period_end,
    };
  } catch (error) {
    console.error('Error getting usage summary:', error);
    throw error;
  }
}

/**
 * Helper funkcia na získanie percent usage
 */
export function getUsagePercentage(used: number, limit: number | null): number {
  if (limit === null) return 0; // Unlimited
  if (limit === 0) return 100; // Not available
  return Math.min((used / limit) * 100, 100);
}
