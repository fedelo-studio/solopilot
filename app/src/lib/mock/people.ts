import type { Person } from "@/types/domain";
import { MOCK_USER_ID, tsOffset } from "./seed";
import { makeMockStore, registerMockStore } from "./_store";

const seed: Person[] = [
  {
    id: "pe-felipe",
    userId: MOCK_USER_ID,
    name: "Felipe",
    email: "studio@fedelo.io",
    costRate: 60,
    billableRate: 120,
    weeklyCapacityHours: 40,
    isActive: true,
    createdAt: tsOffset(-320),
  },
  {
    id: "pe-mia",
    userId: MOCK_USER_ID,
    name: "Mia Fontana",
    email: "mia@fontana-illustration.ch",
    costRate: 45,
    billableRate: 95,
    weeklyCapacityHours: 20,
    isActive: true,
    notes: "Illustration — sous-traitante freelance.",
    createdAt: tsOffset(-90),
  },
  {
    id: "pe-tomas",
    userId: MOCK_USER_ID,
    name: "Tomás Herrera",
    email: "tomas@dev-herrera.io",
    costRate: 55,
    billableRate: 110,
    weeklyCapacityHours: 15,
    isActive: true,
    notes: "Développement front — sous-traitant freelance.",
    createdAt: tsOffset(-60),
  },
];

export const mockPeopleStore = makeMockStore<Person>(seed);
registerMockStore("people", mockPeopleStore);
export const mockPeople = mockPeopleStore.items;
