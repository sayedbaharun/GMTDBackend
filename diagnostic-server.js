const express = require('express');
const path = require('path');
const os = require('os');
const app = express();
const port = 8080;

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root endpoint - Shows both the onboarding UI and system info
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Diagnostic endpoint
app.get('/diagnostic', (req, res) => {
  const interfaces = os.networkInterfaces();
  const memory = {
    total: os.totalmem(),
    free: os.freemem(),
    usage: (1 - os.freemem() / os.totalmem()) * 100
  };
  
  const diagnosticInfo = {
    server: {
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      cpus: os.cpus().length,
      uptime: os.uptime(),
      memory: memory
    },
    network: interfaces,
    environment: {
      NODE_ENV: process.env.NODE_ENV || 'not set',
      PORT: process.env.PORT || port
    },
    timestamp: new Date().toISOString()
  };
  
  res.json(diagnosticInfo);
});

// Mock API endpoints for onboarding steps
app.post('/api/onboarding/user-info', (req, res) => {
  console.log('Received basic info:', req.body);
  res.json({ 
    success: true, 
    message: 'Basic info saved successfully'
  });
});

app.post('/api/onboarding/additional-details', (req, res) => {
  console.log('Received preferences:', req.body);
  res.json({ 
    success: true, 
    message: 'Preferences saved successfully'
  });
});

app.post('/api/onboarding/payment', (req, res) => {
  console.log('Received payment info:', req.body);
  res.json({ 
    success: true, 
    message: 'Payment processed successfully'
  });
});

app.post('/api/onboarding/complete', (req, res) => {
  console.log('Onboarding completed');
  res.json({ 
    success: true, 
    message: 'Onboarding completed successfully'
  });
});

// Get Stripe key endpoint
app.get('/api/stripe-key', (req, res) => {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY || 'pk_test_placeholder';
  res.json({ publicKey: publishableKey });
});

// Simple test endpoint
app.get('/test', (req, res) => {
  res.send('Server is working!');
});

// Custom health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    time: new Date().toISOString(),
    message: 'Diagnostic server is running',
    port: port,
    interfaces: Object.keys(os.networkInterfaces())
  });
});

// Start the server
const server = app.listen(port, '0.0.0.0', () => {
  const address = server.address();
  console.log('------------------- SERVER INFO -------------------');
  console.log(`Diagnostic server running on http://0.0.0.0:${port}`);
  console.log(`Server address: ${JSON.stringify(address)}`);
  console.log(`Available network interfaces: ${JSON.stringify(Object.keys(os.networkInterfaces()))}`);
  console.log(`Hostname: ${os.hostname()}`);
  console.log('---------------------------------------------------');
});

// Make the process robust
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
});

// Keep the process running
process.on('SIGINT', () => {
  console.log('Received SIGINT signal. Closing server gracefully.');
  server.close(() => {
    console.log('Server shutdown');
    process.exit(0);
  });
});

// Log to keep track of server status
setInterval(() => {
  const address = server.address();
  console.log(`Server still running on http://0.0.0.0:${port} (${JSON.stringify(address)})`);
}, 10000); // Log every 10 seconds