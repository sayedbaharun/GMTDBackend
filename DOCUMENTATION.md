# Technical Documentation

This document provides detailed technical information about the Express TypeScript API implementation.

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Server Components](#server-components)
3. [API Implementation Details](#api-implementation-details)
4. [Authentication System](#authentication-system)
5. [Subscription Implementation](#subscription-implementation)
6. [Onboarding Flow](#onboarding-flow)
7. [Database Schema and Models](#database-schema-and-models)
8. [Amadeus Travel API Integration](#amadeus-travel-api-integration)
9. [Error Handling Strategy](#error-handling-strategy)
10. [Security Considerations](#security-considerations)
11. [Deployment Notes](#deployment-notes)
12. [Testing](#testing)

## System Architecture

The application follows a layered architecture:

```
┌─────────────────────────────────────────────────────────┐
│                        Express App                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────┐    ┌────────────┐    ┌──────────────┐  │
│  │   Routes    │───▶│Controllers │───▶│   Services   │  │
│  └─────────────┘    └────────────┘    └──────────────┘  │
│         │                                    │          │
│         │                                    │          │
│         ▼                                    ▼          │
│  ┌─────────────┐                    ┌──────────────┐   │
│  │ Middleware  │                    │External APIs │   │
│  └─────────────┘                    └──────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Multiple Server Strategy

The application is structured around multiple specialized servers, each with its own responsibilities:

1. **Express API Server** (workflow-server.js): Main API server handling all RESTful endpoints, including flight and hotel routes.
2. **Express Deployment Server** (index.js): Production deployment server, optimized for Replit deployment.
3. **Web App Server** (app.js): Serves the user-facing web application.
4. **Onboarding Server** (onboarding-server.js): Dedicated server for handling the multi-step onboarding process.
5. **Diagnostic Server** (diagnostic-server.js): System diagnostics and monitoring for development.
6. **Simple Web Server** (simple-web-server.js): For serving static assets and simple web pages.
7. **Seed Database** (seed-db.js): One-time script for database initialization.

This multi-server approach provides several benefits:
- Separation of concerns
- Improved scalability
- Easier maintenance
- Independent deployments
- Specialized configuration for each service

## Server Components

### Express API Server (workflow-server.js)

The main API server handles all RESTful endpoints. Key implementation details:

```javascript
// Core server setup
const express = require('express');
const app = express();
const cors = require('cors');
const helmet = require('helmet');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Middleware setup
app.use(express.json());
app.use(cors());
app.use(helmet());

// Route registration
const mainRouter = require('./src/routes');
app.use('/api', mainRouter);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: 'Server error' });
});

// Server startup
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Express API server running on http://0.0.0.0:${PORT}`);
});
```

### Simple Web Server (simple-web-server.js)

Serves static files and basic web pages:

```javascript
const express = require('express');
const path = require('path');
const app = express();

// Static file serving
app.use(express.static(path.join(__dirname, 'public')));

// Basic routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Server startup
const PORT = process.env.PORT || 7000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server still running on http://0.0.0.0:${PORT}`);
});
```

## API Implementation Details

### Routes Organization

Routes are organized by domain and registered in the main router:

```typescript
// src/routes/index.ts
import express from 'express';
import authRoutes from './auth';
import userRoutes from './user';
import onboardingRoutes from './onboarding';
import subscriptionRoutes from './subscriptions';
import paymentsRoutes from './payments';
import webhookRoutes from './webhooks';
import healthRoutes from './health';
import adminRoutes from './admin';
import flightRoutes from './flightRoutes';
import hotelRoutes from './hotelRoutes';

const router = express.Router();

// Register routes
router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/onboarding', onboardingRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/payments', paymentsRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/health', healthRoutes);
router.use('/admin', adminRoutes);
router.use('/flights', flightRoutes);
router.use('/hotels', hotelRoutes);

export default router;
```

### Controller Design Pattern

Controllers follow a consistent pattern:

```typescript
// Example controller pattern
export const getAllFlights = async (req: Request, res: Response) => {
  try {
    const flights = await prisma.flight.findMany();
    return res.json({ success: true, data: flights });
  } catch (error) {
    console.error('Error fetching flights:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch flights' 
    });
  }
};
```

### Route Implementation

Routes connect HTTP endpoints to controllers:

```typescript
// Example route implementation (src/routes/flightRoutes.ts)
import express, { Request, Response } from 'express';
import { 
  getAllFlights, 
  getFlightById, 
  createFlight, 
  updateFlight, 
  deleteFlight 
} from '../controllers/flightController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = express.Router();

// Public routes
router.get('/', (req: Request, res: Response) => getAllFlights(req, res));
router.get('/:id', (req: Request, res: Response) => getFlightById(req, res));

// Protected routes
router.post('/', authenticate, validate(flightSchema), 
  (req: Request, res: Response) => createFlight(req as AuthenticatedRequest, res));
router.put('/:id', authenticate, validate(updateFlightSchema), 
  (req: Request, res: Response) => updateFlight(req as AuthenticatedRequest, res));
router.delete('/:id', authenticate, 
  (req: Request, res: Response) => deleteFlight(req as AuthenticatedRequest, res));

export default router;
```

## Authentication System

The authentication system uses Supabase for user management and JWT verification.

### Authentication Flow

1. User registers or logs in via client application using Supabase Auth
2. Client receives JWT token from Supabase
3. JWT token is included in the Authorization header for subsequent requests
4. The `authenticate` middleware validates the token for protected routes

### Middleware Implementation

```typescript
// src/middleware/auth.ts
export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }

    // Verify the JWT with Supabase
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }

    // Attach user to request
    req.user = data.user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ success: false, error: 'Authentication error' });
  }
};
```

## Subscription Implementation

The Stripe integration enables subscription management with webhook-based lifecycle events.

### Subscription Creation

```typescript
// src/controllers/subscriptions.ts
export const createSubscription = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user } = req;
    const { priceId } = req.body;

    // Create or retrieve customer
    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.fullName,
      });
      stripeCustomerId = customer.id;
      
      // Update user with customer ID
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId },
      });
    }

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    });

    // Update user with subscription ID
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeSubscriptionId: subscription.id },
    });

    return res.status(200).json({
      subscriptionId: subscription.id,
      clientSecret: subscription.latest_invoice.payment_intent.client_secret,
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to create subscription' 
    });
  }
};
```

### Webhook Handling

```typescript
// src/controllers/webhooks.ts
export const handleStripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle specific events
  switch (event.type) {
    case 'customer.subscription.created':
      await handleSubscriptionCreated(event.data.object);
      break;
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object);
      break;
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object);
      break;
    case 'invoice.payment_succeeded':
      await handleInvoicePaymentSucceeded(event.data.object);
      break;
    case 'invoice.payment_failed':
      await handleInvoicePaymentFailed(event.data.object);
      break;
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return res.status(200).json({ received: true });
};
```

## Onboarding Flow

The application implements a comprehensive multi-step onboarding process for the "Get Me To Dubai" service. This process collects user information, service preferences, and processes subscription payments through Stripe.

### Onboarding Steps

The onboarding flow consists of 5 sequential steps:

#### Step 1: Personal Details

**Goal:** Capture essential identity and contact info for personalized service.

| Field                 | Type                    | Validation |
|----------------------|-------------------------|------------|
| Salutation           | Dropdown (Mr, Ms, Dr)   | Optional |
| First Name           | Text                    | Required |
| Surname              | Text                    | Required |
| Email Address        | Email                   | Required, valid email format |
| Mobile Number        | Phone (Intl format)     | Required, valid phone format |
| Country of Residence | Dropdown / Autocomplete | Required |
| Nationality          | Dropdown / Autocomplete | Optional |

#### Step 2: Preferences & Services

**Goal:** Understand user's travel intent and lifestyle preferences.

| Field                 | Type         | Validation |
|----------------------|--------------|------------|
| Services Interested In | Multi-select | Required, at least one option |
| Experience Style       | Dropdown     | Optional |

Available services include: Flights, Hotels, Beach Clubs, Yacht Rentals, Supercars, Restaurant Bookings, Events, Visa Assistance, and Concierge.

Experience styles include: Luxury, Relaxation, Adventure, Party, and Family-friendly.

#### Step 3: Preferences for Contact

**Goal:** Optimize communication for conversions.

| Field                   | Type             | Validation |
|------------------------|------------------|------------|
| Preferred Contact Method | Toggle          | Required |
| Best Time to Contact     | Time Range Picker | Optional |
| Consent Checkbox         | Checkbox        | Required |

Contact methods include: WhatsApp, Email, and Phone Call.

#### Step 4: Subscription Product

**Goal:** Present the subscription package.

The system offers a fixed premium subscription at $499. This step displays:

- Package name and description
- Comprehensive list of benefits and features
- Subscription period and billing details
- Optional promo code field

#### Step 5: Confirmation & Payment

**Goal:** Finalize subscription and process payment.

| Field                | Type         | Validation |
|---------------------|--------------|------------|
| Summary of Selections | Display block | N/A |
| Total Price          | Display (fixed $499) | N/A |
| Terms & Conditions   | Checkbox     | Required |
| Payment Method       | Stripe Integration | Required |

### Backend Processing

After the payment is processed and confirmed through Stripe, the system stores the following data:

#### Stripe Payment Details
| Field                    | Description |
|-------------------------|-------------|
| stripe_customer_id       | The Stripe customer ID for the client |
| stripe_payment_intent_id | The Stripe payment intent ID |
| payment_amount           | The amount paid ($499) |
| payment_currency         | Currency code (USD) |
| payment_status           | Status of payment (succeeded, failed, pending) |
| payment_method           | Payment method used |
| card_last4               | Last 4 digits of the card (if applicable) |
| card_brand               | Card brand (if applicable) |

#### Subscription Details
| Field                  | Description |
|-----------------------|-------------|
| subscription_id        | The Stripe subscription ID |
| subscription_status    | Status of the subscription |
| subscription_plan_id   | The ID of the subscription plan |
| subscription_plan_name | Name of the subscription plan |
| current_period_start   | Start date of current billing period |
| current_period_end     | End date of current billing period |

#### System Tracking
| Field                  | Description |
|-----------------------|-------------|
| onboarding_step        | Current step in the process |
| onboarding_complete    | Boolean flag indicating completion |
| onboarding_completed_at| Timestamp of completion |

### Implementation Details

The onboarding process is implemented through a RESTful API:

```typescript
// Onboarding Routes (src/routes/onboarding.ts)
router.get('/status', validate(onboardingValidation.getOnboardingStatus), 
  createRouteHandler(getOnboardingStatus));

