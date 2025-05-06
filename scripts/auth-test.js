// Script to test Supabase auth directly
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const email = process.argv[2] || 'test@example.com';
const password = process.argv[3] || 'Password123!';
const action = process.argv[4] || 'login'; // 'login' or 'signup'

async function testAuth() {
  // Validate Supabase environment variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('Error: Missing Supabase credentials in environment');
    console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env');
    return;
  }

  console.log(`Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
  
  // Initialize Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  
  try {
    let result;
    
    if (action === 'signup') {
      console.log(`Attempting to sign up user: ${email}`);
      result = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: 'Test User'
          }
        }
      });
    } else {
      console.log(`Attempting to sign in user: ${email}`);
      result = await supabase.auth.signInWithPassword({
        email,
        password
      });
    }
    
    if (result.error) {
      console.error('Authentication error:', result.error.message);
      
      if (action === 'login' && result.error.message.includes('Invalid login credentials')) {
        console.log('\nUser may not exist. Try creating the account first:');
        console.log(`node scripts/auth-test.js ${email} ${password} signup`);
      }
      
      return;
    }
    
    console.log('\n=== Authentication Successful ===');
    
    if (action === 'signup') {
      console.log('\nUser created successfully! You can now login:');
      console.log(`node scripts/auth-test.js ${email} ${password} login`);
      return;
    }
    
    console.log('\nAccess Token (for API calls):');
    console.log(result.data.session.access_token);
    
    console.log('\nTo use this token in curl requests:');
    console.log(`curl -H "Authorization: Bearer ${result.data.session.access_token}" http://localhost:5000/api/onboarding/status`);
    
    console.log('\nUser Info:');
    console.log('ID:', result.data.user.id);
    console.log('Email:', result.data.user.email);
    
  } catch (error) {
    console.error('Unexpected error:', error.message);
  }
}

testAuth().catch(err => {
  console.error('Execution error:', err);
});