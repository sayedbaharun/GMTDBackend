require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase with the service role key for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0YWVxa2l5aHNjdnZzeWdxZWpjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTQwMzM3OSwiZXhwIjoyMDYwOTc5Mzc5fQ.ly2fThGkNzf34LtGvnQPm7Sn5zZmGVS42tN_RW5a--I";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSchema() {
  console.log('Checking Supabase database schema...');
  
  try {
    // List all tables in the database
    console.log('\n--- DATABASE TABLES ---');
    const { data: tables, error: tablesError } = await supabase
      .from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public');
      
    if (tablesError) {
      console.error('Error listing tables:', tablesError.message);
    } else {
      console.log('Tables in the database:');
      tables.forEach(table => {
        console.log(` - ${table.tablename}`);
      });
    }
    
    // Check profiles table specifically
    console.log('\n--- PROFILES TABLE ---');
    const { data: profilesInfo, error: profilesError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'profiles')
      .eq('table_schema', 'public');
      
    if (profilesError) {
      console.error('Error getting profiles schema:', profilesError.message);
    } else if (profilesInfo && profilesInfo.length > 0) {
      console.log('Profiles table columns:');
      profilesInfo.forEach(column => {
        console.log(` - ${column.column_name} (${column.data_type})`);
      });
    } else {
      console.log('No columns found in profiles table or table does not exist');
    }
    
    // Query actual data
    console.log('\n--- TEST QUERY ---');
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('*')
      .limit(2);
      
    if (testError) {
      console.error('Error querying profiles data:', testError.message);
    } else {
      console.log(`Found ${testData.length} records in profiles table`);
      if (testData.length > 0) {
        console.log('Sample data:');
        console.log(JSON.stringify(testData[0], null, 2));
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    return { success: false, error };
  }
}

// Run the check
checkSchema().then(result => {
  if (result.success) {
    console.log('\nSchema check completed');
  } else {
    console.error('Schema check failed');
    process.exit(1);
  }
});