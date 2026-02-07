/**
 * Conversation Service
 * Manages conversation history with automatic cleanup and message limits
 * 
 * Features:
 * - Max 500 messages per conversation (rolling window)
 * - Auto-archival after 100 messages
 * - Delete messages older than 90 days
 * - Efficient retrieval with pagination
 */

import { getPrismaClient } from './queries';

const MAX_MESSAGES_PER_CONVERSATION = 500;
const ARCHIVE_THRESHOLD = 100;
const MESSAGE_RETENTION_DAYS = 90;

export interface ConversationMessage {
  id: number;
  conversationId: number;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
}

/**
 * Get conversation with message limit
 * Returns at most 500 messages (most recent first)
 */
export async function getConversationWithMessages(
  conversationId: number,
  limit: number = 50,
  offset: number = 0
) {
  const prisma = getPrismaClient();

  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
        },
      },
    });

    return conversation;
  } catch (error) {
    console.error('Error retrieving conversation:', error);
    throw new Error(`Failed to retrieve conversation: ${String(error)}`);
  }
}

/**
 * Get all recent messages for a conversation
 * Returns newest messages only (up to MAX_MESSAGES_PER_CONVERSATION)
 */
export async function getRecentConversationMessages(conversationId: number) {
  const prisma = getPrismaClient();

  try {
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: MAX_MESSAGES_PER_CONVERSATION,
    });

    // Return in chronological order for history
    return messages.reverse();
  } catch (error) {
    console.error('Error retrieving conversation messages:', error);
    throw new Error(`Failed to retrieve messages: ${String(error)}`);
  }
}

/**
 * Add a message to conversation
 * Automatically triggers cleanup if message count exceeds ARCHIVE_THRESHOLD
 */
export async function addConversationMessage(
  conversationId: number,
  role: 'user' | 'assistant',
  content: string,
  classification?: Record<string, any>
) {
  const prisma = getPrismaClient();

  try {
    // Add message
    const message = await prisma.message.create({
      data: {
        conversationId,
        role,
        content,
        classification: classification ? JSON.stringify(classification) : null,
      },
    });

    // Check if we need to archive/cleanup
    const messageCount = await prisma.message.count({
      where: { conversationId },
    });

    if (messageCount > ARCHIVE_THRESHOLD) {
      await cleanupOldMessages(conversationId);
    }

    return message;
  } catch (error) {
    console.error('Error adding conversation message:', error);
    throw new Error(`Failed to add message: ${String(error)}`);
  }
}

/**
 * Clean up old messages from a conversation
 * Deletes messages older than MESSAGE_RETENTION_DAYS
 * Ensures conversation doesn't exceed MAX_MESSAGES_PER_CONVERSATION
 */
export async function cleanupOldMessages(conversationId: number) {
  const prisma = getPrismaClient();

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - MESSAGE_RETENTION_DAYS);

    // Delete old messages (older than 90 days)
    await prisma.message.deleteMany({
      where: {
        conversationId,
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    // If still too many messages, delete oldest ones
    const messageCount = await prisma.message.count({
      where: { conversationId },
    });

    if (messageCount > MAX_MESSAGES_PER_CONVERSATION) {
      const excess = messageCount - MAX_MESSAGES_PER_CONVERSATION;

      const oldestMessages = await prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'asc' },
        take: excess,
      });

      for (const msg of oldestMessages) {
        await prisma.message.delete({
          where: { id: msg.id },
        });
      }
    }

    console.log(`Cleaned up old messages for conversation ${conversationId}`);
  } catch (error) {
    console.error('Error cleaning up old messages:', error);
    // Don't throw - cleanup failures shouldn't break conversation
  }
}

/**
 * Global cleanup: Delete all messages older than retention period
 * Run this as a cron job or on-demand
 */
export async function performGlobalMessageCleanup() {
  const prisma = getPrismaClient();

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - MESSAGE_RETENTION_DAYS);

    const result = await prisma.message.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    console.log(`Global cleanup: Deleted ${result.count} old messages`);
    return result.count;
  } catch (error) {
    console.error('Error performing global message cleanup:', error);
    throw new Error(`Failed to perform cleanup: ${String(error)}`);
  }
}

/**
 * Get conversation statistics
 */
export async function getConversationStats(conversationId: number) {
  const prisma = getPrismaClient();

  try {
    const messageCount = await prisma.message.count({
      where: { conversationId },
    });

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    return {
      conversationId,
      messageCount,
      createdAt: conversation?.createdAt,
      updatedAt: conversation?.updatedAt,
      status: conversation?.status,
      needsCleanup: messageCount > ARCHIVE_THRESHOLD,
    };
  } catch (error) {
    console.error('Error getting conversation stats:', error);
    throw new Error(`Failed to get stats: ${String(error)}`);
  }
}

/**
 * Archive a conversation (mark as inactive)
 */
export async function archiveConversation(conversationId: number) {
  const prisma = getPrismaClient();

  try {
    const conversation = await prisma.conversation.update({
      where: { id: conversationId },
      data: { status: 'archived' },
    });

    return conversation;
  } catch (error) {
    console.error('Error archiving conversation:', error);
    throw new Error(`Failed to archive conversation: ${String(error)}`);
  }
}
