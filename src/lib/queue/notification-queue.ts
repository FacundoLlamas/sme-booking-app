/**
 * Notification Queue - Bull/BullMQ
 * Handles SMS and email notifications asynchronously with retry logic
 * Supports in-memory queue if Redis is unavailable
 */

import Queue from 'bull';
import Redis from 'redis';
import { getPrismaClient } from '@/lib/db/queries';
import { sendSMS } from '@/lib/sms/send';
import { sendEmail } from '@/lib/email/send';

/**
 * Notification job data structure
 */
export interface NotificationJob {
  type: 'sms' | 'email';
  bookingId: number;
  customerId: number;
  recipientAddr: string;
  subject?: string;
  body: string;
  notificationLogId?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Queue configuration
 */
const QUEUE_NAME = 'notifications';
const MAX_ATTEMPTS = 3;
const BACKOFF_DELAY = 2000; // 2 seconds initial
const BACKOFF_MULTIPLIER = 2; // exponential backoff
const TIMEOUT = 30000; // 30 seconds per job

// Redis client configuration
let redisClient: Redis.RedisClient | null = null;
let notificationQueue: Queue.Queue<NotificationJob> | null = null;

/**
 * Initialize Redis connection (with fallback to in-memory)
 */
async function initializeRedis(): Promise<Redis.RedisClient | null> {
  if (redisClient) {
    return redisClient;
  }

  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    const client = new Redis(redisUrl);

    // Test connection
    await new Promise((resolve, reject) => {
      client.on('connect', () => {
        console.log('[Queue] Connected to Redis');
        resolve(null);
      });
      client.on('error', (err) => {
        console.warn('[Queue] Redis connection failed, using in-memory queue:', err.message);
        reject(err);
      });
    });

    redisClient = client;
    return client;
  } catch (error) {
    console.warn('[Queue] Failed to connect to Redis, using in-memory queue');
    return null;
  }
}

/**
 * Get or create the notification queue
 */
export async function getNotificationQueue(): Promise<
  Queue.Queue<NotificationJob>
> {
  if (notificationQueue) {
    return notificationQueue;
  }

  try {
    // Try to connect to Redis first
    const redis = await initializeRedis();

    if (redis) {
      // Use Redis-backed Bull queue
      notificationQueue = new Queue(QUEUE_NAME, {
        redis: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
        },
        defaultJobOptions: {
          attempts: MAX_ATTEMPTS,
          backoff: {
            type: 'exponential',
            delay: BACKOFF_DELAY,
          },
          timeout: TIMEOUT,
          removeOnComplete: true,
          removeOnFail: false,
        },
      });
    } else {
      // Use in-memory queue (for development/testing)
      notificationQueue = new Queue(QUEUE_NAME, {
        settings: {
          maxStalledCount: 2,
          lockDuration: TIMEOUT,
          lockRenewTime: 15000,
          maxRetriesPerSecond: 5,
          retryProcessDelay: 5000,
        },
        defaultJobOptions: {
          attempts: MAX_ATTEMPTS,
          backoff: {
            type: 'exponential',
            delay: BACKOFF_DELAY,
          },
          timeout: TIMEOUT,
          removeOnComplete: true,
          removeOnFail: false,
        },
      });

      console.log('[Queue] Using in-memory queue (Redis unavailable)');
    }

    // Setup queue event handlers
    setupQueueHandlers(notificationQueue);

    return notificationQueue;
  } catch (error) {
    console.error('[Queue] Failed to initialize queue:', error);
    throw new Error(`Failed to initialize notification queue: ${String(error)}`);
  }
}

/**
 * Setup queue event handlers for monitoring
 */
function setupQueueHandlers(queue: Queue.Queue<NotificationJob>): void {
  queue.on('completed', (job) => {
    console.log(`[Queue] Job ${job.id} completed: ${job.data.type} to ${job.data.recipientAddr}`);
  });

  queue.on('failed', (job, err) => {
    console.error(
      `[Queue] Job ${job.id} failed (attempt ${job.attemptsMade}/${job.opts.attempts}):`,
      err.message
    );
  });

  queue.on('error', (error) => {
    console.error('[Queue] Queue error:', error);
  });

  queue.on('waiting', (jobId) => {
    console.log(`[Queue] Job ${jobId} is waiting`);
  });
}

