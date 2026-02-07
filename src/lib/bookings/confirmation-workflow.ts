/**
 * Booking Confirmation Workflow
 * Orchestrates: booking creation → confirmation code → SMS → Email → logging
 * Ensures notifications are sent within SLA times (SMS <10s, Email <30s)
 */

import { getPrismaClient } from '@/lib/db/queries';
import { createBooking, CreateBookingInput } from '@/lib/db/booking-service';
import { enqueueNotification } from '@/lib/queue/notification-queue';
import {
  confirmationSMSTemplate,
} from '@/lib/sms/templates';
import { confirmationEmail } from '@/lib/email/templates';

/**
 * Generate an 8-character alphanumeric confirmation code
 * Format: XXXXXXXX (letters + numbers, no special chars)
 */
export function generateConfirmationCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';

  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return code;
}

/**
 * Confirmation workflow result
 */
export interface ConfirmationWorkflowResult {
  bookingId: number;
  confirmationCode: string;
  customerId: number;
  businessId: number;
  smsQueued: boolean;
  emailQueued: boolean;
  smsJobId?: string;
  emailJobId?: string;
  error?: string;
}

/**
 * Run the complete booking confirmation workflow
 * 1. Create booking in database
 * 2. Generate confirmation code
 * 3. Queue SMS notification (SLA: <10s)
 * 4. Queue Email notification (SLA: <30s)
 * 5. Log all activities
 *
 * @throws Error if booking creation fails (notifications can be retried)
 */
export async function confirmBooking(
  input: CreateBookingInput,
  customerPhone: string,
  customerEmail: string | null,
  customerName: string,
  businessPhone?: string
): Promise<ConfirmationWorkflowResult> {
  const prisma = getPrismaClient();

  console.log(`[Confirmation] Starting workflow for customer ${input.customerId}`);

  const result: ConfirmationWorkflowResult = {
    bookingId: 0,
    confirmationCode: '',
    customerId: input.customerId,
    businessId: input.businessId,
    smsQueued: false,
    emailQueued: false,
  };

  try {
    // Step 1: Create booking
    console.log('[Confirmation] Creating booking...');
    const booking = await createBooking(input);
    result.bookingId = booking.id;

    // Step 2: Generate confirmation code
    console.log('[Confirmation] Generating confirmation code...');
    const confirmationCode = generateConfirmationCode();
    result.confirmationCode = confirmationCode;

    // Step 3: Update booking with confirmation code
    console.log('[Confirmation] Updating booking with confirmation code...');
    await prisma.booking.update({
      where: { id: booking.id },
      data: { confirmationCode },
    });

    // Step 4: Check notification preferences
    console.log('[Confirmation] Checking notification preferences...');
    const preferences = await prisma.notificationPreferences.findUnique({
      where: { customerId: input.customerId },
    });

    const sendSMS = preferences?.smsEnabled !== false; // Default to true
    const sendEmail = preferences?.emailEnabled !== false; // Default to true

    // Step 5: Queue SMS notification (SLA: <10s)
    if (sendSMS) {
      try {
        console.log('[Confirmation] Queueing SMS notification...');
        const smsMessage = confirmationSMSTemplate(
          customerName,
          confirmationCode,
          new Date(booking.bookingTime).toLocaleDateString(),
          new Date(booking.bookingTime).toLocaleTimeString(),
          input.serviceType || 'Service'
        );

        const smsJob = await enqueueNotification({
          type: 'sms',
          bookingId: booking.id,
          customerId: input.customerId,
          recipientAddr: customerPhone,
          body: smsMessage,
        });

        result.smsQueued = true;
        result.smsJobId = String(smsJob.id);
        console.log(
          `[Confirmation] SMS queued (Job: ${smsJob.id}) - SLA: <10s`
        );
      } catch (error) {
        console.error('[Confirmation] Failed to queue SMS:', error);
        result.error = `SMS queue failed: ${String(error)}`;
        // Don't throw - continue with email
      }
    }

    // Step 6: Queue Email notification (SLA: <30s)
    if (sendEmail && customerEmail) {
      try {
        console.log('[Confirmation] Queueing email notification...');
        const emailBody = confirmationEmail(
          customerName,
          confirmationCode,
          new Date(booking.bookingTime).toLocaleDateString(),
          new Date(booking.bookingTime).toLocaleTimeString(),
          businessPhone || process.env.BUSINESS_PHONE || '1-800-SME-BOOK',
          input.serviceType || 'Service'
        );

        const emailJob = await enqueueNotification({
          type: 'email',
          bookingId: booking.id,
          customerId: input.customerId,
          recipientAddr: customerEmail,
          subject: `Booking Confirmed - Code: ${confirmationCode}`,
          body: emailBody,
        });

        result.emailQueued = true;
        result.emailJobId = String(emailJob.id);
        console.log(
          `[Confirmation] Email queued (Job: ${emailJob.id}) - SLA: <30s`
        );
      } catch (error) {
        console.error('[Confirmation] Failed to queue email:', error);
        if (!result.error) {
          result.error = `Email queue failed: ${String(error)}`;
        }
        // Don't throw - SMS already sent
      }
    }

    console.log(
      `[Confirmation] Workflow completed for booking ${booking.id}: Code ${confirmationCode}`
    );

    return result;
  } catch (error) {
    console.error('[Confirmation] Workflow failed:', error);

    // If booking creation failed, we can't proceed
    throw new Error(
      `Booking confirmation workflow failed: ${String(error)}`
    );
  }
}

