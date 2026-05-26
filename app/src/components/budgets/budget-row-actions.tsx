"use client";

import { RowActions } from "@/components/shared/row-actions";
import { deleteBudget } from "@/app/actions/budgets";

export function BudgetRowActions({ budgetId, categoryName }: { budgetId: string; categoryName: string }) {
  return (
    <RowActions
      editHref={`/budgets/${budgetId}/edit`}
      deleteLabel={`le budget "${categoryName}"`}
      onDelete={() => deleteBudget(budgetId)}
    />
  );
}
