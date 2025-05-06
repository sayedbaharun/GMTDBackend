// Express server for Replit Workflow
const express = require('express');
const path = require('path');
const app = express();
const port = parseInt(process.env.PORT || 5000);
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
const Stripe = require('stripe');
require('dotenv').config();

// Import the compiled TypeScript API routes
try {
  // This is where our compiled TypeScript routes will be
  const apiRoutes = require('./dist/routes').default;
  console.log('Successfully loaded TypeScript API routes');
} catch (error) {
  console.warn('Failed to load TypeScript API routes:', error.message);
  console.warn('Continuing with basic routes only');
}

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Initialize Stripe client
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' }) : null;

// JWT secret for token verification (development only)
const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-do-not-use-in-production';

// Webhook endpoint for Stripe needs to be before body parser middleware
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    // Check if Stripe is initialized
    if (!stripe) {
      return res.status(500).json({
        success: false,
        message: 'Stripe integration is not configured',
        error: 'STRIPE_SECRET_KEY is missing or invalid'
      });
    }
    
    const sig = req.headers['stripe-signature'];
    
    // Need the webhook secret from env
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!endpointSecret) {
      console.warn('No Stripe webhook secret configured. Skipping signature verification.');
      // For development, we'll process the event without verification
      const event = JSON.parse(req.body.toString());
      console.log('Received unverified Stripe event:', event.type);
      
      // Handle the event
      await handleStripeEvent(event);
      
      // Return success
      return res.status(200).json({ received: true });
    }
    
    let event;
    
    try {
      // Verify the event with the signature
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    // Handle the verified event
    console.log('Received verified Stripe event:', event.type);
    await handleStripeEvent(event);
    
    // Return success
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error processing Stripe webhook:', error.message);
    res.status(500).json({
      success: false,
      error: `Error processing webhook: ${error.message}`
    });
  }
});

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Add CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Authentication middleware
const authenticate = (req, res, next) => {
  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authorization header missing or invalid format'
      });
    }
    
    // Extract the token
    const token = authHeader.split(' ')[1];
    
    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Attach the user to the request
    req.user = decoded;
    
    // Continue to the next middleware/route handler
    next();
  } catch (error) {
    // Handle token verification errors
    console.error('JWT verification error:', error.message);
    
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      error: error.message
    });
  }
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    time: new Date().toISOString(), 
    message: 'API server is running'
  });
});

// Register our TypeScript API routes if available
try {
  // This is where our compiled TypeScript routes would be
  const apiRoutes = require('./dist/routes').default;
  console.log('Registering TypeScript API routes...');
  
  // Mount all API routes under /api
  app.use('/api', apiRoutes);
  
  console.log('Successfully registered TypeScript API routes');
} catch (error) {
  console.warn('Could not register TypeScript API routes:', error.message);
  console.warn('API endpoints might be limited. Consider building the TypeScript code.');
}

// Register direct API routes for admin dashboard
const adminRouter = express.Router();

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
};

// Add admin routes with authentication and admin check
adminRouter.use(authenticate);
adminRouter.use(requireAdmin);

// Admin dashboard stats endpoint
adminRouter.get('/dashboard', (req, res) => {
  // Mock dashboard statistics
  res.status(200).json({
    success: true,
    data: {
      userStats: {
        total: 25,
        new: 5,
        subscriptionRate: '40.00',
        onboardingCompletionRate: '80.00'
      },
      subscriptionStats: {
        active: 10
      },
      bookingStats: {
        total: 15,
        active: 8
      },
      recentUsers: [
        {
          id: 'c12a3375-bd65-4b4f-a2c9-1394c1596ca6',
          email: 'admin@example.com',
          fullName: 'System Admin',
          createdAt: new Date().toISOString(),
          subscriptionStatus: 'active'
        }
      ]
    }
  });
});

