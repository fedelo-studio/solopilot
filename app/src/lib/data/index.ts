/** Public barrel for the data layer.
 *  Pages and server actions should ONLY import from here, never from `@/lib/mock`. */

export { getClients, getClientById, getContacts, getContactsByClient } from "./clients";
export { getDeals, getDealById } from "./deals";
export { getProjects, getProjectById, getProjectsByClient } from "./projects";
export { getInvoices, getInvoiceById, nextInvoiceNumber, getPaymentsByInvoice } from "./invoices";
export { getQuotes, getQuoteById, nextQuoteNumber } from "./quotes";
export {
  getExpenses,
  getExpenseById,
  getExpenseCategories,
  getExpensesByProject,
} from "./expenses";
export { getBudgets, getBudgetById } from "./budgets";
export { getAccounts, getAccountById, getTransactions } from "./accounts";
export { getAlerts } from "./alerts";
export { getCompanySettings, isOnboarded } from "./company";