router.post('/user-info', validate(onboardingValidation.userInfo), 
  createRouteHandler(saveUserInfo));

router.post('/additional-details', validate(onboardingValidation.additionalDetails), 
  createRouteHandler(saveAdditionalDetails));

router.post('/payment', validate(onboardingValidation.paymentProcess), 
  createRouteHandler(processPayment));

router.post('/complete', createRouteHandler(completeOnboarding));
```

The client-side implementation provides a responsive, user-friendly interface that guides users through each step, with proper validation and error handling at each stage.

## Database Schema and Models

The application uses Prisma ORM with PostgreSQL. Key models include:

### Prisma Schema (Simplified)

## Amadeus Travel API Integration

The application integrates with the Amadeus Travel API to provide flight search, airport location search, and travel information capabilities. This integration allows the application to access real-time travel data from Amadeus, a leading provider of travel information services.

### Service Implementation

The integration is implemented through a dedicated `AmadeusService` class that handles all API interactions:

```typescript
// src/services/amadeus.ts
import Amadeus from 'amadeus';
import { logger } from '../utils/logger';

class AmadeusService {
  private amadeus!: Amadeus;
  private isInitialized: boolean = false;

  constructor() {
    try {
      this.amadeus = new Amadeus({
        clientId: process.env.AMADEUS_API_KEY || '7GW9BtjxxiP4b9j5wjQVRJm6bjpngfPP',
        clientSecret: process.env.AMADEUS_API_SECRET || 'yrsVsEXxAckcMuqm',
      });
      this.isInitialized = true;
      logger.info('Amadeus API service initialized');
    } catch (error) {
      logger.error('Failed to initialize Amadeus API service:', error);
      this.isInitialized = false;
    }
  }

