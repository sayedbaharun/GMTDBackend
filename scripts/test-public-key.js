// Script to test Supabase connection with just the public key
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testConnection() {
  // Get Supabase URL and anon key from environment
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  console.log('Testing Supabase connection with:');
  console.log('URL:', supabaseUrl);
  console.log('Key type: Public anon key');
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing required environment variables for Supabase');
    return;
  }
  
  try {
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Test auth signIn operation
    console.log('\nTesting Supabase auth operation...');
    
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('Auth operation failed:', authError.message);
    } else {
      console.log('✓ Auth operation successful!');
      console.log('Session data:', authData);
    }
    
    // Try a basic public table operation
    console.log('\nTesting basic query operation...');
    
    // Usually public tables like countries, products, etc.
    // Using any table that should be readable with the anon key
    const { data: queryData, error: queryError } = await supabase
      .from('profiles')  // Replace with a known public table in your project
      .select('created_at')
      .limit(1);
    
    if (queryError) {
      console.error('Query operation failed:', queryError.message);
      console.error('Error details:', queryError);
    } else {
      console.log('✓ Query operation successful!');
      console.log('Query result:', queryData);
    }
    
  } catch (error) {
    console.error('Unexpected error:', error.message);
  }
}

testConnection();