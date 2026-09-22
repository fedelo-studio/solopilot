"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormField } from "@/components/shared/form-field";
import { FormError } from "@/components/shared/form-error";
import { DialogFormFooter } from "@/components/shared/dialog-form-footer";
import { createTask, updateTask } from "@/app/actions/tasks";
import {
  TASK_PRIORITIES,
  TASK_PRIORITY_LABELS,
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  type Person,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from "@/types/domain";

interface Props {
  projectId: string;
  people: Person[];
  /** When present, the dialog is in edit mode and prefills from this task. */
  task?: Task;
  trigger?: ReactNode;
}

export function TaskFormDialog({ projectId, people, task, trigger }: Props) {
  const router = useRouter();
  const isEdit = Boolean(task);
  const [open, setOpen] = useState(false);
  const [assigneeId, setAssigneeId] = useState(task?.assigneeId ?? "");
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? "todo");
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? "medium");
  const [billable, setBillable] = useState(task?.billable ?? true);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const payload = {
      projectId,
      assigneeId: assigneeId || undefined,
      title: String(fd.get("title") ?? ""),
      description: String(fd.get("description") ?? "") || undefined,
      status,
      priority,
      category: String(fd.get("category") ?? "") || undefined,
      billable,
      estimatedHours: fd.get("estimatedHours") ? Number(fd.get("estimatedHours")) : undefined,
      startDate: String(fd.get("startDate") ?? "") || undefined,
      dueDate: String(fd.get("dueDate") ?? "") || undefined,
    };
    startTransition(async () => {
      const result = isEdit
        ? await updateTask({ id: task!.id, ...payload })
        : await createTask(payload);
      if (result.ok) {
        setOpen(false);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  const defaultTrigger = isEdit ? (
    <Button variant="ghost" size="icon" aria-label="Modifier la tâche">
      <Pencil className="h-3.5 w-3.5" />
    </Button>
  ) : (
    <Button variant="outline" size="sm">
      <Plus className="h-4 w-4" />
      Nouvelle tâche
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger ?? defaultTrigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier la tâche" : "Nouvelle tâche"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Titre" required>
            <Input name="title" defaultValue={task?.title ?? ""} required autoFocus />
          </FormField>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Assigné à" hint="Optionnel">
              <Select value={assigneeId || "none"} onValueChange={(v) => setAssigneeId(v === "none" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Personne à assigner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Non assigné</SelectItem>
                  {people.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Catégorie / service" hint="ex. Design, Développement">
              <Input name="category" defaultValue={task?.category ?? ""} />
            </FormField>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Statut">
              <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {TASK_STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Priorité">
              <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {TASK_PRIORITY_LABELS[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <FormField label="Heures estimées" hint="Optionnel">
              <Input
                name="estimatedHours"
                type="number"
                step="0.5"
                min={0}
                defaultValue={task?.estimatedHours ?? ""}
              />
            </FormField>
            <FormField label="Début">
              <Input name="startDate" type="date" defaultValue={task?.startDate ?? ""} />
            </FormField>
            <FormField label="Échéance">
              <Input name="dueDate" type="date" defaultValue={task?.dueDate ?? ""} />
            </FormField>
          </div>

          <FormField label="Description">
            <Textarea name="description" rows={2} defaultValue={task?.description ?? ""} />
          </FormField>

          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={billable}
              onChange={(e) => setBillable(e.target.checked)}
              className="h-3.5 w-3.5 rounded border border-input accent-foreground"
            />
            Facturable
          </label>

          <FormError message={error} size="xs" />

          <DialogFormFooter
            pending={pending}
            submitLabel={isEdit ? "Enregistrer" : "Créer la tâche"}
            pendingLabel="Enregistrement…"
          />
        </form>
      </DialogContent>
    </Dialog>
  );
}
