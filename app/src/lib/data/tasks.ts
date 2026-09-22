import "server-only";
import { isLive } from "./_mode";
import { createServerSupabase } from "@/lib/supabase/server";
import { mockTasks } from "@/lib/mock";
import type { Task } from "@/types/domain";

function rowToTask(row: Record<string, unknown>): Task {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    projectId: row.project_id as string,
    assigneeId: (row.assignee_id as string) ?? undefined,
    title: row.title as string,
    description: (row.description as string) ?? undefined,
    status: row.status as Task["status"],
    priority: row.priority as Task["priority"],
    category: (row.category as string) ?? undefined,
    billable: row.billable as boolean,
    estimatedHours: row.estimated_hours != null ? Number(row.estimated_hours) : undefined,
    startDate: (row.start_date as string) ?? undefined,
    dueDate: (row.due_date as string) ?? undefined,
    createdAt: row.created_at as string,
  };
}

export async function getTasks(): Promise<Task[]> {
  if (!isLive) return mockTasks;
  const supabase = await createServerSupabase();
  if (!supabase) return mockTasks;
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(rowToTask);
}

export async function getTasksByProject(projectId: string): Promise<Task[]> {
  if (!isLive) return mockTasks.filter((t) => t.projectId === projectId);
  const supabase = await createServerSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(rowToTask);
}

export async function getTaskById(id: string): Promise<Task | null> {
  if (!isLive) return mockTasks.find((t) => t.id === id) ?? null;
  const supabase = await createServerSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.from("tasks").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? rowToTask(data) : null;
}
