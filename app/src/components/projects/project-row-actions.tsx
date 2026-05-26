"use client";

import { RowActions } from "@/components/shared/row-actions";
import { deleteProject } from "@/app/actions/projects";

export function ProjectRowActions({ projectId, projectName }: { projectId: string; projectName: string }) {
  return (
    <RowActions
      viewHref={`/projets/${projectId}`}
      editHref={`/projets/${projectId}/edit`}
      deleteLabel={`le projet "${projectName}"`}
      onDelete={() => deleteProject(projectId)}
    />
  );
}
