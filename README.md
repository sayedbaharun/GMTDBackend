# GMTD Luxury Concierge Platform

**GetMeToDub.ai** - Your AI-powered luxury concierge for Dubai's most exclusive experiences.

## 🏆 Current Status: FULLY OPERATIONAL

### ✅ **Latest Updates (January 2025)**

**🔧 Functionality Restored:**
- ✅ **Flight Search**: Real Amadeus API integration returning 20+ flight options
- ✅ **Hotel Search**: Live Dubai hotel data with 10+ premium properties  
- ✅ **API Integration**: Fixed parameter mapping and error handling
- ✅ **Booking Flow**: Mock endpoints ready for production deployment

**🎨 Brand UX/UI Enhanced:**
- ✅ **Luxury Dashboard**: Premium navigation with GMTD branding
- ✅ **Brand Colors**: Navy, Gold, Electric blue consistently applied
- ✅ **Mobile Responsive**: Optimized for all device sizes
- ✅ **Premium Animations**: Hover effects and luxury interactions

## 🚀 **Live Demo**

- **Main Dashboard**: http://localhost:3002/dashboard
- **Flight Search**: http://localhost:3002/dashboard/flights  
- **Hotel Search**: http://localhost:3002/dashboard/hotels
- **Backend API**: http://localhost:5000/api/health

## 🏗️ **Architecture**

### **Frontend (Next.js 14)**
- **Port**: 3002
- **Framework**: Next.js with TypeScript
- **Styling**: Tailwind CSS with luxury brand theme
- **Components**: Shadcn/ui with custom GMTD styling

### **Backend (Node.js/Express)**
- **Port**: 5000
- **APIs**: Amadeus (flights/hotels), Stripe (payments)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Auth0 integration

## 🎯 **Key Features**

### **✈️ Flight Search & Booking**
- Real-time Amadeus API integration
- 20+ flight options for popular routes (e.g., JFK→DXB)
- Price range: $503-$688 USD
- Multiple airlines: Emirates, Air Canada, Swiss, United, Lufthansa
- VIP booking flow with 5% GMTD service fee

### **🏨 Hotel Search & Booking**
- Live Dubai hotel inventory
- Premium properties: Shangri La, Sofitel, luxury brands
- Real pricing and availability
- Exclusive perks and upgrades

### **💎 Luxury Experience**
- AI-powered concierge recommendations
- VIP treatment and exclusive access
- Premium brand styling throughout
- Client-first user experience

## 🛠️ **Installation & Setup**

### **Prerequisites**
- Node.js 18+
- PostgreSQL database
- Amadeus API credentials
- Stripe API keys
- Auth0 configuration

### **Backend Setup**
```bash
cd gmtd_web_backend
npm install
cp .env.example .env
# Configure your API keys in .env
npm run build
npm start
```

### **Frontend Setup**
```bash
cd gmtd_web_frontend
npm install
cp .env.local.example .env.local
# Configure your environment variables
npm run dev
```

## 🔑 **Environment Variables**

### **Backend (.env)**
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/gmtd_db"

# Amadeus API
AMADEUS_CLIENT_ID="your_amadeus_client_id"
AMADEUS_CLIENT_SECRET="your_amadeus_client_secret"
AMADEUS_HOSTNAME="test"  # or "production"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Auth0
AUTH0_SECRET="your_auth0_secret"
AUTH0_BASE_URL="http://localhost:5000"
AUTH0_ISSUER_BASE_URL="https://your-domain.auth0.com"
AUTH0_CLIENT_ID="your_auth0_client_id"
AUTH0_CLIENT_SECRET="your_auth0_client_secret"
```

### **Frontend (.env.local)**
```env
# Auth0
AUTH0_SECRET="your_auth0_secret"
AUTH0_BASE_URL="http://localhost:3002"
AUTH0_ISSUER_BASE_URL="https://your-domain.auth0.com"
AUTH0_CLIENT_ID="your_auth0_client_id"
AUTH0_CLIENT_SECRET="your_auth0_client_secret"

# API
NEXT_PUBLIC_API_URL="http://localhost:5000"
```

## 🎨 **Brand Guidelines**

### **Color Palette**
- **Navy**: `#070726` - Primary background
- **Gold**: `#D4AF37` - Primary accent, buttons, highlights
- **Electric**: `#00D4FF` - Secondary accent, status indicators
- **Ivory**: `#F5F5DC` - Text and content
- **Platinum**: `#E5E4E2` - Secondary text

