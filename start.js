/**
 * Simple start script for Railway deployment
 */

// Load environment variables
require('dotenv').config();

// Start the compiled application
try {
    console.log('Starting GetMeToDubai Backend...');
    console.log('Node version:', process.version);
    console.log('Current directory:', __dirname);
    console.log('Environment:', process.env.NODE_ENV);
    
    // Try to load the compiled version
    require('./dist/index.js');
} catch (error) {
    console.error('Failed to start from dist/index.js:', error.message);
    console.log('Attempting to start with ts-node...');
    
    // Fallback to ts-node
    require('ts-node').register({
        transpileOnly: true,
        compilerOptions: {
            module: 'commonjs'
        }
    });
    require('./src/index.ts');
}