import { Request, Response } from 'express';
import memberIntelligenceService from '../services/memberIntelligenceService';
import { PrismaClient, Prisma } from '@prisma/client';
import OpenAI from 'openai';

const prisma = new PrismaClient();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Simple logger fallback
const logger = {
  info: (message: string, ...args: any[]) => console.log(`[INFO] ${message}`, ...args),
  error: (message: string, ...args: any[]) => console.error(`[ERROR] ${message}`, ...args),
  warn: (message: string, ...args: any[]) => console.warn(`[WARN] ${message}`, ...args)
};

class SmartChatController {
  
  /**
   * Handle intelligent chat with memory and knowledge base
   */
  async handleSmartChat(req: Request, res: Response) {
    try {
      const { message, userId, conversationId } = req.body;
      
      if (!message || !userId) {
        return res.status(400).json({ 
          error: 'Message and userId are required' 
        });
      }

      logger.info(`Smart chat request from user ${userId}: ${message}`);

      // 1. Check if we can answer from knowledge base (SAVE API COSTS!)
      const apiCheck = await memberIntelligenceService.shouldUseAPI(message, this.detectIntent(message));
      
      if (!apiCheck.useAPI) {
        logger.info(`Knowledge base hit! Saved API call for: ${message}`);
        
        // Update analytics for knowledge base hit
        await memberIntelligenceService.updateBehaviorAnalytics(userId, 'knowledge_base_hit');
        
        return res.json({
          response: apiCheck.answer,
          source: 'knowledge_base',
          apiCallSaved: true,
          conversationId
        });
      }

      // 2. Get user context and preferences for personalized response
      const preferences = await memberIntelligenceService.getUserPreferences(userId);
      const conversationContext = await memberIntelligenceService.getConversationContext(userId, 3);
      
      // 3. Extract entities and detect intent
      const entities = memberIntelligenceService.extractTravelEntities(message);
      const mood = memberIntelligenceService.detectUserMood(message);
      const intent = this.detectIntent(message);

      // 4. Generate personalized suggestions
      const suggestions = await memberIntelligenceService.generatePersonalizedSuggestions(userId, intent);

      // 5. Build context-aware prompt
      const systemPrompt = this.buildSystemPrompt(preferences, conversationContext, suggestions, intent);
      
      // 6. Call OpenAI with enriched context
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        max_tokens: 500,
        temperature: 0.7
      });

      const aiResponse = completion.choices[0].message.content;

      // 7. Store conversation memory for future use
      if (conversationId) {
        await memberIntelligenceService.storeConversationMemory(userId, conversationId, {
          intent,
          entities,
          mood,
          previousRequests: conversationContext.map((c: any) => c.detectedIntent),
          lastDestination: entities.destinations[0] || undefined,
          lastTravelDates: entities.dates[0] ? { mentioned: entities.dates[0] } : undefined
        });
      }

      // 8. Update user preferences based on conversation
      await memberIntelligenceService.updatePreferencesFromConversation(userId, {
        airlines: entities.airlines,
        destinations: entities.destinations,
        // Extract more preferences from message if needed
      });

      // 9. Update behavior analytics
      await memberIntelligenceService.updateBehaviorAnalytics(userId, 'conversation');

      // 10. Create travel request if booking intent detected
      let travelRequest = null;
      if (this.isBookingIntent(intent)) {
        travelRequest = await this.createTravelRequest(userId, conversationId, message, intent, entities);
      }

      logger.info(`Smart chat response generated for user ${userId}`);

