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
import { mockDealsStore } from "@/lib/mock/deals";
import { mockId, nowIso } from "@/lib/mock/_store";

const DEAL_STAGES = ["lead", "qualified", "proposal", "negotiation", "won", "lost"] as const;
const TERMINAL_STAGES = new Set(["won", "lost"] as const);

const DealCreateSchema = z.object({
  title: z.string().trim().min(1, "Le titre est requis"),
  clientId: z.string().optional(),
  stage: z.enum(DEAL_STAGES).default("lead"),
  estimatedAmount: z.coerce.number().nonnegative("Le montant doit être positif"),
  probability: z.coerce.number().int().min(0).max(100),
  expectedSignatureDate: z.string().optional(),
  expectedPaymentDate: z.string().optional(),
  source: z.string().optional(),
  notes: z.string().optional(),
});

export async function createDeal(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const parsed = parseFormData(DealCreateSchema, formData);
  if (!parsed.success) return fail("Validation échouée", parsed.fields);

  const session = await getAuthedSession();
  if (!session.ok) return fail(session.error);

  if (session.session.mode === "mock") {
    const id = mockId("d");
    mockDealsStore.add({
      id,
      userId: session.session.userId,
      clientId: parsed.data.clientId || undefined,
      title: parsed.data.title,
      stage: parsed.data.stage,
      estimatedAmount: parsed.data.estimatedAmount,
      currency: "CHF",
      probability: parsed.data.probability,
      expectedSignatureDate: parsed.data.expectedSignatureDate || undefined,
      expectedPaymentDate: parsed.data.expectedPaymentDate || undefined,
      source: parsed.data.source || undefined,
      notes: parsed.data.notes || undefined,
      wonAt: parsed.data.stage === "won" ? nowIso() : undefined,
      createdAt: nowIso(),
    });
    revalidateMany(["/pipeline", "/dashboard"]);
    return ok({ id });
  }

  const { userId, supabase } = session.session;
  const { data, error } = await supabase
    .from("deals")
    .insert({
      user_id: userId,
      title: parsed.data.title,
      client_id: parsed.data.clientId || null,
      stage: parsed.data.stage,
      estimated_amount: parsed.data.estimatedAmount,
      probability: parsed.data.probability,
      expected_signature_date: parsed.data.expectedSignatureDate || null,
      expected_payment_date: parsed.data.expectedPaymentDate || null,
      source: parsed.data.source || null,
      notes: parsed.data.notes || null,
    })
    .select("id")
    .single();

  if (error) return fail(error.message);
  revalidateMany(["/pipeline", "/dashboard"]);
  return ok({ id: data.id as string });
}

const DealUpdateSchema = DealCreateSchema.extend({ id: z.string().min(1) });

export async function updateDeal(
  input: z.input<typeof DealUpdateSchema>,
): Promise<ActionResult> {
  const parsed = parseInput(DealUpdateSchema, input);
  if (!parsed.success) return fail(firstError(parsed), parsed.fields);

  const session = await getAuthedSession();
  if (!session.ok) return fail(session.error);

  const paths = [`/pipeline/${parsed.data.id}`, "/pipeline", "/dashboard"];

  if (session.session.mode === "mock") {
    const current = mockDealsStore.get(parsed.data.id);
    if (!current) return fail("Deal introuvable");
    const patch: Partial<typeof current> = {
      title: parsed.data.title,
      clientId: parsed.data.clientId || undefined,
      stage: parsed.data.stage,
      estimatedAmount: parsed.data.estimatedAmount,
      probability: parsed.data.probability,
      expectedSignatureDate: parsed.data.expectedSignatureDate || undefined,
      expectedPaymentDate: parsed.data.expectedPaymentDate || undefined,
      source: parsed.data.source || undefined,
      notes: parsed.data.notes || undefined,
    };
    // Stamp wonAt the first time we move to "won"; clear if we move out.
    if (parsed.data.stage === "won" && current.stage !== "won") patch.wonAt = nowIso();
    if (parsed.data.stage !== "won") patch.wonAt = undefined;
    mockDealsStore.update(parsed.data.id, patch);
    revalidateMany(paths);
    return ok(null);
  }

  const { userId, supabase } = session.session;
  const { error } = await supabase
    .from("deals")
    .update({
      title: parsed.data.title,
      client_id: parsed.data.clientId || null,
      stage: parsed.data.stage,
      estimated_amount: parsed.data.estimatedAmount,
      probability: parsed.data.probability,
      expected_signature_date: parsed.data.expectedSignatureDate || null,
      expected_payment_date: parsed.data.expectedPaymentDate || null,
      source: parsed.data.source || null,
      notes: parsed.data.notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.id)
    .eq("user_id", userId);

  if (error) return fail(error.message);
  revalidateMany(paths);
  return ok(null);
}

/* Lightweight stage-change action — used by the pipeline kanban for the
 * "Qualifier / Proposition / Négociation / Gagné / Perdu" quick action.
 * Does not require re-submitting the full deal form. */
const DealStageSchema = z.object({
  id: z.string().min(1),
  stage: z.enum(DEAL_STAGES),
  /** Optional reason captured when moving a deal to "lost". */
  lostReason: z.string().optional(),
});

const DEFAULT_PROBABILITY_BY_STAGE: Record<(typeof DEAL_STAGES)[number], number> = {
  lead: 10,
  qualified: 30,
  proposal: 50,
  negotiation: 70,
  won: 100,
  lost: 0,
};

export async function setDealStage(
  input: z.input<typeof DealStageSchema>,
): Promise<ActionResult> {
  const parsed = parseInput(DealStageSchema, input);
  if (!parsed.success) return fail(firstError(parsed), parsed.fields);

  const session = await getAuthedSession();
  if (!session.ok) return fail(session.error);

  const paths = [`/pipeline/${parsed.data.id}`, "/pipeline", "/dashboard"];

  if (session.session.mode === "mock") {
    const current = mockDealsStore.get(parsed.data.id);
    if (!current) return fail("Deal introuvable");
    const probability = DEFAULT_PROBABILITY_BY_STAGE[parsed.data.stage];
    mockDealsStore.update(parsed.data.id, {
      stage: parsed.data.stage,
      probability,
      wonAt:
        parsed.data.stage === "won" && current.stage !== "won"
          ? nowIso()
          : parsed.data.stage === "won"
            ? current.wonAt
            : undefined,
      lostReason: parsed.data.stage === "lost" ? parsed.data.lostReason || current.lostReason : undefined,
    });
    revalidateMany(paths);
    return ok(null);
  }

  const { userId, supabase } = session.session;
  const probability = DEFAULT_PROBABILITY_BY_STAGE[parsed.data.stage];
  const update: Record<string, unknown> = {
    stage: parsed.data.stage,
    probability,
    updated_at: new Date().toISOString(),
  };
  if (parsed.data.stage === "won") update.won_at = new Date().toISOString();
  if (parsed.data.stage === "lost" && parsed.data.lostReason) {
    update.lost_reason = parsed.data.lostReason;
  }
  if (!TERMINAL_STAGES.has(parsed.data.stage as "won" | "lost")) {
    update.won_at = null;
    update.lost_reason = null;
  }
  const { error } = await supabase
    .from("deals")
    .update(update)
    .eq("id", parsed.data.id)
    .eq("user_id", userId);

  if (error) return fail(error.message);
  revalidateMany(paths);
  return ok(null);
}

export async function deleteDeal(id: string): Promise<ActionResult> {
  return deleteOwnedRow({ table: "deals", id, paths: ["/pipeline", "/dashboard"] });
}
