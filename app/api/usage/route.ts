import { NextRequest, NextResponse } from 'next/server';
import { getUsageSummary } from '@/lib/usage';
import { createServiceRoleClient } from '@/lib/utils';

const supabase = createServiceRoleClient();

/**
 * API endpoint pre získanie usage informácií používateľa
 * GET /api/usage
 *
 * Response: {
 *   tierId: string
 *   tierName: string
 *   usage: {
 *     pdf_conversions: { used: number, limit: number | null, unlimited: boolean }
 *     materials: { used: number, limit: number | null, unlimited: boolean }
 *     notes_generations: { used: number, limit: number | null, unlimited: boolean }
 *     questions_generations: { used: number, limit: number | null, unlimited: boolean }
 *   }
 *   periodStart: string
 *   periodEnd: string
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Autentifikácia cez Bearer token
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
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    // Získaj usage summary
    const summary = await getUsageSummary(user.id);

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Error fetching usage:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch usage',
      },
      { status: 500 }
    );
  }
}
