/**
 * Reminder Notifications Cron Job
 * Runs every hour to find bookings within next 24 hours and send reminders
 * Sends reminders at:
 * - 24 hours before booking (reminder_24h)
 * - 2 hours before booking (reminder_2h)
 *
 * Tracks sent reminders to avoid duplicates
 */

import { getPrismaClient } from '@/lib/db/queries';
import { enqueueNotification } from '@/lib/queue/notification-queue';
import {
  reminderSMSTemplate_24h,
  reminderSMSTemplate_2h,
} from '@/lib/sms/templates';

/**
 * Reminder types
 */
export type ReminderType = '24h' | '2h';

/**
 * Configuration for reminders
 */
const REMINDER_CONFIG = {
  '24h': {
    hoursBeforeBooking: 24,
    description: '24 hours before',
  },
  '2h': {
    hoursBeforeBooking: 2,
    description: '2 hours before',
  },
};

/**
 * Check and send reminders for bookings
 * Call this every hour via cron job
 */
export async function sendReminders(): Promise<{
  sent_24h: number;
  sent_2h: number;
  failures: number;
  lastRun: string;
}> {
  const prisma = getPrismaClient();
  const now = new Date();

  console.log(`[Reminders] Starting reminder check at ${now.toISOString()}`);

  const stats = {
    sent_24h: 0,
    sent_2h: 0,
    failures: 0,
    lastRun: now.toISOString(),
  };

  try {
    // Check for 24-hour reminders
    console.log('[Reminders] Checking for 24-hour reminders...');
    const sent24h = await sendRemindersForType('24h', prisma);
    stats.sent_24h = sent24h.sent;
    stats.failures += sent24h.failures;

    // Check for 2-hour reminders
    console.log('[Reminders] Checking for 2-hour reminders...');
    const sent2h = await sendRemindersForType('2h', prisma);
    stats.sent_2h = sent2h.sent;
    stats.failures += sent2h.failures;

    console.log(
      `[Reminders] Reminder check completed: 24h=${stats.sent_24h}, 2h=${stats.sent_2h}, failures=${stats.failures}`
    );

    return stats;
  } catch (error) {
    console.error('[Reminders] Error during reminder check:', error);
    stats.failures++;
    return stats;
  }
}

/**
 * Send reminders of a specific type (24h or 2h)
 */
async function sendRemindersForType(
  type: ReminderType,
  prisma: ReturnType<typeof getPrismaClient>
): Promise<{ sent: number; failures: number }> {
  const config = REMINDER_CONFIG[type];
  const now = new Date();

  // Calculate time window for this reminder
  const reminderWindowStart = new Date(
    now.getTime() - (config.hoursBeforeBooking + 1) * 60 * 60 * 1000
  );
  const reminderWindowEnd = new Date(
    now.getTime() - (config.hoursBeforeBooking - 0.5) * 60 * 60 * 1000
  );

  console.log(
    `[Reminders-${type}] Looking for bookings between ${reminderWindowStart.toISOString()} and ${reminderWindowEnd.toISOString()}`
  );

  let sent = 0;
  let failures = 0;

  try {
    // Find bookings in the reminder window that:
    // 1. Have not yet been reminded of this type
    // 2. Are confirmed
    // 3. Have customer phone/email
    const bookingsNeedingReminder = await prisma.booking.findMany({
      where: {
        status: 'confirmed',
        bookingTime: {
          gte: reminderWindowStart,
          lte: reminderWindowEnd,
        },
        remindersSent: {
          none: {
            reminderType: type,
          },
        },
      },
      include: {
        customer: true,
        service: true,
        technician: true,
        business: true,
      },
    });

    console.log(
      `[Reminders-${type}] Found ${bookingsNeedingReminder.length} bookings needing reminders`
    );

    // For each booking, send SMS and email if customer preferences allow
    for (const booking of bookingsNeedingReminder) {
      try {
        // Get customer notification preferences
        const preferences = await prisma.notificationPreferences.findUnique({
          where: { customerId: booking.customerId },
        });

        const sendSMS = preferences?.smsEnabled !== false;
        const sendEmail = preferences?.emailEnabled !== false;

        console.log(
          `[Reminders-${type}] Sending reminder for booking ${booking.id}: SMS=${sendSMS}, Email=${sendEmail}`
        );

        // Send SMS reminder
        if (sendSMS && booking.customer.phone) {
          try {
            const smsMessage = generateReminderSMS(
              type,
              booking.bookingTime,
              booking.customer.name,
              booking.service?.name,
              booking.business?.name
            );

            await enqueueNotification({
              type: 'sms',
              bookingId: booking.id,
              customerId: booking.customerId,
              recipientAddr: booking.customer.phone,
              body: smsMessage,
              metadata: { reminderType: type },
            });

            console.log(
              `[Reminders-${type}] SMS reminder queued for booking ${booking.id}`
            );
          } catch (error) {
            console.error(
              `[Reminders-${type}] Failed to queue SMS for booking ${booking.id}:`,
              error
            );
            failures++;
          }
        }

        // Send Email reminder
        if (sendEmail && booking.customer.email) {
          try {
            const { subject, body } = generateReminderEmail(
              type,
              booking.customer.name,
              booking.bookingTime,
              booking.service?.name,
              booking.business?.name
            );

            await enqueueNotification({
              type: 'email',
              bookingId: booking.id,
              customerId: booking.customerId,
              recipientAddr: booking.customer.email,
              subject: subject,
              body: body,
              metadata: { reminderType: type },
            });

            console.log(
              `[Reminders-${type}] Email reminder queued for booking ${booking.id}`
            );
          } catch (error) {
            console.error(
              `[Reminders-${type}] Failed to queue email for booking ${booking.id}:`,
              error
            );
            failures++;
          }
        }

        // Mark reminder as sent for this type and channel(s)
        if (sendSMS) {
          await prisma.reminderSent.create({
            data: {
              bookingId: booking.id,
              customerId: booking.customerId,
              reminderType: type,
              channel: 'sms',
            },
          });
        }

        if (sendEmail) {
          await prisma.reminderSent.create({
            data: {
              bookingId: booking.id,
              customerId: booking.customerId,
              reminderType: type,
              channel: 'email',
            },
          });
        }

        sent++;
        console.log(
          `[Reminders-${type}] Reminder sent for booking ${booking.id}`
        );
      } catch (error) {
        console.error(
          `[Reminders-${type}] Error processing booking ${booking.id}:`,
          error
        );
        failures++;
      }
    }
  } catch (error) {
    console.error(`[Reminders-${type}] Error fetching bookings:`, error);
    failures++;
  }

  return { sent, failures };
}

