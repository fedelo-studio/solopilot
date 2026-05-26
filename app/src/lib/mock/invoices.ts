import type { Invoice } from "@/types/domain";
import { MOCK_USER_ID, dateOffset, tsOffset } from "./seed";
import { makeMockStore, registerMockStore } from "./_store";

export function buildInvoice(input: {
  id: string;
  clientId: string;
  projectId?: string;
  number: string;
  status: Invoice["status"];
  issuedDays: number;
  dueDays: number;
  amountPaid?: number;
  lines: Array<{ description: string; quantity: number; unitPrice: number; vatRate: number }>;
  notes?: string;
}): Invoice {
  const lines = input.lines.map((l, idx) => ({
    id: `${input.id}-l${idx}`,
    invoiceId: input.id,
    description: l.description,
    quantity: l.quantity,
    unitPrice: l.unitPrice,
    vatRate: l.vatRate,
    total: l.quantity * l.unitPrice,
  }));
  const subtotal = lines.reduce((acc, l) => acc + l.total, 0);
  const vatAmount = lines.reduce((acc, l) => acc + (l.total * l.vatRate) / 100, 0);
  const total = subtotal + vatAmount;
  return {
    id: input.id,
    userId: MOCK_USER_ID,
    clientId: input.clientId,
    projectId: input.projectId,
    number: input.number,
    status: input.status,
    issuedAt: dateOffset(input.issuedDays),
    dueDate: dateOffset(input.dueDays),
    currency: "CHF",
    subtotal,
    vatAmount,
    total,
    amountPaid: input.amountPaid ?? (input.status === "paid" ? total : 0),
    notes: input.notes,
    lines,
    createdAt: tsOffset(input.issuedDays),
  };
}

const seed: Invoice[] = [
  buildInvoice({
    id: "i-2026-0042",
    clientId: "c-lumen",
    projectId: "p-lumen-brand",
    number: "2026-0042",
    status: "sent",
    issuedDays: -10,
    dueDays: 20,
    lines: [
      { description: "Refonte branding — acompte 50%", quantity: 1, unitPrice: 11_000, vatRate: 8.1 },
    ],
  }),
  buildInvoice({
    id: "i-2026-0041",
    clientId: "c-helvet",
    projectId: "p-helvet-site",
    number: "2026-0041",
    status: "paid",
    issuedDays: -45,
    dueDays: -15,
    lines: [
      { description: "Site corporate — acompte initial", quantity: 1, unitPrice: 8_750, vatRate: 8.1 },
    ],
  }),
  buildInvoice({
    id: "i-2026-0040",
    clientId: "c-helvet",
    projectId: "p-helvet-site",
    number: "2026-0040",
    status: "sent",
    issuedDays: -22,
    dueDays: 8,
    lines: [
      { description: "Site corporate — sprint design", quantity: 1, unitPrice: 4_800, vatRate: 8.1 },
    ],
  }),
  buildInvoice({
    id: "i-2026-0039",
    clientId: "c-helvet",
    number: "2026-0039",
    status: "overdue",
    issuedDays: -52,
    dueDays: -22,
    lines: [
      { description: "Landing page — solde final", quantity: 1, unitPrice: 3_200, vatRate: 8.1 },
    ],
    notes: "Relance envoyée, en attente de paiement.",
  }),
  buildInvoice({
    id: "i-2026-0038",
    clientId: "c-nordique",
    projectId: "p-nordique-id",
    number: "2026-0038",
    status: "paid",
    issuedDays: -68,
    dueDays: -38,
    lines: [
      { description: "Concept identité — phase exploration", quantity: 1, unitPrice: 2_500, vatRate: 8.1 },
    ],
  }),
  buildInvoice({
    id: "i-2026-0037",
    clientId: "c-nordique",
    projectId: "p-nordique-id",
    number: "2026-0037",
    status: "sent",
    issuedDays: -5,
    dueDays: 25,
    lines: [
      { description: "Identité bureau — concept final", quantity: 1, unitPrice: 2_000, vatRate: 8.1 },
    ],
  }),
  buildInvoice({
    id: "i-2026-0036",
    clientId: "c-lumen",
    number: "2026-0036",
    status: "paid",
    issuedDays: -120,
    dueDays: -90,
    lines: [
      { description: "Workshop direction artistique", quantity: 2, unitPrice: 1_400, vatRate: 8.1 },
    ],
  }),
  buildInvoice({
    id: "i-2026-0035",
    clientId: "c-meraki",
    number: "2026-0035",
    status: "paid",
    issuedDays: -280,
    dueDays: -250,
    lines: [
      { description: "Refonte carte — fee global", quantity: 1, unitPrice: 3_200, vatRate: 7.7 },
    ],
  }),
  buildInvoice({
    id: "i-2026-0043-draft",
    clientId: "c-helvet",
    number: "2026-0043",
    status: "draft",
    issuedDays: 0,
    dueDays: 30,
    lines: [
      { description: "Audit UX produit — prévision", quantity: 1, unitPrice: 5_500, vatRate: 8.1 },
    ],
    notes: "À envoyer après signature de la proposition.",
  }),
  buildInvoice({
    id: "i-2026-0044-draft",
    clientId: "c-blume",
    number: "2026-0044",
    status: "draft",
    issuedDays: 0,
    dueDays: 30,
    lines: [
      { description: "Atelier discovery produit", quantity: 1, unitPrice: 4_800, vatRate: 8.1 },
    ],
  }),
];

export const mockInvoicesStore = makeMockStore<Invoice>(seed);
registerMockStore("invoices", mockInvoicesStore);
export const mockInvoices = mockInvoicesStore.items;
