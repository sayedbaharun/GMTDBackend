import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// Simple logger fallback
const logger = {
  info: (message: string, ...args: any[]) => console.log(`[INFO] ${message}`, ...args),
  error: (message: string, ...args: any[]) => console.error(`[ERROR] ${message}`, ...args),
  warn: (message: string, ...args: any[]) => console.warn(`[WARN] ${message}`, ...args)
};

interface ConversationData {
  intent?: string;
  entities?: any;
  mood?: string;
  previousRequests?: string[];
  lastBookingType?: string;
  lastDestination?: string;
  lastTravelDates?: any;
  suggestedUpgrades?: any;
  personalizedOffers?: any;
  airlines?: string[];
  destinations?: string[];
  class?: string;
  hotelChains?: string[];
  cuisines?: string[];
}

interface KnowledgeBaseResult {
  found: boolean;
  answer?: string;
  confidence?: number;
  source?: string;
}

interface ApiCheckResult {
  useAPI: boolean;
  answer?: string;
  source?: string;
  reason?: string;
}

class MemberIntelligenceService {
  
  // ===== CONVERSATION MEMORY =====
  
  async storeConversationMemory(userId: string, conversationId: string, data: ConversationData) {
    try {
      const memory = await prisma.conversationMemory.create({
        data: {
          userId,
          conversationId,
          detectedIntent: data.intent || 'UNKNOWN',
          extractedEntities: data.entities || {},
          userMood: data.mood,
          previousRequests: data.previousRequests || [],
          lastBookingType: data.lastBookingType,
          lastDestination: data.lastDestination,
          lastTravelDates: data.lastTravelDates,
          suggestedUpgrades: data.suggestedUpgrades,
          personalizedOffers: data.personalizedOffers
        }
      });
      
      logger.info(`Conversation memory stored for user ${userId}`);
      return memory;
    } catch (error: any) {
      logger.error('Error storing conversation memory:', error);
      throw error;
    }
  }

