"use server";

import {
  getClients,
  getDeals,
  getInvoices,
  getProjects,
  getQuotes,
} from "@/lib/data";
import { liveStatus } from "@/lib/finance/invoices";
import { DEAL_STAGE_LABELS, INVOICE_STATUS_LABELS, QUOTE_STATUS_LABELS } from "@/types/domain";

export type SearchHitKind =
  | "client"
  | "deal"
  | "project"
  | "invoice"
  | "quote";

export interface SearchHit {
  kind: SearchHitKind;
  id: string;
  /** Visible primary label. */
  title: string;
  /** Visible secondary label (client name, status, amount, etc.). */
  subtitle?: string;
  /** Computed href to navigate to. */
  href: string;
}

/** Build a flat list of all searchable records. The Command palette filters
 *  client-side using cmdk's fuzzy match. We keep the response small (no notes,
 *  no descriptions) so it stays snappy even with hundreds of records. */
export async function searchIndex(): Promise<SearchHit[]> {
  const [clients, deals, projects, invoices, quotes] = await Promise.all([
    getClients(),
    getDeals(),
    getProjects(),
    getInvoices(),
    getQuotes(),
  ]);

  const clientById = new Map(clients.map((c) => [c.id, c]));
  const hits: SearchHit[] = [];

  for (const c of clients) {
    hits.push({
      kind: "client",
      id: c.id,
      title: c.name,
      subtitle: c.email ?? c.status,
      href: `/clients/${c.id}`,
    });
  }

  for (const d of deals) {
    const client = d.clientId ? clientById.get(d.clientId) : undefined;
    hits.push({
      kind: "deal",
      id: d.id,
      title: d.title,
      subtitle: `${client?.name ?? "Prospect"} · ${DEAL_STAGE_LABELS[d.stage]}`,
      href: "/pipeline",
    });
  }

  for (const p of projects) {
    const client = clientById.get(p.clientId);
    hits.push({
      kind: "project",
      id: p.id,
      title: p.name,
      subtitle: client?.name,
      href: `/projets/${p.id}`,
    });
  }

  for (const i of invoices) {
    const client = clientById.get(i.clientId);
    hits.push({
      kind: "invoice",
      id: i.id,
      title: `Facture #${i.number}`,
      subtitle: `${client?.name ?? "—"} · ${INVOICE_STATUS_LABELS[liveStatus(i)]}`,
      href: `/factures/${i.id}`,
    });
  }

  for (const q of quotes) {
    const client = clientById.get(q.clientId);
    hits.push({
      kind: "quote",
      id: q.id,
      title: `Devis ${q.number}`,
      subtitle: `${client?.name ?? "—"} · ${QUOTE_STATUS_LABELS[q.status]}`,
      href: `/devis/${q.id}`,
    });
  }

  return hits;
}