  async searchFlights(
    originCode: string,
    destinationCode: string,
    departureDate: string,
    returnDate?: string,
    adults: number = 1,
    travelClass: string = 'ECONOMY'
  ) {
    // Implementation of flight search
  }

  async searchAirports(keyword: string, subType: string = 'AIRPORT') {
    // Implementation of airport search
  }

  async testConnection() {
    // Implementation of API connectivity test
  }
}

export const amadeusService = new AmadeusService();
```

### API Routes

The travel features are exposed through dedicated REST API endpoints:

```typescript
// src/routes/travelRoutes.ts
import { Router } from 'express';
import { authenticate, authenticateOptional } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { searchFlights, searchLocations, testAmadeusConnection } from '../controllers/travelController';

const router = Router();

// Test the Amadeus API connection
router.get('/test-connection', testAmadeusConnection);

// Search for flights - Allow public access with optional authentication
router.get('/flights', authenticateOptional, searchFlights);

// Search for airports or cities
router.get('/locations', searchLocations);

export default router;
```

### Controllers

The controllers handle HTTP requests and delegate to the Amadeus service:

```typescript
// src/controllers/travelController.ts
export const searchFlights = async (req: Request, res: Response) => {
  try {
    const {
      origin,
      destination, 
      departureDate,
      returnDate,
      adults = '1',
      travelClass = 'ECONOMY'
    } = req.query;

    // Input validation
    if (!origin || !destination || !departureDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }

    // Call Amadeus service for flight search
    const result = await amadeusService.searchFlights(
      origin as string, 
      destination as string, 
      departureDate as string,
      returnDate as string,
      parseInt(adults as string),
      travelClass as string
    );

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to search flights',
      error: error.message 
    });
  }
};
```

### Available Endpoints

| Endpoint | Method | Description | Query Parameters |
|----------|--------|-------------|------------------|
| `/api/travel/test-connection` | GET | Test Amadeus API connectivity | None |
| `/api/travel/flights` | GET | Search for flights | `origin`, `destination`, `departureDate`, `returnDate` (optional), `adults`, `travelClass` |
| `/api/travel/locations` | GET | Search for airports or cities | `keyword`, `subType` (optional) |

### Error Handling

The integration includes graceful handling of API limitations:

- Hotel search functionality is conditionally checked since it's not available in the basic Amadeus API subscription plan
- All API calls are wrapped in try/catch blocks with proper error responses
- Service methods check for API initialization status before making requests
- Responses include detailed error information when failures occur

```prisma
model User {
  id                 String    @id @default(uuid())
  email              String    @unique
  fullName           String
  role               Role      @default(USER)
  stripeCustomerId   String?
  stripeSubscriptionId String?
  onboardingCompleted Boolean   @default(false)
  onboardingStep     Int       @default(1)
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt
  bookings           Booking[]
}

