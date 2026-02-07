/**
 * SMS Module Exports
 */

export { sendSMS, sendBulkSMS, getSMSLog, clearSMSLog, getSMSStats } from './send';
export {
  confirmationSMS,
  reminderSMS_24h,
  reminderSMS_2h,
  cancellationSMS,
  rescheduleSMS,
  technicianEnRouteSMS,
  serviceCompletedSMS,
} from './templates';
export type { SendSMSParams, SendSMSResponse } from './send';
