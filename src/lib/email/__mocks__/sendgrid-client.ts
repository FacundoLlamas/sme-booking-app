/**
 * Mock SendGrid Email Client
 * Logs emails to file and console instead of sending
 * Supports failure simulation and proper HTML text extraction
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { mockOrchestrator } from '@/lib/mock-orchestrator';

export interface EmailLogEntry {
  id: string;
  to: string;
  subject: string;
  body_preview: string;
  timestamp: string;
  status: 'sent' | 'queued' | 'failed';
  hasHtml: boolean;
  hasText: boolean;
  error?: string;
}

export interface SendEmailResult {
  id: string;
  status: 'sent' | 'queued' | 'failed';
  timestamp: string;
  to: string;
  error?: string;
}

// Configuration from environment
const EMAIL_FAILURE_RATE = parseFloat(process.env.MOCK_EMAIL_FAILURE_RATE || '0');

// Path to email log file
const LOG_FILE_PATH = path.join(process.cwd(), 'data', 'email-log.json');

// Path to store email HTML previews
const PREVIEW_DIR = path.join(process.cwd(), 'data', 'email-previews');

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
  if (!fs.existsSync(PREVIEW_DIR)) {
    fs.mkdirSync(PREVIEW_DIR, { recursive: true });
  }
}

/**
 * Read existing email log entries
 */
function readLogEntries(): EmailLogEntry[] {
  try {
    const content = fs.readFileSync(LOG_FILE_PATH, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.warn('[Email Mock] Could not read log file, starting fresh:', error);
    return [];
  }
}

/**
 * Append a new email log entry
 */
function appendLogEntry(entry: EmailLogEntry): void {
  const entries = readLogEntries();
  entries.push(entry);
  fs.writeFileSync(LOG_FILE_PATH, JSON.stringify(entries, null, 2), 'utf8');
}

/**
 * Generate a mock email ID
 */
function generateEmailId(): string {
  const timestamp = Date.now();
  const hash = crypto.randomBytes(8).toString('hex');
  return `email_${timestamp}_${hash}`;
}

/**
 * Validate email address format (basic validation)
 */
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Extract text from HTML (removes script/style tags and HTML markup)
 */
function extractTextFromHtml(html: string): string {
  // Remove script and style tags with content
  let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  // Remove remaining HTML tags
  text = text.replace(/<[^>]+>/g, ' ');
  // Clean up whitespace
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Create a text preview (strip tags and limit length)
 */
function createTextPreview(text: string, maxLength: number = 100): string {
  const cleaned = text.trim();
  return cleaned.length > maxLength ? cleaned.substring(0, maxLength) + '...' : cleaned;
}

/**
 * Save HTML email preview to file
 */
function saveEmailPreview(id: string, html: string, to: string, subject: string): string {
  const filename = `${id}.html`;
  const filepath = path.join(PREVIEW_DIR, filename);

  // Add metadata header to HTML
  const htmlWithMeta = `
<!-- Email Preview -->
<!-- To: ${to} -->
<!-- Subject: ${subject} -->
<!-- ID: ${id} -->
<!-- Generated: ${new Date().toISOString()} -->

${html}
  `.trim();

  fs.writeFileSync(filepath, htmlWithMeta, 'utf8');
  return filepath;
}

/**
 * Mock email sending function
 */
export async function sendEmailMock(
  to: string,
  subject: string,
  htmlBody: string,
  textBody?: string
): Promise<SendEmailResult> {
  return mockOrchestrator.withOrchestratedMock('email', async () => {
    // Ensure log file exists
    ensureLogFile();

  // Validate email address
  if (!validateEmail(to)) {
    console.warn(`[Email Mock] Invalid email address: ${to}`);
    const failedResult: SendEmailResult = {
      id: generateEmailId(),
      status: 'failed',
      timestamp: new Date().toISOString(),
      to,
      error: 'Invalid email address format',
    };

    const logEntry: EmailLogEntry = {
      id: failedResult.id,
      to,
      subject,
      body_preview: '',
      timestamp: failedResult.timestamp,
      status: 'failed',
      hasHtml: !!htmlBody,
      hasText: !!textBody,
      error: failedResult.error,
    };

    appendLogEntry(logEntry);
    return failedResult;
  }

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 100 + Math.random() * 200));

  // Simulate random failure
  if (Math.random() < EMAIL_FAILURE_RATE) {
    const failures = [
      'SMTP connection timeout',
      'Recipient mailbox full',
      'Email service unavailable',
      'Rate limit exceeded',
      'Rejected by spam filter',
      'Invalid recipient domain',
    ];
    const error = failures[Math.floor(Math.random() * failures.length)];

    const id = generateEmailId();
    const timestamp = new Date().toISOString();

    const bodyPreview = textBody
      ? createTextPreview(textBody, 100)
      : createTextPreview(extractTextFromHtml(htmlBody), 100);

    const logEntry: EmailLogEntry = {
      id,
      to,
      subject,
      body_preview: bodyPreview,
      timestamp,
      status: 'failed',
      hasHtml: !!htmlBody,
      hasText: !!textBody,
      error,
    };

    appendLogEntry(logEntry);

    console.log(`[EMAIL] To: ${to} | Subject: ${subject} | Status: FAILED | Error: ${error}`);

    return {
      id,
      status: 'failed',
      timestamp,
      to,
      error,
    };
  }

  // Success path
  const id = generateEmailId();
  const timestamp = new Date().toISOString();

  // Create body preview with proper text extraction
  const bodyPreview = textBody
    ? createTextPreview(textBody, 100)
    : createTextPreview(extractTextFromHtml(htmlBody), 100);

  // Save HTML preview to file
  let previewPath: string | undefined;
  try {
    previewPath = saveEmailPreview(id, htmlBody, to, subject);
  } catch (error) {
    console.warn('[Email Mock] Could not save HTML preview:', error);
  }

  // Create log entry
  const logEntry: EmailLogEntry = {
    id,
    to,
    subject,
    body_preview: bodyPreview,
    timestamp,
    status: 'sent',
    hasHtml: !!htmlBody,
    hasText: !!textBody,
  };

  // Log to console
  console.log(
    `[EMAIL] To: ${to} | Subject: ${subject} | Preview: ${previewPath || 'not saved'} | Status: sent`
  );

  // Append to log file
  try {
    appendLogEntry(logEntry);
  } catch (error) {
    console.error('[Email Mock] Failed to write to log file:', error);
  }

  return {
    id,
    status: 'sent',
    timestamp,
    to,
  };
  });
}

/**
 * Get email log history (for testing/debugging)
 */
export function getEmailLog(): EmailLogEntry[] {
  ensureLogFile();
  return readLogEntries();
}

/**
 * Clear email log (for testing)
 */
export function clearEmailLog(): void {
  ensureLogFile();
  fs.writeFileSync(LOG_FILE_PATH, '[]', 'utf8');

  // Also clear preview files
  try {
    const files = fs.readdirSync(PREVIEW_DIR);
    for (const file of files) {
      if (file.endsWith('.html')) {
        fs.unlinkSync(path.join(PREVIEW_DIR, file));
      }
    }
  } catch (error) {
    console.warn('[Email Mock] Could not clear preview files:', error);
  }

  console.log('[Email Mock] Log and previews cleared');
}

/**
 * Get email statistics
 */
export function getEmailStats(): {
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

/**
 * Get path to email preview HTML file
 */
export function getEmailPreviewPath(emailId: string): string | null {
  const filepath = path.join(PREVIEW_DIR, `${emailId}.html`);
  return fs.existsSync(filepath) ? filepath : null;
}
