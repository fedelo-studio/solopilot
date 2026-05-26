import "server-only";
import { isLive } from "./_mode";
import { createServerSupabase } from "@/lib/supabase/server";
import { mockProjects } from "@/lib/mock";
import type { Currency, Project } from "@/types/domain";

function rowToProject(row: Record<string, unknown>): Project {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    clientId: row.client_id as string,
    dealId: (row.deal_id as string) ?? undefined,
    name: row.name as string,
    status: row.status as Project["status"],
    soldBudget: Number(row.sold_budget),
    internalBudget: Number(row.internal_budget),
    currency: (row.currency as Currency) ?? "CHF",
    startDate: (row.start_date as string) ?? undefined,
    endDate: (row.end_date as string) ?? undefined,
    notes: (row.notes as string) ?? undefined,
    createdAt: row.created_at as string,
  };
}

export async function getProjects(): Promise<Project[]> {
  if (!isLive) return mockProjects;
  const supabase = await createServerSupabase();
  if (!supabase) return mockProjects;
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToProject);
}

export async function getProjectById(id: string): Promise<Project | null> {
  if (!isLive) return mockProjects.find((p) => p.id === id) ?? null;
  const supabase = await createServerSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.from("projects").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? rowToProject(data) : null;
}

export async function getProjectsByClient(clientId: string): Promise<Project[]> {
  if (!isLive) return mockProjects.filter((p) => p.clientId === clientId);
  const supabase = await createServerSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase.from("projects").select("*").eq("client_id", clientId);
  if (error) throw error;
  return (data ?? []).map(rowToProject);
}
