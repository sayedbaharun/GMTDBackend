const memberIntelligenceService = require('../services/memberIntelligenceService');
const { v4: uuidv4 } = require('uuid');

// Enhanced AI response system for luxury Dubai concierge
const enhancedAI = {
  async createChatCompletion(message, context = {}) {
    const { intent = 'GENERAL', entities = {}, mood = 'NEUTRAL' } = context;
    
    // Generate contextual luxury responses based on intent
    let response = '';
    
    switch (intent) {
      case 'RESTAURANT_BOOKING':
        response = `I'd be delighted to arrange an exquisite dining experience for you! Based on your request "${message}", I recommend these premier options:

🏆 **Nobu Dubai** - World-renowned Japanese cuisine with stunning views
• Signature black cod miso and wagyu beef
• Private dining rooms available
• I can secure you a prime table with city views

🥂 **Zuma Dubai** - Contemporary Japanese robatayaki
• Celebrity chef favorite with premium sake selection  
• Rooftop terrace overlooking Dubai skyline
• VIP booth reservations available

✨ **La Petite Maison** - Mediterranean fine dining
• Fresh ingredients flown in daily from France
• Elegant terrace with DIFC views
• Chef's tasting menu with wine pairings

Shall I proceed with booking your preferred restaurant? I can also arrange special touches like champagne service, floral arrangements, or a personal chef's greeting.`;
        break;

      case 'HOTEL_UPGRADE':
        response = `Absolutely! I specialize in securing the finest accommodations in Dubai. For your request "${message}", here are the luxury upgrades I can arrange:

🏨 **Burj Al Arab** - The world's most luxurious hotel
• Royal Suite with personal butler service
• Rolls-Royce airport transfers included  
• Access to private beach and terrace

🌟 **Atlantis The Palm** - Iconic luxury resort
• Royal Bridge Suite with underwater views
• Private beach cabana and pool access
• Complimentary spa treatments and fine dining

🏛️ **Four Seasons Dubai** - Timeless elegance
• Presidential Suite with panoramic city views
• 24/7 personal concierge service
• Access to exclusive Royal Beach Club

I can negotiate complimentary upgrades and special amenities. What dates are you considering, and do you have any specific preferences for views or services?`;
        break;

      case 'FLIGHT_BOOKING':
        response = `I'll ensure your journey to Dubai is nothing short of extraordinary! For "${message}", here's what I can arrange:

✈️ **Emirates First Class** - The ultimate in luxury travel
• Private suites with flat-bed seating
• Onboard shower spa and bar access
• Chauffeur-driven transfers to/from airport

🥂 **Business Class Premium** - Sophisticated comfort
• Lie-flat seats with direct aisle access  
• Priority boarding and lounge access
• Premium dining and beverage service

🚗 **Ground Services**
• Meet & greet at departure airport
• Fast-track immigration and customs
• Luxury vehicle transfer to your hotel

Would you like me to check availability for specific dates? I can also arrange special dietary requirements, seat preferences, and coordinate with your hotel arrival.`;
        break;

      case 'ACTIVITY_BOOKING':
        response = `I'm thrilled to curate unforgettable Dubai experiences for you! Based on "${message}", here are some exclusive activities:

🏜️ **VIP Desert Safari** - Ultimate luxury adventure
• Private vintage Land Rover with expert guide
• Falconry demonstration and camel interactions
• Gourmet dinner under the stars with entertainment

🛥️ **Private Yacht Charter** - Dubai Marina & Burj Al Arab
• Luxury yacht with personal crew and chef
• Swimming, snorkeling, and jet ski access
• Sunset cruise with champagne and canapés

🏗️ **Burj Khalifa VIP Access** - At the top experience
• Private elevator and SKY lounge access
• Professional photographer for exclusive shots
• Afternoon tea at Armani Hotel

Each experience includes personal concierge coordination and luxury transportation. What type of Dubai adventure excites you most?`;
        break;

      default:
        response = `Welcome to GMTD - your personal luxury concierge for Dubai! I'm here to create extraordinary experiences tailored just for you.

🌟 **How I can assist you today:**

🍽️ **Dining** - Exclusive reservations at Dubai's finest restaurants
🏨 **Accommodation** - Luxury hotel upgrades and premium suites  
✈️ **Travel** - First-class flights and private jet arrangements
🎯 **Experiences** - VIP desert safaris, yacht charters, and cultural tours
🛍️ **Shopping** - Personal shopping at Dubai Mall with luxury brands
🎭 **Entertainment** - Premium tickets and exclusive access to events

Simply tell me what Dubai experience you're dreaming of, and I'll make it happen with the finest attention to detail. Whether it's a romantic dinner, family adventure, or business travel, I'm here to exceed your expectations.

What would you like to explore first?`;
    }

    return {
      data: {
        choices: [{
          message: {
            content: response
          }
        }]
      }
    };
  }
};

