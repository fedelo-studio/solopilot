"use server";

import { z } from "zod";
import {
  deleteOwnedRow,
  fail,
  firstError,
  getAuthedSession,
  ok,
  parseFormData,
  parseInput,
  revalidateMany,
  type ActionResult,
} from "./_helpers";
import { mockExpensesStore } from "@/lib/mock/expenses";
import { mockId, nowIso } from "@/lib/mock/_store";
import type { ExpenseLink } from "@/types/domain";

function buildLink(linkType: "deal" | "client" | "project" | "none", linkId?: string): ExpenseLink {
  if (linkType === "none" || !linkId) return { type: "none" };
  return { type: linkType, id: linkId };
}

const ExpenseCreateSchema = z.object({
  date: z.string().min(1, "La date est requise"),
  vendor: z.string().trim().min(1, "Le fournisseur est requis"),
  amount: z.coerce.number().positive("Le montant doit être positif"),
  categoryId: z.string().optional(),
  linkType: z.enum(["deal", "client", "project", "none"]).default("none"),
  linkId: z.string().optional(),
  billable: z
    .union([z.literal("on"), z.literal("true"), z.literal("")])
    .optional()
    .transform((v) => v === "on" || v === "true"),
  description: z.string().optional(),
});

export async function createExpense(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const parsed = parseFormData(ExpenseCreateSchema, formData);
  if (!parsed.success) return fail("Validation échouée", parsed.fields);

  const session = await getAuthedSession();
  if (!session.ok) return fail(session.error);

  if (session.session.mode === "mock") {
    const id = mockId("e");
    mockExpensesStore.add({
      id,
      userId: session.session.userId,
      date: parsed.data.date,
      vendor: parsed.data.vendor,
      description: parsed.data.description || undefined,
      amount: parsed.data.amount,
      currency: "CHF",
      categoryId: parsed.data.categoryId || undefined,
      link: buildLink(parsed.data.linkType, parsed.data.linkId),
      billable: parsed.data.billable,
      createdAt: nowIso(),
    });
    revalidateMany(["/depenses", "/dashboard", "/budgets", "/projets"]);
    return ok({ id });
  }

  const { userId, supabase } = session.session;
  const linkType = parsed.data.linkType;
  const linkId = linkType !== "none" ? parsed.data.linkId || null : null;

  const { data, error } = await supabase
    .from("expenses")
    .insert({
      user_id: userId,
      date: parsed.data.date,
      vendor: parsed.data.vendor,
      amount: parsed.data.amount,
      category_id: parsed.data.categoryId || null,
      link_type: linkType,
      link_id: linkId,
      billable: parsed.data.billable,
      description: parsed.data.description || null,
    })
    .select("id")
    .single();

  if (error) return fail(error.message);
  revalidateMany(["/depenses"]);
  return ok({ id: data.id as string });
}

const ExpenseUpdateSchema = z.object({
  id: z.string().min(1),
  date: z.string().min(1, "La date est requise"),
  vendor: z.string().trim().min(1, "Le fournisseur est requis"),
  amount: z.coerce.number().positive("Le montant doit être positif"),
  categoryId: z.string().optional(),
  linkType: z.enum(["deal", "client", "project", "none"]).default("none"),
  linkId: z.string().optional(),
  billable: z.coerce.boolean().default(false),
  description: z.string().optional(),
});

export async function updateExpense(
  input: z.input<typeof ExpenseUpdateSchema>,
): Promise<ActionResult> {
  const parsed = parseInput(ExpenseUpdateSchema, input);
  if (!parsed.success) return fail(firstError(parsed), parsed.fields);

  const session = await getAuthedSession();
  if (!session.ok) return fail(session.error);

  const paths = [`/depenses/${parsed.data.id}`, "/depenses", "/dashboard"];

  if (session.session.mode === "mock") {
    if (!mockExpensesStore.get(parsed.data.id)) return fail("Dépense introuvable");
    mockExpensesStore.update(parsed.data.id, {
      date: parsed.data.date,
      vendor: parsed.data.vendor,
      description: parsed.data.description || undefined,
      amount: parsed.data.amount,
      categoryId: parsed.data.categoryId || undefined,
      link: buildLink(parsed.data.linkType, parsed.data.linkId),
      billable: parsed.data.billable,
    });
    revalidateMany(paths);
    return ok(null);
  }

  const { userId, supabase } = session.session;
  const linkType = parsed.data.linkType;
  const linkId = linkType !== "none" ? parsed.data.linkId || null : null;

  const { error } = await supabase
    .from("expenses")
    .update({
      date: parsed.data.date,
      vendor: parsed.data.vendor,
      amount: parsed.data.amount,
      category_id: parsed.data.categoryId || null,
      link_type: linkType,
      link_id: linkId,
      billable: parsed.data.billable,
      description: parsed.data.description || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.id)
    .eq("user_id", userId);

  if (error) return fail(error.message);
  revalidateMany(paths);
  return ok(null);
}

export async function deleteExpense(id: string): Promise<ActionResult> {
  return deleteOwnedRow({ table: "expenses", id, paths: ["/depenses", "/dashboard"] });
}
