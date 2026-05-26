"use client";

import { RowActions } from "@/components/shared/row-actions";
import { deleteClient } from "@/app/actions/clients";

export function ClientRowActions({
  clientId,
  clientName,
}: {
  clientId: string;
  clientName: string;
}) {
  return (
    <RowActions
      viewHref={`/clients/${clientId}`}
      editHref={`/clients/${clientId}/edit`}
      deleteLabel={`le client "${clientName}"`}
      onDelete={() => deleteClient(clientId)}
    />
  );
}
