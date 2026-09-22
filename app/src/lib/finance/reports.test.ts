import { describe, expect, it } from "vitest";
import type { Client, Expense, Person, Project, Task, TimeEntry } from "@/types/domain";
import {
  billableUtilization,
  estimateVsActualRows,
  hoursByPerson,
  hoursByProject,
  projectMargins,
} from "./reports";

const now = new Date().toISOString();

function client(overrides: Partial<Client> = {}): Client {
  return {
    id: "c",
    userId: "u",
    name: "Client test",
    kind: "company",
    status: "active",
    defaultCurrency: "CHF",
    createdAt: now,
    ...overrides,
  };
}

function project(overrides: Partial<Project> = {}): Project {
  return {
    id: "p",
    userId: "u",
    clientId: "c",
    name: "Projet test",
    status: "active",
    soldBudget: 1_000,
    internalBudget: 200,
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

function expense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: "e",
    userId: "u",
    date: "2026-01-01",
    vendor: "Vendor",
    amount: 0,
    currency: "CHF",
    link: { type: "none" },
    billable: false,
    createdAt: now,
    ...overrides,
  };
}

describe("projectMargins", () => {
  it("keeps hoursLogged/timeCost separate from cost/margin", () => {
    const people = [person({ costRate: 60 })];
    const entries = [timeEntry({ durationMinutes: 120 })]; // 2h @ 60 = 120
    const rows = projectMargins([project()], [client()], [], entries, people);
    expect(rows[0].cost).toBe(200); // unaffected by time cost
    expect(rows[0].margin).toBe(800);
    expect(rows[0].hoursLogged).toBe(2);
    expect(rows[0].timeCost).toBe(120);
  });

  it("still folds in linked expenses as before", () => {
    const rows = projectMargins(
      [project({ soldBudget: 1_000, internalBudget: 200 })],
      [client()],
      [expense({ amount: 100, link: { type: "project", id: "p" } })],
      [],
      [],
    );
    expect(rows[0].cost).toBe(300);
    expect(rows[0].margin).toBe(700);
  });
});

describe("hoursByProject", () => {
  it("splits billable vs non-billable and computes a percentage", () => {
    const entries = [
      timeEntry({ id: "1", durationMinutes: 60, billable: true }),
      timeEntry({ id: "2", durationMinutes: 60, billable: false }),
    ];
    const rows = hoursByProject([project()], [client()], entries);
    expect(rows[0].hours).toBe(2);
    expect(rows[0].billableHours).toBe(1);
    expect(rows[0].nonBillableHours).toBe(1);
    expect(rows[0].billablePercent).toBe(50);
  });

  it("excludes projects with no tracked time", () => {
    const rows = hoursByProject([project(), project({ id: "p2" })], [client()], [
      timeEntry({ projectId: "p" }),
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0].project.id).toBe("p");
  });
});

describe("hoursByPerson", () => {
  it("aggregates per person and sorts by hours descending", () => {
    const people = [person({ id: "a" }), person({ id: "b" })];
    const entries = [
      timeEntry({ id: "1", personId: "a", durationMinutes: 60 }),
      timeEntry({ id: "2", personId: "b", durationMinutes: 180 }),
    ];
    const rows = hoursByPerson(people, entries);
    expect(rows).toHaveLength(2);
    expect(rows[0].person.id).toBe("b");
    expect(rows[0].hours).toBe(3);
  });
});

describe("billableUtilization", () => {
  it("returns 0% for no entries (no divide-by-zero)", () => {
    expect(billableUtilization([])).toEqual({
      billableHours: 0,
      nonBillableHours: 0,
      billablePercent: 0,
    });
  });

  it("computes the billable share across all entries", () => {
    const entries = [
      timeEntry({ id: "1", durationMinutes: 180, billable: true }),
      timeEntry({ id: "2", durationMinutes: 60, billable: false }),
    ];
    const r = billableUtilization(entries);
    expect(r.billableHours).toBe(3);
    expect(r.nonBillableHours).toBe(1);
    expect(r.billablePercent).toBe(75);
  });
});

describe("estimateVsActualRows", () => {
  it("excludes tasks with no estimate", () => {
    const rows = estimateVsActualRows(
      [project()],
      [task({ estimatedHours: undefined })],
      [],
    );
    expect(rows).toHaveLength(0);
  });

  it("computes delta and sorts by biggest absolute overrun first", () => {
    const tasks = [
      task({ id: "t1", estimatedHours: 10 }),
      task({ id: "t2", estimatedHours: 5 }),
    ];
    const entries = [
      timeEntry({ id: "e1", taskId: "t1", durationMinutes: 60 * 11 }), // +1h
      timeEntry({ id: "e2", taskId: "t2", durationMinutes: 60 * 10 }), // +5h
    ];
    const rows = estimateVsActualRows([project()], tasks, entries);
    expect(rows).toHaveLength(2);
    expect(rows[0].task.id).toBe("t2");
    expect(rows[0].deltaHours).toBe(5);
    expect(rows[1].task.id).toBe("t1");
  });
});
