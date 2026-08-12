/**
 * IMPORTANT AUTH CONFIGURATION SAFEGUARD:
 * For Email/Password signups to work, you must manually enable the Email provider 
 * in the Supabase Dashboard:
 * 1. Go to your project page (e.g. https://supabase.com/dashboard/project/ahdggyxzsbiyrjiflltd)
 * 2. Navigate to Authentication -> Providers -> Email
 * 3. Switch the "Enable Email provider" toggle to ON.
 * 4. Confirm "Allow new users to sign up" is enabled in settings.
 * Without this remote dashboard configuration, client signup requests will return
 * an "Email signups are disabled" error.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

export const isSupabaseConfigured =
  Boolean(supabaseUrl && supabaseAnonKey) &&
  supabaseUrl !== 'https://your-project-ref.supabase.co' &&
  supabaseAnonKey !== 'your-anon-key';

function createSupabaseClient(): SupabaseClient {
  if (!isSupabaseConfigured) {
    console.warn(
      '[StudentOS] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy .env.example to .env and restart the dev server.',
    );
    return createClient('http://127.0.0.1:54321', 'public-anon-key-not-configured', {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

export const supabase = createSupabaseClient();

