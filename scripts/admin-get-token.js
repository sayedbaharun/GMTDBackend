// Script to create a test user and get an access token using the Supabase admin API
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Helper function to check if a required secret is present
function checkRequiredSecret(name) {
  if (!process.env[name]) {
    console.error(`Error: Required secret ${name} is missing in .env`);
    return false;
  }
  return true;
}

async function createTestUserAndGetToken() {
  // Check for required secrets
  const requiredSecrets = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];
  
  const missingSecrets = requiredSecrets.filter(secret => !checkRequiredSecret(secret));
  
  if (missingSecrets.length > 0) {
    console.error('\nPlease make sure all required secrets are available in the environment.');
    return;
  }
  
  console.log(`\nUsing Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
  
  // Create a Supabase client with admin privileges using service role key
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  try {
    // Create a test user with a unique email (using a timestamp)
    const timestamp = Date.now();
    const email = `test-user-${timestamp}@test-api.com`;
    const password = 'TestPass123!';
    
    console.log(`\nCreating test user: ${email}`);
    
    // Create a user with admin API (bypasses email confirmation)
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Set email as confirmed
      user_metadata: {
        full_name: 'Test API User'
      }
    });
    
    if (createError) {
      console.error('\nError creating user:', createError.message);
      return;
    }
    
    console.log('\n✓ Test user created successfully!');
    console.log(`User ID: ${userData.user.id}`);
    
    // Generate a session for the user
    console.log('\nGenerating access token...');
    
    // Sign in with admin privileges to generate a session
    const { data: sessionData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password
    });
    
    if (signInError) {
      console.error('\nError generating session:', signInError.message);
      return;
    }
    
    console.log('\n=== Authentication Successful ===');
    console.log('\nAccess Token (for API calls):');
    console.log(sessionData.session.access_token);
    
    console.log('\nTest API Request Example:');
    console.log(`curl -H "Authorization: Bearer ${sessionData.session.access_token}" http://localhost:5000/api/onboarding/status`);
    
    console.log('\nUser credentials for future reference:');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    
  } catch (error) {
    console.error('\nUnexpected error:', error.message);
  }
}

createTestUserAndGetToken().catch(err => {
  console.error('Execution error:', err);
});