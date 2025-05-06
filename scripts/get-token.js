// Script to generate a test JWT token
const jwt = require('jsonwebtoken');
require('dotenv').config();

async function getToken() {
  try {
    // Create a simple secret for JWT signing (for testing only)
    const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-do-not-use-in-production';
    
    // Create a test user payload
    const testUser = {
      id: `test-${Date.now()}`,
      email: `test-${Date.now()}@example.com`,
      name: 'Test User',
      role: 'user',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 hours
    };
    
    // Generate a JWT token
    const token = jwt.sign(testUser, JWT_SECRET);
    
    console.log('\n===== TEST JWT TOKEN =====');
    console.log(token);
    console.log('\nTest user payload:');
    console.log(testUser);
    console.log('\nCurl command example:');
    console.log(`curl -H "Authorization: Bearer ${token}" http://localhost:5000/api/test`);
    
  } catch (error) {
    console.error('Error generating token:', error.message);
  }
}

// Check if jsonwebtoken is installed
try {
  require.resolve('jsonwebtoken');
  getToken();
} catch (e) {
  console.error('\nThe jsonwebtoken package is not installed. Please install it first:');
  console.error('\nnpm install jsonwebtoken');
}