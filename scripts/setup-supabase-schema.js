require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase with the service role key for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
  console.log('Setting up Supabase database schema...');
  
  try {
    // Check if profiles table exists by querying it
    let { data: profilesCheck, error: profilesCheckError } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true });
    
    if (profilesCheckError && profilesCheckError.code === '42P01') {
      console.log('Profiles table does not exist. Creating it...');

      // Use SQL to create the profiles table
      const { error: createError } = await supabase.rpc('create_profiles_table');
      if (createError) {
        // If RPC function doesn't exist, fallback to regular query
        console.log('Using direct SQL to create table...');
        const { error: sqlError } = await supabase.rpc('exec_sql', {
          query: `
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
            
            -- Create trigger to set updated_at on update
            CREATE OR REPLACE FUNCTION update_modified_column()
            RETURNS TRIGGER AS $$
            BEGIN
              NEW.updated_at = NOW();
              RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
            
            DROP TRIGGER IF EXISTS set_updated_at ON profiles;
            CREATE TRIGGER set_updated_at
            BEFORE UPDATE ON profiles
            FOR EACH ROW
            EXECUTE PROCEDURE update_modified_column();
            
            -- Create trigger to create profile after user signup
            CREATE OR REPLACE FUNCTION public.create_profile_for_user()
            RETURNS TRIGGER AS $$
            BEGIN
              INSERT INTO public.profiles (id, email)
              VALUES (NEW.id, NEW.email);
              RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
            
            DROP TRIGGER IF EXISTS create_profile_trigger ON auth.users;
            CREATE TRIGGER create_profile_trigger
            AFTER INSERT ON auth.users
            FOR EACH ROW
            EXECUTE PROCEDURE public.create_profile_for_user();
          `
        });
        
        if (sqlError) {
          throw sqlError;
        }
      }
      
      console.log('✅ Profiles table created successfully');
    } else if (profilesCheckError) {
      throw profilesCheckError;
    } else {
      console.log('Profiles table already exists. Adding missing columns if needed...');
      
      // Get current columns
      const { data: columns, error: columnsError } = await supabase.rpc('get_table_columns', { 
        table_name: 'profiles' 
      });
      
      if (columnsError) {
        // Fallback if RPC doesn't exist
        console.log('Unable to get columns using RPC. Attempting to add all columns...');
        
        // Add all possible missing columns (Postgres will ignore if they already exist)
        const { error: alterError } = await supabase.rpc('exec_sql', {
          query: `
            ALTER TABLE public.profiles 
            ADD COLUMN IF NOT EXISTS full_name TEXT,
            ADD COLUMN IF NOT EXISTS email TEXT,
            ADD COLUMN IF NOT EXISTS phone_number TEXT,
            ADD COLUMN IF NOT EXISTS company_name TEXT,
            ADD COLUMN IF NOT EXISTS industry TEXT,
            ADD COLUMN IF NOT EXISTS company_size TEXT,
            ADD COLUMN IF NOT EXISTS role TEXT,
            ADD COLUMN IF NOT EXISTS goals TEXT[],
            ADD COLUMN IF NOT EXISTS referral_source TEXT,
            ADD COLUMN IF NOT EXISTS onboarding_step TEXT DEFAULT 'not_started',
            ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
            ADD COLUMN IF NOT EXISTS subscription_id TEXT,
            ADD COLUMN IF NOT EXISTS subscription_status TEXT,
            ADD COLUMN IF NOT EXISTS subscription_current_period_start TIMESTAMP WITH TIME ZONE,
            ADD COLUMN IF NOT EXISTS subscription_current_period_end TIMESTAMP WITH TIME ZONE,
            ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMP WITH TIME ZONE,
            ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT FALSE;
          `
        });
        
        if (alterError) {
          throw alterError;
        }
        
        console.log('✅ Schema updated with necessary columns');
      } else {
        // Process columns and add missing ones
        console.log('Current columns:', columns);
        // Further processing if needed
      }
    }
    
    // Check if we need to create a demo user for testing
    const { data: existingUsers, error: usersError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', 'demo-user-id')
      .limit(1);
      
    if (usersError) {
      console.log('Error checking for demo user:', usersError.message);
    } else if (!existingUsers || existingUsers.length === 0) {
      // Create a demo user for testing
      const { error: insertError } = await supabase
        .from('profiles')
        .insert([
          { 
            id: 'demo-user-id',
            email: 'demo@example.com',
            full_name: 'Demo User',
            onboarding_step: 'not_started',
            onboarding_complete: false
          }
        ]);
        
      if (insertError) {
        console.log('Error creating demo user:', insertError.message);
      } else {
        console.log('✅ Demo user created successfully');
      }
    } else {
      console.log('Demo user already exists');
    }
    
    return { success: true };
  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    return { success: false, error: error.message };
  }
}

// Run the setup
setupDatabase().then((result) => {
  if (result.success) {
    console.log('Database setup completed successfully');
  } else {
    console.error('Database setup failed:', result.error);
    process.exit(1);
  }
});