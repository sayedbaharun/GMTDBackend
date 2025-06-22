// Simplified Member Intelligence Service 
// Using mock data to avoid database connection issues for demo

const memberIntelligenceService = {
  
  // Enhanced intent detection
  detectIntent(message) {
    const msg = message.toLowerCase();
    
    // Restaurant and dining keywords
    if (msg.includes('restaurant') || msg.includes('dinner') || msg.includes('lunch') || 
        msg.includes('eat') || msg.includes('dining') || msg.includes('table') || 
        msg.includes('reservation') || msg.includes('food') || msg.includes('meal') ||
        msg.includes('anniversary') || msg.includes('romantic') || msg.includes('fine dining')) {
      return 'RESTAURANT_BOOKING';
    }
    
    // Hotel and accommodation keywords  
    if (msg.includes('hotel') || msg.includes('room') || msg.includes('suite') || 
        msg.includes('upgrade') || msg.includes('stay') || msg.includes('accommodation') ||
        msg.includes('booking') || msg.includes('check-in') || msg.includes('resort')) {
      return 'HOTEL_UPGRADE';
    }
    
    // Flight and travel keywords
    if (msg.includes('flight') || msg.includes('airline') || msg.includes('business class') ||
        msg.includes('first class') || msg.includes('travel') || msg.includes('flying') ||
        msg.includes('airport') || msg.includes('ticket')) {
      return 'FLIGHT_BOOKING';
    }
    
    // Activity and experience keywords
    if (msg.includes('activity') || msg.includes('tour') || msg.includes('experience') ||
        msg.includes('safari') || msg.includes('yacht') || msg.includes('burj khalifa') ||
        msg.includes('sightseeing') || msg.includes('adventure') || msg.includes('excursion') ||
        msg.includes('entertainment') || msg.includes('show') || msg.includes('event')) {
      return 'ACTIVITY_BOOKING';
    }
    
    return 'GENERAL';
  },

  // Simple mood detection
  detectUserMood(message) {
    const urgentWords = ['urgent', 'asap', 'immediately', 'emergency', 'quickly'];
    const excitedWords = ['excited', 'amazing', 'fantastic', 'great', 'awesome'];
    const frustratedWords = ['frustrated', 'annoyed', 'difficult', 'problem', 'issue'];
    
    const lowerMessage = message.toLowerCase();
    
    if (urgentWords.some(word => lowerMessage.includes(word))) return 'URGENT';
    if (excitedWords.some(word => lowerMessage.includes(word))) return 'EXCITED';
    if (frustratedWords.some(word => lowerMessage.includes(word))) return 'FRUSTRATED';
    
    return 'NEUTRAL';
  },

  // Extract travel entities
  extractTravelEntities(message) {
    const entities = {
      destinations: [],
      dates: [],
      airlines: [],
      hotels: []
    };

    const cityPattern = /\b(dubai|london|new york|paris|tokyo|singapore|mumbai|delhi)\b/gi;
    const datePattern = /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})\b/g;
    const airlinePattern = /\b(emirates|etihad|british airways|lufthansa|air france|qatar airways)\b/gi;

    entities.destinations = [...new Set(message.match(cityPattern) || [])];
    entities.dates = [...new Set(message.match(datePattern) || [])];
    entities.airlines = [...new Set(message.match(airlinePattern) || [])];

    return entities;
  },

  // Mock knowledge base check
  async shouldUseAPI(message, category) {
    const commonQuestions = {
      'how long is the flight from london to dubai': 'The flight from London to Dubai takes approximately 7 hours direct.',
      'what is the time difference between dubai and london': 'Dubai is 4 hours ahead of London (3 hours during British Summer Time).',
      'what currency is used in dubai': 'The currency used in Dubai is the UAE Dirham (AED). 1 USD ≈ 3.67 AED.',
      'what is the weather like in dubai': 'Dubai has a desert climate with hot summers (40°C+) and mild winters (20-30°C). Best time to visit is November to March.',
      'do i need a visa for dubai': 'Visa requirements depend on your nationality. Many countries get visa-on-arrival or visa-free entry. Check with UAE immigration.',
      'what are the best restaurants in dubai': 'Top luxury restaurants include Nobu, Zuma, La Petite Maison, Pierchic, and Nathan Outlaw at Al Mahara.',
      'where to stay in dubai': 'Luxury hotels include Burj Al Arab, Atlantis The Palm, Four Seasons, Armani Hotel, and One&Only Royal Mirage.'
    };

    const lowerMessage = message.toLowerCase().trim();
    
    for (const [question, answer] of Object.entries(commonQuestions)) {
      if (lowerMessage.includes(question) || question.includes(lowerMessage)) {
        return {
          useAPI: false,
          answer: answer,
          source: 'knowledge_base'
        };
      }
    }

    return { useAPI: true };
  },

  // Mock conversation memory storage
  async storeConversationMemory(userId, conversationId, data) {
    console.log(`[MEMORY] Stored conversation for user ${userId}: ${JSON.stringify(data)}`);
    return { success: true };
  },

  // Mock behavior analytics
  async updateBehaviorAnalytics(userId, action, data = {}) {
    console.log(`[ANALYTICS] User ${userId} action: ${action}`, data);
    return { success: true };
  },

  // Mock personalized suggestions
  async generatePersonalizedSuggestions(userId, requestType) {
    const suggestions = {
      recommendations: [],
      upgrades: [],
      alternatives: []
    };

    switch (requestType) {
      case 'RESTAURANT_BOOKING':
        suggestions.recommendations.push('I recommend Nobu Dubai with stunning views');
        suggestions.upgrades.push('Would you like a private dining room?');
        break;

      case 'HOTEL_UPGRADE':
        suggestions.recommendations.push('I can arrange a suite upgrade at Burj Al Arab');
        suggestions.upgrades.push('Shall I add butler service and spa access?');
        break;

      case 'FLIGHT_BOOKING':
        suggestions.recommendations.push('Emirates first class has private suites');
        suggestions.upgrades.push('Would you like lounge access and priority boarding?');
        break;

      case 'ACTIVITY_BOOKING':
        suggestions.recommendations.push('Private desert safari with falconry experience');
        suggestions.upgrades.push('Add helicopter transfer and champagne dinner?');
        break;

      default:
        suggestions.recommendations.push('Let me know what Dubai experience interests you most');
        break;
    }

    return suggestions;
  }
};

module.exports = memberIntelligenceService; 