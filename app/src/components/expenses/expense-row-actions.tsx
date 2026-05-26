"use client";

import { RowActions } from "@/components/shared/row-actions";
import { deleteExpense } from "@/app/actions/expenses";

export function ExpenseRowActions({ expenseId, vendor }: { expenseId: string; vendor: string }) {
  return (
    <RowActions
      viewHref={`/depenses/${expenseId}`}
      editHref={`/depenses/${expenseId}/edit`}
      deleteLabel={`la dépense "${vendor}"`}
      onDelete={() => deleteExpense(expenseId)}
    />
  );
}
