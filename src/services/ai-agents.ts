import OpenAI from 'openai';

// Initialize OpenAI with error handling
let openai: OpenAI | null = null;
let openaiError: string | null = null;

try {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key-here') {
    openaiError = 'OpenAI API key not configured. AI features will use fallback responses.';
    console.warn('[AI Agents] ' + openaiError);
  } else {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    console.log('[AI Agents] OpenAI initialized successfully');
  }
} catch (error) {
  openaiError = `OpenAI initialization failed: ${error}`;
  console.error('[AI Agents] ' + openaiError);
}

// AI Agent Types
export enum AgentType {
  FLIGHT = 'flight',
  HOTEL = 'hotel', 
  RESTAURANT = 'restaurant',
  LUXURY = 'luxury',
  GENERAL = 'general'
}

export enum ConversationState {
  WELCOME = 'welcome',
  GATHERING_INFO = 'gathering_info',
  PROCESSING = 'processing',
  CONFIRMATION = 'confirmation',
  COMPLETED = 'completed',
  ESCALATED = 'escalated',
  ERROR = 'error'
}

// Agent Personas and Flows
export const AgentPersonas = {
  [AgentType.FLIGHT]: {
    name: "Flight Specialist",
    personality: "Professional, Efficient, Globally Aware",
    welcome: "Welcome to Get Me To Dubai — ready to find your perfect flight? I can search the best options for you in seconds.",
    questions: [
      "What city are you flying from?",
      "What's your destination airport?", 
      "What are your preferred travel dates?",
      "Do you prefer economy, business, or first class?",
      "Are there any specific airlines you prefer?"
    ],
    actionStatement: "Searching flights now... just a moment.",
    confirmationTemplate: "Found {{count}} great options. Want me to book the best one or send you the full list?",
    completionMessage: "✅ Flight booked! Your e-ticket is being sent to your email. Bon voyage!"
  },

  [AgentType.HOTEL]: {
    name: "Hotel Specialist", 
    personality: "Warm, Discerning, Detail-Oriented",
    welcome: "Looking for a perfect place to stay in Dubai? Let me find hotels that match your style and budget.",
    questions: [
      "What dates are you checking in and out?",
      "Preferred star rating or luxury level?",
      "Which area of Dubai are you interested in?",
      "Any must-have amenities? (e.g. pool, spa, ocean view)"
    ],
    actionStatement: "Great — let me shortlist the most suitable hotels.",
    confirmationTemplate: "Found {{count}} standout options. Would you like images, price breakdown, or the fastest option to reserve?",
    completionMessage: "🏨 Reservation confirmed. Details have been sent to your email and WhatsApp."
  },

  [AgentType.RESTAURANT]: {
    name: "Restaurant Specialist",
    personality: "Sophisticated, Connected, Culinary Savvy", 
    welcome: "Craving something special? I can book you a table at Dubai's top restaurants.",
    questions: [
      "Cuisine preference?",
      "Date and time of reservation?", 
      "Number of guests?",
      "Any dietary restrictions or special requests?"
    ],
    actionStatement: "Let me check availability at the best-rated spots.",
    confirmationTemplate: "Reservation confirmed at {{restaurant}} for {{time}}. You'll receive a WhatsApp confirmation shortly.",
    completionMessage: "🍽️ Table reserved. You'll receive confirmation and directions soon."
  },

  [AgentType.LUXURY]: {
    name: "Luxury Experience Specialist",
    personality: "Concierge-Class, Discreet, Exclusive",
    welcome: "Welcome to luxury on demand. Tell me what you need — from yachts to supercars to private chefs.",
    questions: [
      "Which service are you interested in? (Yacht, supercar, VIP club, etc.)",
      "Date/time of the service?",
      "Duration?", 
      "Number of guests?",
      "Any preferences (e.g. car model, boat length, special requests)?"
    ],
    actionStatement: "I'll arrange the most exclusive options for you now.",
    confirmationTemplate: "Booking confirmed. You'll receive full details and a contact concierge within minutes.",
    completionMessage: "🛥️ All set. Your luxury experience is confirmed. A dedicated contact will follow up shortly."
  },

  [AgentType.GENERAL]: {
    name: "General Concierge",
    personality: "Helpful, Knowledgeable, Adaptable",
    welcome: "Welcome to Get Me To Dubai — your personal concierge for unforgettable travel and lifestyle experiences. What can I assist you with today?",
    questions: [
      "What type of service are you looking for? (Flights, hotels, restaurants, or luxury experiences)",
      "Any specific preferences or requirements?",
      "What timeframe are you considering?"
    ],
    actionStatement: "Let me connect you with the right specialist for your needs.",
    confirmationTemplate: "I'll make sure you get the perfect assistance for your request.",
    completionMessage: "✅ All set! You'll be connected with the appropriate specialist shortly."
  }
};

