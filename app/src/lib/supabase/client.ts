"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseReady } from "./env";

/** Browser-side Supabase client.
 *  Returns null when Supabase isn't configured — callers must handle that. */
export function createClient() {
  if (!isSupabaseReady) return null;
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
