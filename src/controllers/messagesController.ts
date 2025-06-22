import { Request, Response } from 'express';
import { PrismaClient, User as PrismaUser } from '@prisma/client';
import { AuthenticatedRequest } from '../types/express';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

/**
 * # Message Controller
 * Handles messaging operations between users and admins
 */

/**
 * Get all conversations for the current user
 * @route GET /api/messages/conversations
 */
export const getConversations = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user as PrismaUser;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // Find all conversations where the user is a participant
    const conversationParticipants = await prisma.conversationParticipant.findMany({
      where: {
        userId: user.id
      },
      include: {
        conversation: {
          include: {
            participants: {
              include: {
                user: {
                  select: {
                    id: true,
                    fullName: true,
                    email: true,
                    isAdmin: true
                  }
                }
              }
            },
            messages: {
              orderBy: {
                createdAt: 'desc'
              },
              take: 1, // Get only the latest message for preview
            },
            relatedBooking: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });
    
    // Transform the data for the frontend
    const formattedConversations = conversationParticipants.map((participant: any) => {
      const conversation = participant.conversation;
      const lastMessage = conversation.messages[0] || null;
      
      return {
        id: conversation.id,
        title: conversation.title,
        status: conversation.status,
        type: conversation.type,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        participants: conversation.participants.map((p: any) => ({
          id: p.user.id,
          fullName: p.user.fullName,
          email: p.user.email,
          isAdmin: p.user.isAdmin,
          role: p.role
        })),
        lastMessage: lastMessage ? {
          id: lastMessage.id,
          content: lastMessage.content,
          senderId: lastMessage.senderId,
          createdAt: lastMessage.createdAt
        } : null,
        relatedBooking: conversation.relatedBooking ? {
          id: conversation.relatedBooking.id,
          status: conversation.relatedBooking.status
        } : null,
        unreadCount: 0 // Will be calculated in a separate query
      };
    });
    
    return res.status(200).json({
      success: true,
      conversations: formattedConversations
    });
  } catch (error: any) {
    logger.error('Error fetching conversations:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch conversations',
      error: error.message
    });
  }
};

/**
 * Get a specific conversation by ID with all messages
 * @route GET /api/messages/conversations/:id
 */
export const getConversation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user as PrismaUser;
    const conversationId = req.params.id;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // First check if the user is a participant in this conversation
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId: user.id
      }
    });
    
    if (!participant) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this conversation'
      });
    }
    
    // Get the conversation with all messages
    const conversation = await prisma.conversation.findUnique({
      where: {
        id: conversationId
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                isAdmin: true
              }
            }
          }
        },
        messages: {
          orderBy: {
            createdAt: 'asc'
          },
          include: {
            sender: {
              select: {
                id: true,
                fullName: true,
                email: true,
                isAdmin: true
              }
            }
          }
        },
        relatedBooking: true
      }
    });
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }
    
    // Update the lastReadMessageId for this user if there are messages
    if (conversation.messages.length > 0) {
      const lastMessage = conversation.messages[conversation.messages.length - 1];
      
      await prisma.conversationParticipant.update({
        where: {
          id: participant.id
        },
        data: {
          lastReadMessageId: lastMessage.id,
          updatedAt: new Date()
        }
      });
    }
    
    // Format the response
    const formattedConversation = {
      id: conversation.id,
      title: conversation.title,
      status: conversation.status,
      type: conversation.type,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      participants: conversation.participants.map((p: any) => ({
        id: p.user.id,
        fullName: p.user.fullName,
        email: p.user.email,
        isAdmin: p.user.isAdmin,
        role: p.role
      })),
      messages: conversation.messages.map((message: any) => ({
        id: message.id,
        content: message.content,
        contentType: message.contentType,
        sender: {
          id: message.sender.id,
          fullName: message.sender.fullName,
          email: message.sender.email,
          isAdmin: message.sender.isAdmin
        },
        attachmentUrl: message.attachmentUrl,
        isSystem: message.isSystem,
        createdAt: message.createdAt
      })),
      relatedBooking: conversation.relatedBooking ? {
        id: conversation.relatedBooking.id,
        status: conversation.relatedBooking.status
      } : null
    };
    
    return res.status(200).json({
      success: true,
      conversation: formattedConversation
    });
  } catch (error: any) {
    logger.error('Error fetching conversation:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch conversation',
      error: error.message
    });
  }
};

/**
 * Create a new conversation
 * @route POST /api/messages/conversations
 */
