import "server-only";
import { isLive } from "./_mode";
import { createServerSupabase } from "@/lib/supabase/server";
import { mockExpenseCategories, mockExpenses } from "@/lib/mock";
import type { Currency, Expense, ExpenseCategory, ExpenseLink } from "@/types/domain";

function rowToCategory(row: Record<string, unknown>): ExpenseCategory {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    name: row.name as string,
    color: row.color as string,
  };
}

function rowToExpense(row: Record<string, unknown>): Expense {
  const linkType = (row.link_type as ExpenseLink["type"]) ?? "none";
  const link: ExpenseLink =
    linkType === "none"
      ? { type: "none" }
      : ({ type: linkType, id: row.link_id as string } as ExpenseLink);
  return {
    id: row.id as string,
    userId: row.user_id as string,
    date: row.date as string,
    vendor: row.vendor as string,
    description: (row.description as string) ?? undefined,
    amount: Number(row.amount),
    currency: (row.currency as Currency) ?? "CHF",
    categoryId: (row.category_id as string) ?? undefined,
    link,
    billable: Boolean(row.billable),
    receiptUrl: (row.receipt_url as string) ?? undefined,
    createdAt: row.created_at as string,
  };
}

export async function getExpenseById(id: string): Promise<Expense | null> {
  if (!isLive) return mockExpenses.find((e) => e.id === id) ?? null;
  const supabase = await createServerSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.from("expenses").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? rowToExpense(data) : null;
}

export async function getExpenses(): Promise<Expense[]> {
  if (!isLive) return mockExpenses;
  const supabase = await createServerSupabase();
  if (!supabase) return mockExpenses;
  const { data, error } = await supabase.from("expenses").select("*").order("date", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToExpense);
}

export async function getExpenseCategories(): Promise<ExpenseCategory[]> {
  if (!isLive) return mockExpenseCategories;
  const supabase = await createServerSupabase();
  if (!supabase) return mockExpenseCategories;
  const { data, error } = await supabase.from("expense_categories").select("*").order("name");
  if (error) throw error;
  return (data ?? []).map(rowToCategory);
}

export async function getExpensesByProject(projectId: string): Promise<Expense[]> {
  if (!isLive)
    return mockExpenses.filter((e) => e.link.type === "project" && e.link.id === projectId);
  const supabase = await createServerSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("link_type", "project")
    .eq("link_id", projectId);
  if (error) throw error;
  return (data ?? []).map(rowToExpense);
}
