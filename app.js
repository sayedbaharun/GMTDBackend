const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 8080;

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

// Admin dashboard endpoint with API documentation
app.get('/admin', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Express TypeScript API - Admin Dashboard</title>
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
  <h1>Express TypeScript API - Admin Dashboard</h1>
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

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    time: new Date().toISOString(), 
    message: 'API server is running'
  });
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

// API information endpoint
app.get('/api/info', (req, res) => {
  res.json({
    name: 'Express TypeScript API',
    version: '1.0.0',
    features: [
      'Supabase Authentication',
      'Multi-step Onboarding',
      'Stripe Integration',
      'TypeScript Support'
    ],
    endpoints: {
      auth: ['/api/auth/register', '/api/auth/login', '/api/auth/logout'],
      onboarding: [
        '/api/onboarding/status',
        '/api/onboarding/user-info',
        '/api/onboarding/additional-details',
        '/api/onboarding/payment',
        '/api/onboarding/complete'
      ],
      subscriptions: [
        '/api/subscriptions/status',
        '/api/subscriptions/portal'
      ],
      webhooks: [
        '/api/webhooks/stripe'
      ]
    }
  });
});

// Default route to serve the index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'API endpoint not found' 
  });
});

// Start the server
module.exports = app;

if (require.main === module) {
  app.listen(port, '0.0.0.0', () => {
    console.log(`Express API server running on http://0.0.0.0:${port}`);
  });
}