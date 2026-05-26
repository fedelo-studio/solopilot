"use server";

import { z } from "zod";
import {
  fail,
  firstError,
  getAuthedSession,
  ok,
  parseInput,
  revalidateMany,
  type ActionResult,
} from "./_helpers";
import { mockTransactionsStore } from "@/lib/mock/accounts";
import { mockId, nowIso } from "@/lib/mock/_store";

const TransactionInput = z.object({
  date: z.string().min(10),
  label: z.string().trim().min(1),
  amount: z.number().nonnegative(),
  kind: z.enum(["in", "out"]),
});

const ImportInput = z.object({
  accountId: z.string().min(1, "Choisis un compte de destination"),
  transactions: z.array(TransactionInput).min(1, "Aucune ligne à importer"),
});

export type ImportInputT = z.input<typeof ImportInput>;

export async function importTransactions(input: ImportInputT): Promise<ActionResult<{ inserted: number }>> {
  const parsed = parseInput(ImportInput, input);
  if (!parsed.success) return fail(firstError(parsed));

  const session = await getAuthedSession();
  if (!session.ok) return fail(session.error);

  if (session.session.mode === "mock") {
    for (const t of parsed.data.transactions) {
      mockTransactionsStore.add({
        id: mockId("t"),
        userId: session.session.userId,
        accountId: parsed.data.accountId,
        date: t.date,
        label: t.label,
        amount: t.amount,
        kind: t.kind,
        createdAt: nowIso(),
      });
    }
    revalidateMany(["/comptes", "/dashboard", "/cashflow"]);
    return ok({ inserted: parsed.data.transactions.length });
  }

  const { userId, supabase } = session.session;
  const { error } = await supabase.from("transactions").insert(
    parsed.data.transactions.map((t) => ({
      user_id: userId,
      account_id: parsed.data.accountId,
      date: t.date,
      label: t.label,
      amount: t.amount,
      kind: t.kind,
    })),
  );
  if (error) return fail(error.message);

  revalidateMany(["/dashboard", "/comptes"]);
  return ok({ inserted: parsed.data.transactions.length });
}
