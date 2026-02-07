/**
 * Mock Twilio SMS Client
 * Logs SMS to file and console instead of sending
 * Supports failure simulation and network delay for realistic testing
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { mockOrchestrator } from '@/lib/mock-orchestrator';

export interface SMSLogEntry {
  id: string;
  to: string;
  message: string;
  timestamp: string;
  status: 'sent' | 'queued' | 'failed';
  error?: string;
}

export interface SendSMSResult {
  id: string;
  status: 'sent' | 'queued' | 'failed';
  timestamp: string;
  to: string;
  message: string;
  error?: string;
}

// Configuration from environment
const SMS_FAILURE_RATE = parseFloat(process.env.MOCK_SMS_FAILURE_RATE || '0');
const SMS_DELAY_MS = parseInt(process.env.MOCK_SMS_DELAY_MS || '0');

// Path to SMS log file
const LOG_FILE_PATH = path.join(process.cwd(), 'data', 'sms-log.json');

/**
 * Ensure the data directory and log file exist
 */
function ensureLogFile(): void {
  const dir = path.dirname(LOG_FILE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(LOG_FILE_PATH)) {
    fs.writeFileSync(LOG_FILE_PATH, '[]', 'utf8');
  }
}

/**
 * Read existing SMS log entries
 */
function readLogEntries(): SMSLogEntry[] {
  try {
    const content = fs.readFileSync(LOG_FILE_PATH, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.warn('[SMS Mock] Could not read log file, starting fresh:', error);
    return [];
  }
}

/**
 * Append a new SMS log entry
 */
function appendLogEntry(entry: SMSLogEntry): void {
  const entries = readLogEntries();
  entries.push(entry);
  fs.writeFileSync(LOG_FILE_PATH, JSON.stringify(entries, null, 2), 'utf8');
}

/**
 * Generate a mock SMS ID
 */
function generateSMSId(): string {
  const timestamp = Date.now();
  const hash = crypto.randomBytes(8).toString('hex');
  return `sms_${timestamp}_${hash}`;
}

/**
 * Validate phone number format (basic validation)
 */
function validatePhoneNumber(phone: string): boolean {
  // Basic validation: should start with + and have 10-15 digits
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  return /^\+?\d{10,15}$/.test(cleaned);
}

/**
 * Mock SMS sending function
 */
export async function sendSMSMock(
  phone: string,
  message: string
): Promise<SendSMSResult> {
  return mockOrchestrator.withOrchestratedMock('sms', async () => {
    // Ensure log file exists
    ensureLogFile();

  // Simulate network delay
  if (SMS_DELAY_MS > 0) {
    await new Promise((resolve) => setTimeout(resolve, SMS_DELAY_MS));
  }

  // Validate phone number
  if (!validatePhoneNumber(phone)) {
    console.warn(`[SMS Mock] Invalid phone number format: ${phone}`);
    const failedResult: SendSMSResult = {
      id: generateSMSId(),
      status: 'failed',
      timestamp: new Date().toISOString(),
      to: phone,
      message: message,
      error: 'Invalid phone number format',
    };

    const logEntry: SMSLogEntry = {
      id: failedResult.id,
      to: phone,
      message,
      timestamp: failedResult.timestamp,
      status: 'failed',
      error: failedResult.error,
    };

    appendLogEntry(logEntry);
    return failedResult;
  }

  // Simulate random failure
  if (Math.random() < SMS_FAILURE_RATE) {
    const failures = [
      'Network timeout',
      'Invalid phone number',
      'SMS service unavailable',
      'Rate limit exceeded',
      'Carrier rejected message',
    ];
    const error = failures[Math.floor(Math.random() * failures.length)];

    const id = `sms_fail_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const timestamp = new Date().toISOString();

    const logEntry: SMSLogEntry = {
      id,
      to: phone,
      message,
      timestamp,
      status: 'failed',
      error,
    };

    appendLogEntry(logEntry);

    console.log(`[SMS] To: ${phone} | Status: FAILED | Error: ${error} | ID: ${id}`);

    return {
      id,
      status: 'failed',
      timestamp,
      to: phone,
      message,
      error,
    };
  }

  // Success path
  const id = generateSMSId();
  const timestamp = new Date().toISOString();

  const logEntry: SMSLogEntry = {
    id,
    to: phone,
    message,
    timestamp,
    status: 'sent',
  };

  // Log to console
  console.log(`[SMS] To: ${phone} | Message: ${message.substring(0, 60)}${message.length > 60 ? '...' : ''} | Status: sent | ID: ${id}`);

  // Append to log file
  try {
    appendLogEntry(logEntry);
  } catch (error) {
    console.error('[SMS Mock] Failed to write to log file:', error);
  }

  // Simulate additional random network delay
  await new Promise((resolve) => setTimeout(resolve, 50 + Math.random() * 100));

  return {
    id,
    status: 'sent',
    timestamp,
    to: phone,
    message,
  };
  });
}

/**
 * Get SMS log history (for testing/debugging)
 */
export function getSMSLog(): SMSLogEntry[] {
  ensureLogFile();
  return readLogEntries();
}

/**
 * Clear SMS log (for testing)
 */
export function clearSMSLog(): void {
  ensureLogFile();
  fs.writeFileSync(LOG_FILE_PATH, '[]', 'utf8');
  console.log('[SMS Mock] Log cleared');
}

/**
 * Get SMS statistics
 */
export function getSMSStats(): {
  total: number;
  sent: number;
  failed: number;
  lastSent?: string;
} {
  const entries = readLogEntries();
  const sent = entries.filter((e) => e.status === 'sent').length;
  const failed = entries.filter((e) => e.status === 'failed').length;
  const lastEntry = entries[entries.length - 1];

  return {
    total: entries.length,
    sent,
    failed,
    lastSent: lastEntry?.timestamp,
  };
}