// Standard Messages
export const StandardMessages = {
  GENERAL_WELCOME: "Welcome to Get Me To Dubai — your personal concierge for unforgettable travel and lifestyle experiences. What can I assist you with today?",
  REPEAT_USER_WELCOME: "Welcome back! Ready to plan your next adventure or pick up where we left off?",
  
  ESCALATION: "This request may require a specialist. I'm connecting you to a human concierge now. You'll hear back shortly.",
  ESCALATION_BACKUP: "Your request has been escalated. A concierge will message you via WhatsApp within 15 minutes.",
  
  ERROR_UNCLEAR: "Hmm, I didn't catch that. Could you rephrase your request or give me a few more details?",
  ERROR_RETRY: "Something didn't go as planned. I'm checking the system and will retry in a few seconds.",
  ERROR_FAILOVER: "We're having a temporary glitch. I've logged the issue, and a concierge will step in to assist."
};

// Conversation Context Interface
export interface ConversationContext {
  userId: string;
  conversationId: string;
  agentType: AgentType;
  state: ConversationState;
  collectedInfo: Record<string, any>;
  messageHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
  currentQuestionIndex: number;
  retryCount: number;
  escalated: boolean;
}

// AI Agent Service Class
export class AIAgentService {
  
  /**
   * Process incoming user message and generate appropriate response
   */
  async processMessage(
    message: string, 
    context: ConversationContext
  ): Promise<{ response: string; newContext: ConversationContext; shouldEscalate?: boolean }> {
    
    try {
      // Add user message to history
      context.messageHistory.push({
        role: 'user',
        content: message,
        timestamp: new Date()
      });

      // Determine agent and response based on context
      const agent = AgentPersonas[context.agentType];
      let response: string;
      let shouldEscalate = false;

      switch (context.state) {
        case ConversationState.WELCOME:
          response = await this.handleWelcome(message, context);
          break;
          
        case ConversationState.GATHERING_INFO:
          response = await this.handleInfoGathering(message, context);
          break;
          
        case ConversationState.PROCESSING:
          response = await this.handleProcessing(message, context);
          break;
          
        case ConversationState.CONFIRMATION:
          response = await this.handleConfirmation(message, context);
          break;
          
        default:
          response = StandardMessages.ERROR_UNCLEAR;
          context.retryCount++;
      }

      // Check if we should escalate
      if (context.retryCount >= 3 || message.toLowerCase().includes('human') || message.toLowerCase().includes('agent')) {
        shouldEscalate = true;
        response = StandardMessages.ESCALATION;
        context.state = ConversationState.ESCALATED;
        context.escalated = true;
      }

      // Add response to history
      context.messageHistory.push({
        role: 'assistant',
        content: response,
        timestamp: new Date()
      });

      return { response, newContext: context, shouldEscalate };

    } catch (error) {
      console.error('AI Agent Error:', error);
      
      context.retryCount++;
      const response = context.retryCount >= 2 ? StandardMessages.ERROR_FAILOVER : StandardMessages.ERROR_RETRY;
      
      return { 
        response, 
        newContext: context, 
        shouldEscalate: context.retryCount >= 2 
      };
    }
  }

  /**
   * Handle welcome state
   */
  private async handleWelcome(message: string, context: ConversationContext): Promise<string> {
    const agent = AgentPersonas[context.agentType];
    
    // Move to info gathering state
    context.state = ConversationState.GATHERING_INFO;
    context.currentQuestionIndex = 0;
    
    // Return welcome message and first question
    return `${agent.welcome}\n\n${agent.questions[0]}`;
  }

  /**
   * Handle information gathering state
   */
  private async handleInfoGathering(message: string, context: ConversationContext): Promise<string> {
    const agent = AgentPersonas[context.agentType];
    
    // Extract and store information using OpenAI
    const extractedInfo = await this.extractInformation(message, agent.questions[context.currentQuestionIndex]);
    
    // Store the extracted information
    const questionKey = this.getQuestionKey(agent.questions[context.currentQuestionIndex]);
    context.collectedInfo[questionKey] = extractedInfo;
    
    // Move to next question or processing
    context.currentQuestionIndex++;
    
    if (context.currentQuestionIndex >= agent.questions.length) {
      // All info collected, move to processing
      context.state = ConversationState.PROCESSING;
      return agent.actionStatement;
    } else {
      // Ask next question
      return agent.questions[context.currentQuestionIndex];
    }
  }

