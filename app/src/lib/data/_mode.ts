import "server-only";
import { dataMode } from "@/lib/supabase/env";

/** Server-only re-export of `dataMode`.
 *  Importing this in a client component fails at build time. */
export const mode = dataMode;
export const isLive = mode === "live";
