import { Router } from 'express';
import { authenticateAndSyncUser } from '../middleware/auth';
import { adminChatController } from '../controllers/adminChatController';

const router = Router();

/**
 * Admin Chat Routes
 * Handles admin-user communication bridge for escalated conversations
 */

/**
 * GET /api/admin/chat/conversations
 * Get all conversations requiring admin attention (escalated)
 */
router.get('/conversations', authenticateAndSyncUser, adminChatController.getEscalatedConversations.bind(adminChatController));

/**
 * GET /api/admin/chat/:conversationId
 * Get full conversation history for admin review
 */
router.get('/:conversationId', authenticateAndSyncUser, adminChatController.getConversationHistory.bind(adminChatController));

/**
 * POST /api/admin/chat/:conversationId/message
 * Send message as admin to customer
 * Body: { message: string, messageType?: string }
 */
router.post('/:conversationId/message', authenticateAndSyncUser, adminChatController.sendAdminMessage.bind(adminChatController));

/**
 * POST /api/admin/chat/:conversationId/assign
 * Assign conversation to current admin
 */
router.post('/:conversationId/assign', authenticateAndSyncUser, adminChatController.assignConversation.bind(adminChatController));

/**
 * POST /api/admin/chat/:conversationId/resolve
 * Mark conversation as resolved
 * Body: { resolution_notes?: string }
 */
router.post('/:conversationId/resolve', authenticateAndSyncUser, adminChatController.resolveConversation.bind(adminChatController));

/**
 * GET /api/admin/chat/stats
 * Get admin chat statistics
 */
router.get('/stats', authenticateAndSyncUser, adminChatController.getChatStats.bind(adminChatController));

export default router;