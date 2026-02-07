/**
 * Google Calendar Token Manager
 * Handles OAuth token lifecycle: generation, storage, refresh, validation
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';

const prisma = new PrismaClient();

export interface TokenInfo {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  scopes: string[];
}

/**
 * Generate a mock OAuth token for development (mock mode)
 * In real mode, this would be replaced with actual OAuth flow
 */
export function generateMockToken(scopes: string[] = []): TokenInfo {
  return {
    accessToken: `mock_access_token_${Date.now()}`,
    refreshToken: `mock_refresh_token_${Date.now()}`,
    expiresAt: new Date(Date.now() + 3600 * 1000), // 1 hour from now
    scopes,
  };
}

/**
 * Store or update calendar credentials for a business
 */
export async function storeCalendarCredentials(
  businessId: number,
  tokenInfo: TokenInfo
): Promise<void> {
  try {
    await prisma.calendarCredentials.upsert({
      where: { businessId },
      update: {
        accessToken: tokenInfo.accessToken,
        refreshToken: tokenInfo.refreshToken,
        expiresAt: tokenInfo.expiresAt,
        scopes: JSON.stringify(tokenInfo.scopes),
        updatedAt: new Date(),
      },
      create: {
        businessId,
        accessToken: tokenInfo.accessToken,
        refreshToken: tokenInfo.refreshToken,
        expiresAt: tokenInfo.expiresAt,
        scopes: JSON.stringify(tokenInfo.scopes),
      },
    });

    logger.info(`[TokenManager] Credentials stored for business ${businessId}`);
  } catch (error) {
    logger.error('[TokenManager] Failed to store credentials:', error);
    throw error;
  }
}

/**
 * Retrieve calendar credentials for a business
 */
export async function getCalendarCredentials(
  businessId: number
): Promise<TokenInfo | null> {
  try {
    const creds = await prisma.calendarCredentials.findUnique({
      where: { businessId },
    });

    if (!creds) {
      return null;
    }

    return {
      accessToken: creds.accessToken || '',
      refreshToken: creds.refreshToken || undefined,
      expiresAt: creds.expiresAt || undefined,
      scopes: creds.scopes ? JSON.parse(creds.scopes) : [],
    };
  } catch (error) {
    logger.error('[TokenManager] Failed to retrieve credentials:', error);
    throw error;
  }
}

/**
 * Check if token is valid and not expired
 */
export async function isTokenValid(businessId: number): Promise<boolean> {
  try {
    const creds = await getCalendarCredentials(businessId);

    if (!creds || !creds.accessToken) {
      return false;
    }

    // Token is valid if:
    // 1. No expiration time set (perpetual token, or mock)
    // 2. Expiration time is in the future
    if (!creds.expiresAt) {
      return true;
    }

    const now = new Date();
    const bufferMs = 5 * 60 * 1000; // 5 minute buffer
    return creds.expiresAt.getTime() > now.getTime() + bufferMs;
  } catch (error) {
    logger.error('[TokenManager] Failed to validate token:', error);
    return false;
  }
}

/**
 * Refresh token if expired
 * In real mode, this would call Google's refresh token endpoint
 */
