import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[KnowSphere] Supabase credentials not found. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
  );
}

/** Public client — safe for client-side use, respects RLS */
export const supabase = createClient(
  supabaseUrl ?? 'https://placeholder.supabase.co',
  supabaseAnonKey ?? 'placeholder-anon-key'
);

/** Returns true only if real Supabase credentials have been configured */
export function isSupabaseConfigured(): boolean {
  return !!(
    supabaseUrl &&
    !supabaseUrl.includes('your-project-ref') &&
    !supabaseUrl.includes('placeholder') &&
    supabaseServiceKey &&
    !supabaseServiceKey.includes('your-supabase')
  );
}

/** Admin client — server-side only, bypasses RLS via service role */
export function getAdminClient() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      'Server-side Supabase credentials missing or unconfigured. Set SUPABASE_SERVICE_ROLE_KEY in .env.local'
    );
  }
  return createClient(supabaseUrl!, supabaseServiceKey!, {
    auth: { persistSession: false },
  });
}

