/**
 * Notifications Module Exports
 */

export {
  getNotificationPreferences,
  updateNotificationPreferences,
  optOutAllNotifications,
  optInAllNotifications,
  shouldSendNotification,
  getCustomerNotificationStats,
  getMultipleCustomerPreferences,
  type NotificationPreferencesData,
} from './preferences';

export {
  initializeNotificationSystem,
  shutdownNotificationSystem,
  isNotificationSystemInitialized,
  getNotificationSystemStatus,
} from './init';

export {
  confirmBooking,
  resendConfirmation,
  generateConfirmationCode,
  type ConfirmationWorkflowResult,
} from '@/lib/bookings/confirmation-workflow';

export {
  sendReminders,
  setupReminderCron,
  type ReminderType,
} from '@/lib/cron/send-reminders';
