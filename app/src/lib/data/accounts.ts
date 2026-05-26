import "server-only";
import { isLive } from "./_mode";
import { createServerSupabase } from "@/lib/supabase/server";
import { mockAccounts, mockTransactions } from "@/lib/mock";
import type { Account, Currency, Transaction } from "@/types/domain";

function rowToAccount(row: Record<string, unknown>): Account {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    name: row.name as string,
    kind: row.kind as Account["kind"],
    initialBalance: Number(row.initial_balance),
    currency: (row.currency as Currency) ?? "CHF",
    createdAt: row.created_at as string,
  };
}

function rowToTransaction(row: Record<string, unknown>): Transaction {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    accountId: row.account_id as string,
    date: row.date as string,
    amount: Number(row.amount),
    label: row.label as string,
    kind: row.kind as Transaction["kind"],
    linkedInvoiceId: (row.linked_invoice_id as string) ?? undefined,
    linkedExpenseId: (row.linked_expense_id as string) ?? undefined,
    createdAt: row.created_at as string,
  };
}

export async function getAccountById(id: string): Promise<Account | null> {
  if (!isLive) return mockAccounts.find((a) => a.id === id) ?? null;
  const supabase = await createServerSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.from("accounts").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? rowToAccount(data) : null;
}

export async function getAccounts(): Promise<Account[]> {
  if (!isLive) return mockAccounts;
  const supabase = await createServerSupabase();
  if (!supabase) return mockAccounts;
  const { data, error } = await supabase.from("accounts").select("*").order("created_at");
  if (error) throw error;
  return (data ?? []).map(rowToAccount);
}

export async function getTransactions(): Promise<Transaction[]> {
  if (!isLive) return mockTransactions;
  const supabase = await createServerSupabase();
  if (!supabase) return mockTransactions;
  const { data, error } = await supabase.from("transactions").select("*").order("date", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToTransaction);
}
