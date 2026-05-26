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
import { mockProjectsStore } from "@/lib/mock/projects";
import { mockId, nowIso } from "@/lib/mock/_store";

const ProjectSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis"),
  clientId: z.string().min(1, "Sélectionne un client"),
  dealId: z.string().optional(),
  status: z.enum(["active", "paused", "done", "archived"]).default("active"),
  soldBudget: z.coerce.number().nonnegative(),
  internalBudget: z.coerce.number().nonnegative(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  notes: z.string().optional(),
});

export type ProjectInput = z.input<typeof ProjectSchema>;

export async function createProject(input: ProjectInput): Promise<ActionResult<{ id: string }>> {
  const parsed = parseInput(ProjectSchema, input);
  if (!parsed.success) return fail(firstError(parsed));

  const session = await getAuthedSession();
  if (!session.ok) return fail(session.error);

  if (session.session.mode === "mock") {
    const id = mockId("p");
    mockProjectsStore.add({
      id,
      userId: session.session.userId,
      name: parsed.data.name,
      clientId: parsed.data.clientId,
      dealId: parsed.data.dealId || undefined,
      status: parsed.data.status,
      soldBudget: parsed.data.soldBudget,
      internalBudget: parsed.data.internalBudget,
      currency: "CHF",
      startDate: parsed.data.startDate || undefined,
      endDate: parsed.data.endDate || undefined,
      notes: parsed.data.notes || undefined,
      createdAt: nowIso(),
    });
    revalidateMany(["/projets", "/dashboard"]);
    return ok({ id });
  }

  const { userId, supabase } = session.session;
  const { data, error } = await supabase
    .from("projects")
    .insert({
      user_id: userId,
      name: parsed.data.name,
      client_id: parsed.data.clientId,
      deal_id: parsed.data.dealId || null,
      status: parsed.data.status,
      sold_budget: parsed.data.soldBudget,
      internal_budget: parsed.data.internalBudget,
      start_date: parsed.data.startDate || null,
      end_date: parsed.data.endDate || null,
      notes: parsed.data.notes || null,
    })
    .select("id")
    .single();
  if (error) return fail(error.message);
  revalidateMany(["/projets"]);
  return ok({ id: data.id as string });
}

const ProjectUpdateSchema = ProjectSchema.extend({ id: z.string().min(1) });

export async function updateProject(input: z.input<typeof ProjectUpdateSchema>): Promise<ActionResult> {
  const parsed = parseInput(ProjectUpdateSchema, input);
  if (!parsed.success) return fail(firstError(parsed));

  const session = await getAuthedSession();
  if (!session.ok) return fail(session.error);

  const pathsToRevalidate = [`/projets/${parsed.data.id}`, "/projets"];

  if (session.session.mode === "mock") {
    if (!mockProjectsStore.get(parsed.data.id)) return fail("Projet introuvable");
    mockProjectsStore.update(parsed.data.id, {
      name: parsed.data.name,
      clientId: parsed.data.clientId,
      dealId: parsed.data.dealId || undefined,
      status: parsed.data.status,
      soldBudget: parsed.data.soldBudget,
      internalBudget: parsed.data.internalBudget,
      startDate: parsed.data.startDate || undefined,
      endDate: parsed.data.endDate || undefined,
      notes: parsed.data.notes || undefined,
    });
    revalidateMany(pathsToRevalidate);
    return ok(null);
  }

  const { userId, supabase } = session.session;
  const { error } = await supabase
    .from("projects")
    .update({
      name: parsed.data.name,
      client_id: parsed.data.clientId,
      deal_id: parsed.data.dealId || null,
      status: parsed.data.status,
      sold_budget: parsed.data.soldBudget,
      internal_budget: parsed.data.internalBudget,
      start_date: parsed.data.startDate || null,
      end_date: parsed.data.endDate || null,
      notes: parsed.data.notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.id)
    .eq("user_id", userId);
  if (error) return fail(error.message);

  revalidateMany(pathsToRevalidate);
  return ok(null);
}

export async function deleteProject(id: string): Promise<ActionResult> {
  return deleteOwnedRow({ table: "projects", id, paths: ["/projets"] });
}
