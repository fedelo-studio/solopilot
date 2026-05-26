import "server-only";
import { isLive } from "./_mode";
import { createServerSupabase } from "@/lib/supabase/server";
import { mockBudgets } from "@/lib/mock";
import type { Budget, Currency } from "@/types/domain";

function rowToBudget(row: Record<string, unknown>): Budget {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    periodMonth: row.period_month as string,
    categoryId: row.category_id as string,
    plannedAmount: Number(row.planned_amount),
    currency: (row.currency as Currency) ?? "CHF",
    notes: (row.notes as string) ?? undefined,
  };
}

export async function getBudgetById(id: string): Promise<Budget | null> {
  if (!isLive) return mockBudgets.find((b) => b.id === id) ?? null;
  const supabase = await createServerSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.from("budgets").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? rowToBudget(data) : null;
}

export async function getBudgets(): Promise<Budget[]> {
  if (!isLive) return mockBudgets;
  const supabase = await createServerSupabase();
  if (!supabase) return mockBudgets;
  const { data, error } = await supabase.from("budgets").select("*").order("period_month", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToBudget);
}
