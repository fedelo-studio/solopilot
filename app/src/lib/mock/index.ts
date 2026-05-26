/** Barrel exports for the mock dataset.
 *  Pages import from "@/lib/mock" to stay agnostic of the underlying data source —
 *  in vague 2 (Supabase), these exports will be swapped for server-fetched data. */

export { mockClients, mockContacts } from "./clients";
export { mockDeals } from "./deals";
export { mockProjects } from "./projects";
export { mockInvoices } from "./invoices";
export { mockInvoicePayments } from "./payments";
export { mockQuotes } from "./quotes";
export { mockExpenses, mockExpenseCategories } from "./expenses";
export { mockBudgets } from "./budgets";
export { mockAccounts, mockTransactions } from "./accounts";
export { mockAlerts } from "./alerts";
export { mockCompany } from "./company";
