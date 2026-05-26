"use client";

import { RowActions } from "@/components/shared/row-actions";
import { deleteAccount } from "@/app/actions/accounts";

export function AccountRowActions({ accountId, accountName }: { accountId: string; accountName: string }) {
  return (
    <RowActions
      editHref={`/comptes/${accountId}/edit`}
      deleteLabel={`le compte "${accountName}"`}
      onDelete={() => deleteAccount(accountId)}
    />
  );
}
