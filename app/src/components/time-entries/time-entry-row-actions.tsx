"use client";

import { RowActions } from "@/components/shared/row-actions";
import { deleteTimeEntry } from "@/app/actions/time-entries";

export function TimeEntryRowActions({ entryId, projectId }: { entryId: string; projectId: string }) {
  return (
    <RowActions
      deleteLabel="cette entrée de temps"
      onDelete={() => deleteTimeEntry({ id: entryId, projectId })}
    />
  );
}