export const createConversation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user as PrismaUser;
    const { title, type, relatedBookingId } = req.body;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // If this is a booking-related conversation, verify the booking exists and belongs to the user
    if (relatedBookingId) {
      const booking = await prisma.booking.findUnique({
        where: {
          id: relatedBookingId
        }
      });
      
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Related booking not found'
        });
      }
      
      // If user is not an admin, verify they own the booking
      if (!user.isAdmin && booking.userId !== user.id) {
        return res.status(403).json({
          success: false,
          message: 'You do not have access to this booking'
        });
      }
    }
    
    // Create the conversation
    const conversationType = type || 'SUPPORT';
    const conversationTitle = title || (relatedBookingId ? 'Booking Assistance' : 'Support Request');
    
    const conversation = await prisma.conversation.create({
      data: {
        title: conversationTitle,
        type: conversationType,
        status: 'OPEN',
        relatedBookingId,
        participants: {
          create: [
            {
              userId: user.id,
              role: 'CLIENT'
            }
          ]
        }
      }
    });
    
    // If the user is not an admin, find an admin to add to the conversation
    if (!user.isAdmin) {
      const adminUsers = await prisma.user.findMany({
        where: {
          isAdmin: true
        },
        take: 1 // Just get the first admin for now
      });
      
      if (adminUsers.length > 0) {
        await prisma.conversationParticipant.create({
          data: {
            conversationId: conversation.id,
            userId: adminUsers[0].id,
            role: 'ADMIN'
          }
        });
      }
    }
    
    // Create a system message to indicate conversation start
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: user.id,
        content: 'Conversation started',
        isSystem: true
      }
    });
    
    // Fetch the created conversation with all related data
    const createdConversation = await prisma.conversation.findUnique({
      where: {
        id: conversation.id
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                isAdmin: true
              }
            }
          }
        },
        messages: true,
        relatedBooking: true
      }
    });
    
    return res.status(201).json({
      success: true,
      message: 'Conversation created successfully',
      conversation: createdConversation
    });
  } catch (error: any) {
    logger.error('Error creating conversation:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create conversation',
      error: error.message
    });
  }
};

/**
 * Send a message to a conversation
 * @route POST /api/messages/conversations/:id/messages
 */
export const sendMessage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user as PrismaUser;
    const conversationId = req.params.id;
    const { content, contentType, attachmentUrl } = req.body;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    if (!content && !attachmentUrl) {
      return res.status(400).json({
        success: false,
        message: 'Message content or attachment is required'
      });
    }
    
    // Check if the user is a participant in this conversation
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId: user.id
      }
    });
    
    if (!participant) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this conversation'
      });
    }
    
    // Check if the conversation is closed
    const conversation = await prisma.conversation.findUnique({
      where: {
        id: conversationId
      }
    });
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }
    
    if (conversation.status === 'CLOSED' || conversation.status === 'ARCHIVED') {
      return res.status(400).json({
        success: false,
        message: 'Cannot send messages to a closed or archived conversation'
      });
    }
    
    // Create the message
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: user.id,
        content: content || '',
        contentType: contentType || 'TEXT',
        attachmentUrl,
        isSystem: false
      },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            email: true,
            isAdmin: true
          }
        }
      }
    });
    
    // Update the conversation's updatedAt timestamp
    await prisma.conversation.update({
      where: {
        id: conversationId
      },
      data: {
        updatedAt: new Date()
      }
    });
    
    // Update the sender's lastReadMessageId
    await prisma.conversationParticipant.update({
      where: {
        id: participant.id
      },
      data: {
        lastReadMessageId: message.id,
        updatedAt: new Date()
      }
    });
    
    // Format the response
    const formattedMessage = {
      id: message.id,
      content: message.content,
      contentType: message.contentType,
      sender: message.sender,
      attachmentUrl: message.attachmentUrl,
      isSystem: message.isSystem,
      createdAt: message.createdAt
    };
    
    return res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: formattedMessage
    });
  } catch (error: any) {
    logger.error('Error sending message:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message
    });
  }
};

/**
 * Mark all messages in a conversation as read
 * @route PUT /api/messages/conversations/:id/read
 */
