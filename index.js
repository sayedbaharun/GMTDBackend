// Import the functionality from workflow-server.js
// This will make this file act as an entry point but use the same functionality
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const Stripe = require('stripe');
require('dotenv').config();

// Initialize Stripe client
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' }) : null;

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

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the public directory
const path = require('path');
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

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    time: new Date().toISOString(), 
    message: 'API server is running'
  });
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

// Mock onboarding status endpoint
app.get('/api/onboarding/status', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'in_progress',
    step: 'additional_details',
    completed_steps: ['basic_info'],
    remaining_steps: ['additional_details', 'payment', 'complete']
  });
});

// Start the server
app.listen(port, '0.0.0.0', () => {
  console.log(`Express API server running on http://0.0.0.0:${port}`);
});