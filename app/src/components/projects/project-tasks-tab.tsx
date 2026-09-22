import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Duration } from "@/components/shared/duration";
import { TaskFormDialog } from "@/components/tasks/task-form-dialog";
import { TaskCard } from "@/components/tasks/task-card";
import { InvoiceFromTimeDialog } from "@/components/time-entries/invoice-from-time-dialog";
import { formatDate } from "@/lib/finance/format";
import { TASK_STATUSES, TASK_STATUS_LABELS, type Person, type Project, type Task, type TimeEntry } from "@/types/domain";

interface ProjectTasksTabProps {
  project: Project;
  tasks: Task[];
  people: Person[];
  entries: TimeEntry[];
  unbilledEntries: TimeEntry[];
  vatRate: number;
}

export function ProjectTasksTab({
  project,
  tasks,
  people,
  entries,
  unbilledEntries,
  vatRate,
}: ProjectTasksTabProps) {
  const peopleById = new Map(people.map((p) => [p.id, p]));
  const canInvoiceTime = project.billingType === "hourly" && unbilledEntries.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {tasks.length} tâche{tasks.length > 1 ? "s" : ""}
        </p>
        <TaskFormDialog projectId={project.id} people={people} />
      </div>

      <div className="grid auto-rows-min grid-flow-col gap-3 overflow-x-auto pb-2 scrollbar-thin md:grid-cols-5">
        {TASK_STATUSES.map((status) => {
          const columnTasks = tasks.filter((t) => t.status === status);
          return (
            <section
              key={status}
              className="flex min-w-[220px] flex-col rounded-lg border border-border bg-muted/30 p-3 md:min-w-0"
            >
              <header className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-medium">{TASK_STATUS_LABELS[status]}</h3>
                <span className="text-meta-num">{columnTasks.length}</span>
              </header>
              <div className="flex flex-1 flex-col gap-2">
                {columnTasks.length === 0 ? (
                  <EmptyState size="sm" title="Aucune tâche" />
                ) : (
                  columnTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      projectId={project.id}
                      people={people}
                      assignee={task.assigneeId ? peopleById.get(task.assigneeId) : undefined}
                      entries={entries}
                    />
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle>Temps enregistré</CardTitle>
            <CardDescription>
              {entries.length} entrée{entries.length > 1 ? "s" : ""} sur ce projet.
            </CardDescription>
          </div>
          {canInvoiceTime ? (
            <InvoiceFromTimeDialog
              project={project}
              people={people}
              tasks={tasks}
              entries={unbilledEntries}
              vatRate={vatRate}
            />
          ) : null}
        </CardHeader>
        <CardContent className="p-0">
          {entries.length === 0 ? (
            <p className="px-5 pb-5 text-sm text-muted-foreground">Aucun temps suivi pour l'instant.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Personne</TableHead>
                  <TableHead>Tâche</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Durée</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => {
                  const person = peopleById.get(entry.personId);
                  const task = tasks.find((t) => t.id === entry.taskId);
                  return (
                    <TableRow key={entry.id}>
                      <TableCell className="text-muted-foreground">{formatDate(entry.date)}</TableCell>
                      <TableCell>{person?.name ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{task?.title ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{entry.description ?? "—"}</TableCell>
                      <TableCell className="text-right">
                        <Duration minutes={entry.durationMinutes} />
                      </TableCell>
                      <TableCell>
                        {!entry.billable ? (
                          <Badge variant="hypothetical">Non facturable</Badge>
                        ) : entry.invoiceId ? (
                          <Badge variant="confirmed">Facturé</Badge>
                        ) : (
                          <Badge variant="probable">Non facturé</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
