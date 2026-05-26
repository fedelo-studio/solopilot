import type { Alert } from "@/types/domain";
import { MOCK_USER_ID, tsOffset } from "./seed";
import { makeMockStore, registerMockStore } from "./_store";

const seed: Alert[] = [
  {
    id: "al-001",
    userId: MOCK_USER_ID,
    type: "invoice_overdue",
    severity: "danger",
    title: "Facture 2026-0039 en retard",
    body: "Helvet & Cie — 3'460.32 CHF dus depuis 22 jours.",
    relatedType: "invoice",
    relatedId: "i-2026-0039",
    createdAt: tsOffset(-22),
  },
  {
    id: "al-002",
    userId: MOCK_USER_ID,
    type: "expense_uncategorized",
    severity: "warning",
    title: "Dépense sans catégorie",
    body: "Achat de 124 CHF sans catégorie — à classer.",
    relatedType: "expense",
    relatedId: "e-014",
    createdAt: tsOffset(-28),
  },
  {
    id: "al-003",
    userId: MOCK_USER_ID,
    type: "budget_near_limit",
    severity: "warning",
    title: "Budget Sous-traitance proche de la limite",
    body: "73% du budget mensuel déjà engagé.",
    relatedType: "budget",
    relatedId: "b-subcontractor",
    createdAt: tsOffset(-3),
  },
  {
    id: "al-004",
    userId: MOCK_USER_ID,
    type: "deal_stale",
    severity: "info",
    title: "Deal sans activité depuis 30 jours",
    body: "Identité visuelle Nordique — relance recommandée.",
    relatedType: "deal",
    relatedId: "d-004",
    createdAt: tsOffset(-1),
  },
];

export const mockAlertsStore = makeMockStore<Alert>(seed);
registerMockStore("alerts", mockAlertsStore);
export const mockAlerts = mockAlertsStore.items;
