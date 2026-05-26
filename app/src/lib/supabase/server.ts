import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseReady } from "./env";

/** Server-side Supabase client.
 *  Returns null when not configured — gives the rest of the app a chance
 *  to fall back to mock data. */
export async function createServerSupabase() {
  if (!isSupabaseReady) return null;
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(
        cookiesToSet: { name: string; value: string; options?: CookieOptions }[],
      ) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component — cookies can't be mutated. Safe to ignore.
        }
      },
    },
  });
}