### **Typography**
- **Headings**: Bold, gradient text effects
- **Body**: Clean, readable with proper hierarchy
- **Luxury Elements**: Crown icons, sparkles, premium spacing

### **Components**
- **Cards**: Gradient backgrounds with blur effects
- **Buttons**: Gold gradients with hover animations
- **Navigation**: Sticky header with active states
- **Mobile**: Responsive grid layouts

## 📊 **API Endpoints**

### **Travel Search**
- `GET /api/travel/flights` - Search flights
- `GET /api/travel/hotels` - Search hotels
- `GET /api/travel/airports` - Airport lookup

### **Booking**
- `POST /api/flight-booking/mock-booking` - Initiate flight booking
- `POST /api/hotel-booking/mock-booking` - Initiate hotel booking
- `POST /api/flight-booking/confirm` - Confirm booking

### **Health & Status**
- `GET /api/health` - System health check

## 🧪 **Testing**

### **API Testing**
```bash
# Test flight search
curl "http://localhost:5000/api/travel/flights?origin=JFK&destination=DXB&departureDate=2025-06-01&adults=1&travelClass=ECONOMY"

# Test hotel search  
curl "http://localhost:5000/api/travel/hotels?cityCode=DXB&checkInDate=2025-06-01&checkOutDate=2025-06-03&adults=2"

# Test health
curl "http://localhost:5000/api/health"
```

### **Frontend Testing**
- Navigate to http://localhost:3002/dashboard
- Test flight search functionality
- Test hotel search functionality
- Verify responsive design on mobile

## 🚀 **Deployment**

### **Production Checklist**
- [ ] Update environment variables for production
- [ ] Configure production database
- [ ] Set up Amadeus production credentials
- [ ] Configure Stripe live keys
- [ ] Set up Auth0 production tenant
- [ ] Configure domain and SSL
- [ ] Set up monitoring and logging

### **Recommended Hosting**
- **Frontend**: Vercel, Netlify
- **Backend**: Railway, Heroku, DigitalOcean
- **Database**: Supabase, PlanetScale, AWS RDS

## 📈 **Revenue Model**

- **Service Fee**: 5% on all bookings
- **Membership Tiers**: $249-$499 annual subscriptions
- **VIP Services**: Premium concierge add-ons

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Follow the brand guidelines
4. Test thoroughly
5. Submit a pull request

## 📞 **Support**

- **Email**: info@getmetodub.ai
- **Phone**: +44 7417 411359
- **Address**: 71-75 Shelton Street, Covent Garden, London, WC2H 9JQ

## 📄 **License**

Proprietary - All rights reserved to GetMeToDub.ai

## Member Intelligence System

A sophisticated system designed to enhance user experience through personalization and proactive service. It comprises several key components:

-   **`MemberIntelligenceService`**: Core service for managing user preferences, conversation memory, a smart knowledge base, and behavioral analytics. It aims to understand user needs deeply and provide tailored suggestions.
-   **`SmartChatController`**: Handles chat requests, leveraging the `MemberIntelligenceService` to provide context-aware AI responses. It checks a knowledge base to answer common questions without unnecessary API calls, thereby reducing costs.
-   **Prisma Models**:
    -   `UserPreferences`: Stores individual user preferences (e.g., preferred airlines, destinations, communication style).
    -   `ConversationMemory`: Logs conversation details (intent, entities, mood, key topics) for future context.
    -   `KnowledgeBase`: Common travel questions and answers to reduce API calls.
    -   `UserBehaviorAnalytics`: Tracks user engagement patterns and preferences.

### Architecture

The system follows a layered architecture:
1.  **Controller Layer**: `SmartChatController` handles HTTP requests
2.  **Service Layer**: `MemberIntelligenceService` contains business logic
3.  **Data Layer**: Prisma ORM manages database interactions

### API Integration

-   **Amadeus API**: For real-time flight and hotel data
-   **OpenAI GPT-4**: For natural language processing and conversation
-   **Stripe**: For payment processing and subscription management
-   **Auth0**: For user authentication and authorization

### Deployment

The backend is configured for deployment on various platforms:
-   Local development: `npm run dev`
-   Production build: `npm run build`
-   Start production: `npm start`

For detailed API documentation, see `DOCUMENTATION.md`.

---

**Built with ❤️ for luxury travelers who demand the extraordinary.**