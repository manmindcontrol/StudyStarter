import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getUsageSummary } from '@/lib/usage';

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
    // Získaj aktuálneho používateľa
    const { user } = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - User must be logged in' },
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