export async function refreshTokenIfNeeded(businessId: number): Promise<TokenInfo | null> {
  try {
    const isValid = await isTokenValid(businessId);
    if (isValid) {
      const creds = await getCalendarCredentials(businessId);
      return creds;
    }

    // Token is expired or missing - attempt refresh
    const creds = await getCalendarCredentials(businessId);
    if (!creds || !creds.refreshToken) {
      logger.warn(`[TokenManager] Cannot refresh: no refresh token for business ${businessId}`);
      return null;
    }

    // In mock mode, just generate a new token
    const useMock = process.env.GOOGLE_CALENDAR_MOCK === 'true';
    if (useMock) {
      const newToken = generateMockToken(creds.scopes);
      await storeCalendarCredentials(businessId, newToken);
      logger.info(`[TokenManager] Token refreshed (mock mode) for business ${businessId}`);
      return newToken;
    }

    // In real mode, this would call the Google API
    // const response = await fetch('https://oauth2.googleapis.com/token', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    //   body: new URLSearchParams({
    //     client_id: process.env.GOOGLE_CLIENT_ID!,
    //     client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    //     refresh_token: creds.refreshToken,
    //     grant_type: 'refresh_token',
    //   }).toString(),
    // });
    // const data = await response.json();
    // ...store new token...

    logger.warn(`[TokenManager] Real token refresh not implemented. Requires GOOGLE_CLIENT_ID`);
    return null;
  } catch (error) {
    logger.error('[TokenManager] Failed to refresh token:', error);
    throw error;
  }
}

/**
 * Get valid access token, refreshing if needed
 */
export async function getValidAccessToken(businessId: number): Promise<string | null> {
  try {
    const isValid = await isTokenValid(businessId);

    if (isValid) {
      const creds = await getCalendarCredentials(businessId);
      return creds?.accessToken || null;
    }

    // Refresh token if expired
    const refreshedToken = await refreshTokenIfNeeded(businessId);
    return refreshedToken?.accessToken || null;
  } catch (error) {
    logger.error('[TokenManager] Failed to get valid access token:', error);
    return null;
  }
}

/**
 * Delete calendar credentials (when user revokes access)
 */
export async function deleteCalendarCredentials(businessId: number): Promise<void> {
  try {
    await prisma.calendarCredentials.delete({
      where: { businessId },
    });
    logger.info(`[TokenManager] Credentials deleted for business ${businessId}`);
  } catch (error) {
    logger.error('[TokenManager] Failed to delete credentials:', error);
    throw error;
  }
}

/**
 * Get token expiration info (for diagnostics)
 */
export async function getTokenExpirationInfo(businessId: number): Promise<{
  expiresAt: Date | null;
  expiresInMs: number | null;
  isExpired: boolean;
  needsRefresh: boolean;
}> {
  try {
    const creds = await getCalendarCredentials(businessId);

    if (!creds || !creds.expiresAt) {
      return {
        expiresAt: null,
        expiresInMs: null,
        isExpired: false,
        needsRefresh: false,
      };
    }

    const now = new Date();
    const bufferMs = 5 * 60 * 1000; // 5 minute buffer
    const expiresInMs = creds.expiresAt.getTime() - now.getTime();
    const isExpired = expiresInMs <= 0;
    const needsRefresh = expiresInMs <= bufferMs;

    return {
      expiresAt: creds.expiresAt,
      expiresInMs,
      isExpired,
      needsRefresh,
    };
  } catch (error) {
    logger.error('[TokenManager] Failed to get token expiration info:', error);
    throw error;
  }
}

/**
 * Initialize calendar credentials for a new business (OAuth flow)
 * In real mode, this would complete an OAuth flow
 */
export async function initializeCalendarCredentials(
  businessId: number,
  scopes: string[] = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
  ]
): Promise<TokenInfo> {
  try {
    // In mock mode, generate a mock token
    const useMock = process.env.GOOGLE_CALENDAR_MOCK === 'true';
    if (useMock) {
      const mockToken = generateMockToken(scopes);
      await storeCalendarCredentials(businessId, mockToken);
      logger.info(`[TokenManager] Initialized credentials (mock mode) for business ${businessId}`);
      return mockToken;
    }

    // In real mode, this would start an OAuth flow
    // For now, just log a warning
    logger.warn(`[TokenManager] Real OAuth initialization not implemented. Requires GOOGLE_CLIENT_ID`);

    // Return a placeholder token in real mode for now
    const token = generateMockToken(scopes);
    await storeCalendarCredentials(businessId, token);
    return token;
  } catch (error) {
    logger.error('[TokenManager] Failed to initialize credentials:', error);
    throw error;
  }
}
