import { apiSuccess, apiError } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/db/prisma';

/**
 * GET /api/v1/dashboard/stats
 * Returns aggregate metrics for the dashboard
 */
export async function GET() {
  try {
    const [totalBookings, pendingBookings, completedBookings, activeCustomers] =
      await Promise.all([
        prisma.booking.count(),
        prisma.booking.count({ where: { status: 'pending' } }),
        prisma.booking.count({ where: { status: 'completed' } }),
        prisma.customer.count(),
      ]);

    const completionRate =
      totalBookings > 0
        ? Math.round((completedBookings / totalBookings) * 100)
        : 0;

    return apiSuccess({
      totalBookings,
      activeCustomers,
      completionRate,
      pendingBookings,
    });
  } catch (error) {
    logger.error('[DASHBOARD STATS] Error', { error: String(error) });
    return apiError('INTERNAL_ERROR', 'Failed to fetch dashboard stats', 500);
  }
}