model Flight {
  id               String    @id @default(uuid())
  airline          String
  flightNumber     String
  departureAirport String
  arrivalAirport   String
  departureTime    DateTime
  arrivalTime      DateTime
  price            Float
  currency         String    @default("USD")
  class            SeatClass @default(ECONOMY)
  availableSeats   Int
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
  bookings         Booking[]
}

model Hotel {
  id            String    @id @default(uuid())
  name          String
  description   String
  address       String
  city          String
  country       String
  zipCode       String
  latitude      Float
  longitude     Float
  starRating    Float
  amenities     String[]
  pricePerNight Float
  currency      String    @default("USD")
  images        String[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  rooms         Room[]
  bookings      Booking[]
}

model Room {
  id        String    @id @default(uuid())
  hotelId   String
  hotel     Hotel     @relation(fields: [hotelId], references: [id])
  type      RoomType  @default(STANDARD)
  description String
  price     Float
  currency  String    @default("USD")
  capacity  Int
  amenities String[]
  available Boolean   @default(true)
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  bookings  Booking[]
}

model Booking {
  id             String        @id @default(uuid())
  userId         String
  user           User          @relation(fields: [userId], references: [id])
  flightId       String?
  flight         Flight?       @relation(fields: [flightId], references: [id])
  hotelId        String?
  hotel          Hotel?        @relation(fields: [hotelId], references: [id])
  roomId         String?
  room           Room?         @relation(fields: [roomId], references: [id])
  startDate      DateTime
  endDate        DateTime
  totalPrice     Float
  currency       String        @default("USD")
  status         BookingStatus @default(CONFIRMED)
  paymentIntentId String?
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt
}

enum Role {
  USER
  ADMIN
}

enum SeatClass {
  ECONOMY
  BUSINESS
  FIRST
}

enum RoomType {
  STANDARD
  DELUXE
  SUITE
}

enum BookingStatus {
  CONFIRMED
  CANCELLED
  COMPLETED
}
```

## Error Handling Strategy

The application implements a comprehensive error handling strategy:

### Global Error Handler

```typescript
// src/middleware/error.ts
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err.stack);

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: err.details,
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
    });
  }

  // Default server error response
  return res.status(500).json({
    success: false,
    error: 'Server Error',
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred'
      : err.message,
  });
};
```

### Controller-level Error Handling

Each controller implements try/catch blocks with specific error handling:

```typescript
export const getHotelById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const hotel = await prisma.hotel.findUnique({
      where: { id },
      include: { rooms: true },
    });
    
    if (!hotel) {
      return res.status(404).json({ 
        success: false, 
        error: 'Hotel not found' 
      });
    }
    
    return res.json({ success: true, data: hotel });
  } catch (error) {
    console.error('Error fetching hotel:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch hotel details' 
    });
  }
};
```

## Security Considerations

The application implements several security measures:

### Input Validation

All request inputs are validated using express-validator:

```typescript
// src/middleware/validation.ts
export const validate = (validations: any[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  };
};
```

### Rate Limiting

To prevent abuse, the API implements rate limiting:

```typescript
// src/middleware/rateLimiter.ts
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests, please try again later',
  },
});

