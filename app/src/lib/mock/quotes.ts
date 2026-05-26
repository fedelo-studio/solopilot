import type { Quote, QuoteLine } from "@/types/domain";
import { MOCK_USER_ID, dateOffset, tsOffset } from "./seed";
import { makeMockStore, registerMockStore } from "./_store";

export function buildQuote(input: {
  id: string;
  clientId: string;
  dealId?: string;
  number: string;
  status: Quote["status"];
  issuedDays: number;
  validInDays?: number;
  lines: Array<{ description: string; quantity: number; unitPrice: number; vatRate: number }>;
  notes?: string;
  acceptedDays?: number;
  declinedDays?: number;
}): Quote {
  const lines: QuoteLine[] = input.lines.map((l, idx) => ({
    id: `${input.id}-l${idx}`,
    quoteId: input.id,
    description: l.description,
    quantity: l.quantity,
    unitPrice: l.unitPrice,
    vatRate: l.vatRate,
    total: l.quantity * l.unitPrice,
  }));
  const subtotal = lines.reduce((acc, l) => acc + l.total, 0);
  const vatAmount = lines.reduce((acc, l) => acc + (l.total * l.vatRate) / 100, 0);
  return {
    id: input.id,
    userId: MOCK_USER_ID,
    clientId: input.clientId,
    dealId: input.dealId,
    number: input.number,
    status: input.status,
    issuedAt: dateOffset(input.issuedDays),
    validUntil: input.validInDays ? dateOffset(input.issuedDays + input.validInDays) : undefined,
    currency: "CHF",
    subtotal,
    vatAmount,
    total: subtotal + vatAmount,
    notes: input.notes,
    lines,
    acceptedAt: input.acceptedDays != null ? tsOffset(input.acceptedDays) : undefined,
    declinedAt: input.declinedDays != null ? tsOffset(input.declinedDays) : undefined,
    createdAt: tsOffset(input.issuedDays),
  };
}

const seed: Quote[] = [
  buildQuote({
    id: "q-2026-0010",
    clientId: "c-helvet",
    dealId: "d-003",
    number: "DEV-2026-0010",
    status: "sent",
    issuedDays: -8,
    validInDays: 30,
    lines: [
      { description: "Rétainer design produit — Q3 (3 mois)", quantity: 3, unitPrice: 8_000, vatRate: 8.1 },
    ],
    notes: "Proposition pour les sprints juillet-septembre. Validité 30 jours.",
  }),
  buildQuote({
    id: "q-2026-0009",
    clientId: "c-nordique",
    dealId: "d-004",
    number: "DEV-2026-0009",
    status: "accepted",
    issuedDays: -25,
    validInDays: 21,
    acceptedDays: -5,
    lines: [
      { description: "Identité visuelle nouveau bureau — phase exploration", quantity: 1, unitPrice: 4_500, vatRate: 8.1 },
      { description: "Identité visuelle — production finale", quantity: 1, unitPrice: 10_000, vatRate: 8.1 },
    ],
  }),
  buildQuote({
    id: "q-2026-0008",
    clientId: "c-orpailleur",
    dealId: "d-002",
    number: "DEV-2026-0008",
    status: "draft",
    issuedDays: 0,
    validInDays: 30,
    lines: [
      { description: "Refonte site vitrine — 6 pages", quantity: 1, unitPrice: 7_500, vatRate: 8.1 },
      { description: "Setup analytics + SEO basique", quantity: 1, unitPrice: 2_000, vatRate: 8.1 },
    ],
    notes: "À envoyer après le second call de découverte.",
  }),
  buildQuote({
    id: "q-2026-0007",
    clientId: "c-blume",
    dealId: "d-001",
    number: "DEV-2026-0007",
    status: "sent",
    issuedDays: -3,
    validInDays: 30,
    lines: [
      { description: "MVP SaaS B2B — phase 1 (discovery + prototype)", quantity: 1, unitPrice: 12_000, vatRate: 8.1 },
      { description: "MVP SaaS B2B — phase 2 (build)", quantity: 1, unitPrice: 6_000, vatRate: 8.1 },
    ],
  }),
  buildQuote({
    id: "q-2026-0006",
    clientId: "c-meraki",
    number: "DEV-2026-0006",
    status: "declined",
    issuedDays: -70,
    validInDays: 30,
    declinedDays: -50,
    lines: [
      { description: "Carte fidélité — refresh visuel", quantity: 1, unitPrice: 4_200, vatRate: 8.1 },
    ],
    notes: "Refusé : budget non débloqué cette année.",
  }),
];

export const mockQuotesStore = makeMockStore<Quote>(seed);
registerMockStore("quotes", mockQuotesStore);
export const mockQuotes = mockQuotesStore.items;
