import "server-only";
import { isLive } from "./_mode";
import { createServerSupabase } from "@/lib/supabase/server";
import { mockTimeEntries } from "@/lib/mock";
import type { TimeEntry } from "@/types/domain";

function rowToTimeEntry(row: Record<string, unknown>): TimeEntry {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    projectId: row.project_id as string,
    taskId: (row.task_id as string) ?? undefined,
    personId: row.person_id as string,
    date: row.date as string,
    startTime: (row.start_time as string) ?? undefined,
    durationMinutes: Number(row.duration_minutes),
    description: (row.description as string) ?? undefined,
    billable: row.billable as boolean,
    invoiceId: (row.invoice_id as string) ?? undefined,
    createdAt: row.created_at as string,
  };
}

export async function getTimeEntries(): Promise<TimeEntry[]> {
  if (!isLive) return mockTimeEntries;
  const supabase = await createServerSupabase();
  if (!supabase) return mockTimeEntries;
  const { data, error } = await supabase
    .from("time_entries")
    .select("*")
    .order("date", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToTimeEntry);
}

export async function getTimeEntriesByProject(projectId: string): Promise<TimeEntry[]> {
  if (!isLive) return mockTimeEntries.filter((e) => e.projectId === projectId);
  const supabase = await createServerSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("time_entries")
    .select("*")
    .eq("project_id", projectId)
    .order("date", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToTimeEntry);
}

export async function getTimeEntriesByPerson(
  personId: string,
  range?: { from: string; to: string },
): Promise<TimeEntry[]> {
  if (!isLive) {
    return mockTimeEntries.filter(
      (e) =>
        e.personId === personId &&
        (!range || (e.date >= range.from && e.date <= range.to)),
    );
  }
  const supabase = await createServerSupabase();
  if (!supabase) return [];
  let query = supabase.from("time_entries").select("*").eq("person_id", personId);
  if (range) query = query.gte("date", range.from).lte("date", range.to);
  const { data, error } = await query.order("date", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(rowToTimeEntry);
}

export async function getUnbilledTimeEntriesByProject(projectId: string): Promise<TimeEntry[]> {
  if (!isLive) {
    return mockTimeEntries.filter(
      (e) => e.projectId === projectId && e.billable && !e.invoiceId,
    );
  }
  const supabase = await createServerSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("time_entries")
    .select("*")
    .eq("project_id", projectId)
    .eq("billable", true)
    .is("invoice_id", null)
    .order("date", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(rowToTimeEntry);
}