      return res.json({
        response: aiResponse,
        source: 'ai_with_context',
        apiCallSaved: false,
        conversationId,
        userContext: {
          intent,
          mood,
          entities,
          suggestions: suggestions.recommendations
        },
        travelRequest: travelRequest ? {
          id: travelRequest.id,
          type: travelRequest.requestType,
          status: travelRequest.status
        } : null
      });

    } catch (error: any) {
      logger.error('Smart chat error:', error);
      return res.status(500).json({ 
        error: 'Failed to process smart chat request',
        details: error.message 
      });
    }
  }

  /**
   * Get conversation analytics for admin dashboard
   */
  async getConversationAnalytics(req: Request, res: Response) {
    try {
      const analytics = await prisma.userBehaviorAnalytics.findMany({
        include: {
          user: {
            select: { fullName: true, email: true }
          }
        },
        take: 20,
        orderBy: { api_calls_saved: 'desc' }
      });

      const totalApiCallsSaved = analytics.reduce((sum: number, a: { api_calls_saved: number | null }) => sum + (a.api_calls_saved || 0), 0);
      const totalConversations = analytics.reduce((sum: number, a: { total_conversations: number | null }) => sum + (a.total_conversations || 0), 0);

      return res.json({
        analytics,
        summary: {
          totalApiCallsSaved,
          totalConversations,
          averageApiCallsSavedPerUser: analytics.length > 0 ? totalApiCallsSaved / analytics.length : 0
        }
      });

    } catch (error: any) {
      logger.error('Error getting conversation analytics:', error);
      return res.status(500).json({ 
        error: 'Failed to get conversation analytics' 
      });
    }
  }

  /**
   * Get knowledge base usage statistics
   */
  async getKnowledgeBaseStats(req: Request, res: Response) {
    try {
      const stats = await prisma.knowledgeBase.groupBy({
        by: ['category'],
        _count: {
          id: true
        },
        _sum: {
          usage_count: true
        },
        orderBy: {
          _sum: {
            usage_count: 'desc'
          }
        }
      });

      const topQuestions = await prisma.knowledgeBase.findMany({
        select: {
          question: true,
          usage_count: true,
          category: true
        },
        orderBy: { usage_count: 'desc' },
        take: 10
      });

      return res.json({
        categoryStats: stats,
        topQuestions,
        totalEntries: await prisma.knowledgeBase.count()
      });

    } catch (error: any) {
      logger.error('Error getting knowledge base stats:', error);
      return res.status(500).json({ 
        error: 'Failed to get knowledge base stats' 
      });
    }
  }

  // Helper Methods

  detectIntent(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('flight') || lowerMessage.includes('fly') || lowerMessage.includes('airline')) {
      return 'FLIGHT_BOOKING';
    }
    if (lowerMessage.includes('hotel') || lowerMessage.includes('stay') || lowerMessage.includes('accommodation')) {
      return 'HOTEL_BOOKING';
    }
    if (lowerMessage.includes('restaurant') || lowerMessage.includes('eat') || lowerMessage.includes('dining')) {
      return 'RESTAURANT';
    }
    if (lowerMessage.includes('yacht') || lowerMessage.includes('luxury') || lowerMessage.includes('concierge')) {
      return 'LUXURY_SERVICE';
    }
    
    return 'GENERAL_INQUIRY';
  }

  isBookingIntent(intent: string): boolean {
    return ['FLIGHT_BOOKING', 'HOTEL_BOOKING', 'RESTAURANT', 'LUXURY_SERVICE'].includes(intent);
  }

  buildSystemPrompt(preferences: any, conversationContext: any[], suggestions: any, intent: string): string {
    let prompt = `You are GMTD AI, a luxury concierge for Dubai travel. You are sophisticated, knowledgeable, and provide personalized recommendations.

IMPORTANT CONTEXT:
- User's preferred communication style: ${preferences.communicationStyle || 'professional'}
- User's frequent destinations: ${preferences.frequentDestinations.join(', ') || 'None yet'}
- User's preferred airlines: ${preferences.preferredAirlines.join(', ') || 'None specified'}
- User's preferred class: ${preferences.preferredClass || 'Not specified'}

RECENT CONVERSATION CONTEXT:
${conversationContext.map(c => `- ${c.detectedIntent}: ${JSON.stringify(c.extractedEntities)}`).join('\n')}

PERSONALIZED SUGGESTIONS:
${suggestions.recommendations.join('\n')}

GUIDELINES:
1. Be concise but informative
2. Always prioritize Dubai-related recommendations
3. Mention specific prices when possible
4. If user asks about bookings, guide them through the process
5. For luxury services, emphasize exclusivity and quality
6. Remember their preferences and reference them naturally

Current request intent: ${intent}`;

    return prompt;
  }

  async createTravelRequest(userId: string, conversationId: string | undefined, message: string, intent: string, entities: any) {
    try {
      const requestType = this.mapIntentToRequestType(intent);
      
      return await prisma.travelRequest.create({
        data: {
          userId,
          conversationId,
          requestType,
          description: message,
          status: 'PENDING',
          searchParams: {
            entities,
            intent,
            extractedAt: new Date().toISOString()
          }
        }
      });
    } catch (error: any) {
      logger.error('Error creating travel request:', error);
      return null;
    }
  }

  mapIntentToRequestType(intent: string): string {
    const mapping: { [key: string]: string } = {
      'FLIGHT_BOOKING': 'FLIGHT',
      'HOTEL_BOOKING': 'HOTEL',
      'RESTAURANT': 'RESTAURANT',
      'LUXURY_SERVICE': 'OTHER'
    };
    return mapping[intent] || 'OTHER';
  }
}

export default new SmartChatController(); 