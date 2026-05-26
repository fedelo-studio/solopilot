import type { Account, Transaction } from "@/types/domain";
import { MOCK_USER_ID, tsOffset, dateOffset } from "./seed";
import { makeMockStore, registerMockStore } from "./_store";

const accountsSeed: Account[] = [
  {
    id: "a-main",
    userId: MOCK_USER_ID,
    name: "Compte courant — PostFinance",
    kind: "bank",
    initialBalance: 28_450,
    currency: "CHF",
    createdAt: tsOffset(-365),
  },
  {
    id: "a-reserve",
    userId: MOCK_USER_ID,
    name: "Réserve impôts & AVS",
    kind: "savings",
    initialBalance: 14_200,
    currency: "CHF",
    createdAt: tsOffset(-300),
  },
];

export const mockAccountsStore = makeMockStore<Account>(accountsSeed);
registerMockStore("accounts", mockAccountsStore);
export const mockAccounts = mockAccountsStore.items;

const transactionsSeed: Transaction[] = [
  {
    id: "t-001",
    userId: MOCK_USER_ID,
    accountId: "a-main",
    date: dateOffset(-15),
    amount: 9_460.75,
    label: "Paiement facture 2026-0041 — Helvet",
    kind: "in",
    linkedInvoiceId: "i-2026-0041",
    createdAt: tsOffset(-15),
  },
  {
    id: "t-002",
    userId: MOCK_USER_ID,
    accountId: "a-main",
    date: dateOffset(-38),
    amount: 2_702.5,
    label: "Paiement facture 2026-0038 — Nordique",
    kind: "in",
    linkedInvoiceId: "i-2026-0038",
    createdAt: tsOffset(-38),
  },
  {
    id: "t-003",
    userId: MOCK_USER_ID,
    accountId: "a-main",
    date: dateOffset(-5),
    amount: 2_400,
    label: "Lina Pereira — illustration",
    kind: "out",
    linkedExpenseId: "e-002",
    createdAt: tsOffset(-5),
  },
];

export const mockTransactionsStore = makeMockStore<Transaction>(transactionsSeed);
registerMockStore("transactions", mockTransactionsStore);
export const mockTransactions = mockTransactionsStore.items;
