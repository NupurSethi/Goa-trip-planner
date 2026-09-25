/**
 * Conversation Manager Module
 * 
 * This module handles all conversation state management for the trip planning agent.
 * It maintains in-memory storage of conversation threads, allowing the agent to:
 * - Retain context across multiple user queries within a single conversation
 * - Generate unique conversation IDs for tracking
 * - Clean up old conversations to free up memory
 */

// Structure: Map<conversationId, { messages, createdAt, lastActive }>
const conversations = new Map();

// Conversations older than this time (24 hours) will be cleaned up
const CONVERSATION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours in milliseconds


function generateConversationId() {
  const timestamp = Date.now().toString(36);
  
  const randomPart = Math.random().toString(36).substr(2);
  
  return timestamp + randomPart;
}

function getOrCreateConversation(conversationId, systemPrompt) {
  let id = conversationId;
  let isNew = false;

  if (!id || !conversations.has(id)) {
    id = generateConversationId();
    isNew = true;
    
    conversations.set(id, {
      messages: [
        {
          role: 'system',
          content: systemPrompt
        }
      ],
      // Timestamp when conversation was created
      createdAt: Date.now(),
      // Timestamp of last user interaction (used for cleanup)
      lastActive: Date.now()
    });
  } else {
    // Conversation exists - update its last activity time
    // This prevents it from being cleaned up as stale
    conversations.get(id).lastActive = Date.now();
  }

  return { id, isNew };
}

function cleanupOldConversations() {
  const now = Date.now();
  let cleanedCount = 0;

  for (const [id, conversation] of conversations.entries()) {
    const timeSinceLastActive = now - conversation.lastActive;

    if (timeSinceLastActive > CONVERSATION_TIMEOUT) {
      conversations.delete(id);
      cleanedCount++;
    }
  }

  if (cleanedCount > 0) {
    console.log(`[Cleanup] Removed ${cleanedCount} old conversations. Active conversations: ${conversations.size}`);
  }

  return cleanedCount;
}

function getConversationHistory(conversationId) {
  const conversation = conversations.get(conversationId);
  return conversation ? conversation.messages : null;
}

function getConversationStats() {
  let totalMessages = 0;

  // Sum up all messages across all conversations
  for (const conversation of conversations.values()) {
    totalMessages += conversation.messages.length;
  }

  const totalConversations = conversations.size;
  const averageMessagesPerConversation =
    totalConversations > 0 ? (totalMessages / totalConversations).toFixed(2) : 0;

  return {
    totalConversations,
    totalMessages,
    averageMessagesPerConversation,
  };
}

// Export all conversation management functions
module.exports = {
  generateConversationId,
  getOrCreateConversation,
  cleanupOldConversations,
  getConversationHistory,
  getConversationStats,
  conversations, // Export Map reference for advanced usage
  CONVERSATION_TIMEOUT,
};
