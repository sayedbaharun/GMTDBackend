require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase with the service role key for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0YWVxa2l5aHNjdnZzeWdxZWpjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTQwMzM3OSwiZXhwIjoyMDYwOTc5Mzc5fQ.ly2fThGkNzf34LtGvnQPm7Sn5zZmGVS42tN_RW5a--I";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
  console.log('Setting up Supabase database...');
  
  try {
    // First check if the profiles table exists
    console.log('Checking for profiles table...');
    
    // Try to select from profiles table to see if it exists
    const { data: checkData, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (checkError) {
      console.log('Creating profiles table...');
      
      // Create the profiles table with all required columns for the app
      const { error: createError } = await supabase.query(`
        CREATE TABLE IF NOT EXISTS public.profiles (
          id UUID PRIMARY KEY,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          full_name TEXT,
          email TEXT,
          phone_number TEXT,
          company_name TEXT,
          industry TEXT,
          company_size TEXT,
          role TEXT,
          goals TEXT[],
          referral_source TEXT,
          onboarding_step TEXT DEFAULT 'not_started',
          stripe_customer_id TEXT,
          subscription_id TEXT,
          subscription_status TEXT,
          subscription_current_period_start TIMESTAMP WITH TIME ZONE,
          subscription_current_period_end TIMESTAMP WITH TIME ZONE,
          last_payment_date TIMESTAMP WITH TIME ZONE,
          onboarding_complete BOOLEAN DEFAULT FALSE
        );
      `);
      
      if (createError) {
        console.error('Error creating profiles table:', createError);
        return { success: false, error: createError };
      }
      
      console.log('✅ Profiles table created successfully');
    } else {
      console.log('✅ Profiles table already exists');
    }
    
    // Create demo user for testing
    console.log('Creating demo user...');
    
    const { data: existingUser, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', 'demo-user-id')
      .single();
    
    if (userError && userError.code !== 'PGRST116') {
      console.error('Error checking for demo user:', userError);
    }
    
    if (!existingUser) {
      console.log('Inserting demo user...');
      
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: 'demo-user-id',
          full_name: 'Demo User',
          email: 'demo@example.com',
          onboarding_step: 'not_started',
          onboarding_complete: false
        });
      
      if (insertError) {
        console.error('Error creating demo user:', insertError);
        return { success: false, error: insertError };
      }
      
      console.log('✅ Demo user created successfully');
    } else {
      console.log('✅ Demo user already exists');
    }
    
    // List users in the profiles table
    const { data: users, error: listError } = await supabase
      .from('profiles')
      .select('*');
    
    if (listError) {
      console.error('Error listing users:', listError);
    } else {
      console.log(`Found ${users.length} users in the profiles table`);
      users.forEach(user => {
        console.log(` - ${user.id}: ${user.full_name} (${user.email})`);
      });
    }
    
    return { success: true };
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return { success: false, error };
  }
}

// Run the setup
setupDatabase().then(result => {
  if (result.success) {
    console.log('Database setup completed successfully');
  } else {
    console.error('Database setup failed:', result.error);
    process.exit(1);
  }
});