const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 4000;

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Mock API endpoints for onboarding steps
app.post('/api/onboarding/user-info', (req, res) => {
  console.log('Received personal details:', req.body);
  res.json({ 
    success: true, 
    message: 'Personal details saved successfully'
  });
});

app.post('/api/onboarding/preferences', (req, res) => {
  console.log('Received preferences:', req.body);
  res.json({ 
    success: true, 
    message: 'Preferences saved successfully'
  });
});

app.post('/api/onboarding/contact-preferences', (req, res) => {
  console.log('Received contact preferences:', req.body);
  res.json({ 
    success: true, 
    message: 'Contact preferences saved successfully'
  });
});

app.post('/api/onboarding/product-selection', (req, res) => {
  console.log('Received product selection:', req.body);
  res.json({ 
    success: true, 
    message: 'Product selection saved successfully'
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
  // Generate a random confirmation number
  const confirmationNumber = 'DXB-' + Math.floor(100000 + Math.random() * 900000);
  res.json({ 
    success: true, 
    message: 'Onboarding completed successfully',
    confirmationNumber: confirmationNumber
  });
});

// Start the server
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Onboarding server running on http://0.0.0.0:${port}`);
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
  console.log(`Onboarding server still running on http://0.0.0.0:${port}`);
}, 60000); // Log every minute