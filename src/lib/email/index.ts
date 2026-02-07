/**
 * Email Module Exports
 */

export {
  sendEmail,
  sendBulkEmail,
  getEmailLog,
  clearEmailLog,
  getEmailStats,
  getEmailPreviewPath,
} from './send';
export {
  confirmationEmail,
  reminderEmail_24h,
  reminderEmail_2h,
  cancellationEmail,
  rescheduleEmail,
  serviceCompletedEmail,
} from './templates';
export type { SendEmailParams, SendEmailResponse } from './send';
