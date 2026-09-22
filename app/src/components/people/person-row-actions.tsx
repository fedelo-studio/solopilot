"use client";

import { RowActions } from "@/components/shared/row-actions";
import { deletePerson } from "@/app/actions/people";

export function PersonRowActions({ personId, name }: { personId: string; name: string }) {
  return (
    <RowActions
      deleteLabel={`« ${name} »`}
      onDelete={() => deletePerson(personId)}
    />
  );
}
