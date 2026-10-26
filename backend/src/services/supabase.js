import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

// Privileged access is server-only. Future routes must verify identity and ownership.
export function getSupabaseAdmin() {
  if (!env.SUPABASE_URL || !env.SUPABASE_SECRET_KEY) {
    throw new Error('Supabase server credentials are not configured.');
  }
  return createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
