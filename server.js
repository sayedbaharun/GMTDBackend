/**
 * Main Production Server
 * 
 * This file starts the TypeScript application directly
 * to handle deployment on platforms like Render
 */

// Load environment variables FIRST
require('dotenv').config();

// For production deployment, we need to compile TypeScript first
// Check if dist directory exists, otherwise use ts-node
const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, 'dist', 'index.js');

if (fs.existsSync(distPath)) {
    // Production: Use compiled JavaScript
    console.log('Starting from compiled dist/index.js');
    require('./dist/index');
} else {
    // Development/First deployment: Use ts-node
    console.log('Starting with ts-node (dist not found)');
    require('ts-node').register({
        transpileOnly: true,
        compilerOptions: {
            module: 'commonjs'
        }
    });
    require('./src/index');
}

console.log('Server process started. Application logic and listening managed by dist/index.js.');
console.log('Check logs from the application (e.g., logger.info in src/index.ts) for listening port details.');

// Optional: Keep process signal handling if desired
process.on('SIGINT', () => {
  console.log('Received SIGINT. Shutting down gracefully (managed by application)...');
  // Application itself should handle server.close() if exporting the server instance
  // process.exit(0); // Or just exit
});

// We remove the duplicate Express app creation, middleware setup, 
// Stripe/Supabase init, route loading, 404/error handlers from server.js.
// All that logic belongs in src/index.ts.