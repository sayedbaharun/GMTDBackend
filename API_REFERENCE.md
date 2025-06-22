# GMTD Backend API Reference

## Table of Contents
- [Authentication](#authentication)
- [Rate Limiting](#rate-limiting)
- [API Endpoints](#api-endpoints)
- [Error Handling](#error-handling)
- [Testing](#testing)
- [Production Features](#production-features)

## Authentication

The GMTD API uses Auth0 for authentication with JWT tokens.

### Headers
```
Authorization: Bearer <jwt_token>
API-Version: 1.0 (optional)
Content-Type: application/json
```

### Authentication Endpoints

#### POST /api/auth/login
Initiates Auth0 authentication flow.

**Response:**
```json
{
  "success": true,
  "redirectUrl": "https://auth0-domain/authorize?..."
}
```

#### GET /api/auth/callback
Handles Auth0 callback and token exchange.

#### POST /api/auth/logout
Logs out user and clears session.

## Rate Limiting

The API implements multiple rate limiting strategies:

### General API Rate Limits
- **General endpoints**: 1000 requests per 15 minutes (production: 1000, development: 5000)
- **Authentication endpoints**: 10 requests per 15 minutes
- **Search endpoints**: 30 requests per 1 minute
- **Booking endpoints**: 20 requests per 5 minutes
- **Payment endpoints**: 50 requests per 15 minutes
- **Password reset**: 3 requests per 1 hour

### Rate Limit Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1640995200
```

### Rate Limit Response
```json
{
  "error": "Too many requests, please try again later.",
  "retryAfter": 900
}
```

## API Endpoints

### Health Check

#### GET /api/health
Returns system health status with detailed service checks.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-06-22T07:17:23.157Z",
  "responseTime": 45,
  "version": "1.0.0",
  "checks": {
    "server": {
      "status": "ok",
      "uptime": 3600,
      "memory": {
        "rss": 45678912,
        "heapTotal": 12345678,
        "heapUsed": 8765432
      },
      "nodeVersion": "v18.17.0",
      "environment": "development"
    },
    "database": {
      "status": "ok",
      "responseTime": 12
    },
    "stripe": {
      "status": "ok",
      "responseTime": 156
    },
    "system": {
      "loadAverage": [0.5, 0.3, 0.2],
      "freeMemory": 1073741824,
      "totalMemory": 8589934592,
      "cpus": 8
    }
  }
}
```

#### GET /api/health/ready
Simple readiness probe for containers.

#### GET /api/health/live
Simple liveness probe for containers.

### Travel Search

#### GET /api/travel/flights
Search for flights using Amadeus API.

**Query Parameters:**
- `origin` (required): Origin airport code (3 letters)
- `destination` (required): Destination airport code (3 letters)
- `departureDate` (required): Departure date (YYYY-MM-DD)
- `returnDate` (optional): Return date (YYYY-MM-DD)
- `adults` (optional): Number of adults (1-9, default: 1)
- `travelClass` (optional): ECONOMY, PREMIUM_ECONOMY, BUSINESS, FIRST

**Rate Limit:** Search rate limiter (30 requests/minute)

**Response:**
```json
{
  "success": true,
  "data": {
    "flights": [
      {
        "id": "flight_123",
        "source": "GDS",
        "oneWay": false,
        "itineraries": [
          {
            "segments": [
              {
                "departure": {
                  "iataCode": "JFK",
                  "at": "2025-06-01T10:00:00"
                },
                "arrival": {
                  "iataCode": "DXB",
                  "at": "2025-06-01T22:00:00"
                },
                "carrierCode": "EK",
                "number": "202"
              }
            ]
          }
        ],
        "price": {
          "total": "1200.00",
          "currency": "USD"
        }
      }
    ],
    "searchParams": {
      "origin": "JFK",
      "destination": "DXB",
      "departureDate": "2025-06-01",
      "adults": 1,
      "travelClass": "ECONOMY"
    },
    "meta": {
      "count": 15
    }
  },
  "message": "Found 15 flight options"
}
```

#### GET /api/travel/hotels
Search for hotels using Amadeus API.

**Query Parameters:**
- `cityCode` (required): City code (3 letters, default: DXB)
- `checkInDate` (required): Check-in date (YYYY-MM-DD)
- `checkOutDate` (required): Check-out date (YYYY-MM-DD)
- `adults` (required): Number of adults (1-8)
- `children` (optional): Number of children (0-6)
- `radius` (optional): Search radius in km

**Rate Limit:** Search rate limiter (30 requests/minute)

### Bookings

#### GET /api/bookings
Get all bookings for authenticated user.

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "booking_123",
      "userId": "user_456",
      "totalAmount": 1500.00,
      "currency": "USD",
      "status": "CONFIRMED",
      "bookedAt": "2025-01-01T00:00:00Z",
      "flightBookings": [
        {
          "id": "flight_booking_789",
          "flight": {
            "id": "flight_1",
            "origin": "JFK",
            "destination": "DXB",
            "departureTime": "2025-06-01T10:00:00Z"
          }
        }
      ],
      "hotelBookings": [],
      "conciergeRequests": []
    }
  ],
  "count": 1
}
```

### Payments

#### POST /api/payments/create-payment-intent
Create a Stripe payment intent.

**Authentication:** Optional
**Rate Limit:** Payment rate limiter (50 requests/15 minutes)

**Request Body:**
```json
{
  "amount": 150.00,
  "currency": "usd",
  "description": "Dubai hotel booking",
  "metadata": {
    "bookingId": "booking_123"
  }
}
```

**Response:**
```json
{
  "success": true,
  "clientSecret": "pi_1234567890_secret_abcdef",
  "paymentIntentId": "pi_1234567890",
  "amount": 15000,
  "currency": "usd"
}
```

## Error Handling

### Standard Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "VALIDATION_ERROR",
  "details": {
    "field": "email",
    "code": "INVALID_FORMAT"
  }
}
```

### HTTP Status Codes
- `200` - Success
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

### Common Error Types

#### Validation Errors (400)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "departureDate",
      "message": "Departure date must be in YYYY-MM-DD format",
      "value": "2025/06/01"
    }
  ]
}
```

#### Rate Limit Errors (429)
```json
{
  "error": "Too many requests, please try again later.",
  "retryAfter": 900
}
```

#### Authentication Errors (401)
```json
{
  "success": false,
  "message": "Authentication required"
}
```

## Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Test Coverage
- **Controllers**: Health, Travel, Booking, Payment endpoints
- **Middleware**: Authentication, Rate limiting, Validation
- **Services**: Mocked external API integrations

### Example Test
```typescript
describe('Travel Controller', () => {
  it('should return flight results for valid search', async () => {
    const response = await request(app)
      .get('/api/travel/flights')
      .query({
        origin: 'JFK',
        destination: 'DXB',
        departureDate: '2025-06-01',
        adults: '2'
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.flights).toHaveLength(1);
  });
});
```

## Production Features

### Security Middleware
- **Helmet**: Security headers (CSP, HSTS, etc.)
- **CORS**: Configurable cross-origin resource sharing
- **Rate Limiting**: Multi-tier rate limiting strategy
- **Request Validation**: Input sanitization and validation
- **API Versioning**: Version-aware request handling

### Logging and Monitoring
- **Request Logging**: Comprehensive request/response logging
- **Error Tracking**: Structured error logging with context
- **Performance Monitoring**: Response time tracking
- **Health Checks**: Detailed system health endpoints

### Environment Configuration
```bash
# Required Environment Variables
DATABASE_URL=postgresql://...
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_CLIENT_ID=your_client_id
AUTH0_CLIENT_SECRET=your_client_secret
STRIPE_SECRET_KEY=sk_test_...
AMADEUS_CLIENT_ID=your_amadeus_client_id
AMADEUS_CLIENT_SECRET=your_amadeus_secret
OPENAI_API_KEY=your_openai_key

# Optional Configuration
NODE_ENV=production
PORT=5000
SESSION_SECRET=your_session_secret
CLIENT_URL=https://your-frontend.com
```

### Deployment Checklist
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Auth0 production tenant configured
- [ ] Stripe live keys configured
- [ ] Amadeus production credentials
- [ ] SSL certificates configured
- [ ] Monitoring and logging enabled
- [ ] Health check endpoints accessible
- [ ] Rate limiting configured for production load

### Performance Optimizations
- **Compression**: Gzip compression for responses
- **Caching**: Strategic caching headers for static content
- **Connection Pooling**: Database connection optimization
- **Request Size Limits**: Configurable payload size limits
- **Graceful Shutdown**: Proper signal handling for containers

---

**Built with ❤️ for luxury travelers who demand the extraordinary.**