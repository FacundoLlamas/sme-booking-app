/**
 * Notification Preferences Service
 * Handles customer notification preferences (SMS/Email opt-in/opt-out)
 * GDPR/CCPA compliant - customers can opt out anytime
 */

import { getPrismaClient } from '@/lib/db/queries';

/**
 * Notification preferences data
 */
export interface NotificationPreferencesData {
  customerId: number;
  smsEnabled: boolean;
  emailEnabled: boolean;
}

/**
 * Get notification preferences for a customer
 * Creates default preferences if they don't exist
 */
export async function getNotificationPreferences(
  customerId: number
): Promise<NotificationPreferencesData> {
  const prisma = getPrismaClient();

  try {
    let preferences = await prisma.notificationPreferences.findUnique({
      where: { customerId },
    });

    // Create default preferences if none exist
    if (!preferences) {
      console.log(
        `[Preferences] Creating default preferences for customer ${customerId}`
      );

      preferences = await prisma.notificationPreferences.create({
        data: {
          customerId,
          smsEnabled: true,
          emailEnabled: true,
        },
      });
    }

    return {
      customerId: preferences.customerId,
      smsEnabled: preferences.smsEnabled,
      emailEnabled: preferences.emailEnabled,
    };
  } catch (error) {
    console.error('[Preferences] Error getting preferences:', error);
    throw new Error(`Failed to get notification preferences: ${String(error)}`);
  }
}

/**
 * Update notification preferences for a customer
 */
export async function updateNotificationPreferences(
  customerId: number,
  preferences: Partial<NotificationPreferencesData>
): Promise<NotificationPreferencesData> {
  const prisma = getPrismaClient();

  try {
    // Check if customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new Error(`Customer ${customerId} not found`);
    }

    // Get existing or create default preferences
    let current = await prisma.notificationPreferences.findUnique({
      where: { customerId },
    });

    if (!current) {
      current = await prisma.notificationPreferences.create({
        data: {
          customerId,
          smsEnabled: true,
          emailEnabled: true,
        },
      });
    }

    // Update preferences
    const updated = await prisma.notificationPreferences.update({
      where: { customerId },
      data: {
        smsEnabled:
          preferences.smsEnabled !== undefined
            ? preferences.smsEnabled
            : current.smsEnabled,
        emailEnabled:
          preferences.emailEnabled !== undefined
            ? preferences.emailEnabled
            : current.emailEnabled,
      },
    });

    console.log(
      `[Preferences] Updated preferences for customer ${customerId}: SMS=${updated.smsEnabled}, Email=${updated.emailEnabled}`
    );

    // Audit log the change
    logPreferenceChange(customerId, current, updated).catch((error) =>
      console.error('[Preferences] Failed to log preference change:', error)
    );

    return {
      customerId: updated.customerId,
      smsEnabled: updated.smsEnabled,
      emailEnabled: updated.emailEnabled,
    };
  } catch (error) {
    console.error('[Preferences] Error updating preferences:', error);
    throw new Error(`Failed to update notification preferences: ${String(error)}`);
  }
}

/**
 * Opt out of all notifications (GDPR/CCPA compliant)
 */
export async function optOutAllNotifications(
  customerId: number
): Promise<NotificationPreferencesData> {
  console.log(`[Preferences] Customer ${customerId} opted out of all notifications`);

  return updateNotificationPreferences(customerId, {
    smsEnabled: false,
    emailEnabled: false,
  });
}

/**
 * Opt in to all notifications
 */
export async function optInAllNotifications(
  customerId: number
): Promise<NotificationPreferencesData> {
  console.log(`[Preferences] Customer ${customerId} opted in to all notifications`);

  return updateNotificationPreferences(customerId, {
    smsEnabled: true,
    emailEnabled: true,
  });
}

/**
 * Check if a notification should be sent based on preferences
 */
export async function shouldSendNotification(
  customerId: number,
  type: 'sms' | 'email'
): Promise<boolean> {
  try {
    const preferences = await getNotificationPreferences(customerId);

    if (type === 'sms') {
      return preferences.smsEnabled;
    } else if (type === 'email') {
      return preferences.emailEnabled;
    }

    return false;
  } catch (error) {
    console.error('[Preferences] Error checking notification permission:', error);
    // Default to true if we can't determine preferences (fail open)
    return true;
  }
}

/**
 * Get notification statistics for a customer
 */
export async function getCustomerNotificationStats(
  customerId: number
): Promise<{
  totalSent: number;
  totalFailed: number;
  smsCount: number;
  emailCount: number;
  lastNotification?: string;
}> {
  const prisma = getPrismaClient();

  try {
    const logs = await prisma.notificationLog.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
    });

    const totalSent = logs.filter((l) => l.status === 'sent').length;
    const totalFailed = logs.filter((l) => l.status === 'failed').length;
    const smsCount = logs.filter((l) => l.type === 'sms').length;
    const emailCount = logs.filter((l) => l.type === 'email').length;
    const lastNotification = logs[0]?.createdAt.toISOString();

    return {
      totalSent,
      totalFailed,
      smsCount,
      emailCount,
      lastNotification,
    };
  } catch (error) {
    console.error('[Preferences] Error getting notification stats:', error);
    throw new Error(`Failed to get notification stats: ${String(error)}`);
  }
}

/**
 * Internal function to audit log preference changes
 */
async function logPreferenceChange(
  customerId: number,
  oldPrefs: any,
  newPrefs: any
): Promise<void> {
  // This could be expanded to log to an audit table
  // For now, just log to console and can be stored in notification_log table
  if (oldPrefs.smsEnabled !== newPrefs.smsEnabled) {
    console.log(
      `[Preferences Audit] Customer ${customerId}: SMS ${oldPrefs.smsEnabled} → ${newPrefs.smsEnabled}`
    );
  }
  if (oldPrefs.emailEnabled !== newPrefs.emailEnabled) {
    console.log(
      `[Preferences Audit] Customer ${customerId}: Email ${oldPrefs.emailEnabled} → ${newPrefs.emailEnabled}`
    );
  }
}

/**
 * Batch get preferences for multiple customers
 */
export async function getMultipleCustomerPreferences(
  customerIds: number[]
): Promise<Map<number, NotificationPreferencesData>> {
  const prisma = getPrismaClient();

  try {
    const preferences = await prisma.notificationPreferences.findMany({
      where: {
        customerId: { in: customerIds },
      },
    });

    const map = new Map<number, NotificationPreferencesData>();

    for (const customerId of customerIds) {
      const pref = preferences.find((p) => p.customerId === customerId);

      if (pref) {
        map.set(customerId, {
          customerId: pref.customerId,
          smsEnabled: pref.smsEnabled,
          emailEnabled: pref.emailEnabled,
        });
      } else {
        // Default preferences for customers with no record
        map.set(customerId, {
          customerId,
          smsEnabled: true,
          emailEnabled: true,
        });
      }
    }

    return map;
  } catch (error) {
    console.error('[Preferences] Error batch getting preferences:', error);
    throw new Error(`Failed to get multiple preferences: ${String(error)}`);
  }
}
