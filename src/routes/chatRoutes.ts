import { Router } from 'express';
import { authenticateAndSyncUser } from '../middleware/auth';
import { 
  startConversation,
  continueConversation,
  getConversationHistory,
  getUserConversations,
  escalateToHuman
} from '../controllers/chatController';

const router = Router();

/**
 * POST /api/chat/start
 * Start a new conversation with AI agent
 * Body: { message: string, agentType?: string }
 */
router.post('/start', authenticateAndSyncUser, startConversation as any);

/**
 * POST /api/chat/:conversationId/message
 * Continue an existing conversation
 * Body: { message: string }
 */
router.post('/:conversationId/message', authenticateAndSyncUser, continueConversation as any);

/**
 * GET /api/chat/:conversationId/history
 * Get conversation history
 */
router.get('/:conversationId/history', authenticateAndSyncUser, getConversationHistory as any);

/**
 * GET /api/chat/conversations
 * Get user's conversations
 */
router.get('/conversations', authenticateAndSyncUser, getUserConversations as any);

/**
 * POST /api/chat/:conversationId/escalate
 * Escalate conversation to human agent
 * Body: { reason?: string }
 */
router.post('/:conversationId/escalate', authenticateAndSyncUser, escalateToHuman as any);

/**
 * GET /api/chat/agents/types
 * Get available agent types and their descriptions
 */
router.get('/agents/types', async (req, res) => {
  try {
    // This can work without database changes
    const agentTypes = {
      flight: {
        name: 'Flight Specialist',
        description: 'Professional, Efficient, Globally Aware - Helps with flight bookings',
        capabilities: ['Flight search', 'Price comparison', 'Booking assistance', 'Travel dates']
      },
      hotel: {
        name: 'Hotel Specialist', 
        description: 'Warm, Discerning, Detail-Oriented - Finds perfect accommodations',
        capabilities: ['Hotel search', 'Room selection', 'Amenity matching', 'Location preferences']
      },
      restaurant: {
        name: 'Restaurant Specialist',
        description: 'Sophisticated, Connected, Culinary Savvy - Books dining experiences',
        capabilities: ['Restaurant reservations', 'Cuisine preferences', 'Special occasions', 'Dietary restrictions']
      },
      luxury: {
        name: 'Luxury Experience Specialist',
        description: 'Concierge-Class, Discreet, Exclusive - Arranges premium services',
        capabilities: ['Yacht charters', 'Supercar rentals', 'VIP experiences', 'Private services']
      },
      general: {
        name: 'General Concierge',
        description: 'Helpful, Knowledgeable, Adaptable - Handles all inquiries',
        capabilities: ['General assistance', 'Service routing', 'Information', 'Support']
      }
    };

    res.json({
      agentTypes,
      totalAgents: Object.keys(agentTypes).length,
      status: 'Available for basic info - Full chat implementation pending'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get agent types' });
  }
});

export default router; 