  /**
   * Handle processing state
   */
  private async handleProcessing(message: string, context: ConversationContext): Promise<string> {
    const agent = AgentPersonas[context.agentType];
    
    // Simulate processing based on agent type
    const results = await this.performBookingSearch(context);
    
    // Move to confirmation state
    context.state = ConversationState.CONFIRMATION;
    
    // Return confirmation message with results
    return agent.confirmationTemplate
      .replace('{{count}}', results.count.toString())
      .replace('{{restaurant}}', results.restaurant || '')
      .replace('{{time}}', results.time || '');
  }

  /**
   * Handle confirmation state
   */
  private async handleConfirmation(message: string, context: ConversationContext): Promise<string> {
    const agent = AgentPersonas[context.agentType];
    
    // Check if user confirms booking
    const isConfirmation = await this.isConfirmation(message);
    
    if (isConfirmation) {
      context.state = ConversationState.COMPLETED;
      return agent.completionMessage;
    } else {
      // Handle modification requests or provide more options
      return "Would you like me to search for different options or modify your preferences?";
    }
  }

  /**
   * Extract information from user message using OpenAI
   */
  private async extractInformation(message: string, question: string): Promise<string> {
    // Fallback if OpenAI is not available
    if (!openai) {
      console.warn('[AI Agents] OpenAI not available, using fallback extraction');
      return message; // Simple fallback - return original message
    }

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `Extract the relevant information from the user's message that answers the question: "${question}". Return only the extracted information, be concise.`
          },
          {
            role: "user", 
            content: message
          }
        ],
        max_tokens: 100,
        temperature: 0.3
      });

      return completion.choices[0]?.message?.content?.trim() || message;
    } catch (error) {
      console.error('OpenAI extraction error:', error);
      return message; // Fallback to original message
    }
  }

  /**
   * Check if message is a confirmation
   */
  private async isConfirmation(message: string): Promise<boolean> {
    const confirmationWords = ['yes', 'confirm', 'book', 'proceed', 'ok', 'sure', 'go ahead'];
    const rejectionWords = ['no', 'cancel', 'different', 'change', 'modify'];
    
    const lowerMessage = message.toLowerCase();
    
    const hasConfirmation = confirmationWords.some(word => lowerMessage.includes(word));
    const hasRejection = rejectionWords.some(word => lowerMessage.includes(word));
    
    return hasConfirmation && !hasRejection;
  }

  /**
   * Convert question to storage key
   */
  private getQuestionKey(question: string): string {
    return question.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 20);
  }

  /**
   * Perform booking search based on collected information
   */
  private async performBookingSearch(context: ConversationContext): Promise<any> {
    // This would integrate with actual booking APIs (Amadeus, etc.)
    // For now, return mock results
    
    switch (context.agentType) {
      case AgentType.FLIGHT:
        return { count: 3, type: 'flights' };
      case AgentType.HOTEL:
        return { count: 4, type: 'hotels' };
      case AgentType.RESTAURANT:
        return { count: 1, restaurant: 'Nobu Dubai', time: context.collectedInfo.date_and_time || '8:00 PM' };
      case AgentType.LUXURY:
        return { count: 2, type: 'luxury services' };
      default:
        return { count: 0, type: 'general' };
    }
  }

  /**
   * Classify user intent to determine agent type
   */
  static async classifyIntent(message: string): Promise<AgentType> {
    const keywords = {
      [AgentType.FLIGHT]: ['flight', 'fly', 'airline', 'airport', 'ticket', 'travel'],
      [AgentType.HOTEL]: ['hotel', 'stay', 'accommodation', 'room', 'check in', 'resort'],
      [AgentType.RESTAURANT]: ['restaurant', 'dinner', 'lunch', 'eat', 'table', 'reservation', 'food'],
      [AgentType.LUXURY]: ['yacht', 'supercar', 'luxury', 'vip', 'private', 'exclusive', 'chef']
    };

    const lowerMessage = message.toLowerCase();
    
    for (const [agentType, agentKeywords] of Object.entries(keywords)) {
      if (agentKeywords.some(keyword => lowerMessage.includes(keyword))) {
        return agentType as AgentType;
      }
    }

    return AgentType.GENERAL;
  }

  /**
   * Create new conversation context
   */
  static createNewContext(
    userId: string, 
    conversationId: string, 
    agentType: AgentType = AgentType.GENERAL
  ): ConversationContext {
    return {
      userId,
      conversationId,
      agentType,
      state: ConversationState.WELCOME,
      collectedInfo: {},
      messageHistory: [],
      currentQuestionIndex: 0,
      retryCount: 0,
      escalated: false
    };
  }
}

export default AIAgentService; 