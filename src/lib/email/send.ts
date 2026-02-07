/**
 * Email Sending Interface
 * Supports both real SendGrid and mock email
 */

import { sendEmailMock, SendEmailResult } from './__mocks__/sendgrid-client';

export interface SendEmailParams {
  to: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
  from?: string;
}

export interface SendEmailResponse {
  id: string;
  status: 'sent' | 'queued' | 'failed';
  timestamp: string;
}

/**
 * Check if we should use mock mode
 */
function shouldUseMock(): boolean {
  const mockMode = process.env.SENDGRID_MOCK;
  return mockMode === 'true' || mockMode === '1' || !process.env.SENDGRID_API_KEY;
}

/**
 * Send an email message (real or mock)
 */
export async function sendEmail(
  to: string,
  subject: string,
  htmlBody: string,
  textBody?: string,
  from?: string
): Promise<SendEmailResponse> {
  const useMock = shouldUseMock();

  if (useMock) {
    return sendMockEmail(to, subject, htmlBody, textBody);
  } else {
    return sendRealEmail(to, subject, htmlBody, textBody, from);
  }
}

/**
 * Send a mock email message
 */
async function sendMockEmail(
  to: string,
  subject: string,
  htmlBody: string,
  textBody?: string
): Promise<SendEmailResponse> {
  const result = await sendEmailMock(to, subject, htmlBody, textBody);
  return {
    id: result.id,
    status: result.status,
    timestamp: result.timestamp,
  };
}

/**
 * Send a real email using SendGrid
 * This is a stub for future implementation
 */
async function sendRealEmail(
  to: string,
  subject: string,
  htmlBody: string,
  textBody?: string,
  from?: string
): Promise<SendEmailResponse> {
  try {
    // TODO: Implement real SendGrid integration
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    //
    // const msg = {
    //   to: to,
    //   from: from || process.env.SENDGRID_FROM_EMAIL,
    //   subject: subject,
    //   text: textBody,
    //   html: htmlBody,
    // };
    //
    // const result = await sgMail.send(msg);
    //
    // return {
    //   id: result[0].headers['x-message-id'] || `sg_${Date.now()}`,
    //   status: 'sent',
    //   timestamp: new Date().toISOString(),
    // };

    throw new Error(
      'Real SendGrid SDK not yet implemented. Install @sendgrid/mail package and set SENDGRID_API_KEY and SENDGRID_FROM_EMAIL environment variables.'
    );
  } catch (error) {
    console.error('[Email] Error sending real email:', error);
    throw error;
  }
}

/**
 * Send multiple emails (bulk send)
 */
export async function sendBulkEmail(
  recipients: Array<{
    to: string;
    subject: string;
    htmlBody: string;
    textBody?: string;
  }>
): Promise<SendEmailResponse[]> {
  const results: SendEmailResponse[] = [];

  for (const recipient of recipients) {
    try {
      const result = await sendEmail(
        recipient.to,
        recipient.subject,
        recipient.htmlBody,
        recipient.textBody
      );
      results.push(result);
    } catch (error) {
      console.error(`[Email] Failed to send to ${recipient.to}:`, error);
      results.push({
        id: `failed_${Date.now()}`,
        status: 'failed',
        timestamp: new Date().toISOString(),
      });
    }
  }

  return results;
}

// Re-export templates for convenience
export * from './templates';

// Re-export mock utilities for testing
export {
  getEmailLog,
  clearEmailLog,
  getEmailStats,
  getEmailPreviewPath,
} from './__mocks__/sendgrid-client';
