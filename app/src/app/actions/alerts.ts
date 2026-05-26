"use server";

import {
  getAccounts,
  getBudgets,
  getDeals,
  getExpenses,
  getInvoices,
} from "@/lib/data";
import { computeAlerts } from "@/lib/finance/alerts";
import {
  fail,
  getAuthedSession,
  ok,
  revalidateMany,
  type ActionResult,
} from "./_helpers";
import { mockAlertsStore } from "@/lib/mock/alerts";
import { mockId, nowIso } from "@/lib/mock/_store";
import type { Alert } from "@/types/domain";

/** Recompute alerts from current workspace state and sync the alerts table.
 *  Idempotent — running it twice in a row leaves the same set of alerts in the table.
 *
 *  Strategy:
 *    1. Compute seeds from pure function.
 *    2. Diff against existing unresolved alerts (matched on title+related_id).
 *    3. Insert missing ones, mark resolved the ones no longer in the seed set.
 */
export async function recomputeAlerts(): Promise<ActionResult<{ created: number; resolved: number }>> {
  const session = await getAuthedSession();
  if (!session.ok) return fail(session.error);

  const [invoices, expenses, budgets, deals, accounts] = await Promise.all([
    getInvoices(),
    getExpenses(),
    getBudgets(),
    getDeals(),
    getAccounts(),
  ]);

  const seeds = computeAlerts({ invoices, expenses, budgets, deals, accounts });

  if (session.session.mode === "mock") {
    // Mirror the live behavior end-to-end: diff seeds vs existing unresolved
    // alerts, insert missing, resolve obsolete. Keeps the alerts widget
    // truthful as the user changes mock data.
    const existingByKey = new Map<string, string>();
    for (const a of mockAlertsStore.items) {
      if (a.resolvedAt) continue;
      const key = a.relatedId ? `${a.type}:${a.relatedId}` : a.type;
      existingByKey.set(key, a.id);
    }
    const seedKeys = new Set(seeds.map((s) => s.key));

    let created = 0;
    for (const s of seeds) {
      if (existingByKey.has(s.key)) continue;
      const newAlert: Alert = {
        id: mockId("al"),
        userId: session.session.userId,
        type: s.type,
        severity: s.severity,
        title: s.title,
        body: s.body,
        relatedType: s.relatedType,
        relatedId: s.relatedId,
        createdAt: nowIso(),
      };
      mockAlertsStore.add(newAlert);
      created += 1;
    }

    let resolved = 0;
    for (const [key, id] of existingByKey.entries()) {
      if (seedKeys.has(key)) continue;
      mockAlertsStore.update(id, { resolvedAt: nowIso() });
      resolved += 1;
    }

    revalidateMany(["/dashboard", "/alertes", "/factures"]);
    return ok({ created, resolved });
  }

  const { userId, supabase } = session.session;
  // Fetch existing unresolved alerts for this user.
  const { data: existingRows, error: fetchError } = await supabase
    .from("alerts")
    .select("id, type, related_id")
    .eq("user_id", userId)
    .is("resolved_at", null);
  if (fetchError) return fail(fetchError.message);

  /** Reproduce the same `key` shape as computeAlerts for matching. */
  function keyOf(row: { type: string; related_id: string | null }): string {
    return row.related_id ? `${row.type}:${row.related_id}` : row.type;
  }

  const existingByKey = new Map<string, string>((existingRows ?? []).map((r) => [keyOf(r), r.id]));
  const seedKeys = new Set(seeds.map((s) => s.key));

  // Inserts: seeds that aren't already in the table.
  const toInsert = seeds.filter((s) => !existingByKey.has(s.key));
  let created = 0;
  if (toInsert.length > 0) {
    const { error: insertError } = await supabase.from("alerts").insert(
      toInsert.map((s) => ({
        user_id: userId,
        type: s.type,
        severity: s.severity,
        title: s.title,
        body: s.body,
        related_type: s.relatedType,
        related_id: s.relatedId,
      })),
    );
    if (insertError) return fail(insertError.message);
    created = toInsert.length;
  }

  // Resolutions: existing alerts not present in the new seed set.
  const toResolve = [...existingByKey.entries()]
    .filter(([key]) => !seedKeys.has(key))
    .map(([, id]) => id);
  let resolved = 0;
  if (toResolve.length > 0) {
    const { error: resolveError } = await supabase
      .from("alerts")
      .update({ resolved_at: new Date().toISOString() })
      .in("id", toResolve);
    if (resolveError) return fail(resolveError.message);
    resolved = toResolve.length;
  }

  revalidateMany(["/dashboard", "/factures"]);
  return ok({ created, resolved });
}
