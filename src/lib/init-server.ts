/**
 * Server-side initialization for SME Booking App
 * This module handles all startup tasks like:
 * - Initializing the notification system
 * - Setting up database connections
 * - Loading configuration
 *
 * Should be called once at application startup
 */

import { initializeNotificationSystem } from '@/lib/notifications/init';

let initialized = false;

/**
 * Initialize the server on first request
 * This is a safe way to initialize on serverless platforms
 */
export async function initializeServer(): Promise<void> {
  if (initialized) {
    return;
  }

  try {
    console.log('[Server Init] Starting server initialization...');

    // Initialize notification system
    console.log('[Server Init] Initializing notification system...');
    const notificationStatus = await initializeNotificationSystem();
    console.log('[Server Init] Notification system initialized:', notificationStatus);

    console.log('[Server Init] ✅ Server initialization complete');
    initialized = true;
  } catch (error) {
    console.error('[Server Init] Error during initialization:', error);
    // Don't rethrow - allow app to start even if initialization fails
    // Notifications can be retried
  }
}

/**
 * Check if server is initialized
 */
export function isServerInitialized(): boolean {
  return initialized;
}
