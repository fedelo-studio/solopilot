import Link from "next/link";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { addDays, eachDayOfInterval, endOfWeek, format, startOfWeek } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Duration } from "@/components/shared/duration";
import { TimerWidget } from "@/components/time-entries/timer-widget";
import { WeeklyTimesheetGrid } from "@/components/time-entries/weekly-timesheet-grid";
import { LogTimeDialog } from "@/components/time-entries/log-time-dialog";
import { TimeEntryRowActions } from "@/components/time-entries/time-entry-row-actions";

import { getPeople, getProjects, getTasksByProject, getTimeEntriesByPerson } from "@/lib/data";
import { formatDate } from "@/lib/finance/format";
import type { Task } from "@/types/domain";

export default async function TempsPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string; person?: string }>;
}) {
  const params = await searchParams;

  const anchor = params.week ? new Date(params.week) : new Date();
  const weekStart = startOfWeek(anchor, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(anchor, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd }).map((d) => format(d, "yyyy-MM-dd"));

  const [people, projects] = await Promise.all([getPeople(), getProjects()]);
  const personId = params.person || people[0]?.id || "";
  const person = people.find((p) => p.id === personId);

  const tasksByProjectEntries = await Promise.all(
    projects.map(async (p) => [p.id, await getTasksByProject(p.id)] as [string, Task[]]),
  );
  const tasksByProject: Record<string, Task[]> = Object.fromEntries(tasksByProjectEntries);

  const entries = personId
    ? await getTimeEntriesByPerson(personId, { from: weekDays[0], to: weekDays[6] })
    : [];

  const prevWeek = format(addDays(weekStart, -7), "yyyy-MM-dd");
  const nextWeek = format(addDays(weekStart, 7), "yyyy-MM-dd");
  const weekLabel = `${format(weekStart, "d MMM")} – ${format(weekEnd, "d MMM yyyy")}`;

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        eyebrow="Temps"
        title="Temps"
        description="Timer, saisie rapide et feuille de temps hebdomadaire."
        actions={
          people.length > 0 ? (
            <LogTimeDialog
              projects={projects}
              tasksByProject={tasksByProject}
              people={people}
              defaults={{ personId, date: format(new Date(), "yyyy-MM-dd") }}
            />
          ) : null
        }
      />

      {people.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="Aucune personne dans le roster"
          description="Ajoute d'abord une personne dans Équipe pour pouvoir suivre du temps."
          action={
            <Button asChild variant="outline">
              <Link href="/equipe">Aller à Équipe</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          <TimerWidget
            projects={projects}
            tasksByProject={tasksByProject}
            people={people}
            defaultPersonId={personId}
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1">
              <Button asChild variant="ghost" size="icon">
                <Link href={`/temps?week=${prevWeek}&person=${personId}`} aria-label="Semaine précédente">
                  <ChevronLeft className="h-4 w-4" />
                </Link>
              </Button>
              <span className="text-sm font-medium capitalize">{weekLabel}</span>
              <Button asChild variant="ghost" size="icon">
                <Link href={`/temps?week=${nextWeek}&person=${personId}`} aria-label="Semaine suivante">
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            {people.length > 1 ? (
              <div className="flex flex-wrap gap-1">
                {people.map((p) => (
                  <Button
                    key={p.id}
                    asChild
                    variant={p.id === personId ? "default" : "outline"}
                    size="sm"
                  >
                    <Link href={`/temps?week=${format(weekStart, "yyyy-MM-dd")}&person=${p.id}`}>
                      {p.name}
                    </Link>
                  </Button>
                ))}
              </div>
            ) : null}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Feuille de temps — {person?.name ?? "—"}</CardTitle>
              <CardDescription>Clique une cellule pour ajouter une entrée ce jour-là.</CardDescription>
            </CardHeader>
            <CardContent>
              <WeeklyTimesheetGrid
                entries={entries}
                projects={projects}
                tasksByProject={tasksByProject}
                people={people}
                personId={personId}
                weekDays={weekDays}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Entrées de la semaine</CardTitle>
              <CardDescription>
                {entries.length} entrée{entries.length > 1 ? "s" : ""} — modifie ou supprime ici.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {entries.length === 0 ? (
                <p className="px-5 pb-5 text-sm text-muted-foreground">Aucune entrée cette semaine.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Projet</TableHead>
                      <TableHead>Tâche</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Durée</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="w-20" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((entry) => {
                      const project = projects.find((p) => p.id === entry.projectId);
                      const task = entry.taskId
                        ? tasksByProject[entry.projectId]?.find((t) => t.id === entry.taskId)
                        : undefined;
                      return (
                        <TableRow key={entry.id}>
                          <TableCell className="text-muted-foreground">{formatDate(entry.date)}</TableCell>
                          <TableCell>{project?.name ?? "—"}</TableCell>
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
                          <TableCell>
                            <div className="flex items-center justify-end gap-1">
                              {!entry.invoiceId ? (
                                <LogTimeDialog
                                  projects={projects}
                                  tasksByProject={tasksByProject}
                                  people={people}
                                  entry={entry}
                                />
                              ) : null}
                              {!entry.invoiceId ? (
                                <TimeEntryRowActions entryId={entry.id} projectId={entry.projectId} />
                              ) : null}
                            </div>
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
      )}
    </div>
  );
}