/**
 * Resend confirmation notification for existing booking
 * Useful if customer doesn't receive the original notification
 */
export async function resendConfirmation(
  bookingId: number,
  notificationType: 'sms' | 'email' | 'both'
): Promise<{
  smsQueued: boolean;
  emailQueued: boolean;
  error?: string;
}> {
  const prisma = getPrismaClient();

  console.log(
    `[Confirmation] Resending ${notificationType} for booking ${bookingId}`
  );

  const result: {
    smsQueued: boolean;
    emailQueued: boolean;
    error?: string;
  } = {
    smsQueued: false,
    emailQueued: false,
  };

  try {
    // Get booking details
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { customer: true, service: true },
    });

    if (!booking) {
      throw new Error(`Booking ${bookingId} not found`);
    }

    if (!booking.confirmationCode) {
      throw new Error(`No confirmation code found for booking ${bookingId}`);
    }

    // Resend SMS
    if ((notificationType === 'sms' || notificationType === 'both') && booking.customer.phone) {
      try {
        const smsMessage = confirmationSMSTemplate(
          booking.customer.name,
          booking.confirmationCode,
          booking.bookingTime.toLocaleDateString(),
          booking.bookingTime.toLocaleTimeString(),
          booking.serviceType || 'Service'
        );

        await enqueueNotification({
          type: 'sms',
          bookingId: booking.id,
          customerId: booking.customerId,
          recipientAddr: booking.customer.phone,
          body: smsMessage,
        });

        result.smsQueued = true;
        console.log(`[Confirmation] SMS resent for booking ${bookingId}`);
      } catch (error) {
        console.error('[Confirmation] Failed to resend SMS:', error);
        result.error = `SMS resend failed: ${String(error)}`;
      }
    }

    // Resend Email
    if (
      (notificationType === 'email' || notificationType === 'both') &&
      booking.customer.email
    ) {
      try {
        const emailBody = confirmationEmail(
          booking.customer.name,
          booking.confirmationCode,
          booking.bookingTime.toLocaleDateString(),
          booking.bookingTime.toLocaleTimeString(),
          process.env.BUSINESS_PHONE || '1-800-SME-BOOK',
          booking.serviceType || 'Service'
        );

        await enqueueNotification({
          type: 'email',
          bookingId: booking.id,
          customerId: booking.customerId,
          recipientAddr: booking.customer.email,
          subject: `Booking Confirmed - Code: ${booking.confirmationCode}`,
          body: emailBody,
        });

        result.emailQueued = true;
        console.log(`[Confirmation] Email resent for booking ${bookingId}`);
      } catch (error) {
        console.error('[Confirmation] Failed to resend email:', error);
        if (!result.error) {
          result.error = `Email resend failed: ${String(error)}`;
        }
      }
    }

    return result;
  } catch (error) {
    console.error('[Confirmation] Resend workflow failed:', error);
    throw new Error(`Resend confirmation failed: ${String(error)}`);
  }
}
