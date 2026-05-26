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
import { mockAccountsStore } from "@/lib/mock/accounts";
import { mockId, nowIso } from "@/lib/mock/_store";

const AccountCreateSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis"),
  kind: z.enum(["bank", "cash", "savings"]).default("bank"),
  initialBalance: z.coerce.number(),
});

export async function createAccount(
  input: z.input<typeof AccountCreateSchema>,
): Promise<ActionResult<{ id: string }>> {
  const parsed = parseInput(AccountCreateSchema, input);
  if (!parsed.success) return fail(firstError(parsed));

  const session = await getAuthedSession();
  if (!session.ok) return fail(session.error);

  if (session.session.mode === "mock") {
    const id = mockId("a");
    mockAccountsStore.add({
      id,
      userId: session.session.userId,
      name: parsed.data.name,
      kind: parsed.data.kind,
      initialBalance: parsed.data.initialBalance,
      currency: "CHF",
      createdAt: nowIso(),
    });
    revalidateMany(["/comptes", "/dashboard"]);
    return ok({ id });
  }

  const { userId, supabase } = session.session;
  const { data, error } = await supabase
    .from("accounts")
    .insert({
      user_id: userId,
      name: parsed.data.name,
      kind: parsed.data.kind,
      initial_balance: parsed.data.initialBalance,
    })
    .select("id")
    .single();

  if (error) return fail(error.message);
  revalidateMany(["/comptes", "/dashboard"]);
  return ok({ id: data.id as string });
}

const AccountUpdateSchema = AccountCreateSchema.extend({ id: z.string().min(1) });

export async function updateAccount(
  input: z.input<typeof AccountUpdateSchema>,
): Promise<ActionResult> {
  const parsed = parseInput(AccountUpdateSchema, input);
  if (!parsed.success) return fail(firstError(parsed), parsed.fields);

  const session = await getAuthedSession();
  if (!session.ok) return fail(session.error);

  if (session.session.mode === "mock") {
    if (!mockAccountsStore.get(parsed.data.id)) return fail("Compte introuvable");
    mockAccountsStore.update(parsed.data.id, {
      name: parsed.data.name,
      kind: parsed.data.kind,
      initialBalance: parsed.data.initialBalance,
    });
    revalidateMany(["/comptes", "/dashboard"]);
    return ok(null);
  }

  const { userId, supabase } = session.session;
  const { error } = await supabase
    .from("accounts")
    .update({
      name: parsed.data.name,
      kind: parsed.data.kind,
      initial_balance: parsed.data.initialBalance,
    })
    .eq("id", parsed.data.id)
    .eq("user_id", userId);

  if (error) return fail(error.message);
  revalidateMany(["/comptes", "/dashboard"]);
  return ok(null);
}

export async function deleteAccount(id: string): Promise<ActionResult> {
  return deleteOwnedRow({ table: "accounts", id, paths: ["/comptes", "/dashboard"] });
}
