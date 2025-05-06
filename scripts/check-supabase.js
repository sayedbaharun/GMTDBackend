require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Check that required environment variables are set
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Error: Missing Supabase credentials in environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

// Log sanitized credentials (for debugging, hiding most of the key)
console.log('Using Supabase URL:', supabaseUrl);
console.log('Using Service Role Key:', supabaseServiceRoleKey.substring(0, 10) + '...' + supabaseServiceRoleKey.substring(supabaseServiceRoleKey.length - 5));

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkSupabaseConnection() {
  try {
    console.log('Connecting to Supabase...');
    
    // Get table information from Supabase
    const { data: tableInfo, error: tableError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('Error querying profiles table:', tableError);
      return;
    }
    
    console.log('Successfully connected to Supabase!');
    
    // Display table structure
    if (tableInfo && tableInfo.length > 0) {
      console.log('\nUser Profile Table Structure:');
      const sampleUser = tableInfo[0];
      Object.keys(sampleUser).forEach(key => {
        const value = sampleUser[key];
        const type = Array.isArray(value) ? 'array' : typeof value;
        console.log(`- ${key}: ${type} ${value === null ? '(nullable)' : ''}`);
      });
      
      console.log('\nTotal fields in user profile:', Object.keys(sampleUser).length);
    } else {
      console.log('No user profiles found in the database');
    }
    
    // Try to get table names using system schema
    try {
      const { data: tables, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');
        
      if (tablesError) {
        console.error('Error fetching tables from information schema:', tablesError);
      } else if (tables && tables.length > 0) {
        console.log('\nAvailable tables in database:');
        tables.forEach(table => {
          console.log(`- ${table.table_name}`);
        });
      }
    } catch (schemaError) {
      console.log('Unable to query information schema, trying direct table query');
      
      // Try another approach to list tables
      try {
        const tables = ['profiles', 'users', 'auth', 'subscriptions', 'payments'];
        console.log('\nChecking common tables:');
        
        for (const table of tables) {
          const { error } = await supabase.from(table).select('count').limit(1);
          if (!error) {
            console.log(`- ${table} (exists)`);
          }
        }
      } catch (tableCheckError) {
        console.error('Error checking common tables:', tableCheckError);
      }
    }
    
  } catch (error) {
    console.error('Error connecting to Supabase:', error.message);
  }
}

checkSupabaseConnection();