import "server-only";
import { isLive } from "./_mode";
import { createServerSupabase } from "@/lib/supabase/server";
import { mockPeople } from "@/lib/mock";
import type { Person } from "@/types/domain";

function rowToPerson(row: Record<string, unknown>): Person {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    name: row.name as string,
    email: (row.email as string) ?? undefined,
    costRate: Number(row.cost_rate),
    billableRate: Number(row.billable_rate),
    weeklyCapacityHours: Number(row.weekly_capacity_hours),
    isActive: row.is_active as boolean,
    notes: (row.notes as string) ?? undefined,
    createdAt: row.created_at as string,
  };
}

export async function getPeople(): Promise<Person[]> {
  if (!isLive) return mockPeople;
  const supabase = await createServerSupabase();
  if (!supabase) return mockPeople;
  const { data, error } = await supabase.from("people").select("*").order("name");
  if (error) throw error;
  return (data ?? []).map(rowToPerson);
}

export async function getPersonById(id: string): Promise<Person | null> {
  if (!isLive) return mockPeople.find((p) => p.id === id) ?? null;
  const supabase = await createServerSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.from("people").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? rowToPerson(data) : null;
}
