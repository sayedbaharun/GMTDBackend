"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { MessageCircle, X, Send, Wifi, WifiOff, Crown, Star } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import dubaiFallbackData from "@/lib/fallback-data"
import { monitorConnection, getApiAvailability, setApiAvailability, isOnline } from "@/lib/connection-utils"
import { parseDateString } from "@/lib/date-utils"

// Type definition for message objects
type Message = {
  role: "user" | "assistant" | "system";
  content: string;
}

// # Define types for category keys to fix TypeScript errors
type RestaurantCategory = 'rooftop' | 'fineDining' | 'beachside' | 'localCuisine';
type HotelCategory = 'fiveStar' | 'beachResorts' | 'boutique';
type AttractionCategory = 'cultural' | 'adventure' | 'shopping' | 'beaches';

// Sales-focused AI Chat Widget - Luxury Lead Generation
const AIChatWidget = () => {
  const [isOpen, setIsOpen] = useState(true)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "✨ Welcome to Get Me To Dubai — where luxury meets personalization! I'm your exclusive concierge consultant. Are you ready to discover how we transform ordinary Dubai trips into extraordinary experiences that money can't usually buy?",
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [useFallback, setUseFallback] = useState(false)
  const [internetStatus, setInternetStatus] = useState<boolean>(true)
  const [conversationStep, setConversationStep] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const apiFailCount = useRef<number>(0)

  // Member testimonials for social proof
  const memberTestimonials = [
    `💬 "GMTD got us into Atlantis's private villa that wasn't even advertised online. Plus saved us $3,000!" - Sarah M., London`,
    `💬 "The private Gold Souk tour they arranged was magical. Experiences you literally can't buy anywhere else." - James R., NYC`,
    `💬 "Their AI knew my preferences better than I did. Every recommendation was perfect!" - Maria L., Dubai member`,
    `💬 "We saved 40% and got experiences 10x better than what we planned ourselves." - Ahmed K., Premium member`,
    `💬 "Private yacht dinner with Burj Khalifa views for less than a regular restaurant? Mind blown!" - Lisa T., Member since 2024`
  ];

  const getRandomTestimonial = (): string => {
    return memberTestimonials[Math.floor(Math.random() * memberTestimonials.length)];
  };

  // Check internet connection status and OpenAI API availability
  useEffect(() => {
    // Check if device is online
    setInternetStatus(isOnline())
    
    // Monitor connection changes
    const cleanup = monitorConnection((online) => {
      setInternetStatus(online)
      if (!online) {
        setUseFallback(true)
      }
    })
    
    // Check if OpenAI is available from previous sessions
    const openAIAvailable = getApiAvailability('openai')
    if (!openAIAvailable) {
      setUseFallback(true)
    }
    
    return cleanup
  }, [])
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Simplified toggle function
  const toggleChat = () => {
    console.log("Toggling chat, current state:", isOpen)
    setIsOpen(!isOpen)
  }

  // Registration intent detection
  const detectRegistrationIntent = (input: string): boolean => {
    const registrationKeywords = [
      'sign up', 'register', 'join', 'membership', 'member', 'profile',
      'yes', 'interested', 'tell me more', 'how do i', 'want to',
      'show me', 'preview', 'start', 'begin', 'ready', 'create'
    ];
    
    return registrationKeywords.some(keyword => 
      input.toLowerCase().includes(keyword)
    );
  };

  // Handle registration flow
  const handleRegistrationFlow = (input: string): string => {
    if (detectRegistrationIntent(input)) {
      return `🎉 Perfect! I'm creating your exclusive member preview now. 

Here's what you'll get immediately:
✅ Personalized Dubai luxury itinerary 
✅ Member-only pricing on all experiences
✅ Priority access to sold-out venues
✅ 24/7 concierge support

Just click here to create your profile (takes 30 seconds): 
[Start My Dubai Experience →](http://localhost:5000/public/index.html)

Once you're set up, I'll show you exclusive options that will absolutely amaze you! 🌟`;
    }
    
    return '';
  };

  // Sales-focused conversation flows
  const generateSalesResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    // KEYWORD-BASED RESPONSES WITH SALES INTEGRATION
    if (input.includes('price') || input.includes('cost') || input.includes('expensive') || input.includes('budget')) {
      return `💰 Great question! Here's the thing - our members typically SAVE money while getting exponentially better experiences. For example, instead of paying $500 for a regular Burj Khalifa dinner, our members get a private dining room with panoramic views for $400. Want me to show you the specific savings for your travel style?`;
    }
    
    if (input.includes('restaurant') || input.includes('dining') || input.includes('eat') || input.includes('food')) {
      return `🍽️ Dubai's restaurant scene is incredible, but the BEST tables are never available to the public. Our members dine at places like Nobu's private chef table, exclusive rooftop venues, and restaurants that don't even advertise. For instance, we have a partnership with a Michelin-starred chef who only cooks for 12 people per night. Interested in seeing what's possible for your trip?`;
    }
    
    if (input.includes('hotel') || input.includes('stay') || input.includes('accommodation') || input.includes('resort')) {
      return `🏨 Forget standard hotels! Our members stay in experiences: Private villas with personal butlers, hotel suites that aren't bookable online, and resorts where they upgrade you automatically. Last week, a member got a $5,000/night suite for $2,000 because of our partnerships. Want to see what's available for your dates?`;
    }
    
    if (input.includes('experience') || input.includes('activities') || input.includes('things to do') || input.includes('adventure')) {
      return `🎯 This is where we really shine! Private desert camps with Michelin dining, after-hours Gold Souk tours, yacht parties with A-list DJs, helicopter tours that land on private islands. These aren't touristy activities - they're once-in-a-lifetime experiences. Ready to see what's possible for you?`;
    }

    if (input.includes('luxury') || input.includes('exclusive') || input.includes('vip') || input.includes('premium')) {
      return `✨ Now you're speaking my language! Luxury in Dubai isn't just about spending more - it's about accessing the impossible. Our members enjoy private shopping at closed boutiques, dinner parties on yachts with celebrities, and experiences that literally don't exist for the general public. What defines luxury for you?`;
    }

    if (input.includes('how') || input.includes('work') || input.includes('process') || input.includes('magic')) {
      return `⚡ Here's how the magic happens: 1) Share your travel style/preferences 2) Our AI creates a personalized luxury itinerary 3) We use our exclusive partnerships to secure the impossible 4) You enjoy experiences most people don't even know exist. The whole process takes 5 minutes, but the memories last forever. Want to start?`;
    }

    if (input.includes('flight') || input.includes('fly') || input.includes('airline') || input.includes('airport')) {
      return `✈️ Flights are just the beginning! While I can help you find great flights, what happens AFTER you land is where we create magic. Private airport pickup in a Rolls Royce, helicopter transfer to your hotel, or arriving to find your suite already stocked with your favorite champagne - that's the GMTD difference. Interested in the full luxury arrival experience?`;
    }

    if (input.includes('yacht') || input.includes('boat') || input.includes('cruise') || input.includes('sailing')) {
      return `🛥️ Yacht experiences are our specialty! We arrange everything from intimate sunset dinners for two to 50-person parties with international DJs. Our fleet includes yachts that aren't available for public charter. Last month, we had a member's proposal on a yacht that usually only hosts A-list celebrities. Ready to explore the waters in style?`;
    }

    if (input.includes('shopping') || input.includes('mall') || input.includes('gold') || input.includes('jewelry')) {
      return `💎 Shopping in Dubai can be ordinary or extraordinary. Our members shop after-hours at the Gold Souk with personal experts, get private showings at luxury boutiques, and access sales events not open to the public. We recently arranged a private viewing at Cartier for a member - they saved 25% on a piece that wasn't even in the regular collection. Interested in exclusive shopping experiences?`;
    }
    
    // DEFAULT SALES RESPONSES WITH URGENCY AND VALUE
    const defaultSalesResponses = [
      `🌟 Dubai is extraordinary, but most people only see 10% of what's possible. Our members access the hidden 90% - private venues, exclusive experiences, and insider connections. What aspect of Dubai excites you most?`,
      `✨ You know what's interesting? Most Dubai visitors spend weeks planning and still miss the best experiences. Our AI creates perfect itineraries in minutes using our exclusive partnerships. What's your ideal Dubai vibe?`,
      `🎯 I love helping people discover Dubai's secrets! Are you interested in luxury dining, exclusive experiences, cultural immersion, or maybe a mix of everything? Let me show you what's possible.`,
      `💎 Dubai has endless possibilities, but the truly special experiences require insider access. That's where we come in. What would make your Dubai trip absolutely unforgettable?`,
      `⏰ Quick heads up: We only accept 50 new members per month to maintain our exclusive service quality. This month we have 7 spots remaining. What brings you to Dubai?`
    ];
    
    return defaultSalesResponses[Math.floor(Math.random() * defaultSalesResponses.length)];
  };

  // ... existing code ...
} 