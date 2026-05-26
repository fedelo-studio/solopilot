import type { Project } from "@/types/domain";
import { MOCK_USER_ID, dateOffset, tsOffset } from "./seed";
import { makeMockStore, registerMockStore } from "./_store";

const seed: Project[] = [
  {
    id: "p-lumen-brand",
    userId: MOCK_USER_ID,
    clientId: "c-lumen",
    dealId: "d-007",
    name: "Refonte branding — Studio Lumen",
    status: "active",
    soldBudget: 22_000,
    internalBudget: 12_500,
    currency: "CHF",
    startDate: dateOffset(-15),
    endDate: dateOffset(35),
    notes: "Livraison prévue fin du trimestre. Sous-traitance illustration prévue.",
    createdAt: tsOffset(-15),
  },
  {
    id: "p-helvet-site",
    userId: MOCK_USER_ID,
    clientId: "c-helvet",
    dealId: "d-008",
    name: "Site corporate V2 — Helvet & Cie",
    status: "active",
    soldBudget: 17_500,
    internalBudget: 9_800,
    currency: "CHF",
    startDate: dateOffset(-40),
    endDate: dateOffset(10),
    createdAt: tsOffset(-40),
  },
  {
    id: "p-nordique-id",
    userId: MOCK_USER_ID,
    clientId: "c-nordique",
    name: "Concept identité bureau",
    status: "paused",
    soldBudget: 4_500,
    internalBudget: 2_200,
    currency: "CHF",
    startDate: dateOffset(-60),
    notes: "En pause — attente validation interne client.",
    createdAt: tsOffset(-60),
  },
  {
    id: "p-helvet-old",
    userId: MOCK_USER_ID,
    clientId: "c-helvet",
    name: "Landing page lancement",
    status: "done",
    soldBudget: 6_500,
    internalBudget: 3_400,
    currency: "CHF",
    startDate: dateOffset(-150),
    endDate: dateOffset(-90),
    createdAt: tsOffset(-150),
  },
  {
    id: "p-meraki",
    userId: MOCK_USER_ID,
    clientId: "c-meraki",
    name: "Refonte carte produits",
    status: "archived",
    soldBudget: 3_200,
    internalBudget: 1_900,
    currency: "CHF",
    startDate: dateOffset(-320),
    endDate: dateOffset(-280),
    createdAt: tsOffset(-320),
  },
];

export const mockProjectsStore = makeMockStore<Project>(seed);
registerMockStore("projects", mockProjectsStore);
export const mockProjects = mockProjectsStore.items;
