// Script to test Supabase connection
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testConnection() {
  // Get Supabase URL and anon key from environment
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  console.log('Supabase URL:', supabaseUrl);
  console.log('Anon key exists:', !!supabaseAnonKey);
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing required environment variables for Supabase');
    return;
  }
  
  try {
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Try a simple query to check connection
    console.log('Testing connection to Supabase...');
    const { data, error } = await supabase.from('profiles').select('id').limit(1);
    
    if (error) {
      console.error('Failed to connect to Supabase:', error.message);
      return;
    }
    
    console.log('✓ Successfully connected to Supabase!');
    console.log('Data:', data);
    
    // Try to sign up a test user
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'Password123!';
    
    console.log(`\nTrying to sign up a test user (${testEmail})...`);
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });
    
    if (signUpError) {
      console.error('Failed to sign up test user:', signUpError.message);
      return;
    }
    
    console.log('✓ Test user sign up response:', signUpData);
    
  } catch (error) {
    console.error('Unexpected error:', error.message);
  }
}

testConnection();