"use client";

import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Duration } from "@/components/shared/duration";
import { LogTimeDialog } from "./log-time-dialog";
import type { Person, Project, Task, TimeEntry } from "@/types/domain";

interface Props {
  entries: TimeEntry[];
  projects: Project[];
  tasksByProject: Record<string, Task[]>;
  people: Person[];
  personId: string;
  weekDays: string[];
}

interface Row {
  projectId: string;
  taskId?: string;
  label: string;
}

export function WeeklyTimesheetGrid({ entries, projects, tasksByProject, people, personId, weekDays }: Props) {
  const projectsById = new Map(projects.map((p) => [p.id, p]));

  const rowKey = (e: TimeEntry) => `${e.projectId}::${e.taskId ?? "none"}`;
  const rows = new Map<string, Row>();
  for (const entry of entries) {
    const key = rowKey(entry);
    if (rows.has(key)) continue;
    const project = projectsById.get(entry.projectId);
    const task = entry.taskId ? tasksByProject[entry.projectId]?.find((t) => t.id === entry.taskId) : undefined;
    rows.set(key, {
      projectId: entry.projectId,
      taskId: entry.taskId,
      label: `${project?.name ?? "Projet"}${task ? ` — ${task.title}` : ""}`,
    });
  }

  const entriesFor = (row: Row, day: string) =>
    entries.filter((e) => e.projectId === row.projectId && (e.taskId ?? undefined) === row.taskId && e.date === day);

  const dayTotal = (day: string) =>
    entries.filter((e) => e.date === day).reduce((acc, e) => acc + e.durationMinutes, 0);

  const grandTotal = entries.reduce((acc, e) => acc + e.durationMinutes, 0);

  if (rows.size === 0) {
    return <p className="text-sm text-muted-foreground">Aucune entrée cette semaine.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-xs text-muted-foreground">
            <th className="py-2 text-left font-medium">Projet / Tâche</th>
            {weekDays.map((day) => (
              <th key={day} className="px-2 py-2 text-right font-medium capitalize">
                {format(parseISO(day), "EEE d", { locale: fr })}
              </th>
            ))}
            <th className="py-2 pl-2 text-right font-medium">Total</th>
          </tr>
        </thead>
        <tbody>
          {Array.from(rows.values()).map((row) => {
            const rowTotal = weekDays.reduce(
              (acc, day) => acc + entriesFor(row, day).reduce((a, e) => a + e.durationMinutes, 0),
              0,
            );
            return (
              <tr key={`${row.projectId}::${row.taskId ?? "none"}`} className="border-b border-border/60">
                <td className="py-2 pr-2 text-foreground">{row.label}</td>
                {weekDays.map((day) => {
                  const dayEntries = entriesFor(row, day);
                  const minutes = dayEntries.reduce((a, e) => a + e.durationMinutes, 0);
                  return (
                    <td key={day} className="px-2 py-2 text-right">
                      <LogTimeDialog
                        projects={projects}
                        tasksByProject={tasksByProject}
                        people={people}
                        defaults={{ projectId: row.projectId, taskId: row.taskId, personId, date: day }}
                        trigger={
                          <button
                            type="button"
                            className="rounded-sm px-1.5 py-0.5 text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            {minutes > 0 ? <Duration minutes={minutes} className="text-foreground" /> : "—"}
                          </button>
                        }
                      />
                    </td>
                  );
                })}
                <td className="py-2 pl-2 text-right font-medium">
                  <Duration minutes={rowTotal} />
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t border-border font-medium">
            <td className="py-2">Total</td>
            {weekDays.map((day) => (
              <td key={day} className="px-2 py-2 text-right">
                <Duration minutes={dayTotal(day)} />
              </td>
            ))}
            <td className="py-2 pl-2 text-right">
              <Duration minutes={grandTotal} />
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
