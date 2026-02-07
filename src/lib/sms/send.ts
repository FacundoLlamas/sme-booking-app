/**
 * SMS Sending Interface
 * Supports both real Twilio and mock SMS
 */

import { sendSMSMock, SendSMSResult } from './__mocks__/twilio-client';

export interface SendSMSParams {
  phone: string;
  message: string;
}

export interface SendSMSResponse {
  id: string;
  status: 'sent' | 'queued' | 'failed';
  message: string;
  timestamp: string;
}

/**
 * Check if we should use mock mode
 */
function shouldUseMock(): boolean {
  const mockMode = process.env.TWILIO_MOCK;
  return mockMode === 'true' || mockMode === '1' || !process.env.TWILIO_ACCOUNT_SID;
}

/**
 * Send an SMS message (real or mock)
 */
export async function sendSMS(
  phone: string,
  message: string
): Promise<SendSMSResponse> {
  const useMock = shouldUseMock();

  if (useMock) {
    return sendMockSMS(phone, message);
  } else {
    return sendRealSMS(phone, message);
  }
}

/**
 * Send a mock SMS message
 */
async function sendMockSMS(
  phone: string,
  message: string
): Promise<SendSMSResponse> {
  const result = await sendSMSMock(phone, message);
  return {
    id: result.id,
    status: result.status,
    message: message,
    timestamp: result.timestamp,
  };
}

/**
 * Send a real SMS using Twilio
 * This is a stub for future implementation
 */
async function sendRealSMS(
  phone: string,
  message: string
): Promise<SendSMSResponse> {
  try {
    // TODO: Implement real Twilio integration
    // const twilio = require('twilio');
    // const client = twilio(
    //   process.env.TWILIO_ACCOUNT_SID,
    //   process.env.TWILIO_AUTH_TOKEN
    // );
    //
    // const result = await client.messages.create({
    //   body: message,
    //   from: process.env.TWILIO_PHONE_NUMBER,
    //   to: phone,
    // });
    //
    // return {
    //   id: result.sid,
    //   status: result.status,
    //   message: message,
    //   timestamp: new Date().toISOString(),
    // };

    throw new Error(
      'Real Twilio SDK not yet implemented. Install twilio package and set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER environment variables.'
    );
  } catch (error) {
    console.error('[SMS] Error sending real SMS:', error);
    throw error;
  }
}

/**
 * Send multiple SMS messages (bulk send)
 */
export async function sendBulkSMS(
  recipients: Array<{ phone: string; message: string }>
): Promise<SendSMSResponse[]> {
  const results: SendSMSResponse[] = [];

  for (const recipient of recipients) {
    try {
      const result = await sendSMS(recipient.phone, recipient.message);
      results.push(result);
    } catch (error) {
      console.error(`[SMS] Failed to send to ${recipient.phone}:`, error);
      results.push({
        id: `failed_${Date.now()}`,
        status: 'failed',
        message: recipient.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  return results;
}

// Re-export templates for convenience
export * from './templates';

// Re-export mock utilities for testing
export { getSMSLog, clearSMSLog, getSMSStats } from './__mocks__/twilio-client';
