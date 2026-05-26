import "server-only";
import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { z, ZodTypeAny } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { isLive } from "@/lib/data/_mode";
// Ensures every mock store registers itself in the delete registry before
// `deleteOwnedRow` tries to dispatch to it. The barrel file side-effect-imports
// every entity module, populating the registry on first load.
import "@/lib/mock";
import { deleteFromMock } from "@/lib/mock/_store";

/** Resolve the authenticated user id, or null in mock mode.
 *  Internal — prefer `getAuthedSession()` from any caller. */
async function requireUserId(): Promise<string | null> {
  if (!isLive) return "user-felipe"; // mock user in mock mode
  const supabase = await createServerSupabase();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string; fields?: Record<string, string> };

/** Generic on the success payload type so it composes with concrete return annotations
 *  on each Server Action (e.g. `Promise<ActionResult<{ id: string }>>`). */
export function fail<T = never>(error: string, fields?: Record<string, string>): ActionResult<T> {
  return { ok: false, error, fields };
}

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared boilerplate helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Result of trying to validate untrusted user input against a Zod schema.
 *  Either we have parsed data, or we have a flat `field → message` map ready
 *  to feed back into the UI for inline errors. */
export type ParseResult<T> =
  | { success: true; data: T }
  | { success: false; fields: Record<string, string> };

/** Parse a `FormData` object against a Zod schema and flatten the validation
 *  errors into a `{ fieldName: message }` shape suitable for the UI.
 *  Use this for actions invoked via native HTML `<form action={…}>`. */
export function parseFormData<Schema extends ZodTypeAny>(
  schema: Schema,
  formData: FormData,
): ParseResult<z.output<Schema>> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = schema.safeParse(raw);
  if (parsed.success) return { success: true, data: parsed.data };
  return { success: false, fields: flattenFieldErrors(parsed.error.issues) };
}

/** Parse an arbitrary input object against a Zod schema, same flattened shape.
 *  Use this for actions invoked with a typed object via `useTransition`. */
export function parseInput<Schema extends ZodTypeAny>(
  schema: Schema,
  input: unknown,
): ParseResult<z.output<Schema>> {
  const parsed = schema.safeParse(input);
  if (parsed.success) return { success: true, data: parsed.data };
  return { success: false, fields: flattenFieldErrors(parsed.error.issues) };
}

function flattenFieldErrors(
  issues: { path: (string | number)[]; message: string }[],
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const path = issue.path[0];
    if (typeof path === "string" && !(path in out)) out[path] = issue.message;
  }
  return out;
}

/** Pull the first issue's message — handy for action results that surface a
 *  single top-level error message instead of inline field errors. */
export function firstError(result: ParseResult<unknown>): string {
  if (result.success) return "Validation échouée";
  return Object.values(result.fields)[0] ?? "Validation échouée";
}

/** Lazy-loaded Supabase client + user id. Returns `null` when the request
 *  should be served from mock data (and therefore *not* hit the database). */
export type AuthedSession =
  | { mode: "mock"; userId: string; supabase: null }
  | { mode: "live"; userId: string; supabase: SupabaseClient };

/** Resolve auth + Supabase in one call.
 *  - In mock mode: returns the mock user id and a `null` Supabase client.
 *  - In live mode: returns the authenticated user id and a ready client.
 *  - Returns a structured failure when auth or the client can't be obtained,
 *    which the caller can short-circuit straight to a `fail(...)` response. */
export async function getAuthedSession(): Promise<
  { ok: true; session: AuthedSession } | { ok: false; error: string }
> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "Non authentifié." };
  if (!isLive) return { ok: true, session: { mode: "mock", userId, supabase: null } };
  const supabase = await createServerSupabase();
  if (!supabase) return { ok: false, error: "Supabase indisponible." };
  return { ok: true, session: { mode: "live", userId, supabase } };
}

/** Convenience — revalidate several paths in one go. */
export function revalidateMany(paths: readonly string[]): void {
  for (const p of paths) revalidatePath(p);
}

/** Delete a row scoped to the authenticated user. Centralises the
 *  auth → mock-branch → `delete().eq(id).eq(user_id)` → revalidate scaffolding
 *  that every entity's `delete*` action was hand-rolling.
 *
 *  - In mock mode: dispatches to the registered mock store for `table`. If no
 *    store is registered, returns ok (the registry covers every CRUD entity).
 *  - In live mode: deletes the row, returning a friendlier `fkMessage`
 *    when an `on delete restrict` constraint blocks the delete (Postgres 23503).
 */
export async function deleteOwnedRow(args: {
  table: string;
  id: string;
  paths: readonly string[];
  fkMessage?: string;
  /** Mock-only hook to mirror Supabase cascade / set-null behavior in fixtures.
   *  Runs AFTER the row is removed from the mock store. */
  mockSideEffect?: () => void;
}): Promise<ActionResult> {
  const session = await getAuthedSession();
  if (!session.ok) return fail(session.error);

  if (session.session.mode === "mock") {
    deleteFromMock(args.table, args.id);
    args.mockSideEffect?.();
    revalidateMany(args.paths);
    return ok(null);
  }

  const { userId, supabase } = session.session;
  const { error } = await supabase
    .from(args.table)
    .delete()
    .eq("id", args.id)
    .eq("user_id", userId);

  if (error) {
    if (args.fkMessage && error.code === "23503") return fail(args.fkMessage);
    return fail(error.message);
  }
  revalidateMany(args.paths);
  return ok(null);
}
