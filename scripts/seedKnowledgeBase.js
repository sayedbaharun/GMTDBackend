import { PrismaClient } from '@prisma/client';
import memberIntelligenceService from '../src/services/memberIntelligenceService.js';

const prisma = new PrismaClient();

const commonTravelKnowledge = [
  // Flight Information
  {
    category: 'FLIGHT_FAQ',
    question: 'How long is the flight from London to Dubai?',
    answer: 'A direct flight from London to Dubai takes approximately 7 hours. Emirates and British Airways offer direct flights on this route.',
    keywords: ['london', 'dubai', 'flight', 'duration', 'time', 'hours']
  },
  {
    category: 'FLIGHT_FAQ',
    question: 'What airlines fly from London to Dubai?',
    answer: 'Emirates, British Airways, Virgin Atlantic, and Etihad Airways offer flights from London to Dubai. Emirates offers the most frequent direct flights.',
    keywords: ['airlines', 'london', 'dubai', 'emirates', 'british airways', 'virgin']
  },
  {
    category: 'FLIGHT_FAQ',
    question: 'When is the best time to book flights to Dubai?',
    answer: 'The best time to book flights to Dubai is 6-8 weeks in advance. Avoid peak season (December-March) for better prices. Tuesday and Wednesday departures are typically cheaper.',
    keywords: ['best time', 'book flights', 'dubai', 'advance', 'cheap', 'booking']
  },

  // Dubai General Information
  {
    category: 'DESTINATION_GUIDE',
    question: 'What currency is used in Dubai?',
    answer: 'The currency used in Dubai is the UAE Dirham (AED). 1 USD = approximately 3.67 AED. Credit cards are widely accepted.',
    keywords: ['currency', 'dubai', 'dirham', 'aed', 'money', 'exchange']
  },
  {
    category: 'DESTINATION_GUIDE',
    question: 'What is the time difference between Dubai and London?',
    answer: 'Dubai is 4 hours ahead of London (GMT+4). When it\'s 12:00 PM in London, it\'s 4:00 PM in Dubai.',
    keywords: ['time difference', 'dubai', 'london', 'timezone', 'gmt', 'hours ahead']
  },
  {
    category: 'DESTINATION_GUIDE',
    question: 'Do I need a visa for Dubai?',
    answer: 'UK citizens get a free 30-day visa on arrival in Dubai. US citizens also get visa-free entry for 30 days. Other nationalities should check UAE embassy requirements.',
    keywords: ['visa', 'dubai', 'uk', 'us', 'citizens', 'entry', 'requirements']
  },
  {
    category: 'DESTINATION_GUIDE',
    question: 'What is the weather like in Dubai?',
    answer: 'Dubai has a desert climate. Best weather is November-April (20-30°C). Summer (May-October) is very hot (35-45°C). It rarely rains.',
    keywords: ['weather', 'dubai', 'temperature', 'climate', 'hot', 'best time']
  },

  // Hotel Information
  {
    category: 'HOTEL_INFO',
    question: 'What are the best areas to stay in Dubai?',
    answer: 'Popular areas include: Downtown Dubai (Burj Khalifa area), Dubai Marina, Jumeirah Beach, Palm Jumeirah, and DIFC for business travelers.',
    keywords: ['best areas', 'stay', 'dubai', 'downtown', 'marina', 'jumeirah', 'palm']
  },
  {
    category: 'HOTEL_INFO',
    question: 'What are the top luxury hotels in Dubai?',
    answer: 'Top luxury hotels include: Burj Al Arab, Atlantis The Palm, Four Seasons Resort Dubai, Jumeirah Al Qasr, and Address Downtown Dubai.',
    keywords: ['luxury hotels', 'dubai', 'burj al arab', 'atlantis', 'four seasons', 'jumeirah']
  },

  // Restaurant & Dining
  {
    category: 'RESTAURANT_INFO',
    question: 'What are the best restaurants in Dubai?',
    answer: 'Top restaurants include: Pierchic (seafood), Al Hadheerah (Emirati), Nobu (Japanese), Zuma (contemporary Japanese), and Nathan Outlaw (British seafood).',
    keywords: ['best restaurants', 'dubai', 'pierchic', 'nobu', 'zuma', 'dining', 'food']
  },
  {
    category: 'RESTAURANT_INFO',
    question: 'Is alcohol available in Dubai?',
    answer: 'Yes, alcohol is available in licensed hotels, restaurants, and bars. You need to be 21+ and carry ID. Alcohol is not sold in regular supermarkets.',
    keywords: ['alcohol', 'dubai', 'bars', 'restaurants', 'licensed', 'age limit']
  },

  // Transportation
  {
    category: 'TRANSPORT_INFO',
    question: 'How do I get from Dubai Airport to the city?',
    answer: 'Options include: Dubai Metro (cheapest), Dubai Taxi (convenient), Uber/Careem (app-based), or hotel transfers. Metro takes 45 mins to Downtown.',
    keywords: ['airport', 'dubai', 'transport', 'metro', 'taxi', 'uber', 'transfer']
  },
  {
    category: 'TRANSPORT_INFO',
    question: 'What is the best way to get around Dubai?',
    answer: 'Dubai Metro is efficient for main areas. Taxis are convenient but can be expensive. Uber/Careem are popular. Car rental is good for longer stays.',
    keywords: ['transport', 'dubai', 'metro', 'taxi', 'uber', 'car rental', 'getting around']
  },

  // Shopping & Activities
  {
    category: 'ACTIVITY_INFO',
    question: 'What are the top attractions in Dubai?',
    answer: 'Must-see attractions: Burj Khalifa, Dubai Mall, Palm Jumeirah, Dubai Marina, Gold Souk, Spice Souk, Dubai Fountain, and Jumeirah Beach.',
    keywords: ['attractions', 'dubai', 'burj khalifa', 'dubai mall', 'palm jumeirah', 'marina', 'souk']
  },
  {
    category: 'ACTIVITY_INFO',
    question: 'When is the best time to visit Dubai?',
    answer: 'Best time is November to April when temperatures are pleasant (20-30°C). Avoid summer (May-October) when it\'s extremely hot (35-45°C).',
    keywords: ['best time', 'visit', 'dubai', 'weather', 'temperature', 'season']
  }
];

async function seedKnowledgeBase() {
  console.log('🧠 Seeding GMTD Knowledge Base...');
  
  try {
    // Clear existing knowledge base
    await prisma.knowledgeBase.deleteMany({});
    console.log('✅ Cleared existing knowledge base');

    // Add new knowledge
    for (const knowledge of commonTravelKnowledge) {
      await memberIntelligenceService.addKnowledge(
        knowledge.category,
        knowledge.question,
        knowledge.answer,
        knowledge.keywords,
        false // These don't need API calls
      );
    }

    console.log(`✅ Added ${commonTravelKnowledge.length} knowledge entries`);
    
    // Verify the seeding
    const count = await prisma.knowledgeBase.count();
    console.log(`📊 Total knowledge base entries: ${count}`);
    
    console.log('🎉 Knowledge base seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding knowledge base:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedKnowledgeBase(); 