// Stricter limits for sensitive endpoints
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later',
  },
});
```

### Security Headers

The application uses Helmet to set security headers:

```javascript
// In server setup
const helmet = require('helmet');
app.use(helmet());
```

## Deployment Notes

The application supports multiple deployment options, with configurations for both Replit and Git-based deployments.

### Consolidated Server Architecture

The application has been consolidated into a single server.js file that combines all functionality:
- RESTful API endpoints from TypeScript routes
- Static file serving from the public directory
- Stripe webhook handling
- Authentication and middleware
- Error handling and validation

This consolidated approach simplifies deployment and maintenance while ensuring all components work together seamlessly.

### Replit Configuration

The project can be deployed on Replit with the following settings:

```toml
[deployment]
run = ["sh", "-c", "node server.js"]

[[ports]]
localPort = 5000
externalPort = 5000
localPort = 7000
externalPort = 3003

[[ports]]
localPort = 8080
externalPort = 8080
```

### Git Deployment Process

For deploying to a Git repository and subsequently to a hosting platform:

#### Exporting from Replit to Git

Since Replit has restrictions on direct Git operations, follow these steps to export your project:

1. **Download as ZIP**:
   - From Replit, use the "Download as ZIP" option in the three-dot menu
   - This will download your entire project as a zip archive

2. **Extract the ZIP file** on your local machine

3. **Copy Environment Variables**:
   - Create a new `.env` file in the extracted project based on `.env.example`
   - Fill in the environment variables from your Replit Secrets

4. **Clean the Project**:
   - Remove Replit-specific files:
     ```
     rm -rf .replit replit.nix .config
     ```
   - Make sure `.gitignore` is properly configured to exclude sensitive files

#### Pre-Deployment Checklist

1. **TypeScript Compilation**: Ensure all TypeScript files have been compiled to JavaScript
   ```bash
   npx tsc
   ```

2. **Environment Variables**: Prepare a `.env` file based on `.env.example` (but don't commit it)

3. **Dependencies**: Verify all dependencies are properly listed in `package.json`

4. **Security**: Check that `.gitignore` excludes sensitive files and directories:
   - `.env` files
   - `node_modules/`
   - Editor configuration files
   - Log files
   - Build artifacts not required for deployment

#### Git Repository Setup

1. Navigate to the extracted project directory and initialize Git:
   ```bash
   git init
   ```

2. Configure Git identity:
   ```bash
   git config user.name "Your Name"
   git config user.email "your.email@example.com"
   ```

3. Add files to Git staging:
   ```bash
   git add .
   ```

4. Create initial commit:
   ```bash
   git commit -m "Initial commit"
   ```

5. Create a new repository on GitHub, GitLab, or BitBucket

6. Add remote repository:
   ```bash
   git remote add origin https://github.com/yourusername/your-repository.git
   ```

7. Push to remote repository:
   ```bash
   git push -u origin main
   ```

#### Deployment to Hosting Platforms

The application is compatible with various hosting providers:

##### Heroku Deployment

1. Create a new Heroku app:
   ```bash
   heroku create
   ```

2. Set required environment variables:
   ```bash
   heroku config:set NEXT_PUBLIC_SUPABASE_URL=your_value
   heroku config:set NEXT_PUBLIC_SUPABASE_ANON_KEY=your_value
   # Set all other required environment variables
   ```

3. Add PostgreSQL add-on (if needed):
   ```bash
   heroku addons:create heroku-postgresql:hobby-dev
   ```

4. Deploy the application:
   ```bash
   git push heroku main
   ```

##### Vercel/Netlify Deployment

For serverless deployment:

1. Connect your Git repository to Vercel/Netlify
2. Configure build settings:
   - Build command: `npm run build`
   - Output directory: `dist`
3. Set environment variables in the platform dashboard
4. Deploy

### Environment Variables

The application requires the following environment variables:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Stripe
STRIPE_SECRET_KEY=your-stripe-secret-key
NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY=your-stripe-publishable-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
NEXT_PUBLIC_STRIPE_PRICE_ID=your-subscription-price-id

# Database
DATABASE_URL=postgresql://...

# Server Configuration (for production)
PORT=5000
NODE_ENV=production

# Amadeus API (if using flight search)
AMADEUS_API_KEY=your-amadeus-api-key
AMADEUS_API_SECRET=your-amadeus-api-secret
```

