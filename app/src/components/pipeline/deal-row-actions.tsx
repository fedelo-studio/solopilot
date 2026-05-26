"use client";

import { RowActions } from "@/components/shared/row-actions";
import { deleteDeal } from "@/app/actions/deals";

export function DealRowActions({ dealId, title }: { dealId: string; title: string }) {
  return (
    <RowActions
      viewHref={`/pipeline/${dealId}`}
      editHref={`/pipeline/${dealId}/edit`}
      deleteLabel={`le deal "${title}"`}
      onDelete={() => deleteDeal(dealId)}
    />
  );
}
