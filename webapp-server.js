const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 9000;

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Root endpoint and pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/sales', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'sales.html'));
});

app.get('/user-requests', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'user-requests.html'));
});

// Endpoint to get Stripe publishable key
app.get('/api/stripe-key', (req, res) => {
  // Get the key from environment variable
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY || 'pk_test_placeholder';
  res.json({ publicKey: publishableKey });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    time: new Date().toISOString(), 
    message: 'Web app server is running'
  });
});

// Start the server
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Web app server running on http://0.0.0.0:${port}`);
});

// Keep the process running
process.on('SIGINT', () => {
  server.close(() => {
    console.log('Server shutdown');
    process.exit(0);
  });
});

// Log to keep track of server status
setInterval(() => {
  console.log(`Web app server still running on http://0.0.0.0:${port}`);
}, 60000); // Log every minute