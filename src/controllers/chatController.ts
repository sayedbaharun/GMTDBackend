import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types/express';
import AIAgentService, { AgentType, ConversationContext } from '../services/ai-agents';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const aiAgentService = new AIAgentService();

// In-memory conversation storage (should be replaced with Redis in production)
const conversations = new Map<string, ConversationContext>();

/**
 * Start a new conversation with AI agent
 */
export const startConversation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { message, agentType } = req.body;
    const userId = req.auth?.payload?.sub;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Classify intent if no agent type specified
    const determinedAgentType = agentType || await AIAgentService.classifyIntent(message);
    
    // Generate conversation ID
    const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create new conversation context
    const context = AIAgentService.createNewContext(userId, conversationId, determinedAgentType);
    
    // Process the initial message
    const result = await aiAgentService.processMessage(message, context);
    
    // Store conversation context
    conversations.set(conversationId, result.newContext);
    
    // Save conversation to database
    await saveConversationToDb(result.newContext);

    // If escalation needed, trigger human agent notification
    if (result.shouldEscalate) {
      await notifyHumanAgent(result.newContext);
    }

    res.json({
      conversationId,
      agentType: determinedAgentType,
      response: result.response,
      state: result.newContext.state,
      escalated: result.shouldEscalate || false
    });

  } catch (error) {
    console.error('Start conversation error:', error);
    res.status(500).json({ error: 'Failed to start conversation' });
  }
};

/**
 * Continue an existing conversation
 */
export const continueConversation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { conversationId } = req.params;
    const { message } = req.body;
    const userId = req.auth?.payload?.sub;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!message || !conversationId) {
      return res.status(400).json({ error: 'Message and conversation ID are required' });
    }

    // Get conversation context
    let context = conversations.get(conversationId);
    
    if (!context) {
      // Try to restore from database
      context = await restoreConversationFromDb(conversationId, userId);
      if (!context) {
        return res.status(404).json({ error: 'Conversation not found' });
      }
    }

    // Verify user owns this conversation
    if (context.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Process the message
    const result = await aiAgentService.processMessage(message, context);
    
    // Update stored context
    conversations.set(conversationId, result.newContext);
    
    // Update conversation in database
    await updateConversationInDb(result.newContext);

    // If escalation needed, trigger human agent notification
    if (result.shouldEscalate) {
      await notifyHumanAgent(result.newContext);
    }

    res.json({
      conversationId,
      response: result.response,
      state: result.newContext.state,
      escalated: result.shouldEscalate || false,
      collectedInfo: result.newContext.collectedInfo
    });

  } catch (error) {
    console.error('Continue conversation error:', error);
    res.status(500).json({ error: 'Failed to continue conversation' });
  }
};

/**
 * Get conversation history
 */
export const getConversationHistory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { conversationId } = req.params;
    const userId = req.auth?.payload?.sub;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get conversation context
    let context = conversations.get(conversationId);
    
    if (!context) {
      context = await restoreConversationFromDb(conversationId, userId);
      if (!context) {
        return res.status(404).json({ error: 'Conversation not found' });
      }
    }

    // Verify user owns this conversation
    if (context.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      conversationId,
      agentType: context.agentType,
      state: context.state,
      messageHistory: context.messageHistory,
      collectedInfo: context.collectedInfo,
      escalated: context.escalated
    });

  } catch (error) {
    console.error('Get conversation history error:', error);
    res.status(500).json({ error: 'Failed to get conversation history' });
  }
};

/**
 * Get user's conversations
 */
export const getUserConversations = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.auth?.payload?.sub;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get conversations from database via participants
    const userConversations = await prisma.conversationParticipant.findMany({
      where: {
        user: {
          auth0Id: userId
        }
      },
      include: {
        conversation: true
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 20
    });

    res.json({
      conversations: userConversations.map(participant => ({
        id: participant.conversation.id,
        title: participant.conversation.title,
        type: participant.conversation.type,
        status: participant.conversation.status,
        createdAt: participant.conversation.createdAt,
        updatedAt: participant.conversation.updatedAt
      }))
    });

  } catch (error) {
    console.error('Get user conversations error:', error);
    res.status(500).json({ error: 'Failed to get conversations' });
  }
};

