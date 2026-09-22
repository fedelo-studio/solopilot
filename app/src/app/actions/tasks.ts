"use server";

import { z } from "zod";
import {
  deleteOwnedRow,
  fail,
  firstError,
  getAuthedSession,
  ok,
  parseInput,
  revalidateMany,
  type ActionResult,
} from "./_helpers";
import { mockTasksStore } from "@/lib/mock/tasks";
import { mockId, nowIso } from "@/lib/mock/_store";
import { TASK_PRIORITIES, TASK_STATUSES } from "@/types/domain";

const TaskSchema = z.object({
  projectId: z.string().min(1),
  assigneeId: z.string().optional(),
  title: z.string().trim().min(1, "Le titre est requis"),
  description: z.string().optional(),
  status: z.enum(TASK_STATUSES).default("todo"),
  priority: z.enum(TASK_PRIORITIES).default("medium"),
  category: z.string().optional(),
  billable: z.coerce.boolean().default(true),
  estimatedHours: z.coerce.number().nonnegative().optional(),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
});

export type TaskInput = z.input<typeof TaskSchema>;

export async function createTask(input: TaskInput): Promise<ActionResult<{ id: string }>> {
  const parsed = parseInput(TaskSchema, input);
  if (!parsed.success) return fail(firstError(parsed), parsed.fields);

  const session = await getAuthedSession();
  if (!session.ok) return fail(session.error);

  const paths = [`/projets/${parsed.data.projectId}`];

  if (session.session.mode === "mock") {
    const id = mockId("t");
    mockTasksStore.add({
      id,
      userId: session.session.userId,
      projectId: parsed.data.projectId,
      assigneeId: parsed.data.assigneeId || undefined,
      title: parsed.data.title,
      description: parsed.data.description || undefined,
      status: parsed.data.status,
      priority: parsed.data.priority,
      category: parsed.data.category || undefined,
      billable: parsed.data.billable,
      estimatedHours: parsed.data.estimatedHours,
      startDate: parsed.data.startDate || undefined,
      dueDate: parsed.data.dueDate || undefined,
      createdAt: nowIso(),
    });
    revalidateMany(paths);
    return ok({ id });
  }

  const { userId, supabase } = session.session;
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      user_id: userId,
      project_id: parsed.data.projectId,
      assignee_id: parsed.data.assigneeId || null,
      title: parsed.data.title,
      description: parsed.data.description || null,
      status: parsed.data.status,
      priority: parsed.data.priority,
      category: parsed.data.category || null,
      billable: parsed.data.billable,
      estimated_hours: parsed.data.estimatedHours ?? null,
      start_date: parsed.data.startDate || null,
      due_date: parsed.data.dueDate || null,
    })
    .select("id")
    .single();
  if (error) return fail(error.message);

  revalidateMany(paths);
  return ok({ id: data.id as string });
}

const TaskUpdateSchema = TaskSchema.extend({ id: z.string().min(1) });

export async function updateTask(input: z.input<typeof TaskUpdateSchema>): Promise<ActionResult> {
  const parsed = parseInput(TaskUpdateSchema, input);
  if (!parsed.success) return fail(firstError(parsed), parsed.fields);

  const session = await getAuthedSession();
  if (!session.ok) return fail(session.error);

  const paths = [`/projets/${parsed.data.projectId}`];

  if (session.session.mode === "mock") {
    if (!mockTasksStore.get(parsed.data.id)) return fail("Tâche introuvable");
    mockTasksStore.update(parsed.data.id, {
      assigneeId: parsed.data.assigneeId || undefined,
      title: parsed.data.title,
      description: parsed.data.description || undefined,
      status: parsed.data.status,
      priority: parsed.data.priority,
      category: parsed.data.category || undefined,
      billable: parsed.data.billable,
      estimatedHours: parsed.data.estimatedHours,
      startDate: parsed.data.startDate || undefined,
      dueDate: parsed.data.dueDate || undefined,
    });
    revalidateMany(paths);
    return ok(null);
  }

  const { userId, supabase } = session.session;
  const { error } = await supabase
    .from("tasks")
    .update({
      assignee_id: parsed.data.assigneeId || null,
      title: parsed.data.title,
      description: parsed.data.description || null,
      status: parsed.data.status,
      priority: parsed.data.priority,
      category: parsed.data.category || null,
      billable: parsed.data.billable,
      estimated_hours: parsed.data.estimatedHours ?? null,
      start_date: parsed.data.startDate || null,
      due_date: parsed.data.dueDate || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.id)
    .eq("user_id", userId);
  if (error) return fail(error.message);

  revalidateMany(paths);
  return ok(null);
}

export async function deleteTask(input: { id: string; projectId: string }): Promise<ActionResult> {
  return deleteOwnedRow({ table: "tasks", id: input.id, paths: [`/projets/${input.projectId}`] });
}

/* Lightweight status-change action — mirrors setDealStage. Powers
 * TaskStatusMenu so moving a task across the kanban doesn't require
 * resubmitting the full task form. */
const TaskStatusSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  status: z.enum(TASK_STATUSES),
});

export async function setTaskStatus(
  input: z.input<typeof TaskStatusSchema>,
): Promise<ActionResult> {
  const parsed = parseInput(TaskStatusSchema, input);
  if (!parsed.success) return fail(firstError(parsed), parsed.fields);

  const session = await getAuthedSession();
  if (!session.ok) return fail(session.error);

  const paths = [`/projets/${parsed.data.projectId}`];

  if (session.session.mode === "mock") {
    if (!mockTasksStore.get(parsed.data.id)) return fail("Tâche introuvable");
    mockTasksStore.update(parsed.data.id, { status: parsed.data.status });
    revalidateMany(paths);
    return ok(null);
  }

  const { userId, supabase } = session.session;
  const { error } = await supabase
    .from("tasks")
    .update({ status: parsed.data.status, updated_at: new Date().toISOString() })
    .eq("id", parsed.data.id)
    .eq("user_id", userId);
  if (error) return fail(error.message);

  revalidateMany(paths);
  return ok(null);
}
