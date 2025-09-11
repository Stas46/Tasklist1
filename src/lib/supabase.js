import { createClient } from '@supabase/supabase-js';


// Supabase credentials: prefer environment variables for security. Fallback to the current hardcoded values.
const FALLBACK_SUPABASE_URL = 'https://efenxstkzveazqjbrxli.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmZW54c3RrenZlYXpxamJyeGxpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MjMwNTUsImV4cCI6MjA3MzE5OTA1NX0.OJNa2bl_10xq_P8LPWe5aIEfUIhwPNrDpelEc8jLJDQ';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_SUPABASE_ANON_KEY;

// Lightweight runtime checks to help debug "Invalid API key" without printing secrets
try {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    // no key/url at all
    // eslint-disable-next-line no-console
    console.warn('[supabase] missing URL or anon key — check EXPO_PUBLIC_SUPABASE_* env vars');
  } else if (SUPABASE_ANON_KEY.length < 20) {
    // clearly invalid
    // eslint-disable-next-line no-console
    console.warn('[supabase] anon key appears too short — likely invalid');
  } else if (SUPABASE_URL.indexOf('.supabase.co') === -1) {
    // unexpected URL
    // eslint-disable-next-line no-console
    console.warn(`[supabase] SUPABASE_URL looks unexpected: ${SUPABASE_URL}`);
  }
} catch (e) {
  // ignore
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
