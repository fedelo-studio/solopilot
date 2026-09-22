import { describe, expect, it } from "vitest";
import { addDays, format, startOfWeek, subDays } from "date-fns";
import type { Person, Project, TimeEntry } from "@/types/domain";
import { computeAlerts } from "./alerts";

const now = new Date().toISOString();

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

function timeEntry(overrides: Partial<TimeEntry> = {}): TimeEntry {
  return {
    id: "te",
    userId: "u",
    projectId: "p",
    personId: "pe",
    date: format(new Date(), "yyyy-MM-dd"),
    durationMinutes: 60,
    billable: true,
    createdAt: now,
    ...overrides,
  };
}

/** Base args for computeAlerts — every test overrides only what it needs. */
function baseArgs(overrides: Partial<Parameters<typeof computeAlerts>[0]> = {}) {
  return {
    invoices: [],
    expenses: [],
    budgets: [],
    deals: [],
    accounts: [],
    projects: [],
    people: [],
    timeEntries: [],
    ...overrides,
  };
}

describe("computeAlerts — project hour budgets", () => {
  it("does nothing when the project has no hour budget", () => {
    const alerts = computeAlerts(baseArgs({ projects: [project({ budgetHours: undefined })] }));
    expect(alerts.filter((a) => a.type.startsWith("project_hours"))).toHaveLength(0);
  });

  it("flags near_limit as warning between 75% and 89%", () => {
    const p = project({ budgetHours: 100 });
    const alerts = computeAlerts(
      baseArgs({ projects: [p], timeEntries: [timeEntry({ durationMinutes: 80 * 60 })] }),
    );
    const a = alerts.find((x) => x.type === "project_hours_near_limit");
    expect(a?.severity).toBe("warning");
  });

  it("flags near_limit as danger between 90% and 99%", () => {
    const p = project({ budgetHours: 100 });
    const alerts = computeAlerts(
      baseArgs({ projects: [p], timeEntries: [timeEntry({ durationMinutes: 95 * 60 })] }),
    );
    const a = alerts.find((x) => x.type === "project_hours_near_limit");
    expect(a?.severity).toBe("danger");
  });

  it("flags exceeded (not near_limit) at 100%+", () => {
    const p = project({ budgetHours: 100 });
    const alerts = computeAlerts(
      baseArgs({ projects: [p], timeEntries: [timeEntry({ durationMinutes: 110 * 60 })] }),
    );
    expect(alerts.find((x) => x.type === "project_hours_exceeded")).toBeTruthy();
    expect(alerts.find((x) => x.type === "project_hours_near_limit")).toBeFalsy();
  });

  it("stays silent below the near-limit threshold", () => {
    const p = project({ budgetHours: 100 });
    const alerts = computeAlerts(
      baseArgs({ projects: [p], timeEntries: [timeEntry({ durationMinutes: 50 * 60 })] }),
    );
    expect(alerts.filter((a) => a.type.startsWith("project_hours"))).toHaveLength(0);
  });
});

describe("computeAlerts — project deadline approaching", () => {
  it("flags a project ending within 7 days as warning", () => {
    const p = project({ endDate: format(addDays(new Date(), 5), "yyyy-MM-dd") });
    const alerts = computeAlerts(baseArgs({ projects: [p] }));
    const a = alerts.find((x) => x.type === "project_deadline_approaching");
    expect(a?.severity).toBe("warning");
  });

  it("flags a project ending within 2 days as danger", () => {
    const p = project({ endDate: format(addDays(new Date(), 1), "yyyy-MM-dd") });
    const alerts = computeAlerts(baseArgs({ projects: [p] }));
    const a = alerts.find((x) => x.type === "project_deadline_approaching");
    expect(a?.severity).toBe("danger");
  });

  it("ignores a deadline more than 7 days away", () => {
    const p = project({ endDate: format(addDays(new Date(), 20), "yyyy-MM-dd") });
    const alerts = computeAlerts(baseArgs({ projects: [p] }));
    expect(alerts.find((x) => x.type === "project_deadline_approaching")).toBeFalsy();
  });

  it("ignores an already-past deadline", () => {
    const p = project({ endDate: format(subDays(new Date(), 1), "yyyy-MM-dd") });
    const alerts = computeAlerts(baseArgs({ projects: [p] }));
    expect(alerts.find((x) => x.type === "project_deadline_approaching")).toBeFalsy();
  });

  it("ignores done/archived projects", () => {
    const p = project({ endDate: format(addDays(new Date(), 1), "yyyy-MM-dd"), status: "done" });
    const alerts = computeAlerts(baseArgs({ projects: [p] }));
    expect(alerts.find((x) => x.type === "project_deadline_approaching")).toBeFalsy();
  });
});