export const markConversationAsRead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user as PrismaUser;
    const conversationId = req.params.id;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // Check if the user is a participant in this conversation
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId: user.id
      }
    });
    
    if (!participant) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this conversation'
      });
    }
    
    // Get the latest message
    const latestMessage = await prisma.message.findFirst({
      where: {
        conversationId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    if (latestMessage) {
      // Update the participant's lastReadMessageId
      await prisma.conversationParticipant.update({
        where: {
          id: participant.id
        },
        data: {
          lastReadMessageId: latestMessage.id,
          updatedAt: new Date()
        }
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Conversation marked as read'
    });
  } catch (error: any) {
    logger.error('Error marking conversation as read:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to mark conversation as read',
      error: error.message
    });
  }
};

/**
 * Close a conversation
 * @route PUT /api/messages/conversations/:id/close
 */
export const closeConversation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user as PrismaUser;
    const conversationId = req.params.id;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // Check if the user is a participant in this conversation
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId: user.id
      }
    });
    
    if (!participant) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this conversation'
      });
    }
    
    // Only admins can close conversations
    if (!user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can close conversations'
      });
    }
    
    // Update the conversation status
    await prisma.conversation.update({
      where: {
        id: conversationId
      },
      data: {
        status: 'CLOSED',
        updatedAt: new Date()
      }
    });
    
    // Add a system message about closing
    await prisma.message.create({
      data: {
        conversationId,
        senderId: user.id,
        content: 'Conversation closed by admin',
        isSystem: true
      }
    });
    
    return res.status(200).json({
      success: true,
      message: 'Conversation closed successfully'
    });
  } catch (error: any) {
    logger.error('Error closing conversation:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to close conversation',
      error: error.message
    });
  }
};

/**
 * Reopen a closed conversation
 * @route PUT /api/messages/conversations/:id/reopen
 */
export const reopenConversation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user as PrismaUser;
    const conversationId = req.params.id;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // Check if the user is a participant in this conversation
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId: user.id
      }
    });
    
    if (!participant) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this conversation'
      });
    }
    
    // Only admins can reopen conversations
    if (!user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can reopen conversations'
      });
    }
    
    // Update the conversation status
    await prisma.conversation.update({
      where: {
        id: conversationId
      },
      data: {
        status: 'OPEN',
        updatedAt: new Date()
      }
    });
    
    // Add a system message about reopening
    await prisma.message.create({
      data: {
        conversationId,
        senderId: user.id,
        content: 'Conversation reopened by admin',
        isSystem: true
      }
    });
    
    return res.status(200).json({
      success: true,
      message: 'Conversation reopened successfully'
    });
  } catch (error: any) {
    logger.error('Error reopening conversation:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reopen conversation',
      error: error.message
    });
  }
};

/**
 * Get unread message count for the current user
 * @route GET /api/messages/unread
 */
export const getUnreadCount = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user as PrismaUser;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // Get all conversation participants for this user
    const participants = await prisma.conversationParticipant.findMany({
      where: {
        userId: user.id
      },
      include: {
        conversation: {
          include: {
            messages: {
              orderBy: {
                createdAt: 'desc'
              },
              take: 1
            }
          }
        }
      }
    });
    
    let totalUnread = 0;
    const unreadByConversation: Record<string, number> = {};
    
    // For each conversation, count messages newer than lastReadMessageId
    for (const participant of participants) {
      if (!participant.lastReadMessageId && participant.conversation.messages.length > 0) {
        // If never read any message, count all messages except system messages
        const messageCount = await prisma.message.count({
          where: {
            conversationId: participant.conversation.id,
            isSystem: false,
            senderId: {
              not: user.id // Don't count user's own messages
            }
          }
        });
        totalUnread += messageCount;
        unreadByConversation[participant.conversation.id] = messageCount;
      } else if (participant.lastReadMessageId) {
        // Find the timestamp of the last read message
        const lastReadMessage = await prisma.message.findUnique({
          where: {
            id: participant.lastReadMessageId
          }
        });
        
        if (lastReadMessage) {
          // Count messages newer than the last read message
          const messageCount = await prisma.message.count({
            where: {
              conversationId: participant.conversation.id,
              isSystem: false,
              senderId: {
                not: user.id // Don't count user's own messages
              },
              createdAt: {
                gt: lastReadMessage.createdAt
              }
            }
          });
          totalUnread += messageCount;
          unreadByConversation[participant.conversation.id] = messageCount;
        }
      }
    }
    
    return res.status(200).json({
      success: true,
      totalUnread,
      unreadByConversation
    });
  } catch (error: any) {
    logger.error('Error getting unread count:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get unread count',
      error: error.message
    });
  }
}; 