### Database Migration for Deployment

When moving from Replit to an external hosting environment, you'll need to migrate your database data. Here are the recommended steps:

#### PostgreSQL Data Export from Replit

1. **Generate a database dump**:
   ```bash
   pg_dump -U $PGUSER -h $PGHOST -p $PGPORT -d $PGDATABASE -f database_dump.sql
   ```

2. **Download the dump file** from Replit to your local machine

#### Importing to New PostgreSQL Instance

1. **Create a new database** on your hosting provider

2. **Import the schema and data**:
   ```bash
   psql -U username -h hostname -d database_name -f database_dump.sql
   ```

3. **Update the DATABASE_URL** environment variable with your new database connection string

#### Using Prisma for Database Migration

If you're using Prisma ORM, you can use its migration system:

1. **Generate migration files**:
   ```bash
   npx prisma migrate dev --name initial
   ```

2. **Apply migrations in production**:
   ```bash
   npx prisma migrate deploy
   ```

3. **Generate Prisma client**:
   ```bash
   npx prisma generate
   ```

### Security Best Practices for Deployment

1. **Environment Variables**: Never commit sensitive environment variables to your repository
2. **HTTPS**: Ensure your deployed application uses HTTPS
3. **CORS**: Configure CORS properly to restrict access to your API
4. **Rate Limiting**: Use rate limiting middleware to prevent abuse
5. **Helmet**: Employ Helmet middleware to set security headers
6. **Dependency Auditing**: Regularly run `npm audit` to check for vulnerabilities
7. **Webhook Signatures**: Verify webhook signatures for external services like Stripe
8. **Database Security**: Use connection pooling and set appropriate access controls
9. **Regular Backups**: Schedule regular database backups for disaster recovery

## Testing

The application includes several testing scripts in the `/scripts` directory:

1. **Authentication Tests**:
   - `scripts/auth-test.js`: Tests Supabase authentication
   - `scripts/admin-get-token.js`: Generates admin tokens for testing

2. **API Tests**:
   - `scripts/test-admin-api.js`: Tests admin API endpoints
   - `scripts/test-stripe.js`: Tests Stripe integration

3. **Database Tests**:
   - `scripts/check-supabase-schema.js`: Validates database schema
   - `scripts/check-supabase.js`: Tests database connection

To run tests:

```bash
node scripts/test-admin-api.js
```