/**
 * Enqueue a notification (SMS or Email)
 */
export async function enqueueNotification(
  job: NotificationJob
): Promise<Queue.Job<NotificationJob>> {
  const queue = await getNotificationQueue();

  try {
    // Create notification log entry first
    const prisma = getPrismaClient();

    let notificationLogId = job.notificationLogId;

    if (!notificationLogId) {
      const logEntry = await prisma.notificationLog.create({
        data: {
          bookingId: job.bookingId,
          customerId: job.customerId,
          type: job.type,
          recipientAddr: job.recipientAddr,
          subject: job.subject,
          body: job.body,
          status: 'queued',
        },
      });
      notificationLogId = logEntry.id;
    }

    // Add job to queue with unique job ID for idempotency
    const jobId = `${job.type}-${job.customerId}-${job.bookingId}-${Date.now()}`;
    const queuedJob = await queue.add(
      {
        ...job,
        notificationLogId,
      },
      {
        jobId,
        priority: job.type === 'sms' ? 10 : 5, // SMS higher priority
      }
    );

    console.log(
      `[Queue] Enqueued ${job.type} notification (Job ${queuedJob.id}): ${job.recipientAddr}`
    );

    return queuedJob;
  } catch (error) {
    console.error('[Queue] Failed to enqueue notification:', error);
    throw new Error(
      `Failed to enqueue ${job.type} notification: ${String(error)}`
    );
  }
}

/**
 * Process notification jobs from the queue
 * Call this once at application startup
 */
export async function processNotificationQueue(): Promise<void> {
  const queue = await getNotificationQueue();

  queue.process(MAX_ATTEMPTS, async (job) => {
    const prisma = getPrismaClient();
    const { type, recipientAddr, subject, body, notificationLogId } = job.data;

    console.log(`[Queue] Processing job ${job.id}: ${type} to ${recipientAddr}`);

    try {
      let result;

      if (type === 'sms') {
        // Send SMS
        result = await sendSMS(recipientAddr, body);
      } else if (type === 'email') {
        // Send Email
        result = await sendEmail(
          recipientAddr,
          subject || 'Notification',
          body,
          body,
          process.env.EMAIL_FROM || 'noreply@smebooking.com'
        );
      } else {
        throw new Error(`Unknown notification type: ${type}`);
      }

      // Update notification log
      if (notificationLogId) {
        await prisma.notificationLog.update({
          where: { id: notificationLogId },
          data: {
            status: 'sent',
            sentAt: new Date(),
            externalId: result.id,
          },
        });
      }

      console.log(`[Queue] Job ${job.id} completed successfully`);
      return result;
    } catch (error) {
      console.error(`[Queue] Job ${job.id} failed:`, error);

      // Update notification log with error
      if (notificationLogId) {
        await prisma.notificationLog.update({
          where: { id: notificationLogId },
          data: {
            status: job.attemptsMade >= MAX_ATTEMPTS ? 'failed' : 'queued',
            errorMessage: String(error),
            retryCount: job.attemptsMade,
            lastRetryAt: new Date(),
          },
        });
      }

      // Rethrow for Bull to handle retry
      throw error;
    }
  });

  console.log('[Queue] Notification queue processor started');
}

/**
 * Get queue statistics
 */
export async function getQueueStats(): Promise<{
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
}> {
  const queue = await getNotificationQueue();

  const counts = await queue.counts();

  return {
    waiting: counts.waiting,
    active: counts.active,
    completed: counts.completed,
    failed: counts.failed,
    delayed: counts.delayed,
    paused: counts.paused,
  };
}

/**
 * Clear all jobs from queue (for testing)
 */
export async function clearQueue(): Promise<void> {
  const queue = await getNotificationQueue();
  await queue.clean(0, 'completed');
  await queue.clean(0, 'failed');
  console.log('[Queue] Queue cleared');
}

/**
 * Gracefully shutdown the queue
 */
export async function shutdownQueue(): Promise<void> {
  if (notificationQueue) {
    await notificationQueue.close();
    console.log('[Queue] Notification queue closed');
  }

  if (redisClient) {
    redisClient.quit();
    console.log('[Queue] Redis client closed');
  }
}
