# Express TypeScript API with Supabase and Stripe

A robust Express backend built with TypeScript for Next.js applications, focusing on reliable server deployment and advanced system management with comprehensive onboarding, subscription features, and travel-related API routes.

## Features

- **Supabase Authentication**: Secure user registration, login, and session management
- **Multi-step Onboarding**: Guided user registration process with progressive steps
- **Stripe Payments**: Integration for subscription-based billing with webhook handling
- **TypeScript**: Type-safe code with modern ES6+ features
- **API Documentation**: Comprehensive endpoint documentation
- **Travel Management**: Flight, hotel, and booking API endpoints
- **Amadeus API Integration**: Real-time flight search and airport location data
- **Admin Dashboard**: Admin-only endpoints for system management
- **Multi-server Architecture**: Specialized servers for different functionalities

## Project Structure

The application follows a modular MVC architecture:

- `controllers/`: Request handlers for different routes
  - `auth.ts`: Authentication controllers (register, login, logout)
  - `admin.ts`: Admin-only operations for system management
  - `onboarding.ts`: Multi-step onboarding process handlers
  - `flightController.ts`: Flight management endpoints
  - `hotelController.ts`: Hotel and room management endpoints
  - `bookingController.ts`: Booking creation and management
  - `payments.ts`: Stripe payment processing
  - `subscriptions.ts`: Subscription management
  - `webhooks.ts`: Webhook handlers for external services
  - `user.ts`: User profile management
  - `health.ts`: System health monitoring

- `routes/`: API endpoint definitions
  - `index.ts`: Main router configuration
  - `auth.ts`: Authentication routes
  - `admin.ts`: Admin dashboard routes
  - `onboarding.ts`: Onboarding flow routes
  - `flightRoutes.ts`: Flight management routes
  - `hotelRoutes.ts`: Hotel management routes
  - `user.ts`: User profile routes
  - `subscriptions.ts`: Subscription management routes
  - `payments.ts`: Payment processing routes
  - `webhooks.ts`: External service webhook routes
  - `health.ts`: System health routes

- `middleware/`: Request processing middleware
  - `auth.ts`: JWT authentication validation
  - `error.ts`: Global error handling
  - `rateLimiter.ts`: Request rate limiting
  - `validation.ts`: Request data validation

- `services/`: Business logic and external service integration
  - `auth.ts`: Supabase authentication service
  - `stripe.ts`: Stripe payment and subscription service
  - `supabase.ts`: Supabase client configuration
  - `amadeus.ts`: Amadeus Travel API integration service

- `types/`: TypeScript type definitions for request/response objects and database entities
- `utils/`: Utility functions for common operations

## Server Architecture

While the development environment includes multiple specialized servers for testing different components, the production deployment uses a single consolidated server:

**Production Server** (Port 5000): The main server.js file combines all functionality:
- RESTful API endpoints
- Static file serving
- Webhook handling
- Authentication
- Error handling

This consolidated architecture simplifies deployment and ensures all components work together seamlessly.

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account and project
- Stripe account

### Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Copy `.env.example` to `.env` and add your credentials:
   ```
   cp .env.example .env
   ```
4. Build the TypeScript files:
   ```
   npx tsc
   ```
5. Start the production server:
   ```
   node server.js
   ```

### Deployment

The application is designed to be deployed to any Node.js hosting platform:

### Standard Deployment

1. Build TypeScript files:
   ```
   npx tsc
   ```

2. Set environment variables or secrets in your hosting platform

3. Start the server with:
   ```
   node server.js
   ```

The consolidated server.js file will automatically:
- Serve static files from the public directory
- Register all TypeScript API routes under /api
- Handle Stripe webhooks
- Provide a health check endpoint
- Handle authentication and error scenarios

### Git Deployment

To deploy this project to Git:

1. Clone the repository from Replit (or download the files)

2. Create a new repository on GitHub, GitLab, or Bitbucket

3. Initialize Git in the project directory (if not already initialized):
   ```
   git init
   ```

4. Configure your Git identity:
   ```
   git config user.name "Your Name"
   git config user.email "your.email@example.com"
   ```

5. Add all files to Git staging (excluding those in .gitignore):
   ```
   git add .
   ```

6. Commit the changes:
   ```
   git commit -m "Initial commit"
   ```

7. Add your remote repository URL:
   ```
   git remote add origin https://github.com/yourusername/your-repository.git
   ```

8. Push to the remote repository:
   ```
   git push -u origin main
   ```

**Important Security Notes:**
- Make sure your .env file is in the .gitignore list to avoid exposing sensitive credentials
- Use environment variables in your deployment platform instead of committing secrets
- Consider using Git secrets scanning tools to prevent accidental credential leaks

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user
- `POST /api/auth/logout` - Logout the current user
- `POST /api/auth/reset-password` - Request password reset

