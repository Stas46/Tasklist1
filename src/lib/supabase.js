import { createClient } from '@supabase/supabase-js';

// Supabase credentials (provided)
const SUPABASE_URL = 'https://llbwjgpvsqewbrqzcujp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsYndqZ3B2c3Fld2JycXpjdWpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MTk5NjYsImV4cCI6MjA3MzE5NTk2Nn0.zfOZCB3YmfkWPEPKLC3oAJoOoPjsdJwpePjg1AobfCE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
