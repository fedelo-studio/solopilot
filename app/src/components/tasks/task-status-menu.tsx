"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { setTaskStatus } from "@/app/actions/tasks";
import { TASK_STATUSES, TASK_STATUS_LABELS, type TaskStatus } from "@/types/domain";

/** Inline status menu for tasks — the kanban-card shortcut for moving a task
 *  without opening the edit form. Mirrors DealStageMenu exactly. */
interface TaskStatusMenuProps {
  taskId: string;
  projectId: string;
  status: TaskStatus;
  size?: "sm" | "md";
}

const VARIANT_BY_STATUS: Record<TaskStatus, Parameters<typeof Badge>[0]["variant"]> = {
  todo: "hypothetical",
  in_progress: "probable",
  review: "warning",
  blocked: "danger",
  done: "confirmed",
};

export function TaskStatusMenu({ taskId, projectId, status, size = "sm" }: TaskStatusMenuProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function move(next: TaskStatus) {
    if (next === status) return;
    startTransition(async () => {
      const result = await setTaskStatus({ id: taskId, projectId, status: next });
      if (result.ok) router.refresh();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Changer le statut de la tâche — actuellement ${TASK_STATUS_LABELS[status]}`}
        onClick={(e) => e.stopPropagation()}
        className="inline-flex items-center gap-1 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:opacity-50"
        disabled={pending}
      >
        <Badge variant={VARIANT_BY_STATUS[status]} className={size === "md" ? "text-xs" : undefined}>
          {TASK_STATUS_LABELS[status]}
          <ChevronDown className="h-3 w-3 opacity-70" aria-hidden />
        </Badge>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44">
        <DropdownMenuLabel className="text-xs">Déplacer cette tâche vers…</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {TASK_STATUSES.map((s) => (
          <DropdownMenuItem key={s} disabled={s === status} onSelect={() => move(s)} className="justify-between">
            <span>{TASK_STATUS_LABELS[s]}</span>
            {s === status ? <span className="text-meta text-muted-foreground">actuel</span> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
