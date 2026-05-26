import "server-only";
import { isLive } from "./_mode";
import { createServerSupabase } from "@/lib/supabase/server";
import { mockAlerts } from "@/lib/mock";
import type { Alert } from "@/types/domain";

function rowToAlert(row: Record<string, unknown>): Alert {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    type: row.type as Alert["type"],
    severity: row.severity as Alert["severity"],
    title: row.title as string,
    body: (row.body as string) ?? undefined,
    relatedType: (row.related_type as Alert["relatedType"]) ?? undefined,
    relatedId: (row.related_id as string) ?? undefined,
    resolvedAt: (row.resolved_at as string) ?? undefined,
    createdAt: row.created_at as string,
  };
}

export async function getAlerts(): Promise<Alert[]> {
  if (!isLive) {
    // Mirror the live behavior — only unresolved alerts, newest first.
    return mockAlerts
      .filter((a) => !a.resolvedAt)
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  const supabase = await createServerSupabase();
  if (!supabase) return mockAlerts;
  const { data, error } = await supabase
    .from("alerts")
    .select("*")
    .is("resolved_at", null)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToAlert);
}
