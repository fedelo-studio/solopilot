import type { Budget } from "@/types/domain";
import { MOCK_USER_ID } from "./seed";
import { startOfMonth, format } from "date-fns";
import { makeMockStore, registerMockStore } from "./_store";

const thisMonth = format(startOfMonth(new Date()), "yyyy-MM-dd");

const seed: Budget[] = [
  {
    id: "b-software",
    userId: MOCK_USER_ID,
    periodMonth: thisMonth,
    categoryId: "cat-software",
    plannedAmount: 220,
    currency: "CHF",
  },
  {
    id: "b-subcontractor",
    userId: MOCK_USER_ID,
    periodMonth: thisMonth,
    categoryId: "cat-subcontractor",
    plannedAmount: 6_000,
    currency: "CHF",
  },
  {
    id: "b-marketing",
    userId: MOCK_USER_ID,
    periodMonth: thisMonth,
    categoryId: "cat-marketing",
    plannedAmount: 400,
    currency: "CHF",
  },
  {
    id: "b-office",
    userId: MOCK_USER_ID,
    periodMonth: thisMonth,
    categoryId: "cat-office",
    plannedAmount: 600,
    currency: "CHF",
  },
  {
    id: "b-travel",
    userId: MOCK_USER_ID,
    periodMonth: thisMonth,
    categoryId: "cat-travel",
    plannedAmount: 200,
    currency: "CHF",
  },
  {
    id: "b-finance",
    userId: MOCK_USER_ID,
    periodMonth: thisMonth,
    categoryId: "cat-finance",
    plannedAmount: 450,
    currency: "CHF",
  },
];

export const mockBudgetsStore = makeMockStore<Budget>(seed);
registerMockStore("budgets", mockBudgetsStore);
export const mockBudgets = mockBudgetsStore.items;

