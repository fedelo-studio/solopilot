"use server";

import { z } from "zod";
import {
  deleteOwnedRow,
  fail,
  getAuthedSession,
  ok,
  parseFormData,
  revalidateMany,
  type ActionResult,
} from "./_helpers";
import { mockClientsStore } from "@/lib/mock/clients";
import { mockId, nowIso } from "@/lib/mock/_store";

const ClientCreateSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis"),
  kind: z.enum(["company", "individual"]).default("company"),
  status: z.enum(["prospect", "active", "archived"]).default("prospect"),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  vatNumber: z.string().optional(),
  notes: z.string().optional(),
});

export type ClientCreateInput = z.input<typeof ClientCreateSchema>;

export async function createClient(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const parsed = parseFormData(ClientCreateSchema, formData);
  if (!parsed.success) return fail("Validation échouée", parsed.fields);

  const session = await getAuthedSession();
  if (!session.ok) return fail(session.error);

  if (session.session.mode === "mock") {
    const id = mockId("c");
    mockClientsStore.add({
      id,
      userId: session.session.userId,
      name: parsed.data.name,
      kind: parsed.data.kind,
      status: parsed.data.status,
      email: parsed.data.email || undefined,
      phone: parsed.data.phone || undefined,
      address: parsed.data.address || undefined,
      vatNumber: parsed.data.vatNumber || undefined,
      defaultCurrency: "CHF",
      notes: parsed.data.notes || undefined,
      createdAt: nowIso(),
    });
    revalidateMany(["/clients", "/pipeline", "/dashboard"]);
    return ok({ id });
  }

  const { userId, supabase } = session.session;
  const { data, error } = await supabase
    .from("clients")
    .insert({
      user_id: userId,
      name: parsed.data.name,
      kind: parsed.data.kind,
      status: parsed.data.status,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      address: parsed.data.address || null,
      vat_number: parsed.data.vatNumber || null,
      notes: parsed.data.notes || null,
    })
    .select("id")
    .single();

  if (error) return fail(error.message);

  revalidateMany(["/clients"]);
  return ok({ id: data.id as string });
}

const ClientUpdateSchema = ClientCreateSchema.extend({
  id: z.string().min(1),
});

export async function updateClient(formData: FormData): Promise<ActionResult> {
  const parsed = parseFormData(ClientUpdateSchema, formData);
  if (!parsed.success) return fail("Validation échouée", parsed.fields);

  const session = await getAuthedSession();
  if (!session.ok) return fail(session.error);

  const pathsToRevalidate = [`/clients/${parsed.data.id}`, "/clients"];

  if (session.session.mode === "mock") {
    if (!mockClientsStore.get(parsed.data.id)) return fail("Client introuvable");
    mockClientsStore.update(parsed.data.id, {
      name: parsed.data.name,
      kind: parsed.data.kind,
      status: parsed.data.status,
      email: parsed.data.email || undefined,
      phone: parsed.data.phone || undefined,
      address: parsed.data.address || undefined,
      vatNumber: parsed.data.vatNumber || undefined,
      notes: parsed.data.notes || undefined,
    });
    revalidateMany(pathsToRevalidate);
    return ok(null);
  }

  const { userId, supabase } = session.session;
  const { error } = await supabase
    .from("clients")
    .update({
      name: parsed.data.name,
      kind: parsed.data.kind,
      status: parsed.data.status,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      address: parsed.data.address || null,
      vat_number: parsed.data.vatNumber || null,
      notes: parsed.data.notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.id)
    .eq("user_id", userId);

  if (error) return fail(error.message);
  revalidateMany(pathsToRevalidate);
  return ok(null);
}

export async function deleteClient(id: string): Promise<ActionResult> {
  // FK violation: projects / invoices reference clients with ON DELETE RESTRICT.
  return deleteOwnedRow({
    table: "clients",
    id,
    paths: ["/clients"],
    fkMessage:
      "Impossible de supprimer ce client : il a des projets ou factures associés. Archive-le ou supprime d'abord les liens.",
  });
}