### Onboarding (Multi-step)

- `GET /api/onboarding/status` - Get current onboarding status
- `POST /api/onboarding/user-info` - Save basic user information (Step 1)
- `POST /api/onboarding/additional-details` - Save additional details (Step 2)
- `POST /api/onboarding/payment` - Process payment (Step 3)
- `POST /api/onboarding/complete` - Mark onboarding as complete

### User Management

- `GET /api/user/profile` - Get current user profile
- `PUT /api/user/profile` - Update user profile

### Subscriptions

- `POST /api/subscriptions/create` - Create a new subscription
- `GET /api/subscriptions/status` - Get subscription status
- `POST /api/subscriptions/portal` - Create customer portal session

### Flight Management

- `GET /api/flights` - Get all available flights
- `GET /api/flights/:id` - Get details of a specific flight
- `POST /api/flights` - Create a new flight (authenticated)
- `PUT /api/flights/:id` - Update flight details (authenticated)
- `DELETE /api/flights/:id` - Delete a flight (authenticated)

### Hotel Management

- `GET /api/hotels` - Get all available hotels
- `GET /api/hotels/:id` - Get details of a specific hotel with its rooms
- `GET /api/hotels/rooms/:id` - Get details of a specific room
- `POST /api/hotels` - Create a new hotel (authenticated)
- `POST /api/hotels/:hotelId/rooms` - Add a room to a hotel (authenticated)
- `PUT /api/hotels/:id` - Update hotel details (authenticated)
- `PUT /api/hotels/rooms/:id` - Update room details (authenticated)
- `DELETE /api/hotels/:id` - Delete a hotel (authenticated)
- `DELETE /api/hotels/rooms/:id` - Delete a room (authenticated)

### Booking Management

- `GET /api/bookings` - Get all user bookings (authenticated)
- `GET /api/bookings/:id` - Get details of a specific booking (authenticated)
- `POST /api/bookings` - Create a new booking (authenticated)
- `DELETE /api/bookings/:id` - Cancel a booking (authenticated)

### Admin Dashboard

- `GET /api/admin/users` - Get all users (admin only)
- `GET /api/admin/users/:userId` - Get a specific user (admin only)
- `PUT /api/admin/users/:userId` - Update a user (admin only)
- `DELETE /api/admin/users/:userId` - Delete a user (admin only)
- `GET /api/admin/dashboard` - Get dashboard statistics (admin only)
- `GET /api/admin/subscriptions` - Get all subscriptions (admin only)
- `GET /api/admin/bookings` - Get all bookings (admin only)
- `GET /api/admin/system-logs` - Get system logs (admin only)

### Payment Processing

- `POST /api/payments/create-payment-intent` - Create a Stripe payment intent

### Webhooks

- `POST /api/webhooks/stripe` - Receive Stripe webhook events

### Travel API (Amadeus Integration)

- `GET /api/travel/test-connection` - Test Amadeus API connectivity
- `GET /api/travel/flights` - Search for flights
- `GET /api/travel/locations` - Search for airports or cities

### System Health

- `GET /api/health` - Check API health status

## Authentication Flow

The API uses Supabase for authentication with JWT tokens:

1. User registers or logs in using Supabase Auth
2. JWT token is returned to the client
3. Client includes the token in the Authorization header for authenticated requests
4. Server validates the token using Supabase auth middleware

## Subscription Flow

The subscription process uses Stripe's payment API:

1. Create a customer in Stripe
2. Create a subscription with a trial period
3. Process payment using Stripe Elements
4. Handle webhooks for subscription lifecycle events

## Development

For local development:

```
npm run dev
```

This will start the server with hot reloading enabled.

## Environment Variables