/**
 * Generate reminder SMS message
 */
function generateReminderSMS(
  type: ReminderType,
  bookingTime: Date,
  customerName: string,
  serviceName?: string,
  businessName?: string
): string {
  const date = bookingTime.toLocaleDateString();
  const time = bookingTime.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (type === '24h') {
    return reminderSMSTemplate_24h(
      customerName,
      date,
      time,
      serviceName,
      businessName
    );
  } else {
    // 2h reminder
    return reminderSMSTemplate_2h(
      customerName,
      time,
      serviceName,
      businessName
    );
  }
}

/**
 * Generate reminder email message
 */
function generateReminderEmail(
  type: ReminderType,
  customerName: string,
  bookingTime: Date,
  serviceName?: string,
  businessName?: string
): { subject: string; body: string } {
  const date = bookingTime.toLocaleDateString();
  const time = bookingTime.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (type === '24h') {
    return {
      subject: `Reminder: Your appointment is tomorrow at ${time}`,
      body: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #667eea; color: white; padding: 20px; border-radius: 5px; }
    .content { padding: 20px 0; }
    .detail { margin: 10px 0; }
    .footer { color: #666; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Appointment Reminder</h2>
    </div>
    <div class="content">
      <p>Hi ${customerName},</p>
      <p>Just a friendly reminder that your appointment is coming up tomorrow!</p>
      <div class="detail"><strong>Date:</strong> ${date}</div>
      <div class="detail"><strong>Time:</strong> ${time}</div>
      ${serviceName ? `<div class="detail"><strong>Service:</strong> ${serviceName}</div>` : ''}
      ${businessName ? `<div class="detail"><strong>Business:</strong> ${businessName}</div>` : ''}
      <p>Please make sure to arrive 5 minutes early. If you need to reschedule or cancel, please let us know as soon as possible.</p>
      <p>See you tomorrow!</p>
    </div>
    <div class="footer">
      <p>This is an automated reminder. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
      `,
    };
  } else {
    // 2h reminder
    return {
      subject: `Reminder: Your appointment is in 2 hours!`,
      body: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #667eea; color: white; padding: 20px; border-radius: 5px; }
    .content { padding: 20px 0; }
    .detail { margin: 10px 0; }
    .footer { color: #666; font-size: 12px; margin-top: 30px; }
    .alert { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Appointment Soon!</h2>
    </div>
    <div class="content">
      <p>Hi ${customerName},</p>
      <div class="alert">
        <strong>Your appointment is in 2 hours!</strong>
      </div>
      <div class="detail"><strong>Time:</strong> ${time}</div>
      ${serviceName ? `<div class="detail"><strong>Service:</strong> ${serviceName}</div>` : ''}
      ${businessName ? `<div class="detail"><strong>Business:</strong> ${businessName}</div>` : ''}
      <p>Please make sure you're ready. If you can't make it, please cancel immediately to help us serve other customers.</p>
      <p>Looking forward to seeing you!</p>
    </div>
    <div class="footer">
      <p>This is an automated reminder. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
      `,
    };
  }
}

/**
 * Setup reminder cron job (call this at application startup)
 * Runs every hour at the top of the hour
 */
export function setupReminderCron(): NodeJS.Timer | null {
  console.log('[Reminders] Setting up hourly reminder cron job');

  // Run immediately on startup
  sendReminders().catch((error) =>
    console.error('[Reminders] Initial cron execution failed:', error)
  );

  // Schedule to run every hour at :00 minutes
  const scheduleNext = () => {
    const now = new Date();
    const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
    nextHour.setMinutes(0);
    nextHour.setSeconds(0);
    nextHour.setMilliseconds(0);

    const delay = nextHour.getTime() - now.getTime();

    console.log(
      `[Reminders] Next cron run scheduled in ${Math.round(delay / 1000)} seconds (${nextHour.toISOString()})`
    );

    return setTimeout(() => {
      sendReminders()
        .catch((error) =>
          console.error('[Reminders] Cron execution failed:', error)
        )
        .finally(() => {
          scheduleNext(); // Schedule next run
        });
    }, delay);
  };

  return scheduleNext();
}

/**
 * Stub functions for template helpers (placeholder)
 */
function reminderEmailTemplate_24h(
  customerName: string,
  bookingTime: Date,
  serviceName?: string
): string {
  return `Email reminder for ${customerName} - 24h before ${bookingTime}`;
}

function reminderEmailTemplate_2h(
  customerName: string,
  bookingTime: Date,
  serviceName?: string
): string {
  return `Email reminder for ${customerName} - 2h before ${bookingTime}`;
}
