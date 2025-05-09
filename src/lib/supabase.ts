'use client';

import { createClient } from '@supabase/supabase-js';

// Check if Supabase URL and key are available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Flag to check if Supabase is configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseKey);

// Create Supabase client if configured, otherwise return null
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseKey!)
  : null;
