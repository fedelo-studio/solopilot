"use server";

import { z } from "zod";
import {
  deleteOwnedRow,
  fail,
  firstError,
  getAuthedSession,
  ok,
  parseInput,
  revalidateMany,
  type ActionResult,
} from "./_helpers";
import { mockBudgetsStore } from "@/lib/mock/budgets";
import { mockId } from "@/lib/mock/_store";

const BudgetSchema = z.object({
  periodMonth: z.string().min(7, "Mois requis (format YYYY-MM-01)"),
  categoryId: z.string().min(1, "Sélectionne une catégorie"),
  plannedAmount: z.coerce.number().nonnegative("Le budget doit être positif"),
  notes: z.string().optional(),
});

export async function createBudget(
  input: z.input<typeof BudgetSchema>,
): Promise<ActionResult<{ id: string }>> {
  const parsed = parseInput(BudgetSchema, input);
  if (!parsed.success) return fail(firstError(parsed), parsed.fields);

  const session = await getAuthedSession();
  if (!session.ok) return fail(session.error);

  if (session.session.mode === "mock") {
    const id = mockId("b");
    mockBudgetsStore.add({
      id,
      userId: session.session.userId,
      periodMonth: parsed.data.periodMonth,
      categoryId: parsed.data.categoryId,
      plannedAmount: parsed.data.plannedAmount,
      currency: "CHF",
      notes: parsed.data.notes || undefined,
    });
    revalidateMany(["/budgets", "/dashboard"]);
    return ok({ id });
  }

  const { userId, supabase } = session.session;
  const { data, error } = await supabase
    .from("budgets")
    .insert({
      user_id: userId,
      period_month: parsed.data.periodMonth,
      category_id: parsed.data.categoryId,
      planned_amount: parsed.data.plannedAmount,
      notes: parsed.data.notes || null,
    })
    .select("id")
    .single();

  if (error) return fail(error.message);
  revalidateMany(["/budgets", "/dashboard"]);
  return ok({ id: data.id as string });
}

const BudgetUpdateSchema = BudgetSchema.extend({ id: z.string().min(1) });

export async function updateBudget(
  input: z.input<typeof BudgetUpdateSchema>,
): Promise<ActionResult> {
  const parsed = parseInput(BudgetUpdateSchema, input);
  if (!parsed.success) return fail(firstError(parsed), parsed.fields);

  const session = await getAuthedSession();
  if (!session.ok) return fail(session.error);

  if (session.session.mode === "mock") {
    if (!mockBudgetsStore.get(parsed.data.id)) return fail("Budget introuvable");
    mockBudgetsStore.update(parsed.data.id, {
      periodMonth: parsed.data.periodMonth,
      categoryId: parsed.data.categoryId,
      plannedAmount: parsed.data.plannedAmount,
      notes: parsed.data.notes || undefined,
    });
    revalidateMany(["/budgets", "/dashboard"]);
    return ok(null);
  }

  const { userId, supabase } = session.session;
  const { error } = await supabase
    .from("budgets")
    .update({
      period_month: parsed.data.periodMonth,
      category_id: parsed.data.categoryId,
      planned_amount: parsed.data.plannedAmount,
      notes: parsed.data.notes || null,
    })
    .eq("id", parsed.data.id)
    .eq("user_id", userId);

  if (error) return fail(error.message);
  revalidateMany(["/budgets", "/dashboard"]);
  return ok(null);
}

export async function deleteBudget(id: string): Promise<ActionResult> {
  return deleteOwnedRow({ table: "budgets", id, paths: ["/budgets"] });
}