// Get all users endpoint
adminRouter.get('/users', (req, res) => {
  // Get pagination parameters
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  
  res.status(200).json({
    success: true,
    data: {
      users: [
        {
          id: 'c12a3375-bd65-4b4f-a2c9-1394c1596ca6',
          email: 'admin@example.com',
          fullName: 'System Admin',
          isAdmin: true,
          createdAt: new Date().toISOString(),
          subscriptionStatus: 'active'
        }
      ],
      pagination: {
        total: 1,
        page: page,
        limit: limit,
        pages: 1
      }
    }
  });
});

// Get user by ID endpoint
adminRouter.get('/users/:userId', (req, res) => {
  const { userId } = req.params;
  
  // Only return data for the admin user
  if (userId === 'c12a3375-bd65-4b4f-a2c9-1394c1596ca6') {
    res.status(200).json({
      success: true,
      data: {
        user: {
          id: 'c12a3375-bd65-4b4f-a2c9-1394c1596ca6',
          email: 'admin@example.com',
          fullName: 'System Admin',
          isAdmin: true,
          createdAt: new Date().toISOString(),
          subscriptionStatus: 'active',
          profile: {
            title: 'System Administrator',
            bio: 'System administrator with full access to the admin dashboard'
          },
          bookings: []
        }
      }
    });
  } else {
    res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }
});

// Update user endpoint
adminRouter.put('/users/:userId', (req, res) => {
  const { userId } = req.params;
  const updates = req.body;
  
  // Only update the admin user
  if (userId === 'c12a3375-bd65-4b4f-a2c9-1394c1596ca6') {
    res.status(200).json({
      success: true,
      data: {
        id: 'c12a3375-bd65-4b4f-a2c9-1394c1596ca6',
        email: 'admin@example.com',
        fullName: updates.fullName || 'System Admin',
        isAdmin: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        subscriptionStatus: updates.subscriptionStatus || 'active',
        subscriptionTier: updates.subscriptionTier || 'premium',
        profile: {
          title: 'System Administrator',
          bio: 'System administrator with full access to the admin dashboard'
        }
      }
    });
  } else {
    res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }
});

// Get subscriptions endpoint
adminRouter.get('/subscriptions', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  
  res.status(200).json({
    success: true,
    data: {
      subscriptions: [],
      pagination: {
        total: 0,
        page: page,
        limit: limit,
        pages: 0
      }
    }
  });
});

// Get bookings endpoint
adminRouter.get('/bookings', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  
  res.status(200).json({
    success: true,
    data: {
      bookings: [],
      pagination: {
        total: 0,
        page: page,
        limit: limit,
        pages: 0
      }
    }
  });
});

// Get system logs endpoint
adminRouter.get('/system-logs', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  
  res.status(200).json({
    success: true,
    data: {
      logs: [
        {
          id: '1',
          timestamp: new Date().toISOString(),
          level: 'info',
          message: 'Server started',
          source: 'system'
        }
      ],
      pagination: {
        total: 1,
        page: page,
        limit: limit,
        pages: 1
      }
    }
  });
});

// Register the admin router
app.use('/api/admin', adminRouter);

// UI Page Routes
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/sales', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'sales.html'));
});

app.get('/simple-sales', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'simple-sales.html'));
});

app.get('/user-requests', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'user-requests.html'));
});

