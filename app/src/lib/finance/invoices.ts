import { isBefore, parseISO } from "date-fns";
import type { Invoice, InvoiceStatus } from "@/types/domain";

/** Remaining balance — total minus paid. */
export function balanceDue(invoice: Invoice): number {
  return Math.max(0, invoice.total - invoice.amountPaid);
}

/** Derived "live" status: even if stored as "sent", we mark it overdue when
 *  the due date has passed and balance is still owed. */
export function liveStatus(invoice: Invoice): InvoiceStatus {
  if (invoice.status === "paid" || invoice.status === "cancelled") return invoice.status;
  if (invoice.amountPaid >= invoice.total) return "paid";
  if (invoice.status === "draft") return "draft";
  if (isBefore(parseISO(invoice.dueDate), new Date())) return "overdue";
  return "sent";
}

/** Total amount across a list of invoices, optionally filtered by status. */
export function sumInvoices(
  invoices: Invoice[],
  filter?: (i: Invoice) => boolean,
): number {
  const list = filter ? invoices.filter(filter) : invoices;
  return list.reduce((acc, i) => acc + i.total, 0);
}

/** Open invoices = sent or overdue, not paid yet. */
export function isOpen(invoice: Invoice): boolean {
  const status = liveStatus(invoice);
  return status === "sent" || status === "overdue";
}

/** Total balance still owed to the user across all open invoices. */
export function totalOwed(invoices: Invoice[]): number {
  return invoices.filter(isOpen).reduce((acc, i) => acc + balanceDue(i), 0);
}
