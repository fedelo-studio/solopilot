"use client";

import { cn } from "@/lib/utils";
import { Duration } from "@/components/shared/duration";
import { RowActions } from "@/components/shared/row-actions";
import { TaskStatusMenu } from "./task-status-menu";
import { TaskFormDialog } from "./task-form-dialog";
import { deleteTask } from "@/app/actions/tasks";
import { taskEstimateVsActual } from "@/lib/finance/projects";
import { TASK_PRIORITY_LABELS, type Person, type Task, type TimeEntry } from "@/types/domain";

interface TaskCardProps {
  task: Task;
  projectId: string;
  people: Person[];
  assignee?: Person;
  entries: TimeEntry[];
}

const PRIORITY_DOT: Record<Task["priority"], string> = {
  low: "bg-hypothetical",
  medium: "bg-probable",
  high: "bg-warning",
  urgent: "bg-danger",
};

export function TaskCard({ task, projectId, people, assignee, entries }: TaskCardProps) {
  const estimate = taskEstimateVsActual(task, entries);

  return (
    <article className="group rounded-md border border-border bg-card p-3 shadow-card transition-all hover:border-foreground/20 hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <TaskFormDialog
          projectId={projectId}
          people={people}
          task={task}
          trigger={
            <button className="line-clamp-2 rounded-sm text-left text-sm font-medium leading-tight outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1">
              {task.title}
            </button>
          }
        />
        <RowActions
          onDelete={() => deleteTask({ id: task.id, projectId })}
          deleteLabel={`« ${task.title} »`}
        />
      </div>

      <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className={cn("h-1.5 w-1.5 rounded-full", PRIORITY_DOT[task.priority])} aria-hidden />
        {TASK_PRIORITY_LABELS[task.priority]}
        {task.category ? <span> · {task.category}</span> : null}
      </p>

      <div className="mt-2 flex items-center justify-between gap-2">
        <TaskStatusMenu taskId={task.id} projectId={projectId} status={task.status} size="sm" />
        <span className="truncate text-xs text-muted-foreground">
          {assignee?.name ?? "Non assigné"}
        </span>
      </div>

      {estimate.estimatedHours != null || estimate.actualHours > 0 ? (
        <div className="mt-2 flex items-center justify-between border-t border-border pt-2 text-meta text-muted-foreground">
          <span>
            Réel <Duration minutes={estimate.actualHours * 60} className="text-foreground" />
          </span>
          {estimate.estimatedHours != null ? (
            <span>
              Estimé <Duration minutes={estimate.estimatedHours * 60} />
            </span>
          ) : null}
        </div>
      ) : null}

      {task.dueDate ? (
        <div className="mt-1 text-meta text-muted-foreground">
          Échéance {new Date(task.dueDate).toLocaleDateString("fr-CH")}
        </div>
      ) : null}
    </article>
  );
}
