/**
 * Customer Notification Preferences API
 * GET /api/v1/customers/:id/preferences - Get preferences
 * PUT /api/v1/customers/:id/preferences - Update preferences
 * DELETE /api/v1/customers/:id/preferences - Opt out of all
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  optOutAllNotifications,
  optInAllNotifications,
  getCustomerNotificationStats,
} from '@/lib/notifications/preferences';

export const runtime = 'nodejs';

/**
 * GET /api/v1/customers/:id/preferences
 * Get notification preferences for a customer
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const customerId = parseInt(id);

    if (isNaN(customerId)) {
      return NextResponse.json(
        { error: 'Invalid customer ID' },
        { status: 400 }
      );
    }

    const preferences = await getNotificationPreferences(customerId);
    const stats = await getCustomerNotificationStats(customerId);

    return NextResponse.json({
      success: true,
      data: {
        preferences,
        stats,
      },
    });
  } catch (error) {
    console.error('[API] Error getting preferences:', error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/v1/customers/:id/preferences
 * Update notification preferences
 * Body: { smsEnabled?: boolean, emailEnabled?: boolean }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const customerId = parseInt(id);

    if (isNaN(customerId)) {
      return NextResponse.json(
        { error: 'Invalid customer ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { smsEnabled, emailEnabled, optOut } = body;

    let preferences;

    // Handle opt-out request
    if (optOut === true) {
      preferences = await optOutAllNotifications(customerId);
    } else if (optOut === false) {
      // Re-enable all notifications
      preferences = await optInAllNotifications(customerId);
    } else {
      // Update individual preferences
      if (
        typeof smsEnabled !== 'boolean' &&
        typeof emailEnabled !== 'boolean'
      ) {
        return NextResponse.json(
          { error: 'At least one preference must be specified' },
          { status: 400 }
        );
      }

      preferences = await updateNotificationPreferences(customerId, {
        smsEnabled:
          typeof smsEnabled === 'boolean' ? smsEnabled : undefined,
        emailEnabled:
          typeof emailEnabled === 'boolean' ? emailEnabled : undefined,
      });
    }

    return NextResponse.json({
      success: true,
      data: preferences,
      message: 'Preferences updated successfully',
    });
  } catch (error) {
    console.error('[API] Error updating preferences:', error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/customers/:id/preferences
 * Opt out of all notifications (GDPR/CCPA compliant)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const customerId = parseInt(id);

    if (isNaN(customerId)) {
      return NextResponse.json(
        { error: 'Invalid customer ID' },
        { status: 400 }
      );
    }

    const preferences = await optOutAllNotifications(customerId);

    return NextResponse.json({
      success: true,
      data: preferences,
      message: 'You have been opted out of all notifications',
    });
  } catch (error) {
    console.error('[API] Error opting out:', error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
