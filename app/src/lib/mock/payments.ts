import type { InvoicePayment } from "@/types/domain";
import { MOCK_USER_ID, tsOffset, dateOffset } from "./seed";
import { makeMockStore, registerMockStore } from "./_store";

/** Historical payments — one per paid invoice in mock data.
 *  Mock mode mutates these via the store (record-payment dialog) AND keeps
 *  the linked invoice's amount_paid in sync — see actions/invoices.ts. */
const seed: InvoicePayment[] = [
  {
    id: "ip-i-2026-0041",
    userId: MOCK_USER_ID,
    invoiceId: "i-2026-0041",
    amount: 9_460.75,
    paidOn: dateOffset(-15),
    method: "bank_transfer",
    notes: "Virement reçu par PostFinance.",
    createdAt: tsOffset(-15),
  },
  {
    id: "ip-i-2026-0038",
    userId: MOCK_USER_ID,
    invoiceId: "i-2026-0038",
    amount: 2_702.5,
    paidOn: dateOffset(-38),
    method: "bank_transfer",
    createdAt: tsOffset(-38),
  },
  {
    id: "ip-i-2026-0036",
    userId: MOCK_USER_ID,
    invoiceId: "i-2026-0036",
    amount: 3_026.16,
    paidOn: dateOffset(-95),
    method: "bank_transfer",
    createdAt: tsOffset(-95),
  },
  {
    id: "ip-i-2026-0035",
    userId: MOCK_USER_ID,
    invoiceId: "i-2026-0035",
    amount: 3_446.4,
    paidOn: dateOffset(-260),
    method: "bank_transfer",
    createdAt: tsOffset(-260),
  },
];

export const mockInvoicePaymentsStore = makeMockStore<InvoicePayment>(seed);
registerMockStore("invoice_payments", mockInvoicePaymentsStore);
export const mockInvoicePayments = mockInvoicePaymentsStore.items;
