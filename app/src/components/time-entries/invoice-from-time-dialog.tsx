"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Duration } from "@/components/shared/duration";
import { Money } from "@/components/shared/money";
import { createInvoiceFromTimeEntries } from "@/app/actions/time-entries";
import { buildTimeEntryInvoiceLines, type InvoiceLineGrouping } from "@/lib/finance/projects";
import { computeLineTotals } from "@/lib/finance/lines";
import { formatDate } from "@/lib/finance/format";
import type { Person, Project, Task, TimeEntry } from "@/types/domain";

interface Props {
  project: Project;
  people: Person[];
  tasks: Task[];
  /** Unbilled, billable entries for this project — the only eligible pool. */
  entries: TimeEntry[];
  /** Company default VAT rate, for the live totals preview. */
  vatRate?: number;
}

const GROUPING_LABELS: Record<InvoiceLineGrouping, string> = {
  task: "Par tâche",
  person: "Par personne",
  single_line: "Une seule ligne",
};

export function InvoiceFromTimeDialog({ project, people, tasks, entries, vatRate = 0 }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(() => new Set(entries.map((e) => e.id)));
  const [groupBy, setGroupBy] = useState<InvoiceLineGrouping>("task");
  const [dueInDays, setDueInDays] = useState(30);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const peopleById = new Map(people.map((p) => [p.id, p]));
  const tasksById = new Map(tasks.map((t) => [t.id, t]));

  const selectedEntries = useMemo(
    () => entries.filter((e) => selected.has(e.id)),
    [entries, selected],
  );

  const preview = useMemo(
    () => buildTimeEntryInvoiceLines(selectedEntries, { project, people, tasks }, groupBy, vatRate),
    [selectedEntries, project, people, tasks, groupBy, vatRate],
  );
  const totals = preview.error ? null : computeLineTotals(preview.lines);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => (prev.size === entries.length ? new Set() : new Set(entries.map((e) => e.id))));
  }

  function handleCreate() {
    setError(null);
    startTransition(async () => {
      const result = await createInvoiceFromTimeEntries({
        projectId: project.id,
        entryIds: Array.from(selected),
        dueInDays,
        groupBy,
      });
      if (result.ok) {
        router.push(`/factures/${result.data.invoiceId}`);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="hot">
          <FileText className="h-4 w-4" />
          Facturer le temps
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Facturer le temps suivi</DialogTitle>
          <DialogDescription>
            Une facture brouillon sera créée à partir des entrées sélectionnées. Une fois facturées,
            elles ne peuvent plus être sélectionnées à nouveau.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-64 space-y-1 overflow-y-auto rounded-md border border-border p-2">
          <label className="flex cursor-pointer items-center gap-2 border-b border-border pb-1.5 text-xs font-medium text-muted-foreground">
            <input
              type="checkbox"
              checked={selected.size === entries.length && entries.length > 0}
              onChange={toggleAll}
              className="h-3.5 w-3.5 rounded border border-input accent-foreground"
            />
            Tout sélectionner ({entries.length})
          </label>
          {entries.map((entry) => {
            const person = peopleById.get(entry.personId);
            const task = entry.taskId ? tasksById.get(entry.taskId) : undefined;
            return (
              <label
                key={entry.id}
                className="flex cursor-pointer items-center justify-between gap-2 rounded-sm px-1 py-1 text-sm hover:bg-accent"
              >
                <span className="flex items-center gap-2 truncate">
                  <input
                    type="checkbox"
                    checked={selected.has(entry.id)}
                    onChange={() => toggle(entry.id)}
                    className="h-3.5 w-3.5 shrink-0 rounded border border-input accent-foreground"
                  />
                  <span className="truncate">
                    <span className="text-muted-foreground">{formatDate(entry.date)}</span>{" "}
                    {task?.title ?? "Sans tâche"} — {person?.name ?? "—"}
                  </span>
                </span>
                <Duration minutes={entry.durationMinutes} className="shrink-0 text-muted-foreground" />
              </label>
            );
          })}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Grouper par">
            <Select value={groupBy} onValueChange={(v) => setGroupBy(v as InvoiceLineGrouping)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(GROUPING_LABELS) as InvoiceLineGrouping[]).map((g) => (
                  <SelectItem key={g} value={g}>
                    {GROUPING_LABELS[g]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Échéance (jours)">
            <Input
              type="number"
              min={0}
              max={120}
              value={dueInDays}
              onChange={(e) => setDueInDays(Number(e.target.value))}
            />
          </FormField>
        </div>

        {preview.error ? (
          <FormError message={preview.error} size="xs" />
        ) : totals ? (
          <div className="space-y-1 rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
            {preview.lines.map((line, idx) => (
              <div key={idx} className="flex items-center justify-between text-muted-foreground">
                <span className="truncate">{line.description}</span>
                <span className="shrink-0">
                  {line.quantity} h × <Money amount={line.unitPrice} className="text-foreground" />
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between border-t border-border pt-1 font-medium">
              <span>Total TTC</span>
              <Money amount={totals.total} />
            </div>
          </div>
        ) : null}

        <FormError message={error} size="xs" />

        <DialogFormFooter
          pending={pending}
          submitLabel="Créer la facture"
          pendingLabel="Création…"
          submitVariant="hot"
          disableSubmit={selected.size === 0 || Boolean(preview.error)}
          onSubmit={handleCreate}
        />
      </DialogContent>
    </Dialog>
  );
}
