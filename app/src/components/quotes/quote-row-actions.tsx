"use client";

import { FileDown } from "lucide-react";
import { RowActions } from "@/components/shared/row-actions";
import { deleteQuote } from "@/app/actions/quotes";

export function QuoteRowActions({ quoteId, quoteNumber }: { quoteId: string; quoteNumber: string }) {
  return (
    <RowActions
      viewHref={`/devis/${quoteId}`}
      editHref={`/devis/${quoteId}/edit`}
      extraItems={[{ label: "PDF", href: `/devis/${quoteId}/pdf`, icon: FileDown }]}
      deleteLabel={`le devis ${quoteNumber}`}
      onDelete={() => deleteQuote(quoteId)}
    />
  );
}