describe("computeAlerts — person capacity exceeded", () => {
  it("flags a person over 100% capacity this week", () => {
    const pe = person({ weeklyCapacityHours: 10 });
    const thisMonday = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
    const alerts = computeAlerts(
      baseArgs({
        people: [pe],
        timeEntries: [timeEntry({ personId: "pe", date: thisMonday, durationMinutes: 11 * 60 })],
      }),
    );
    expect(alerts.find((x) => x.type === "person_capacity_exceeded")).toBeTruthy();
  });

  it("ignores an inactive person even if over capacity", () => {
    const pe = person({ weeklyCapacityHours: 10, isActive: false });
    const alerts = computeAlerts(
      baseArgs({ people: [pe], timeEntries: [timeEntry({ personId: "pe", durationMinutes: 11 * 60 })] }),
    );
    expect(alerts.find((x) => x.type === "person_capacity_exceeded")).toBeFalsy();
  });

  it("stays silent under capacity", () => {
    const pe = person({ weeklyCapacityHours: 40 });
    const alerts = computeAlerts(
      baseArgs({ people: [pe], timeEntries: [timeEntry({ personId: "pe", durationMinutes: 60 })] }),
    );
    expect(alerts.find((x) => x.type === "person_capacity_exceeded")).toBeFalsy();
  });
});

describe("computeAlerts — unbilled time going stale", () => {
  it("flags unbilled billable time older than 14 days on an hourly project", () => {
    const p = project({ billingType: "hourly" });
    const alerts = computeAlerts(
      baseArgs({
        projects: [p],
        timeEntries: [timeEntry({ date: format(subDays(new Date(), 20), "yyyy-MM-dd") })],
      }),
    );
    const a = alerts.find((x) => x.type === "unbilled_time_stale");
    expect(a?.severity).toBe("warning");
  });

  it("escalates to danger after 28 days", () => {
    const p = project({ billingType: "hourly" });
    const alerts = computeAlerts(
      baseArgs({
        projects: [p],
        timeEntries: [timeEntry({ date: format(subDays(new Date(), 30), "yyyy-MM-dd") })],
      }),
    );
    const a = alerts.find((x) => x.type === "unbilled_time_stale");
    expect(a?.severity).toBe("danger");
  });

  it("ignores already-billed entries", () => {
    const p = project({ billingType: "hourly" });
    const alerts = computeAlerts(
      baseArgs({
        projects: [p],
        timeEntries: [
          timeEntry({ date: format(subDays(new Date(), 20), "yyyy-MM-dd"), invoiceId: "i-1" }),
        ],
      }),
    );
    expect(alerts.find((x) => x.type === "unbilled_time_stale")).toBeFalsy();
  });

  it("ignores non-hourly projects", () => {
    const p = project({ billingType: "fixed_price" });
    const alerts = computeAlerts(
      baseArgs({
        projects: [p],
        timeEntries: [timeEntry({ date: format(subDays(new Date(), 20), "yyyy-MM-dd") })],
      }),
    );
    expect(alerts.find((x) => x.type === "unbilled_time_stale")).toBeFalsy();
  });

  it("ignores recent unbilled time (under 14 days)", () => {
    const p = project({ billingType: "hourly" });
    const alerts = computeAlerts(
      baseArgs({
        projects: [p],
        timeEntries: [timeEntry({ date: format(subDays(new Date(), 5), "yyyy-MM-dd") })],
      }),
    );
    expect(alerts.find((x) => x.type === "unbilled_time_stale")).toBeFalsy();
  });
});
