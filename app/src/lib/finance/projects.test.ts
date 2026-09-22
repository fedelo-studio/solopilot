import { describe, expect, it } from "vitest";
import type { Person, Project, Task, TimeEntry } from "@/types/domain";
import {
  budgetUtilizationPercent,
  buildTimeEntryInvoiceLines,
  capacityBand,
  capacityUtilizationPercent,
  hoursLogged,
  hoursRemaining,
  projectMargin,
  projectProgressPercent,
  taskEstimateVsActual,
  timeCost,
} from "./projects";

const now = new Date().toISOString();

function project(overrides: Partial<Project> = {}): Project {
  return {
    id: "p",
    userId: "u",
    clientId: "c",
    name: "Projet test",
    status: "active",
    soldBudget: 10_000,
    internalBudget: 4_000,
    currency: "CHF",
    billingType: "hourly",
    createdAt: now,
    ...overrides,
  };
}

function task(overrides: Partial<Task> = {}): Task {
  return {
    id: "t",
    userId: "u",
    projectId: "p",
    title: "Tâche test",
    status: "todo",
    priority: "medium",
    billable: true,
    createdAt: now,
    ...overrides,
  };
}

function timeEntry(overrides: Partial<TimeEntry> = {}): TimeEntry {
  return {
    id: "te",
    userId: "u",
    projectId: "p",
    personId: "pe",
    date: "2026-01-01",
    durationMinutes: 60,
    billable: true,
    createdAt: now,
    ...overrides,
  };
}

function person(overrides: Partial<Person> = {}): Person {
  return {
    id: "pe",
    userId: "u",
    name: "Personne test",
    costRate: 50,
    billableRate: 100,
    weeklyCapacityHours: 40,
    isActive: true,
    createdAt: now,
    ...overrides,
  };
}

describe("hoursLogged", () => {
  it("returns 0 for no entries", () => {
    expect(hoursLogged([])).toBe(0);
  });
  it("sums durationMinutes into decimal hours", () => {
    expect(hoursLogged([timeEntry({ durationMinutes: 90 }), timeEntry({ durationMinutes: 30 })])).toBe(2);
  });
});

describe("hoursRemaining / budgetUtilizationPercent", () => {
  it("returns null when the project has no hour budget", () => {
    expect(hoursRemaining(project(), [])).toBeNull();
    expect(budgetUtilizationPercent(project(), [])).toBeNull();
  });
  it("computes remaining hours and utilization against budgetHours", () => {
    const p = project({ budgetHours: 40 });
    const entries = [timeEntry({ durationMinutes: 60 * 27 })];
    expect(hoursRemaining(p, entries)).toBe(13);
    expect(budgetUtilizationPercent(p, entries)).toBe(68);
  });
  it("treats a zero budgetHours as untracked (no divide-by-zero)", () => {
    expect(budgetUtilizationPercent(project({ budgetHours: 0 }), [])).toBeNull();
  });
});

describe("projectProgressPercent", () => {
  it("returns 0 for zero tasks", () => {
    expect(projectProgressPercent([])).toBe(0);
  });
  it("returns the percentage of done tasks", () => {
    const tasks = [task({ status: "done" }), task({ status: "todo" }), task({ status: "in_progress" }), task({ status: "done" })];
    expect(projectProgressPercent(tasks)).toBe(50);
  });
});

describe("taskEstimateVsActual", () => {
  it("returns nulls for delta when the task has no estimate", () => {
    const t = task({ estimatedHours: undefined });
    const r = taskEstimateVsActual(t, [timeEntry({ taskId: "t", durationMinutes: 120 })]);
    expect(r.estimatedHours).toBeNull();
    expect(r.actualHours).toBe(2);
    expect(r.deltaHours).toBeNull();
    expect(r.deltaPercent).toBeNull();
  });
  it("computes delta hours and percent against the estimate", () => {
    const t = task({ estimatedHours: 10 });
    const r = taskEstimateVsActual(t, [timeEntry({ taskId: "t", durationMinutes: 60 * 12 })]);
    expect(r.actualHours).toBe(12);
    expect(r.deltaHours).toBe(2);
    expect(r.deltaPercent).toBe(20);
  });
  it("only counts entries linked to this task", () => {
    const t = task({ id: "t1", estimatedHours: 5 });
    const r = taskEstimateVsActual(t, [
      timeEntry({ taskId: "t1", durationMinutes: 60 }),
      timeEntry({ taskId: "t2", durationMinutes: 600 }),
    ]);
    expect(r.actualHours).toBe(1);
  });
});