// Root endpoint with documentation
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Express TypeScript API</title>
  <style>
    body { font-family: system-ui, sans-serif; line-height: 1.5; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px; }
    h2 { color: #444; margin-top: 20px; }
    .card { background: #f9f9f9; border-radius: 5px; padding: 15px; margin-bottom: 15px; }
    .success { color: green; }
    .endpoint { font-family: monospace; padding: 4px 8px; background: #eee; border-radius: 3px; }
    pre { background: #f1f1f1; padding: 10px; border-radius: 5px; overflow-x: auto; }
  </style>
</head>
<body>
  <h1>Express TypeScript API</h1>
  <div class="card">
    <p class="success">✓ Server is running!</p>
    <p>This Express server includes integration with Supabase for auth/database and Stripe for payments.</p>
  </div>
  
  <h2>System Endpoints</h2>
  <ul>
    <li><span class="endpoint">GET /health</span> - Health check endpoint</li>
    <li><span class="endpoint">GET /api/test/stripe</span> - Test Stripe integration</li>
    <li><span class="endpoint">GET /api/test/supabase</span> - Test Supabase integration</li>
  </ul>
  
  <h2>Onboarding Flow</h2>
  <ul>
    <li><span class="endpoint">GET /api/onboarding/status</span> - Get current onboarding status</li>
    <li><span class="endpoint">POST /api/onboarding/user-info</span> - Step 1: Save user information</li>
    <li><span class="endpoint">POST /api/onboarding/additional-details</span> - Step 2: Save additional details</li>
    <li><span class="endpoint">POST /api/onboarding/payment</span> - Step 3: Process payment</li>
    <li><span class="endpoint">POST /api/onboarding/complete</span> - Step 4: Complete onboarding</li>
  </ul>
  
  <h2>Subscription Management</h2>
  <ul>
    <li><span class="endpoint">GET /api/subscriptions/status</span> - Get subscription status</li>
    <li><span class="endpoint">POST /api/subscriptions/portal</span> - Create Stripe customer portal session</li>
  </ul>
  
  <h2>Webhook Endpoints</h2>
  <ul>
    <li><span class="endpoint">POST /api/webhooks/stripe</span> - Stripe webhook for subscription events</li>
  </ul>

  <h2>Admin Dashboard API</h2>
  <ul>
    <li><span class="endpoint">GET /api/admin/dashboard</span> - Get dashboard statistics</li>
    <li><span class="endpoint">GET /api/admin/users</span> - Get all users (paginated)</li>
    <li><span class="endpoint">GET /api/admin/users/:userId</span> - Get user details by ID</li>
    <li><span class="endpoint">PUT /api/admin/users/:userId</span> - Update user details</li>
    <li><span class="endpoint">GET /api/admin/subscriptions</span> - Get all subscriptions (paginated)</li>
    <li><span class="endpoint">GET /api/admin/bookings</span> - Get all bookings (paginated)</li>
    <li><span class="endpoint">GET /api/admin/system-logs</span> - Get system logs (paginated)</li>
  </ul>
</body>
</html>
  `);
});

// Test API endpoints 
app.get('/api/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is working properly',
    timestamp: new Date().toISOString()
  });
});

// Protected test endpoint that requires JWT authentication
app.get('/api/protected/test', authenticate, (req, res) => {
  // Return success with the user data (added by authenticate middleware)
  res.status(200).json({
    success: true,
    message: 'You are authenticated!',
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

// Mock onboarding status endpoint (protected, requires authentication)
app.get('/api/onboarding/status', authenticate, (req, res) => {
  // Get the user from the request (added by authenticate middleware)
  const user = req.user;
  
  // In a real implementation, this would fetch the user's actual onboarding status from database
  // For now, we'll use a mock status based on the user ID (could be made more dynamic)
  res.status(200).json({
    success: true,
    status: 'in_progress',
    step: 'additional_details',
    completed_steps: ['basic_info'],
    remaining_steps: ['additional_details', 'payment', 'complete'],
    user_id: user.id
  });
});

// Save basic user information (Step 1 of onboarding)
app.post('/api/onboarding/user-info', authenticate, (req, res) => {
  try {
    const { full_name, email, phone_number, company_name } = req.body;
    
    // Validate required fields
    if (!full_name || !email || !phone_number || !company_name) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        required: ['full_name', 'email', 'phone_number', 'company_name']
      });
    }
    
    // In a real implementation, this would update the user's profile in the database
    // For now, we'll just return success
    res.status(200).json({
      success: true,
      message: 'User information saved successfully',
      next_step: 'additional_details',
      data: {
        full_name,
        email,
        phone_number,
        company_name,
        user_id: req.user.id
      }
    });
  } catch (error) {
    console.error('Error saving user info:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error saving user information',
      error: error.message
    });
  }
});

// Save additional details (Step 2 of onboarding)
app.post('/api/onboarding/additional-details', authenticate, (req, res) => {
  try {
    const { industry, company_size, role, goals, referral_source } = req.body;
    
    // Validate required fields
    if (!industry || !company_size || !role || !goals || !Array.isArray(goals)) {
      return res.status(400).json({
        success: false,
        message: 'Missing or invalid required fields',
        required: ['industry', 'company_size', 'role', 'goals'],
        notes: 'goals must be an array of strings'
      });
    }
    
    // In a real implementation, this would update the user's profile in the database
    // For now, we'll just return success
    res.status(200).json({
      success: true,
      message: 'Additional details saved successfully',
      next_step: 'payment',
      data: {
        industry,
        company_size,
        role,
        goals,
        referral_source: referral_source || null,
        user_id: req.user.id
      }
    });
  } catch (error) {
    console.error('Error saving additional details:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error saving additional details',
      error: error.message
    });
  }
});

// Process payment (Step 3 of onboarding)
app.post('/api/onboarding/payment', authenticate, async (req, res) => {
  try {
    // Check if Stripe is initialized
    if (!stripe) {
      return res.status(500).json({
        success: false,
        message: 'Stripe integration is not configured',
        error: 'STRIPE_SECRET_KEY is missing or invalid'
      });
    }

    const { payment_method_id } = req.body;
    
    if (!payment_method_id) {
      return res.status(400).json({
        success: false,
        message: 'Missing payment method ID',
        required: ['payment_method_id']
      });
    }
    
    // Get the user from the request
    const user = req.user;
    
    // Create a customer in Stripe
    const customer = await stripe.customers.create({
      name: user.name || 'Customer',
      email: user.email,
      metadata: {
        user_id: user.id
      }
    });
    
    console.log(`Created Stripe customer ${customer.id} for user ${user.id}`);
    
    // Create a subscription for the customer
    // In a real implementation, you would use a priceId from your Stripe dashboard
    // For this example, we will use a simpler approach just for testing
    
    // Use the payment method to create a setup intent
    const setupIntent = await stripe.setupIntents.create({
      customer: customer.id,
      payment_method: payment_method_id,
      payment_method_types: ['card'],
      confirm: true,
      usage: 'off_session',
    });
    
    // In a real implementation, you would create a subscription with a specific
    // product and price ID, but for this example we'll just return success
    
    // For example:
    // const subscription = await stripe.subscriptions.create({
    //   customer: customer.id,
    //   items: [{ price: 'price_123' }],
    //   default_payment_method: paymentMethod.id
    // });
    
    // Return success response
    res.status(200).json({
      success: true,
      message: 'Payment method successfully saved',
      next_step: 'complete',
      data: {
        customer_id: customer.id,
        setup_intent_id: setupIntent.id,
        setup_intent_status: setupIntent.status,
        user_id: user.id
      }
    });
  } catch (error) {
    console.error('Error processing payment:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error processing payment',
      error: error.message
    });
  }
});

// Complete onboarding (Step 4)
app.post('/api/onboarding/complete', authenticate, (req, res) => {
  try {
    // Get the user from the request
    const user = req.user;
    
    // In a real implementation, this would update the user's profile in the database
    // to mark onboarding as complete
    
    // Return success response
    res.status(200).json({
      success: true,
      message: 'Onboarding completed successfully',
      user_id: user.id,
      onboarding_complete: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error completing onboarding:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error completing onboarding',
      error: error.message
    });
  }
});

// Test Stripe integration
app.get('/api/test/stripe', (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({
        success: false,
        message: 'Stripe integration is not configured',
        error: 'STRIPE_SECRET_KEY is missing or invalid'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Stripe integration is properly configured',
      stripe_api_version: stripe.getApiField('version')
    });
  } catch (error) {
    console.error('Stripe test error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error testing Stripe integration',
      error: error.message
    });
  }
});

// Create a payment intent for one-time payments
app.post('/api/payments/create-payment-intent', authenticate, async (req, res) => {
  try {
    // Check if Stripe is initialized
    if (!stripe) {
      return res.status(500).json({
        success: false,
        message: 'Stripe integration is not configured',
        error: 'STRIPE_SECRET_KEY is missing or invalid'
      });
    }
    
    const { amount, currency = 'usd' } = req.body;
    
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount',
        required: ['amount'],
        notes: 'Amount must be a positive number'
      });
    }
    
    // Create a payment intent (in cents)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: currency.toLowerCase(),
      metadata: {
        user_id: req.user.id
      }
    });
    
    // Return the client secret
    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id
    });
  } catch (error) {
    console.error('Error creating payment intent:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error creating payment intent',
      error: error.message
    });
  }
});

// Test auth endpoint to get a token without email verification
app.post('/api/test/auth', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }
    
    console.log(`Test auth request for ${email}`);
    
    // Check if user exists
    const { data: userData, error: userError } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    // If user doesn't exist or there's an error about email confirmation
    if (userError) {
      console.log('Auth error:', userError.message);
      
      if (userError.message.includes('Email not confirmed') || 
          userError.message.includes('Invalid login credentials')) {
        // Create a new user with the anon key
        const { data: newUser, error: signupError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: 'Test User'
            }
          }
        });
        
        if (signupError) {
          console.log('Signup error:', signupError.message);
          return res.status(500).json({
            success: false,
            error: `Failed to create test user: ${signupError.message}`
          });
        }
        
        return res.status(200).json({
          success: true,
          message: 'User created but requires email confirmation',
          user: {
            id: newUser.user.id,
            email: newUser.user.email
          }
        });
      }
      
      return res.status(401).json({
        success: false,
        error: userError.message
      });
    }
    
    // User exists and auth succeeded
    res.status(200).json({
      success: true,
      token: userData.session.access_token,
      user: {
        id: userData.user.id,
        email: userData.user.email
      }
    });
  } catch (error) {
    console.error('Test auth error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Webhook endpoint for Stripe events
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    // Check if Stripe is initialized
    if (!stripe) {
      return res.status(500).json({
        success: false,
        message: 'Stripe integration is not configured',
        error: 'STRIPE_SECRET_KEY is missing or invalid'
      });
    }
    
    const sig = req.headers['stripe-signature'];
    
    // Need the webhook secret from env
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!endpointSecret) {
      console.warn('No Stripe webhook secret configured. Skipping signature verification.');
      // For development, we'll process the event without verification
      const event = req.body;
      console.log('Received unverified Stripe event:', event.type);
      
      // Handle the event
      await handleStripeEvent(event);
      
      // Return success
      return res.status(200).json({ received: true });
    }
    
    let event;
    
    try {
      // Verify the event with the signature
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    // Handle the verified event
    console.log('Received verified Stripe event:', event.type);
    await handleStripeEvent(event);
    
    // Return success
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error processing Stripe webhook:', error.message);
    res.status(500).json({
      success: false,
      error: `Error processing webhook: ${error.message}`
    });
  }
});

// Function to handle different Stripe event types
async function handleStripeEvent(event) {
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log(`Payment succeeded: ${paymentIntent.id}`);
      // In a real implementation, this would update the database
      break;
      
    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log(`Payment failed: ${failedPayment.id}`);
      // In a real implementation, this would update the database
      break;
      
    case 'customer.subscription.created':
      const subscription = event.data.object;
      console.log(`Subscription created: ${subscription.id}`);
      // In a real implementation, this would update the database
      break;
      
    case 'customer.subscription.updated':
      const updatedSubscription = event.data.object;
      console.log(`Subscription updated: ${updatedSubscription.id}`);
      // In a real implementation, this would update the database
      break;
      
    case 'customer.subscription.deleted':
      const deletedSubscription = event.data.object;
      console.log(`Subscription deleted: ${deletedSubscription.id}`);
      // In a real implementation, this would update the database
      break;
      
    case 'invoice.payment_succeeded':
      const invoice = event.data.object;
      console.log(`Invoice payment succeeded: ${invoice.id}`);
      // In a real implementation, this would update the database
      break;
      
    case 'invoice.payment_failed':
      const failedInvoice = event.data.object;
      console.log(`Invoice payment failed: ${failedInvoice.id}`);
      // In a real implementation, this would update the database
      break;
      
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
}

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`Express API server running on http://0.0.0.0:${port}`);
});