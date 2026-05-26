import type { Client, Contact } from "@/types/domain";
import { MOCK_USER_ID, tsOffset } from "./seed";
import { makeMockStore, registerMockStore } from "./_store";

const clientsSeed: Client[] = [
  {
    id: "c-lumen",
    userId: MOCK_USER_ID,
    name: "Studio Lumen",
    kind: "company",
    status: "active",
    email: "contact@studio-lumen.ch",
    phone: "+41 22 555 01 02",
    address: "Rue du Rhône 12, 1204 Genève",
    vatNumber: "CHE-123.456.789 TVA",
    defaultCurrency: "CHF",
    notes: "Studio créatif partenaire — collabore régulièrement sur des projets MVP.",
    createdAt: tsOffset(-180),
  },
  {
    id: "c-nordique",
    userId: MOCK_USER_ID,
    name: "Nordique Architecture",
    kind: "company",
    status: "active",
    email: "hello@nordique.ch",
    phone: "+41 21 555 03 04",
    address: "Avenue de la Gare 4, 1003 Lausanne",
    defaultCurrency: "CHF",
    createdAt: tsOffset(-120),
  },
  {
    id: "c-helvet",
    userId: MOCK_USER_ID,
    name: "Helvet & Cie",
    kind: "company",
    status: "active",
    email: "marie.brun@helvet.ch",
    defaultCurrency: "CHF",
    createdAt: tsOffset(-90),
  },
  {
    id: "c-orpailleur",
    userId: MOCK_USER_ID,
    name: "Atelier Orpailleur",
    kind: "company",
    status: "prospect",
    email: "j.veron@orpailleur.ch",
    defaultCurrency: "CHF",
    notes: "Premier contact via LinkedIn. Cherche un site vitrine premium.",
    createdAt: tsOffset(-21),
  },
  {
    id: "c-blume",
    userId: MOCK_USER_ID,
    name: "Blume Lab",
    kind: "company",
    status: "prospect",
    email: "leo@blumelab.ch",
    defaultCurrency: "CHF",
    notes: "MVP SaaS B2B, possibilité de rétainer trimestriel.",
    createdAt: tsOffset(-8),
  },
  {
    id: "c-meraki",
    userId: MOCK_USER_ID,
    name: "Méraki Café",
    kind: "company",
    status: "archived",
    email: "anne@meraki-cafe.ch",
    defaultCurrency: "CHF",
    createdAt: tsOffset(-340),
  },
];

export const mockClientsStore = makeMockStore<Client>(clientsSeed);
registerMockStore("clients", mockClientsStore);
export const mockClients = mockClientsStore.items;

const contactsSeed: Contact[] = [
  {
    id: "ct-lumen-isa",
    userId: MOCK_USER_ID,
    clientId: "c-lumen",
    firstName: "Isabelle",
    lastName: "Roy",
    role: "Directrice de création",
    email: "isabelle@studio-lumen.ch",
    phone: "+41 79 555 11 22",
    createdAt: tsOffset(-150),
  },
  {
    id: "ct-nordique-pierre",
    userId: MOCK_USER_ID,
    clientId: "c-nordique",
    firstName: "Pierre",
    lastName: "Dupraz",
    role: "Associé",
    email: "pierre@nordique.ch",
    createdAt: tsOffset(-100),
  },
  {
    id: "ct-helvet-marie",
    userId: MOCK_USER_ID,
    clientId: "c-helvet",
    firstName: "Marie",
    lastName: "Brun",
    role: "Responsable marketing",
    email: "marie.brun@helvet.ch",
    createdAt: tsOffset(-85),
  },
  {
    id: "ct-orpailleur-jean",
    userId: MOCK_USER_ID,
    clientId: "c-orpailleur",
    firstName: "Jean",
    lastName: "Véron",
    role: "Fondateur",
    email: "j.veron@orpailleur.ch",
    createdAt: tsOffset(-21),
  },
  {
    id: "ct-blume-leo",
    userId: MOCK_USER_ID,
    clientId: "c-blume",
    firstName: "Léo",
    lastName: "Stettler",
    role: "CEO",
    email: "leo@blumelab.ch",
    createdAt: tsOffset(-8),
  },
];

export const mockContactsStore = makeMockStore<Contact>(contactsSeed);
registerMockStore("contacts", mockContactsStore);
export const mockContacts = mockContactsStore.items;