The following environment variables are required:

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
```

## Supabase Schema Mapping

The API is designed to work with an existing Supabase profiles table schema that may not have all the fields we need for a complex onboarding flow. To adapt to this constraint, we implement mapping strategies:

### Profile Fields
- User name is stored in `first_name`, `last_name`, and `display_name` fields
- Contact information is stored in `email` and `phone` fields
- User role is stored in the `role` field

### Additional Fields Storage
Since the schema might not have dedicated fields for all data we collect during onboarding, we utilize the `bio` field as a multi-purpose storage:

- **Company Information**: "Company: Acme Inc"
- **Stripe Customer ID**: "Stripe Customer ID: cus_xxx123xxx"
- **Subscription Status**: "Subscription Status: active"
- **Additional Details**: Industry, company size, goals, etc.

This approach allows us to work with the existing schema without requiring database migrations, while still providing the full functionality needed by the application.

## Database Models

The application uses a PostgreSQL database with Prisma ORM for type-safe database access. The main models include:

### User Model
Represents a registered user in the system:
- `id`: Unique identifier (UUID)
- `email`: User's email address (unique)
- `fullName`: User's full name
- `role`: User role (USER, ADMIN)
- `createdAt`: Account creation timestamp
- `updatedAt`: Last update timestamp
- `stripeCustomerId`: Stripe customer ID (for payment processing)
- `stripeSubscriptionId`: Stripe subscription ID
- `onboardingCompleted`: Boolean indicating if onboarding is complete
- `onboardingStep`: Current step in the onboarding process

### Flight Model
Represents available flights:
- `id`: Unique identifier (UUID)
- `airline`: Airline name
- `flightNumber`: Flight identifier
- `departureAirport`: Airport code for departure
- `arrivalAirport`: Airport code for arrival
- `departureTime`: Scheduled departure time
- `arrivalTime`: Scheduled arrival time
- `price`: Ticket price
- `currency`: Currency code (USD, EUR, etc.)
- `class`: Seat class (ECONOMY, BUSINESS, FIRST)
- `availableSeats`: Number of available seats
- `createdAt`: Record creation timestamp
- `updatedAt`: Last update timestamp

### Hotel Model
Represents available hotels:
- `id`: Unique identifier (UUID)
- `name`: Hotel name
- `description`: Detailed description
- `address`: Street address
- `city`: City location
- `country`: Country location
- `zipCode`: Postal/ZIP code
- `latitude`: Geographical latitude
- `longitude`: Geographical longitude
- `starRating`: Hotel quality rating (1-5)
- `amenities`: List of available amenities
- `pricePerNight`: Base price per night
- `currency`: Currency code (USD, EUR, etc.)
- `images`: Array of image URLs
- `rooms`: Relation to Room model
- `createdAt`: Record creation timestamp
- `updatedAt`: Last update timestamp

### Room Model
Represents hotel rooms:
- `id`: Unique identifier (UUID)
- `hotelId`: Reference to parent hotel
- `type`: Room type (STANDARD, DELUXE, SUITE)
- `description`: Detailed description
- `price`: Price per night
- `currency`: Currency code (USD, EUR, etc.)
- `capacity`: Maximum number of guests
- `amenities`: List of room-specific amenities
- `available`: Availability status
- `createdAt`: Record creation timestamp
- `updatedAt`: Last update timestamp

### Booking Model
Represents user bookings:
- `id`: Unique identifier (UUID)
- `userId`: Reference to the booking user
- `flightId`: Optional reference to booked flight
- `hotelId`: Optional reference to booked hotel
- `roomId`: Optional reference to booked room
- `startDate`: Booking start date
- `endDate`: Booking end date
- `totalPrice`: Total booking price
- `currency`: Currency code (USD, EUR, etc.)
- `status`: Booking status (CONFIRMED, CANCELLED, COMPLETED)
- `paymentIntentId`: Stripe payment intent ID
- `createdAt`: Booking creation timestamp
- `updatedAt`: Last update timestamp

## Implemented Features

The following key features have been fully implemented and tested:

1. **Authentication System**
   - Secure user registration and login with Supabase
   - JWT token-based authentication
   - Password reset functionality
   - Role-based access control (User vs Admin)

2. **Multi-Step Onboarding**
   - Progressive 4-step onboarding process
   - State management between steps
   - Validation at each step
   - Support for partial completion and resuming

3. **Subscription Management**
   - Stripe integration for recurring billing
   - Customer portal access
   - Subscription status tracking
   - Webhook handling for subscription events

4. **Travel API**
   - Flight management endpoints (search, create, update, delete)
   - Hotel management with room handling
   - Booking system with validation
   - Pricing and availability tracking

5. **Admin Dashboard API**
   - User management
   - Subscription oversight
   - System monitoring
   - Analytics endpoints for dashboard

6. **Error Handling & Validation**
   - Comprehensive error handling with appropriate HTTP status codes
   - Request validation using express-validator
   - Rate limiting to prevent abuse
   - Security headers via Helmet

7. **Multi-Server Architecture**
   - Dedicated servers for specific functions
   - Port management for different services
   - Workflow configuration for easy startup

## Deployment Configuration

The application is configured for deployment on Replit with the following setup:

- **Consolidated Production Server**: Single Express server running on port 5000
- **Database Integration**: PostgreSQL with connection string in DATABASE_URL
- **Environment Variables**: Securely stored in Replit Secrets
- **Static Files**: Served from the public directory
- **TypeScript API**: Routes compiled to dist/ directory
- **Error Handling**: Global error handler for all routes
- **Authentication**: Middleware for protecting routes
- **Stripe Webhooks**: Special endpoint for payment events

This consolidated approach simplifies deployment and maintenance while providing all the necessary functionality in a single server process.