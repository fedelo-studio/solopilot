/** Centralised access to Supabase env vars + a derived "ready" flag.
 *
 *  The app must keep working when Supabase isn't configured — that lets
 *  Felipe explore the UI before creating his Supabase project. We use the
 *  `isSupabaseReady` flag to gate auth checks and data fetches in vague 2.
 */

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseReady = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

/** "mock" forces fixture data even when Supabase is configured.
 *  Default behaviour: mock data until both URL + anon key are present. */
export const dataMode: "mock" | "live" =
  (process.env.NEXT_PUBLIC_DATA_MODE as "mock" | "live" | undefined) ??
  (isSupabaseReady ? "live" : "mock");