describe("capacityUtilizationPercent / capacityBand", () => {
  it("returns null / no_data when weekly capacity is zero", () => {
    const pe = person({ weeklyCapacityHours: 0 });
    expect(capacityUtilizationPercent(pe, [])).toBeNull();
    expect(capacityBand(pe, [])).toBe("no_data");
  });
  it.each([
    [27, "under"],
    [28, "optimal"],
    [35, "optimal"],
    [36, "near"],
    [40, "near"],
    [41, "over"],
  ] as const)("classifies %i logged hours (of 40) as %s", (hours, band) => {
    const pe = person({ weeklyCapacityHours: 40 });
    const entries = [timeEntry({ durationMinutes: hours * 60 })];
    expect(capacityBand(pe, entries)).toBe(band);
  });
});

describe("timeCost", () => {
  it("sums entries at each person's current cost rate", () => {
    const people = [person({ id: "a", costRate: 50 }), person({ id: "b", costRate: 80 })];
    const entries = [
      timeEntry({ personId: "a", durationMinutes: 60 }),
      timeEntry({ personId: "b", durationMinutes: 30 }),
    ];
    expect(timeCost(entries, people)).toBe(50 + 40);
  });
  it("treats an unknown person as rate 0", () => {
    expect(timeCost([timeEntry({ personId: "ghost", durationMinutes: 60 })], [])).toBe(0);
  });
});

describe("projectMargin", () => {
  it("computes cost, margin and marginPercent", () => {
    const p = project({ soldBudget: 3_000, internalBudget: 1_000 });
    const r = projectMargin(p, 500);
    expect(r.cost).toBe(1_500);
    expect(r.margin).toBe(1_500);
    expect(r.marginPercent).toBe(50);
  });
  it("returns marginPercent 0 when soldBudget is 0 (no divide-by-zero)", () => {
    const r = projectMargin(project({ soldBudget: 0, internalBudget: 0 }), 0);
    expect(r.marginPercent).toBe(0);
  });
});

describe("buildTimeEntryInvoiceLines", () => {
  const people = [person({ id: "a", billableRate: 100 }), person({ id: "b", billableRate: 150 })];
  const tasks = [task({ id: "t1", title: "Design" }), task({ id: "t2", title: "Dev" })];

  it("errors on an empty selection", () => {
    const r = buildTimeEntryInvoiceLines([], { project: project(), people, tasks }, "task", 8.1);
    expect(r.lines).toHaveLength(0);
    expect(r.error).toBeTruthy();
  });

  it("errors when no rate can be resolved for a person", () => {
    const noRate = person({ id: "c", billableRate: 0 });
    const entries = [timeEntry({ personId: "c", durationMinutes: 60 })];
    const r = buildTimeEntryInvoiceLines(
      entries,
      { project: project({ hourlyRate: undefined }), people: [...people, noRate], tasks },
      "task",
      8.1,
    );
    expect(r.lines).toHaveLength(0);
    expect(r.error).toMatch(/tarif/);
  });

  it("prefers project.hourlyRate over each person's billableRate", () => {
    const p = project({ hourlyRate: 200 });
    const entries = [timeEntry({ personId: "a", taskId: "t1", durationMinutes: 60 })];
    const r = buildTimeEntryInvoiceLines(entries, { project: p, people, tasks }, "task", 0);
    expect(r.lines[0].unitPrice).toBe(200);
  });

  it("groups by task and sums hours per group", () => {
    const p = project({ hourlyRate: 100 });
    const entries = [
      timeEntry({ id: "1", taskId: "t1", durationMinutes: 60 }),
      timeEntry({ id: "2", taskId: "t1", durationMinutes: 30 }),
      timeEntry({ id: "3", taskId: "t2", durationMinutes: 120 }),
    ];
    const r = buildTimeEntryInvoiceLines(entries, { project: p, people, tasks }, "task", 0);
    expect(r.lines).toHaveLength(2);
    const design = r.lines.find((l) => l.description === "Design");
    expect(design?.quantity).toBe(1.5);
    expect(design?.unitPrice).toBe(100);
  });

  it("blends unitPrice when a group mixes entries at different resolved rates", () => {
    // No project.hourlyRate override, so each entry resolves to its own
    // person's billableRate (100 for a, 150 for b) — grouped together via
    // single_line, the amount must still equal quantity × blended unitPrice.
    const p = project({ hourlyRate: undefined });
    const entries = [
      timeEntry({ id: "1", personId: "a", durationMinutes: 60 }), // 1h @ 100 = 100
      timeEntry({ id: "2", personId: "b", durationMinutes: 60 }), // 1h @ 150 = 150
    ];
    const r = buildTimeEntryInvoiceLines(entries, { project: p, people, tasks }, "single_line", 0);
    expect(r.lines).toHaveLength(1);
    expect(r.lines[0].quantity).toBe(2);
    expect(r.lines[0].unitPrice).toBe(125); // (100 + 150) / 2
  });
});
