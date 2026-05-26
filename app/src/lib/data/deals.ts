import "server-only";
import { isLive } from "./_mode";
import { createServerSupabase } from "@/lib/supabase/server";
import { mockDeals } from "@/lib/mock";
import type { Currency, Deal } from "@/types/domain";

function rowToDeal(row: Record<string, unknown>): Deal {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    clientId: (row.client_id as string) ?? undefined,
    title: row.title as string,
    stage: row.stage as Deal["stage"],
    estimatedAmount: Number(row.estimated_amount),
    currency: (row.currency as Currency) ?? "CHF",
    probability: Number(row.probability),
    expectedSignatureDate: (row.expected_signature_date as string) ?? undefined,
    expectedPaymentDate: (row.expected_payment_date as string) ?? undefined,
    source: (row.source as string) ?? undefined,
    notes: (row.notes as string) ?? undefined,
    wonAt: (row.won_at as string) ?? undefined,
    lostReason: (row.lost_reason as string) ?? undefined,
    createdAt: row.created_at as string,
  };
}

export async function getDeals(): Promise<Deal[]> {
  if (!isLive) return mockDeals;
  const supabase = await createServerSupabase();
  if (!supabase) return mockDeals;
  const { data, error } = await supabase
    .from("deals")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToDeal);
}

export async function getDealById(id: string): Promise<Deal | null> {
  if (!isLive) return mockDeals.find((d) => d.id === id) ?? null;
  const supabase = await createServerSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.from("deals").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? rowToDeal(data) : null;
}
