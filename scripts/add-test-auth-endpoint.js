// This script adds a temporary test endpoint to the server.js file
// to generate a token without needing email verification
const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, '..', 'server.js');

async function addTestEndpoint() {
  try {
    console.log('Reading server.js file...');
    let serverCode = fs.readFileSync(serverPath, 'utf8');
    
    // Check if the test endpoint already exists
    if (serverCode.includes('/api/test/auth')) {
      console.log('Test auth endpoint already exists, no changes needed.');
      return;
    }
    
    // Find a good spot to insert the test endpoint (after another endpoint)
    const insertPos = serverCode.indexOf('// Health check endpoint');
    
    if (insertPos === -1) {
      console.log('Could not find insertion point in server.js');
      return;
    }
    
    // Create the test auth endpoint code
    const testEndpoint = `
// Temporary test endpoint to get a token without email verification
app.post('/api/test/auth', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }
    
    console.log(\`Test auth request for \${email}\`);
    
    // Check if user exists
    const { data: userData, error: userError } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    // If user doesn't exist or there's an error about email confirmation
    if (userError) {
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
          return res.status(500).json({
            success: false,
            error: \`Failed to create test user: \${signupError.message}\`
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
`;
    
    // Insert the test endpoint code after the health check endpoint section
    const healthCheckEndSection = serverCode.indexOf('});', insertPos) + 3;
    const updatedCode = 
      serverCode.slice(0, healthCheckEndSection) + 
      testEndpoint + 
      serverCode.slice(healthCheckEndSection);
    
    // Write the updated server.js file
    fs.writeFileSync(serverPath, updatedCode);
    console.log('Added test auth endpoint to server.js');
    console.log('Restart the server for changes to take effect.');
    console.log('\nYou can now use the endpoint with:');
    console.log('curl -X POST http://localhost:5000/api/test/auth \\');
    console.log('  -H "Content-Type: application/json" \\');
    console.log('  -d \'{"email": "test@example.com", "password": "Password123!"}\'');
    
  } catch (error) {
    console.error('Error updating server.js:', error.message);
  }
}

addTestEndpoint();