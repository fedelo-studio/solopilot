"use client";

import { FileDown } from "lucide-react";
import { RowActions } from "@/components/shared/row-actions";
import { deleteInvoice } from "@/app/actions/invoices";

export function InvoiceRowActions({ invoiceId, invoiceNumber }: { invoiceId: string; invoiceNumber: string }) {
  return (
    <RowActions
      viewHref={`/factures/${invoiceId}`}
      editHref={`/factures/${invoiceId}/edit`}
      extraItems={[
        { label: "PDF", href: `/factures/${invoiceId}/pdf`, icon: FileDown },
      ]}
      deleteLabel={`la facture #${invoiceNumber}`}
      onDelete={() => deleteInvoice(invoiceId)}
    />
  );
}