/**
 * Escalate conversation to human agent
 */
export const escalateToHuman = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { conversationId } = req.params;
    const { reason } = req.body;
    const userId = req.auth?.payload?.sub;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get conversation context
    let context = conversations.get(conversationId);
    
    if (!context) {
      context = await restoreConversationFromDb(conversationId, userId);
      if (!context) {
        return res.status(404).json({ error: 'Conversation not found' });
      }
    }

    // Verify user owns this conversation
    if (context.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Mark as escalated
    context.escalated = true;
    context.state = 'escalated' as any;
    
    // Update stored context
    conversations.set(conversationId, context);
    
    // Update in database
    await updateConversationInDb(context);
    
    // Notify human agent
    await notifyHumanAgent(context, reason);

    res.json({
      message: 'Conversation escalated to human agent',
      conversationId,
      escalated: true
    });

  } catch (error) {
    console.error('Escalate conversation error:', error);
    res.status(500).json({ error: 'Failed to escalate conversation' });
  }
};

/**
 * Save conversation to database
 */
async function saveConversationToDb(context: ConversationContext) {
  try {
    // Create conversation
    const conversation = await prisma.conversation.create({
      data: {
        id: context.conversationId,
        type: context.agentType.toUpperCase(),
        status: context.escalated ? 'CLOSED' : 'OPEN',
        title: `${context.agentType} assistance`
      }
    });

    // Add user as participant
    await prisma.conversationParticipant.create({
      data: {
        conversationId: context.conversationId,
        userId: (await prisma.user.findUnique({ where: { auth0Id: context.userId } }))?.id || '',
        role: 'CLIENT'
      }
    });

    // Create messages
    for (const msg of context.messageHistory) {
      await prisma.message.create({
        data: {
          conversationId: context.conversationId,
          senderId: (await prisma.user.findUnique({ where: { auth0Id: context.userId } }))?.id || '',
          content: msg.content,
          contentType: 'TEXT',
          isSystem: msg.role === 'assistant'
        }
      });
    }
  } catch (error) {
    console.error('Error saving conversation to DB:', error);
  }
}

/**
 * Update conversation in database
 */
async function updateConversationInDb(context: ConversationContext) {
  try {
    await prisma.conversation.update({
      where: { id: context.conversationId },
      data: {
        status: context.escalated ? 'CLOSED' : 'OPEN',
        updatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Error updating conversation in DB:', error);
  }
}

/**
 * Restore conversation from database
 */
async function restoreConversationFromDb(conversationId: string, userId: string): Promise<ConversationContext | undefined> {
  try {
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        user: {
          auth0Id: userId
        }
      },
      include: {
        conversation: {
          include: {
            messages: {
              orderBy: {
                createdAt: 'asc'
              }
            }
          }
        }
      }
    });

    if (!participant) {
      return undefined;
    }

    const conversation = participant.conversation;

    // Reconstruct context from database
    const context: ConversationContext = {
      userId,
      conversationId,
      agentType: conversation.type.toLowerCase() as AgentType,
      state: conversation.status === 'CLOSED' ? 'escalated' as any : 'welcome' as any,
      collectedInfo: {},
      messageHistory: conversation.messages.map(msg => ({
        role: msg.isSystem ? 'assistant' as const : 'user' as const,
        content: msg.content,
        timestamp: msg.createdAt
      })),
      currentQuestionIndex: 0,
      retryCount: 0,
      escalated: conversation.status === 'CLOSED'
    };

    return context;
    
  } catch (error) {
    console.error('Error restoring conversation from DB:', error);
    return undefined;
  }
}

/**
 * Notify human agent of escalation
 */
async function notifyHumanAgent(context: ConversationContext, reason?: string) {
  try {
    // This would integrate with Pusher or other notification system
    console.log('Human agent notification:', {
      conversationId: context.conversationId,
      userId: context.userId,
      agentType: context.agentType,
      reason: reason || 'Automatic escalation'
    });
    
    // TODO: Implement actual notification logic
    // - Send Pusher notification to agent dashboard
    // - Send email/SMS to on-duty agents
    // - Create notification record in database
    
  } catch (error) {
    console.error('Error notifying human agent:', error);
  }
} 