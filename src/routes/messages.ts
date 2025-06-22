import express from 'express';
import { authenticateAndSyncUser, isAdmin } from '../middleware/auth';
import { createRouteHandler } from '../utils/errorHandler';
import { 
  getConversations, 
  getConversation, 
  createConversation, 
  sendMessage, 
  markConversationAsRead, 
  closeConversation, 
  reopenConversation,
  getUnreadCount
} from '../controllers/messagesController';
import { detectTravelRequest } from '../controllers/travelRequestController';

const router = express.Router();

/**
 * # Message Routes
 * API endpoints for the messaging system between users and admins
 */

// Get all conversations for the current user
router.get('/conversations', authenticateAndSyncUser, createRouteHandler(getConversations));

// Get unread message count
router.get('/unread', authenticateAndSyncUser, createRouteHandler(getUnreadCount));

// Get a specific conversation by ID
router.get('/conversations/:id', authenticateAndSyncUser, createRouteHandler(getConversation));

// Create a new conversation
router.post('/conversations', authenticateAndSyncUser, createRouteHandler(createConversation));

// Send a message to a conversation
router.post('/conversations/:id/messages', authenticateAndSyncUser, createRouteHandler(sendMessage));

// Mark all messages in a conversation as read
router.put('/conversations/:id/read', authenticateAndSyncUser, createRouteHandler(markConversationAsRead));

// Close a conversation (admin only)
router.put('/conversations/:id/close', authenticateAndSyncUser, isAdmin, createRouteHandler(closeConversation));

// Reopen a conversation (admin only)
router.put('/conversations/:id/reopen', authenticateAndSyncUser, isAdmin, createRouteHandler(reopenConversation));

// Travel Request Integration
router.post('/:messageId/detect-travel-request', authenticateAndSyncUser, createRouteHandler(detectTravelRequest));

export default router; 