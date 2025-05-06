require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase with the service role key for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createDemoProfile() {
  console.log('Creating demo profile in Supabase...');
  
  try {
    // First, check if the profile already exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', 'demo-user-id')
      .maybeSingle();
    
    if (checkError) {
      console.error('Error checking for existing profile:', checkError.message);
      // If error is about missing table or column, we'll create the profile anyway
    }
    
    if (existingProfile) {
      console.log('Demo profile already exists, updating it...');
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          email: 'demo@example.com',
          full_name: 'Demo User',
          onboarding_step: 'not_started',
          onboarding_complete: false
        })
        .eq('id', 'demo-user-id');
      
      if (updateError) {
        console.error('Error updating demo profile:', updateError.message);
        return { success: false, error: updateError.message };
      }
      
      console.log('✅ Demo profile updated successfully');
      return { success: true };
    }
    
    // Create a new demo profile
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
      console.error('Error creating demo profile:', insertError.message);
      return { success: false, error: insertError.message };
    }
    
    console.log('✅ Demo profile created successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    return { success: false, error: error.message };
  }
}

// Run the function
createDemoProfile().then((result) => {
  if (result.success) {
    console.log('Operation completed successfully');
  } else {
    console.error('Operation failed:', result.error);
    process.exit(1);
  }
});