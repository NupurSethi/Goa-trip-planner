/**
 * Express Server Setup
 * 
 * This module sets up the main Express server for the trip planning application.
 * It handles:
 * - API routes for trip planning
 * - Conversation management endpoints
 * - System monitoring and health checks
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createTripPlan } = require('./agent/agent');
const {
  cleanupOldConversations,
  getConversationStats,
  conversations
} = require('./agent/conversationManager');

const app = express();

// Middleware: Parse incoming JSON requests
app.use(express.json());

// Middleware: Enable CORS for all routes
// This allows frontend (React/Vite) to access backend (Node on port 5000)
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

/**
 * Root Route - Welcome message
 * Returns: Basic welcome message and API info
 */
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to Plan a Trip!',
    endpoints: {
      planTrip: 'POST /api/plan-trip',
      health: 'GET /health',
      stats: 'GET /api/stats',
      cleanup: 'POST /api/cleanup'
    }
  });
});

/**
 * Health Check Route
 * Returns: Current server status
 * Used by: Load balancers, monitoring systems
 */
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

/**
 * Statistics Route
 * Returns: Information about active conversations and system usage
 * Useful for: Monitoring, debugging, analytics
 */
app.get('/api/stats', (req, res) => {
  const stats = getConversationStats();
  res.json({
    success: true,
    stats: stats,
    timestamp: new Date().toISOString()
  });
});

/**
 * Cleanup Route
 * Triggers immediate cleanup of old conversations
 * Returns: Number of conversations removed
 * 
 * In production, this can be called periodically by a scheduler
 * (e.g., every hour via a cron job)
 */
app.post('/api/cleanup', (req, res) => {
  try {
    const cleanedCount = cleanupOldConversations();
    res.json({
      success: true,
      message: `Cleanup complete`,
      conversationsRemoved: cleanedCount,
      remainingConversations: conversations.size,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Cleanup failed'
    });
  }
});

/**
 * Trip Planning Agent Route
 * 
 * POST /api/plan-trip
 * 
 * Request body:
 * {
 *   "query": "string - User's trip planning question",
 *   "conversationId": "string|null - ID of existing conversation or null for new"
 * }
 * 
 * Response:
 * {
 *   "success": boolean,
 *   "plan": "string - Assistant's response or error message",
 *   "conversationId": "string - ID for follow-up messages",
 *   "toolsUsedRounds": number,
 *   "iterations": number,
 *   "isNewConversation": boolean
 * }
 * 
 * How it works:
 * 1. Validates that a query was provided
 * 2. Checks that OpenAI API key is configured
 * 3. Passes query and conversationId to the agent
 * 4. Returns the agent's response with conversation metadata
 * 
 * The conversationId is crucial for maintaining context:
 * - First message: pass null → backend creates new conversation
 * - Follow-up messages: pass the returned conversationId → backend retrieves history
 */
app.post('/api/plan-trip', async (req, res) => {
  try {
    const { query, conversationId } = req.body;

    // Validate that user provided a query
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a query for trip planning'
      });
    }

    // Check that API is configured
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'OpenAI API key not configured'
      });
    }

    // Send query and conversationId to agent
    // Agent will retrieve existing conversation or create new one
    const result = await createTripPlan(query, conversationId);
    res.json(result);
  } catch (error) {
    console.error('Error in /api/plan-trip:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process trip planning request'
    });
  }
});

module.exports = app;
