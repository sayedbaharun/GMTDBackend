const http = require('http');
const { exec } = require('child_process');
const path = require('path');

// Import our Express application
try {
  // Try to directly import server.js (this will work in production)
  require('./server.js');
  console.log('Started Express server from server.js');
} catch (err) {
  console.error('Error importing server.js, falling back to simple server:', err.message);
  
  // If that fails, provide a fallback simple HTTP server
  const server = http.createServer((req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html');
    res.end(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Express API Server</title>
          <style>
            body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            h1 { color: #333; }
            .card { background: #f9f9f9; border-radius: 5px; padding: 15px; margin-bottom: 15px; }
            pre { background: #f1f1f1; padding: 10px; border-radius: 5px; overflow-x: auto; }
          </style>
        </head>
        <body>
          <h1>Express API Server</h1>
          <div class="card">
            <p>This server provides an API for Next.js applications with Supabase and Stripe integration.</p>
            <p>Current time: ${new Date().toISOString()}</p>
          </div>
          
          <h2>Available Endpoints</h2>
          <ul>
            <li><code>GET /health</code> - Health check endpoint</li>
            <li><code>GET /api/test/stripe</code> - Test Stripe integration</li>
            <li><code>GET /api/test/supabase</code> - Test Supabase integration</li>
            <li><code>GET /api/onboarding/status</code> - Get onboarding status</li>
            <li><code>POST /api/webhooks/stripe</code> - Stripe webhook endpoint</li>
          </ul>
          
          <p>See the README for full API documentation.</p>
        </body>
      </html>
    `);
  });

  const port = 5000;
  server.listen(port, '0.0.0.0', () => {
    console.log(`Simple server running at http://0.0.0.0:${port}/`);
  });
}