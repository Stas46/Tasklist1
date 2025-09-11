import { createClient } from '@supabase/supabase-js';


// Supabase credentials (updated)
const SUPABASE_URL = 'https://efenxstkzveazqjbrxli.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmZW54c3RtenZlYXpxamJyeGxpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MjMwNTUsImV4cCI6MjA3MzE5OTA1NX0.OJNa2bl_10xq_P8LPWe5aIEfUIhwPNrDpelEc8jLJDQ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