  async getConversationContext(userId: string, limit: number = 5) {
    try {
      return await prisma.conversationMemory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          conversation: {
            select: { type: true, agentType: true }
          }
        }
      });
    } catch (error: any) {
      logger.error('Error getting conversation context:', error);
      throw error;
    }
  }

  // ===== SMART KNOWLEDGE BASE =====

  async checkKnowledgeBase(question: string, category: string | null = null): Promise<KnowledgeBaseResult> {
    try {
      const keywords = this.extractKeywords(question);
      
      const knowledge = await prisma.knowledgeBase.findFirst({
        where: {
          AND: [
            category ? { category } : {},
            {
              OR: [
                { question: { contains: question, mode: 'insensitive' } },
                { keywords: { hasSome: keywords } }
              ]
            },
            { confidence_score: { gte: 0.8 } }
          ]
        },
        orderBy: { confidence_score: 'desc' }
      });

      if (knowledge) {
        await prisma.knowledgeBase.update({
          where: { id: knowledge.id },
          data: {
            usage_count: { increment: 1 },
            last_used: new Date()
          }
        });

        logger.info(`Knowledge base hit for question: ${question}`);
        return {
          found: true,
          answer: knowledge.answer,
          confidence: knowledge.confidence_score || 1.0,
          source: 'knowledge_base'
        };
      }

      return { found: false };
    } catch (error: any) {
      logger.error('Error checking knowledge base:', error);
      return { found: false };
    }
  }

  async addKnowledge(category: string, question: string, answer: string, keywords: string[] = [], apiCallNeeded: boolean = false) {
    try {
      return await prisma.knowledgeBase.create({
        data: {
          category,
          question,
          answer,
          keywords,
          api_call_needed: apiCallNeeded,
          confidence_score: 1.0
        }
      });
    } catch (error: any) {
      logger.error('Error adding knowledge:', error);
      throw error;
    }
  }

  // ===== USER PREFERENCES INTELLIGENCE =====

  async getUserPreferences(userId: string) {
    try {
      let preferences = await prisma.userPreferences.findUnique({
        where: { userId }
      });

      if (!preferences) {
        preferences = await prisma.userPreferences.create({
          data: { userId }
        });
      }

      return preferences;
    } catch (error: any) {
      logger.error('Error getting user preferences:', error);
      throw error;
    }
  }

  async updatePreferencesFromConversation(userId: string, conversationData: ConversationData) {
    try {
      const preferences = await this.getUserPreferences(userId);
      const updates: Partial<Prisma.UserPreferencesUpdateInput> = {};

      if (conversationData.airlines) {
        updates.preferredAirlines = [...new Set([...(preferences.preferredAirlines || []), ...conversationData.airlines])];
      }
      if (conversationData.destinations) {
        updates.frequentDestinations = [...new Set([...(preferences.frequentDestinations || []), ...conversationData.destinations])];
      }
      if (conversationData.class) {
        updates.preferredClass = conversationData.class;
      }
      if (conversationData.hotelChains) {
        updates.preferredHotelChains = [...new Set([...(preferences.preferredHotelChains || []), ...conversationData.hotelChains])];
      }
      if (conversationData.cuisines) {
        updates.cuisinePreferences = [...new Set([...(preferences.cuisinePreferences || []), ...conversationData.cuisines])];
      }

      if (Object.keys(updates).length > 0) {
        await prisma.userPreferences.update({
          where: { userId },
          data: updates
        });
        logger.info(`Updated preferences for user ${userId}`);
      }

      return updates;
    } catch (error: any) {
      logger.error('Error updating preferences:', error);
      throw error;
    }
  }

  // ===== SMART SUGGESTIONS =====

  async generatePersonalizedSuggestions(userId: string, requestType: string): Promise<{ recommendations: string[]; upgrades: string[]; alternatives: string[] }> {
    try {
      const preferences = await this.getUserPreferences(userId);
      
      const suggestions = {
        recommendations: [] as string[],
        upgrades: [] as string[],
        alternatives: [] as string[]
      };

      switch (requestType) {
        case 'FLIGHT_BOOKING':
          if (preferences.preferredAirlines && preferences.preferredAirlines.length > 0) {
            suggestions.recommendations.push(`Based on your history, I recommend ${preferences.preferredAirlines[0]} flights`);
          }
          if (preferences.preferredClass && preferences.preferredClass !== 'ECONOMY') {
            suggestions.upgrades.push(`Would you like to upgrade to ${preferences.preferredClass} class?`);
          }
          break;

        case 'HOTEL_BOOKING':
          if (preferences.preferredHotelChains && preferences.preferredHotelChains.length > 0) {
            suggestions.recommendations.push(`I found great options at ${preferences.preferredHotelChains[0]}`);
          }
          break;

        case 'RESTAURANT':
          if (preferences.cuisinePreferences && preferences.cuisinePreferences.length > 0) {
            suggestions.recommendations.push(`Based on your taste, I recommend ${preferences.cuisinePreferences[0]} cuisine`);
          }
          break;
      }

      return suggestions;
    } catch (error: any) {
      logger.error('Error generating suggestions:', error);
      return { recommendations: [], upgrades: [], alternatives: [] };
    }
  }

  // ===== BEHAVIORAL ANALYTICS =====

  async updateBehaviorAnalytics(userId: string, action: string, data: any = {}): Promise<void> {
    try {
      let analytics = await prisma.userBehaviorAnalytics.findFirst({
        where: { userId }
      });

      if (!analytics) {
        analytics = await prisma.userBehaviorAnalytics.create({
          data: {
            userId,
            favorite_destinations: {},
            peak_usage_hours: {},
            preference_changes: {},
            booking_patterns: {}
          }
        });
      }

      const updates: Partial<Prisma.UserBehaviorAnalyticsUpdateInput> = {};

      switch (action) {
        case 'conversation':
          updates.total_conversations = { increment: 1 };
          break;
        case 'booking':
          updates.total_bookings = { increment: 1 };
          if (data.destination) {
            const favDest = (analytics.favorite_destinations as any || {});
            favDest[data.destination] = (favDest[data.destination] || 0) + 1;
            updates.favorite_destinations = favDest;
          }
          break;
        case 'knowledge_base_hit':
          updates.questions_answered_without_api = { increment: 1 };
          updates.api_calls_saved = { increment: 1 };
          break;
      }

      if (Object.keys(updates).length > 0) {
        await prisma.userBehaviorAnalytics.update({
            where: { id: analytics.id },
            data: updates
        });
      }

      logger.info(`Updated behavior analytics for user ${userId}: ${action}`);
    } catch (error: any) {
      logger.error('Error updating behavior analytics:', error);
    }
  }

  // ===== UTILITY METHODS =====

  extractKeywords(text: string): string[] {
    const stopWords = ['is', 'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'how', 'what', 'when', 'where', 'why', 'can', 'could', 'would', 'should'];
    
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(' ')
      .filter(word => word.length > 2 && !stopWords.includes(word))
      .slice(0, 10);
  }

  detectUserMood(message: string): string {
    const urgentWords = ['urgent', 'asap', 'immediately', 'emergency', 'quickly'];
    const excitedWords = ['excited', 'amazing', 'fantastic', 'great', 'awesome'];
    const frustratedWords = ['frustrated', 'annoyed', 'difficult', 'problem', 'issue'];
    
    const lowerMessage = message.toLowerCase();
    
    if (urgentWords.some(word => lowerMessage.includes(word))) return 'URGENT';
    if (excitedWords.some(word => lowerMessage.includes(word))) return 'EXCITED';
    if (frustratedWords.some(word => lowerMessage.includes(word))) return 'FRUSTRATED';
    
    return 'NEUTRAL';
  }

  extractTravelEntities(message: string): { destinations: string[]; dates: string[]; airlines: string[]; hotels: string[] } {
    const entities = {
      destinations: [] as string[],
      dates: [] as string[],
      airlines: [] as string[],
      hotels: [] as string[]
    };

    const cityPattern = /\b(dubai|london|new york|paris|tokyo|singapore|mumbai|delhi)\b/gi;
    const datePattern = /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})\b/g;
    const airlinePattern = /\b(emirates|etihad|british airways|lufthansa|air france|qatar airways)\b/gi;

    entities.destinations = [...new Set(message.match(cityPattern) || [])];
    entities.dates = [...new Set(message.match(datePattern) || [])];
    entities.airlines = [...new Set(message.match(airlinePattern) || [])];

    return entities;
  }

  async shouldUseAPI(question: string, category: string | null): Promise<ApiCheckResult> {
    const knowledgeResult = await this.checkKnowledgeBase(question, category);
    
    if (knowledgeResult.found && knowledgeResult.confidence && knowledgeResult.confidence > 0.8) {
      return {
        useAPI: false,
        answer: knowledgeResult.answer,
        source: 'knowledge_base'
      };
    }

    const noAPIQuestions = [
      'how long is the flight from london to dubai',
      'what is the time difference between dubai and london',
      'what currency is used in dubai',
      'what is the weather like in dubai',
      'do i need a visa for dubai'
    ];

    const lowerQuestion = question.toLowerCase();
    const isNoAPIQuestion = noAPIQuestions.some(q => lowerQuestion.includes(q));

    return {
      useAPI: !isNoAPIQuestion,
      reason: isNoAPIQuestion ? 'common_knowledge' : 'api_required'
    };
  }
}

export default new MemberIntelligenceService(); 