const smartChatController = {
  async handleChat(req, res) {
    try {
      const { userId, message, conversationId } = req.body;

      if (!userId || !message) {
        return res.status(400).json({
          error: 'Missing required fields: userId and message'
        });
      }

      // Generate conversation ID if not provided
      const currentConversationId = conversationId || uuidv4();

      // Detect intent and context from user message
      const intent = memberIntelligenceService.detectIntent(message);
      const mood = memberIntelligenceService.detectUserMood(message);
      const entities = memberIntelligenceService.extractTravelEntities(message);

      // Check if we can answer from knowledge base first
      const apiCheck = await memberIntelligenceService.shouldUseAPI(message, intent);
      
      let response;
      let source;
      let apiCallSaved = false;

      if (!apiCheck.useAPI && apiCheck.answer) {
        // Use knowledge base answer
        response = apiCheck.answer;
        source = 'knowledge_base';
        apiCallSaved = true;
        
        // Track that we saved an API call
        await memberIntelligenceService.updateBehaviorAnalytics(userId, 'knowledge_base_hit');
      } else {
        // Use enhanced AI to generate contextual response
        const aiResponse = await enhancedAI.createChatCompletion(message, {
          intent,
          entities,
          mood
        });
        response = aiResponse.data.choices[0].message.content;
        source = 'ai_with_context';
        
        // Track conversation
        await memberIntelligenceService.updateBehaviorAnalytics(userId, 'conversation');
      }

      // Store conversation memory
      const conversationData = {
        intent,
        entities,
        mood,
        message,
        response
      };

      await memberIntelligenceService.storeConversationMemory(
        userId, 
        currentConversationId, 
        conversationData
      );

      // Generate personalized suggestions
      const suggestions = await memberIntelligenceService.generatePersonalizedSuggestions(
        userId, 
        intent
      );

      res.json({
        response,
        source,
        apiCallSaved,
        conversationId: currentConversationId,
        userContext: {
          intent,
          mood,
          entities,
          suggestions: [
            ...suggestions.recommendations,
            ...suggestions.upgrades
          ].slice(0, 3) // Limit to 3 suggestions
        }
      });

    } catch (error) {
      console.error('Smart chat error:', error);
      res.status(500).json({
        error: 'Failed to process smart chat request',
        details: error.message
      });
    }
  },

  async getAnalytics(req, res) {
    try {
      // Mock analytics data
      res.json({
        totalConversations: 1247,
        apiCallsSaved: 623,
        averageResponseTime: '0.8s',
        topIntents: [
          { intent: 'restaurant_booking', count: 156 },
          { intent: 'hotel_upgrade', count: 134 },
          { intent: 'activity_booking', count: 98 }
        ],
        knowledgeBaseHitRate: 0.52
      });
    } catch (error) {
      console.error('Analytics error:', error);
      res.status(500).json({
        error: 'Failed to fetch analytics'
      });
    }
  },

  async getKnowledgeStats(req, res) {
    try {
      // Mock knowledge base stats
      res.json({
        totalEntries: 1456,
        totalUsage: 3247,
        avgConfidenceScore: 0.87,
        lastUpdated: new Date().toISOString(),
        categories: [
          { category: 'restaurants', count: 234 },
          { category: 'hotels', count: 189 },
          { category: 'activities', count: 156 },
          { category: 'transportation', count: 98 }
        ]
      });
    } catch (error) {
      console.error('Knowledge stats error:', error);
      res.status(500).json({
        error: 'Failed to fetch knowledge base statistics'
      });
    }
  }
};

module.exports = smartChatController; 