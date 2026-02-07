/**
 * Notification System Initialization
 * Call this at application startup to:
 * - Initialize the notification queue processor
 * - Setup the reminder cron job
 * - Create default notification preferences for existing customers
 */

import { processNotificationQueue } from '@/lib/queue/notification-queue';
import { setupReminderCron } from '@/lib/cron/send-reminders';
import { getPrismaClient } from '@/lib/db/queries';

let isInitialized = false;
let reminderCronTimer: NodeJS.Timer | null = null;

/**
 * Initialize the notification system
 */
export async function initializeNotificationSystem(): Promise<{
  queueProcessorStarted: boolean;
  reminderCronStarted: boolean;
  defaultPreferencesCreated: number;
}> {
  if (isInitialized) {
    console.log('[Notifications] System already initialized');
    return {
      queueProcessorStarted: false,
      reminderCronStarted: false,
      defaultPreferencesCreated: 0,
    };
  }

  console.log('[Notifications] Initializing notification system...');

  const result = {
    queueProcessorStarted: false,
    reminderCronStarted: false,
    defaultPreferencesCreated: 0,
  };

  try {
    // Step 1: Start queue processor
    console.log('[Notifications] Starting queue processor...');
    try {
      await processNotificationQueue();
      result.queueProcessorStarted = true;
      console.log('[Notifications] ✅ Queue processor started');
    } catch (error) {
      console.error('[Notifications] Failed to start queue processor:', error);
    }

    // Step 2: Setup reminder cron
    console.log('[Notifications] Setting up reminder cron job...');
    try {
      reminderCronTimer = setupReminderCron();
      result.reminderCronStarted = true;
      console.log('[Notifications] ✅ Reminder cron job scheduled');
    } catch (error) {
      console.error('[Notifications] Failed to setup reminder cron:', error);
    }

    // Step 3: Create default preferences for existing customers
    console.log('[Notifications] Creating default preferences for existing customers...');
    try {
      const prisma = getPrismaClient();

      const customersWithoutPrefs = await prisma.customer.findMany({
        where: {
          notificationPreferences: null,
        },
        select: { id: true },
        take: 1000, // Batch process 1000 at a time
      });

      if (customersWithoutPrefs.length > 0) {
        await prisma.notificationPreferences.createMany({
          data: customersWithoutPrefs.map((customer) => ({
            customerId: customer.id,
            smsEnabled: true,
            emailEnabled: true,
          })),
          skipDuplicates: true,
        });

        result.defaultPreferencesCreated = customersWithoutPrefs.length;
        console.log(
          `[Notifications] ✅ Created default preferences for ${customersWithoutPrefs.length} customers`
        );
      }
    } catch (error) {
      console.error('[Notifications] Failed to create default preferences:', error);
    }

    isInitialized = true;

    console.log('[Notifications] 🎉 Notification system initialized successfully');
    console.log('[Notifications] System Status:');
    console.log(`  - Queue Processor: ${result.queueProcessorStarted ? '✅' : '❌'}`);
    console.log(`  - Reminder Cron: ${result.reminderCronStarted ? '✅' : '❌'}`);
    console.log(`  - Default Preferences Created: ${result.defaultPreferencesCreated}`);

    return result;
  } catch (error) {
    console.error('[Notifications] Failed to initialize notification system:', error);
    throw new Error(`Notification system initialization failed: ${String(error)}`);
  }
}

/**
 * Shutdown notification system gracefully
 */
export async function shutdownNotificationSystem(): Promise<void> {
  console.log('[Notifications] Shutting down notification system...');

  if (reminderCronTimer) {
    clearTimeout(reminderCronTimer);
    console.log('[Notifications] Reminder cron job cleared');
  }

  // Note: Queue shutdown is handled separately in notification-queue.ts
  console.log('[Notifications] Notification system shutdown complete');
}

/**
 * Check if notification system is initialized
 */
export function isNotificationSystemInitialized(): boolean {
  return isInitialized;
}

/**
 * Get initialization status
 */
export function getNotificationSystemStatus(): {
  isInitialized: boolean;
  queueProcessorActive: boolean;
  reminderCronActive: boolean;
} {
  return {
    isInitialized,
    queueProcessorActive: isInitialized,
    reminderCronActive: reminderCronTimer !== null,
  };
}
