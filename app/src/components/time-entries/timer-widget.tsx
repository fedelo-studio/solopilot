"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createTimeEntry } from "@/app/actions/time-entries";
import { formatDuration } from "@/lib/finance/format";
import type { Person, Project, Task } from "@/types/domain";

interface Props {
  projects: Project[];
  tasksByProject: Record<string, Task[]>;
  people: Person[];
  defaultPersonId?: string;
}

/** Client-side-only timer — no "running timer" state is persisted server-side.
 *  Starting/stopping just anchors a local Date.now() and, on stop, writes a
 *  real time entry via the same `createTimeEntry` action manual entry uses.
 *  Trade-off: doesn't survive a closed tab or a different device — acceptable
 *  for a single-operator tool, and avoids inventing recovery/notification
 *  infra for an ephemeral concept. */
export function TimerWidget({ projects, tasksByProject, people, defaultPersonId }: Props) {
  const router = useRouter();
  const [projectId, setProjectId] = useState("");
  const [taskId, setTaskId] = useState("");
  const [personId, setPersonId] = useState(defaultPersonId ?? people[0]?.id ?? "");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [pending, startTransition] = useTransition();

  const availableTasks = tasksByProject[projectId] ?? [];
  const running = startedAt != null;

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt!) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [running, startedAt]);

  function start() {
    if (!projectId || !personId) return;
    setStartedAt(Date.now());
    setElapsedSeconds(0);
  }

  function stop() {
    if (!startedAt) return;
    const durationMinutes = Math.max(1, Math.round((Date.now() - startedAt) / 60_000));
    startTransition(async () => {
      const result = await createTimeEntry({
        projectId,
        taskId: taskId || undefined,
        personId,
        date: new Date().toISOString().slice(0, 10),
        durationMinutes,
        billable: true,
      });
      setStartedAt(null);
      setElapsedSeconds(0);
      if (result.ok) router.refresh();
    });
  }

  return (
    <Card>
      <CardContent className="flex flex-wrap items-center gap-3 p-4">
        <Select value={projectId} onValueChange={(v) => { setProjectId(v); setTaskId(""); }} disabled={running}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Projet" />
          </SelectTrigger>
          <SelectContent>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={taskId || "none"} onValueChange={(v) => setTaskId(v === "none" ? "" : v)} disabled={running || !projectId}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Tâche (optionnel)" />
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

        <Select value={personId} onValueChange={setPersonId} disabled={running}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Personne" />
          </SelectTrigger>
          <SelectContent>
            {people.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="num min-w-[5rem] text-lg font-medium tabular-nums">
          {formatDuration(Math.round(elapsedSeconds / 60)) === "0 min" && elapsedSeconds > 0
            ? "< 1 min"
            : formatDuration(Math.round(elapsedSeconds / 60))}
        </span>

        {running ? (
          <Button variant="hot" onClick={stop} disabled={pending}>
            <Square className="h-4 w-4" />
            {pending ? "Enregistrement…" : "Arrêter"}
          </Button>
        ) : (
          <Button onClick={start} disabled={!projectId || !personId}>
            <Play className="h-4 w-4" />
            Démarrer
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
