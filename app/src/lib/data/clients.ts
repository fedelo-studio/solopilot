import "server-only";
import { isLive } from "./_mode";
import { createServerSupabase } from "@/lib/supabase/server";
import { mockClients, mockContacts } from "@/lib/mock";
import type { Client, Contact, Currency } from "@/types/domain";

/** Map a Supabase `clients` row to a domain `Client`. */
function rowToClient(row: Record<string, unknown>): Client {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    name: row.name as string,
    kind: row.kind as Client["kind"],
    status: row.status as Client["status"],
    email: (row.email as string) ?? undefined,
    phone: (row.phone as string) ?? undefined,
    address: (row.address as string) ?? undefined,
    vatNumber: (row.vat_number as string) ?? undefined,
    defaultCurrency: (row.default_currency as Currency) ?? "CHF",
    notes: (row.notes as string) ?? undefined,
    createdAt: row.created_at as string,
  };
}

function rowToContact(row: Record<string, unknown>): Contact {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    clientId: (row.client_id as string) ?? undefined,
    firstName: row.first_name as string,
    lastName: row.last_name as string,
    role: (row.role as string) ?? undefined,
    email: (row.email as string) ?? undefined,
    phone: (row.phone as string) ?? undefined,
    notes: (row.notes as string) ?? undefined,
    createdAt: row.created_at as string,
  };
}

export async function getClients(): Promise<Client[]> {
  if (!isLive) return mockClients;
  const supabase = await createServerSupabase();
  if (!supabase) return mockClients;
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToClient);
}

export async function getClientById(id: string): Promise<Client | null> {
  if (!isLive) return mockClients.find((c) => c.id === id) ?? null;
  const supabase = await createServerSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.from("clients").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? rowToClient(data) : null;
}

export async function getContacts(): Promise<Contact[]> {
  if (!isLive) return mockContacts;
  const supabase = await createServerSupabase();
  if (!supabase) return mockContacts;
  const { data, error } = await supabase.from("contacts").select("*");
  if (error) throw error;
  return (data ?? []).map(rowToContact);
}

export async function getContactsByClient(clientId: string): Promise<Contact[]> {
  if (!isLive) return mockContacts.filter((c) => c.clientId === clientId);
  const supabase = await createServerSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase.from("contacts").select("*").eq("client_id", clientId);
  if (error) throw error;
  return (data ?? []).map(rowToContact);
}
