import { createClient } from '@supabase/supabase-js';
import { config } from '../config';

// Initialize Supabase admin client with service role key
export const supabaseAdmin = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);
