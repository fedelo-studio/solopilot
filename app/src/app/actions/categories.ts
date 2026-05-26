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
import { mockExpenseCategoriesStore, mockExpensesStore } from "@/lib/mock/expenses";
import { mockId } from "@/lib/mock/_store";

const CategorySchema = z.object({
  name: z.string().trim().min(1, "Nom requis"),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Couleur invalide (format #RRGGBB)")
    .default("#6b7280"),
});

const PATHS = ["/parametres", "/depenses", "/budgets", "/rapports"];

export async function createCategory(
  input: z.input<typeof CategorySchema>,
): Promise<ActionResult<{ id: string }>> {
  const parsed = parseInput(CategorySchema, input);
  if (!parsed.success) return fail(firstError(parsed), parsed.fields);

  const session = await getAuthedSession();
  if (!session.ok) return fail(session.error);

  if (session.session.mode === "mock") {
    const id = mockId("cat");
    mockExpenseCategoriesStore.add({
      id,
      userId: session.session.userId,
      name: parsed.data.name,
      color: parsed.data.color,
    });
    revalidateMany(PATHS);
    return ok({ id });
  }

  const { userId, supabase } = session.session;
  const { data, error } = await supabase
    .from("expense_categories")
    .insert({
      user_id: userId,
      name: parsed.data.name,
      color: parsed.data.color,
    })
    .select("id")
    .single();

  if (error) return fail(error.message);
  revalidateMany(PATHS);
  return ok({ id: data.id as string });
}

const CategoryUpdateSchema = CategorySchema.extend({ id: z.string().min(1) });

export async function updateCategory(
  input: z.input<typeof CategoryUpdateSchema>,
): Promise<ActionResult> {
  const parsed = parseInput(CategoryUpdateSchema, input);
  if (!parsed.success) return fail(firstError(parsed), parsed.fields);

  const session = await getAuthedSession();
  if (!session.ok) return fail(session.error);

  if (session.session.mode === "mock") {
    if (!mockExpenseCategoriesStore.get(parsed.data.id)) return fail("Catégorie introuvable");
    mockExpenseCategoriesStore.update(parsed.data.id, {
      name: parsed.data.name,
      color: parsed.data.color,
    });
    revalidateMany(PATHS);
    return ok(null);
  }

  const { userId, supabase } = session.session;
  const { error } = await supabase
    .from("expense_categories")
    .update({ name: parsed.data.name, color: parsed.data.color })
    .eq("id", parsed.data.id)
    .eq("user_id", userId);

  if (error) return fail(error.message);
  revalidateMany(PATHS);
  return ok(null);
}

/** Note: linked expenses will have their `category_id` set to null because of
 *  `on delete set null`. Budgets cascade-delete via FK. The mock side-effect
 *  mirrors both behaviors so the demo dataset stays consistent. */
export async function deleteCategory(id: string): Promise<ActionResult> {
  return deleteOwnedRow({
    table: "expense_categories",
    id,
    paths: PATHS,
    mockSideEffect: () => {
      // ON DELETE SET NULL — nullify on linked expenses
      for (const e of mockExpensesStore.items) {
        if (e.categoryId === id) mockExpensesStore.update(e.id, { categoryId: undefined });
      }
    },
  });
}
