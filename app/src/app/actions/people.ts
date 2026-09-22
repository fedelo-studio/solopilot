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
import { mockPeopleStore } from "@/lib/mock/people";
import { mockId, nowIso } from "@/lib/mock/_store";

const PersonSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis"),
  email: z.string().trim().optional(),
  costRate: z.coerce.number().nonnegative(),
  billableRate: z.coerce.number().nonnegative(),
  weeklyCapacityHours: z.coerce.number().positive().default(40),
  isActive: z.coerce.boolean().default(true),
  notes: z.string().optional(),
});

export type PersonInput = z.input<typeof PersonSchema>;

export async function createPerson(input: PersonInput): Promise<ActionResult<{ id: string }>> {
  const parsed = parseInput(PersonSchema, input);
  if (!parsed.success) return fail(firstError(parsed), parsed.fields);

  const session = await getAuthedSession();
  if (!session.ok) return fail(session.error);

  if (session.session.mode === "mock") {
    const id = mockId("pe");
    mockPeopleStore.add({
      id,
      userId: session.session.userId,
      name: parsed.data.name,
      email: parsed.data.email || undefined,
      costRate: parsed.data.costRate,
      billableRate: parsed.data.billableRate,
      weeklyCapacityHours: parsed.data.weeklyCapacityHours,
      isActive: parsed.data.isActive,
      notes: parsed.data.notes || undefined,
      createdAt: nowIso(),
    });
    revalidateMany(["/equipe"]);
    return ok({ id });
  }

  const { userId, supabase } = session.session;
  const { data, error } = await supabase
    .from("people")
    .insert({
      user_id: userId,
      name: parsed.data.name,
      email: parsed.data.email || null,
      cost_rate: parsed.data.costRate,
      billable_rate: parsed.data.billableRate,
      weekly_capacity_hours: parsed.data.weeklyCapacityHours,
      is_active: parsed.data.isActive,
      notes: parsed.data.notes || null,
    })
    .select("id")
    .single();
  if (error) return fail(error.message);

  revalidateMany(["/equipe"]);
  return ok({ id: data.id as string });
}

const PersonUpdateSchema = PersonSchema.extend({ id: z.string().min(1) });

export async function updatePerson(
  input: z.input<typeof PersonUpdateSchema>,
): Promise<ActionResult> {
  const parsed = parseInput(PersonUpdateSchema, input);
  if (!parsed.success) return fail(firstError(parsed), parsed.fields);

  const session = await getAuthedSession();
  if (!session.ok) return fail(session.error);

  const paths = ["/equipe"];

  if (session.session.mode === "mock") {
    if (!mockPeopleStore.get(parsed.data.id)) return fail("Personne introuvable");
    mockPeopleStore.update(parsed.data.id, {
      name: parsed.data.name,
      email: parsed.data.email || undefined,
      costRate: parsed.data.costRate,
      billableRate: parsed.data.billableRate,
      weeklyCapacityHours: parsed.data.weeklyCapacityHours,
      isActive: parsed.data.isActive,
      notes: parsed.data.notes || undefined,
    });
    revalidateMany(paths);
    return ok(null);
  }

  const { userId, supabase } = session.session;
  const { error } = await supabase
    .from("people")
    .update({
      name: parsed.data.name,
      email: parsed.data.email || null,
      cost_rate: parsed.data.costRate,
      billable_rate: parsed.data.billableRate,
      weekly_capacity_hours: parsed.data.weeklyCapacityHours,
      is_active: parsed.data.isActive,
      notes: parsed.data.notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.id)
    .eq("user_id", userId);
  if (error) return fail(error.message);

  revalidateMany(paths);
  return ok(null);
}

export async function deletePerson(id: string): Promise<ActionResult> {
  return deleteOwnedRow({
    table: "people",
    id,
    paths: ["/equipe"],
    fkMessage:
      "Cette personne a des entrées de temps associées — désactive-la plutôt que de la supprimer.",
  });
}
