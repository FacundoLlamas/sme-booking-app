/**
 * SMS Templates
 * Pre-defined message templates for booking notifications
 */

export interface SMSTemplate {
  (params: any): string;
}

/**
 * Confirmation SMS when booking is created
 */
export function confirmationSMS(
  bookingCode: string,
  date: string,
  time: string,
  businessName: string = 'Evios HQ'
): string {
  return `Your booking is confirmed! 
Booking Code: ${bookingCode}
Date: ${date} at ${time}
Business: ${businessName}

Reply CANCEL to cancel your appointment.`;
}

/**
 * Confirmation SMS with customer name (new format)
 */
export function confirmationSMSTemplate(
  customerName: string,
  confirmationCode: string,
  date: string,
  time: string,
  serviceType: string,
  businessName: string = 'Evios HQ'
): string {
  return `Hi ${customerName}! Your booking is confirmed. 📅

Confirmation Code: ${confirmationCode}
Service: ${serviceType}
Date: ${date}
Time: ${time}
Business: ${businessName}

Reply CANCEL to reschedule.`;
}

/**
 * Reminder SMS 24 hours before appointment
 */
export function reminderSMS_24h(
  date: string,
  time: string,
  businessName: string = 'Evios HQ',
  businessPhone?: string
): string {
  const contactInfo = businessPhone ? `\nQuestions? Call ${businessPhone}` : '';
  return `Reminder: Your appointment is tomorrow!
Date: ${date} at ${time}
Business: ${businessName}${contactInfo}

See you soon!`;
}

/**
 * Reminder SMS template 24 hours (new format for cron)
 */
export function reminderSMSTemplate_24h(
  customerName: string,
  date: string,
  time: string,
  serviceType?: string,
  businessName: string = 'Evios HQ'
): string {
  return `Hi ${customerName}! Reminder: Your ${serviceType || 'service'} appointment is tomorrow.

📅 Date: ${date}
🕐 Time: ${time}
🏢 Business: ${businessName}

See you then!`;
}

/**
 * Reminder SMS 2 hours before appointment
 */
export function reminderSMS_2h(
  time: string,
  address?: string,
  businessName: string = 'Evios HQ'
): string {
  const locationInfo = address ? `\nLocation: ${address}` : '';
  return `Reminder: Your appointment is in 2 hours!
Time: ${time}
Business: ${businessName}${locationInfo}

We're looking forward to serving you!`;
}

/**
 * Reminder SMS template 2 hours (new format for cron)
 */
export function reminderSMSTemplate_2h(
  customerName: string,
  time: string,
  serviceType?: string,
  businessName: string = 'Evios HQ'
): string {
  return `Hi ${customerName}! Your ${serviceType || 'service'} appointment is in 2 hours.

🕐 Time: ${time}
🏢 Business: ${businessName}

We're ready for you!`;
}

/**
 * Cancellation confirmation SMS
 */
export function cancellationSMS(
  bookingCode: string,
  businessName: string = 'Evios HQ',
  businessPhone?: string
): string {
  const rebookInfo = businessPhone ? `\nTo rebook, call ${businessPhone}` : '';
  return `Your booking (${bookingCode}) has been cancelled.
Business: ${businessName}${rebookInfo}

We hope to serve you again soon!`;
}

/**
 * Rescheduling confirmation SMS
 */
export function rescheduleSMS(
  bookingCode: string,
  oldDate: string,
  oldTime: string,
  newDate: string,
  newTime: string,
  businessName: string = 'Evios HQ'
): string {
  return `Your appointment has been rescheduled.
Booking Code: ${bookingCode}
Old: ${oldDate} at ${oldTime}
New: ${newDate} at ${newTime}
Business: ${businessName}

See you then!`;
}

/**
 * Technician on the way SMS
 */
export function technicianEnRouteSMS(
  technicianName: string,
  estimatedArrival: string,
  technicianPhone?: string
): string {
  const contactInfo = technicianPhone ? `\nContact: ${technicianPhone}` : '';
  return `Good news! ${technicianName} is on the way!
Estimated arrival: ${estimatedArrival}${contactInfo}`;
}

/**
 * Service completed SMS
 */
export function serviceCompletedSMS(
  bookingCode: string,
  businessName: string = 'Evios HQ',
  feedbackLink?: string
): string {
  const feedbackInfo = feedbackLink
    ? `\n\nRate your experience: ${feedbackLink}`
    : '';
  return `Service completed! 
Booking Code: ${bookingCode}
Business: ${businessName}

Thank you for choosing us!${feedbackInfo}`;
}
