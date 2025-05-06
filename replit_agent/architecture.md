# Architecture Overview

## 1. Overview

This repository contains an Express TypeScript API that provides backend services with Supabase authentication, database integration, and Stripe payment processing. The application is designed to support a multi-step onboarding process, subscription management, and secure API endpoints for client applications.

The system utilizes a modular architecture with clear separation of concerns following MVC (Model-View-Controller) patterns adapted for a REST API context. It's built to be scalable, maintainable, and secure, with proper error handling and validation throughout.

## 2. System Architecture

### Backend Architecture

The application is built on Node.js with Express as the web framework and TypeScript for type safety. It follows a layered architecture:

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

- **Routes:** Define API endpoints and connect them to controllers
- **Controllers:** Handle HTTP requests/responses and call appropriate services
- **Services:** Contain business logic and interact with external APIs
- **Middleware:** Process requests for authentication, validation, rate limiting, etc.
- **External APIs:** Supabase for database/auth and Stripe for payments

### Data Storage

The application uses Supabase as its primary data storage solution. Supabase provides both authentication services and a PostgreSQL database.

Main data entities:
- User profiles
- Subscription information
- Onboarding progress tracking

## 3. Key Components

### Core Modules

#### Routes (`src/routes`)
Defines API endpoints and associates them with controller functions. Routes are organized by domain (auth, user, onboarding, subscriptions, etc.).

#### Controllers (`src/controllers`)
Handle HTTP requests and responses, validate inputs, and orchestrate service calls. Controllers are focused on the HTTP layer and delegate business logic to services.

#### Services (`src/services`)
Contain core business logic and integrate with external APIs like Supabase and Stripe. Services are organized by domain (auth, user, stripe, etc.).

#### Middleware (`src/middleware`)
Process requests before they reach route handlers:
- `auth.ts`: Authentication middleware using Supabase JWT tokens
- `error.ts`: Global error handling
- `rateLimiter.ts`: Rate limiting to prevent abuse
- `validation.ts`: Request validation using express-validator

#### Types (`src/types`)
TypeScript interfaces and types for database entities, API requests/responses, and internal data structures.

#### Utils (`src/utils`)
Utility functions for common operations like error handling, logging, etc.

#### Config (`src/config`)
Configuration variables and environment setup.

### Authentication System

The application uses Supabase Auth for user authentication:
- JWT-based authentication
- Token validation middleware
- Role-based access control
- Secure password handling

### Payment Integration

Stripe is integrated for payment processing and subscription management:
- Customer creation
- Subscription creation and management
- Webhook handling for payment events
- Secure payment processing

## 4. Data Flow

### Authentication Flow

1. User registers/logs in via client application
2. Client receives JWT token from Supabase
3. Client includes token in Authorization header for API requests
4. API validates token via middleware
5. If valid, user profile is attached to request
6. If invalid, 401 Unauthorized response is returned

### Onboarding Flow

1. User completes initial registration (creates account)
2. Multi-step onboarding process:
   - Step 1: Basic user information (profile data)
   - Step 2: Additional details (preferences, goals)
   - Step 3: Payment setup (Stripe integration)
3. Upon successful payment, user profile is updated with subscription details
4. Onboarding is marked as complete

### Subscription Management Flow

1. User initiates subscription creation
2. API creates Stripe customer if not exists
3. API creates Stripe subscription
4. Stripe webhooks notify API of subscription status changes
5. API updates user profile with subscription details

## 5. External Dependencies

### Primary Dependencies

- **Express**: Web framework for handling HTTP requests
- **TypeScript**: Static typing for JavaScript
- **Supabase**: Authentication and database services
- **Stripe**: Payment processing and subscription management

### Development Dependencies

- **ts-node**: TypeScript execution environment
- **nodemon**: Development server with hot reloading
- **express-validator**: Request validation
- **helmet**: Security headers
- **cors**: Cross-origin resource sharing
- **dotenv**: Environment variable management

## 6. Deployment Strategy

The application is designed to be deployed in various environments:

### Development Environment

- Local development using `nodemon` for hot reloading
- Environment variables stored in `.env` file
- Debug logging enabled

### Production Environment

- Node.js runtime environment
- Environment variables configured in hosting platform
- Security optimizations (helmet, rate limiting)
- Error logging and monitoring

### Replit Deployment

The repository includes configuration for running on Replit:
- `.replit` file with workflow configurations
- Multiple server entry points for flexibility
- Parallel execution of services

The application follows a containerized approach that makes it suitable for deployment on platforms like:
- Replit
- Heroku
- Vercel
- AWS Lambda/Container services
- Google Cloud Run

## 7. Security Considerations

- JWT-based authentication with proper validation
- Rate limiting to prevent abuse
- Input validation on all endpoints
- Secure handling of environment variables
- CORS protection
- Security headers via Helmet
- Stripe webhook signature verification
- Error handling that doesn't expose sensitive information