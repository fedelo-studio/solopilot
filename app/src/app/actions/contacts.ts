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
import { mockContactsStore } from "@/lib/mock/clients";
import { mockId, nowIso } from "@/lib/mock/_store";

const ContactSchema = z.object({
  clientId: z.string().optional(),
  firstName: z.string().trim().min(1, "Prénom requis"),
  lastName: z.string().trim().min(1, "Nom requis"),
  role: z.string().optional(),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

export async function createContact(
  input: z.input<typeof ContactSchema>,
): Promise<ActionResult<{ id: string }>> {
  const parsed = parseInput(ContactSchema, input);
  if (!parsed.success) return fail(firstError(parsed), parsed.fields);

  const session = await getAuthedSession();
  if (!session.ok) return fail(session.error);

  const paths = [
    parsed.data.clientId ? `/clients/${parsed.data.clientId}` : "/clients",
  ];

  if (session.session.mode === "mock") {
    const id = mockId("ct");
    mockContactsStore.add({
      id,
      userId: session.session.userId,
      clientId: parsed.data.clientId || undefined,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      role: parsed.data.role || undefined,
      email: parsed.data.email || undefined,
      phone: parsed.data.phone || undefined,
      notes: parsed.data.notes || undefined,
      createdAt: nowIso(),
    });
    revalidateMany(paths);
    return ok({ id });
  }

  const { userId, supabase } = session.session;
  const { data, error } = await supabase
    .from("contacts")
    .insert({
      user_id: userId,
      client_id: parsed.data.clientId || null,
      first_name: parsed.data.firstName,
      last_name: parsed.data.lastName,
      role: parsed.data.role || null,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      notes: parsed.data.notes || null,
    })
    .select("id")
    .single();

  if (error) return fail(error.message);
  revalidateMany(paths);
  return ok({ id: data.id as string });
}

const ContactUpdateSchema = ContactSchema.extend({ id: z.string().min(1) });

export async function updateContact(
  input: z.input<typeof ContactUpdateSchema>,
): Promise<ActionResult> {
  const parsed = parseInput(ContactUpdateSchema, input);
  if (!parsed.success) return fail(firstError(parsed), parsed.fields);

  const session = await getAuthedSession();
  if (!session.ok) return fail(session.error);

  const paths = [
    parsed.data.clientId ? `/clients/${parsed.data.clientId}` : "/clients",
  ];

  if (session.session.mode === "mock") {
    if (!mockContactsStore.get(parsed.data.id)) return fail("Contact introuvable");
    mockContactsStore.update(parsed.data.id, {
      clientId: parsed.data.clientId || undefined,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      role: parsed.data.role || undefined,
      email: parsed.data.email || undefined,
      phone: parsed.data.phone || undefined,
      notes: parsed.data.notes || undefined,
    });
    revalidateMany(paths);
    return ok(null);
  }

  const { userId, supabase } = session.session;
  const { error } = await supabase
    .from("contacts")
    .update({
      client_id: parsed.data.clientId || null,
      first_name: parsed.data.firstName,
      last_name: parsed.data.lastName,
      role: parsed.data.role || null,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      notes: parsed.data.notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.id)
    .eq("user_id", userId);

  if (error) return fail(error.message);
  revalidateMany(paths);
  return ok(null);
}

export async function deleteContact(id: string, clientId?: string): Promise<ActionResult> {
  return deleteOwnedRow({
    table: "contacts",
    id,
    paths: [clientId ? `/clients/${clientId}` : "/clients"],
  });
}
