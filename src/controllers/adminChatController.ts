import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types/express';
import { PrismaClient } from '@prisma/client';
import { WebSocket } from 'ws';

const prisma = new PrismaClient();

// WebSocket connections for real-time admin notifications
const adminConnections = new Map<string, WebSocket>();
const adminActiveConversations = new Map<string, string[]>(); // admin_id -> conversation_ids[]

/**
 * Admin Chat Controller
 * Handles admin-user communication bridge for escalated conversations
 */
export class AdminChatController {

  /**
   * GET /api/admin/chat/conversations - Get conversations requiring admin attention
   */
  async getEscalatedConversations(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const adminId = req.auth?.payload?.sub;
      
      if (!adminId) {
        res.status(401).json({ error: 'Admin authentication required' });
        return;
      }

      // Get conversations that are escalated and not yet assigned or assigned to this admin
      const escalatedConversations = await prisma.conversation.findMany({
        where: {
          OR: [
            { escalated: true, status: 'OPEN' },
            { type: 'ESCALATED' }
          ]
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  phone: true,
                  createdAt: true
                }
              }
            }
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              sender: {
                select: {
                  fullName: true,
                  email: true
                }
              }
            }
          },
          _count: {
            select: {
              messages: true
            }
          }
        },
        orderBy: {
          updatedAt: 'desc'
        }
      });

      const formattedConversations = escalatedConversations.map(conv => ({
        id: conv.id,
        title: conv.title || 'Escalated Conversation',
        status: conv.status,
        escalated: conv.escalated,
        created_at: conv.createdAt,
        updated_at: conv.updatedAt,
        message_count: conv._count.messages,
        last_message: conv.messages[0] ? {
          content: conv.messages[0].content,
          created_at: conv.messages[0].createdAt,
          sender_name: conv.messages[0].sender.fullName
        } : null,
        customer: conv.participants.find(p => p.role === 'CLIENT')?.user || null,
        agent_type: conv.agentType,
        collected_info: conv.collectedInfo
      }));

      res.json({
        success: true,
        data: formattedConversations,
        count: formattedConversations.length
      });

    } catch (error) {
      console.error('Error fetching escalated conversations:', error);
      res.status(500).json({ error: 'Failed to fetch conversations' });
    }
  }

  /**
   * GET /api/admin/chat/:conversationId - Get full conversation history for admin
   */
  async getConversationHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { conversationId } = req.params;
      const adminId = req.auth?.payload?.sub;

      if (!adminId) {
        res.status(401).json({ error: 'Admin authentication required' });
        return;
      }

      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  phone: true,
                  auth0Id: true
                }
              }
            }
          },
          messages: {
            orderBy: { createdAt: 'asc' },
            include: {
              sender: {
                select: {
                  fullName: true,
                  email: true,
                  isAdmin: true
                }
              }
            }
          },
          relatedBooking: {
            select: {
              id: true,
              status: true,
              totalPrice: true,
              currency: true,
              bookedAt: true
            }
          },
          memories: true
        }
      });

      if (!conversation) {
        res.status(404).json({ error: 'Conversation not found' });
        return;
      }

      const customer = conversation.participants.find((p: any) => p.role === 'CLIENT')?.user;

      res.json({
        success: true,
        data: {
          conversation: {
            id: conversation.id,
            title: conversation.title,
            status: conversation.status,
            type: conversation.type,
            escalated: conversation.escalated,
            agent_type: conversation.agentType,
            collected_info: conversation.collectedInfo,
            current_state: conversation.currentState,
            created_at: conversation.createdAt,
            updated_at: conversation.updatedAt
          },
          customer: customer ? {
            id: customer.id,
            name: customer.fullName,
            email: customer.email,
            phone: customer.phone,
            auth0_id: customer.auth0Id
          } : null,
          messages: conversation.messages.map((msg: any) => ({
            id: msg.id,
            content: msg.content,
            content_type: msg.contentType,
            is_system: msg.isSystem,
            created_at: msg.createdAt,
            sender: {
              name: msg.sender.fullName,
              email: msg.sender.email,
              is_admin: msg.sender.isAdmin
            },
            metadata: msg.metadata
          })),
          related_booking: conversation.relatedBooking,
          conversation_memory: conversation.memories
        }
      });

    } catch (error) {
      console.error('Error fetching conversation history:', error);
      res.status(500).json({ error: 'Failed to fetch conversation history' });
    }
  }

  /**
   * POST /api/admin/chat/:conversationId/message - Send message as admin
   */
  async sendAdminMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { conversationId } = req.params;
      const { message, messageType = 'TEXT' } = req.body;
      const adminId = req.auth?.payload?.sub;

      if (!adminId || !message) {
        res.status(400).json({ error: 'Admin ID and message are required' });
        return;
      }

      // Get admin user record
      const adminUser = await prisma.user.findUnique({
        where: { auth0Id: adminId }
      });

      if (!adminUser || !adminUser.isAdmin) {
        res.status(403).json({ error: 'Admin access required' });
        return;
      }

      // Verify conversation exists
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          participants: {
            include: {
              user: true
            }
          }
        }
      });

      if (!conversation) {
        res.status(404).json({ error: 'Conversation not found' });
        return;
      }

      // Add admin as participant if not already
      const adminParticipant = conversation.participants.find(p => p.userId === adminUser.id);
      if (!adminParticipant) {
        await prisma.conversationParticipant.create({
          data: {
            conversationId,
            userId: adminUser.id,
            role: 'AGENT'
          }
        });
      }

      // Create admin message
      const adminMessage = await prisma.message.create({
        data: {
          conversationId,
          senderId: adminUser.id,
          content: message,
          contentType: messageType,
          isSystem: false,
          metadata: {
            admin_takeover: true,
            admin_name: adminUser.fullName
          }
        },
        include: {
          sender: {
            select: {
              fullName: true,
              email: true,
              isAdmin: true
            }
          }
        }
      });

      // Update conversation status
      await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          status: 'OPEN',
          escalated: true,
          updatedAt: new Date()
        }
      });

      // Notify customer via WebSocket/Push notification (placeholder)
      const customer = conversation.participants.find((p: any) => p.role === 'CLIENT')?.user;
      if (customer) {
        await this.notifyCustomer(customer.auth0Id, {
          type: 'admin_message',
          conversation_id: conversationId,
          message: message,
          admin_name: adminUser.fullName
        });
      }

      res.json({
        success: true,
        data: {
          message_id: adminMessage.id,
          conversation_id: conversationId,
          content: adminMessage.content,
          created_at: adminMessage.createdAt,
          sender: adminMessage.sender
        },
        message: 'Admin message sent successfully'
      });

    } catch (error) {
      console.error('Error sending admin message:', error);
      res.status(500).json({ error: 'Failed to send admin message' });
    }
  }

  /**
   * POST /api/admin/chat/:conversationId/assign - Assign conversation to admin
   */
  async assignConversation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { conversationId } = req.params;
      const adminId = req.auth?.payload?.sub;

      if (!adminId) {
        res.status(401).json({ error: 'Admin authentication required' });
        return;
      }

      const adminUser = await prisma.user.findUnique({
        where: { auth0Id: adminId }
      });

      if (!adminUser || !adminUser.isAdmin) {
        res.status(403).json({ error: 'Admin access required' });
        return;
      }

      // Update conversation with admin assignment
      const updatedConversation = await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          status: 'OPEN',
          escalated: true,
          updatedAt: new Date()
        }
      });

      // Add admin to active conversations
      const adminConversations = adminActiveConversations.get(adminId) || [];
      if (!adminConversations.includes(conversationId)) {
        adminConversations.push(conversationId);
        adminActiveConversations.set(adminId, adminConversations);
      }

      res.json({
        success: true,
        data: {
          conversation_id: conversationId,
          assigned_admin: adminUser.fullName,
          status: updatedConversation.status
        },
        message: 'Conversation assigned successfully'
      });

    } catch (error) {
      console.error('Error assigning conversation:', error);
      res.status(500).json({ error: 'Failed to assign conversation' });
    }
  }

  /**
   * POST /api/admin/chat/:conversationId/resolve - Mark conversation as resolved
   */
  async resolveConversation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { conversationId } = req.params;
      const { resolution_notes } = req.body;
      const adminId = req.auth?.payload?.sub;

      if (!adminId) {
        res.status(401).json({ error: 'Admin authentication required' });
        return;
      }

      const adminUser = await prisma.user.findUnique({
        where: { auth0Id: adminId }
      });

      if (!adminUser || !adminUser.isAdmin) {
        res.status(403).json({ error: 'Admin access required' });
        return;
      }

      // Mark conversation as resolved
      const resolvedConversation = await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          status: 'CLOSED',
          updatedAt: new Date()
        }
      });

      // Add resolution message
      if (resolution_notes) {
        await prisma.message.create({
          data: {
            conversationId,
            senderId: adminUser.id,
            content: `Conversation resolved: ${resolution_notes}`,
            contentType: 'TEXT',
            isSystem: true,
            metadata: {
              resolution: true,
              admin_name: adminUser.fullName,
              resolved_at: new Date()
            }
          }
        });
      }

      // Remove from admin's active conversations
      const adminConversations = adminActiveConversations.get(adminId) || [];
      const updatedConversations = adminConversations.filter(id => id !== conversationId);
      adminActiveConversations.set(adminId, updatedConversations);

      res.json({
        success: true,
        data: {
          conversation_id: conversationId,
          status: resolvedConversation.status,
          resolved_by: adminUser.fullName,
          resolved_at: new Date()
        },
        message: 'Conversation resolved successfully'
      });

    } catch (error) {
      console.error('Error resolving conversation:', error);
      res.status(500).json({ error: 'Failed to resolve conversation' });
    }
  }

  /**
   * GET /api/admin/chat/stats - Get admin chat statistics
   */
  async getChatStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const adminId = req.auth?.payload?.sub;

      if (!adminId) {
        res.status(401).json({ error: 'Admin authentication required' });
        return;
      }

      const [
        totalConversations,
        escalatedConversations, 
        openConversations,
        resolvedToday,
        avgResponseTime
      ] = await Promise.all([
        prisma.conversation.count(),
        prisma.conversation.count({ where: { escalated: true } }),
        prisma.conversation.count({ where: { status: 'OPEN' } }),
        prisma.conversation.count({
          where: {
            status: 'CLOSED',
            updatedAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
          }
        }),
        // Placeholder for response time calculation
        Promise.resolve('< 5 min')
      ]);

      res.json({
        success: true,
        data: {
          total_conversations: totalConversations,
          escalated_conversations: escalatedConversations,
          open_conversations: openConversations,
          resolved_today: resolvedToday,
          avg_response_time: avgResponseTime,
          active_admins: adminActiveConversations.size,
          online_customers: 0 // Placeholder for WebSocket connection count
        }
      });

    } catch (error) {
      console.error('Error fetching chat stats:', error);
      res.status(500).json({ error: 'Failed to fetch chat statistics' });
    }
  }

  /**
   * Notify customer of admin takeover/message
   */
  private async notifyCustomer(customerAuth0Id: string, notification: any) {
    try {
      // TODO: Implement actual customer notification
      // - WebSocket notification to mobile app
      // - Push notification
      // - SMS/WhatsApp notification
      
      console.log('Customer notification:', {
        customer_id: customerAuth0Id,
        notification
      });

      // Placeholder for actual implementation
      
    } catch (error) {
      console.error('Error notifying customer:', error);
    }
  }
}

export const adminChatController = new AdminChatController();