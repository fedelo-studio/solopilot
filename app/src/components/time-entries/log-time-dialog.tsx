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
import { createTimeEntry, updateTimeEntry } from "@/app/actions/time-entries";
import type { Person, Project, Task, TimeEntry } from "@/types/domain";

interface Props {
  projects: Project[];
  tasksByProject: Record<string, Task[]>;
  people: Person[];
  /** When present, the dialog is in edit mode and prefills from this entry. */
  entry?: TimeEntry;
  /** Prefill for quick-add from the weekly grid (project/task/person/date cell). */
  defaults?: { projectId?: string; taskId?: string; personId?: string; date?: string };
  trigger?: ReactNode;
}

function minutesToHm(minutes: number): { h: string; m: string } {
  return { h: String(Math.floor(minutes / 60)), m: String(minutes % 60) };
}

export function LogTimeDialog({ projects, tasksByProject, people, entry, defaults, trigger }: Props) {
  const router = useRouter();
  const isEdit = Boolean(entry);
  const [open, setOpen] = useState(false);
  const [projectId, setProjectId] = useState(entry?.projectId ?? defaults?.projectId ?? "");
  const [taskId, setTaskId] = useState(entry?.taskId ?? defaults?.taskId ?? "");
  const [personId, setPersonId] = useState(entry?.personId ?? defaults?.personId ?? people[0]?.id ?? "");
  const [billable, setBillable] = useState(entry?.billable ?? true);
  const initialHm = minutesToHm(entry?.durationMinutes ?? 60);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const availableTasks = tasksByProject[projectId] ?? [];
  const alreadyBilled = Boolean(entry?.invoiceId);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const hours = Number(fd.get("hours") ?? 0);
    const minutes = Number(fd.get("minutes") ?? 0);
    const payload = {
      projectId,
      taskId: taskId || undefined,
      personId,
      date: String(fd.get("date") ?? ""),
      durationMinutes: hours * 60 + minutes,
      description: String(fd.get("description") ?? "") || undefined,
      billable,
    };
    startTransition(async () => {
      const result = isEdit
        ? await updateTimeEntry({ id: entry!.id, ...payload })
        : await createTimeEntry(payload);
      if (result.ok) {
        setOpen(false);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  const defaultTrigger = isEdit ? (
    <Button variant="ghost" size="icon" aria-label="Modifier l'entrée">
      <Pencil className="h-3.5 w-3.5" />
    </Button>
  ) : (
    <Button>
      <Plus className="h-4 w-4" />
      Nouvelle entrée
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger ?? defaultTrigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier l'entrée" : "Nouvelle entrée de temps"}</DialogTitle>
          {alreadyBilled ? (
            <DialogDescription>
              Cette entrée est déjà facturée et ne peut plus être modifiée.
            </DialogDescription>
          ) : null}
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Projet" required>
              <Select
                value={projectId}
                onValueChange={(v) => {
                  setProjectId(v);
                  setTaskId("");
                }}
                disabled={alreadyBilled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionne un projet" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Tâche" hint="Optionnel">
              <Select
                value={taskId || "none"}
                onValueChange={(v) => setTaskId(v === "none" ? "" : v)}
                disabled={alreadyBilled || !projectId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Aucune tâche" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sans tâche</SelectItem>
                  {availableTasks.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Personne" required>
              <Select value={personId} onValueChange={setPersonId} disabled={alreadyBilled}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionne une personne" />
                </SelectTrigger>
                <SelectContent>
                  {people.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Date" required>
              <Input
                name="date"
                type="date"
                defaultValue={entry?.date ?? defaults?.date ?? new Date().toISOString().slice(0, 10)}
                disabled={alreadyBilled}
                required
              />
            </FormField>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Heures" required>
              <Input name="hours" type="number" min={0} defaultValue={initialHm.h} disabled={alreadyBilled} />
            </FormField>
            <FormField label="Minutes">
              <Input
                name="minutes"
                type="number"
                min={0}
                max={59}
                defaultValue={initialHm.m}
                disabled={alreadyBilled}
              />
            </FormField>
          </div>

          <FormField label="Description">
            <Textarea
              name="description"
              rows={2}
              defaultValue={entry?.description ?? ""}
              disabled={alreadyBilled}
            />
          </FormField>

          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={billable}
              onChange={(e) => setBillable(e.target.checked)}
              disabled={alreadyBilled}
              className="h-3.5 w-3.5 rounded border border-input accent-foreground"
            />
            Facturable
          </label>

          <FormError message={error} size="xs" />

          {!alreadyBilled ? (
            <DialogFormFooter
              pending={pending}
              submitLabel={isEdit ? "Enregistrer" : "Ajouter l'entrée"}
              pendingLabel="Enregistrement…"
              disableSubmit={!projectId || !personId}
            />
          ) : null}
        </form>
      </DialogContent>
    </Dialog>
  );
}
