/* ---------------------------------------------------------------------------
 * Mock store — gives mock-mode fixtures real CRUD semantics.
 *
 * Why this exists
 * ---------------
 * Before this module, every `lib/mock/*.ts` file exported a `const` array of
 * seed data, and every server action's "mock branch" was a no-op that just
 * called `revalidatePath`. Submitting a form looked successful but never
 * mutated state — the page rendered the same fixture again, so the user saw
 * "nothing works".
 *
 * Now: each mock file builds its store via `makeMockStore`. Server actions
 * call `.add / .update / .remove` on that store in mock mode, and the next
 * render reads the mutated array. The store is in-memory per Node process,
 * which is exactly what mock/demo mode needs.
 *
 * Module state survives across requests within a single Node process (Next
 * dev, `next start`, single-instance preview). Restarting the server resets
 * to fixtures — that's intentional for a demo dataset.
 * ------------------------------------------------------------------------- */

export interface MockEntity {
  id: string;
}

export interface MockStore<T extends MockEntity> {
  /** Direct array reference — pages read from this. Always the same identity. */
  readonly items: T[];
  /** Append a new item. Returns the same item for convenience. */
  add(item: T): T;
  /** Patch an existing item by id. Returns the merged result, or null if absent. */
  update(id: string, patch: Partial<Omit<T, "id">>): T | null;
  /** Remove an item by id. Returns true on success. */
  remove(id: string): boolean;
  /** Find by id. Returns null when absent. */
  get(id: string): T | null;
  /** Replace the whole collection — used by company settings (single row). */
  replaceAll(next: T[]): void;
}

export function makeMockStore<T extends MockEntity>(seed: T[]): MockStore<T> {
  const items: T[] = [...seed];

  return {
    items,
    add(item) {
      items.push(item);
      return item;
    },
    update(id, patch) {
      const i = items.findIndex((x) => x.id === id);
      if (i < 0) return null;
      const next = { ...items[i], ...(patch as object) } as T;
      items[i] = next;
      return next;
    },
    remove(id) {
      const i = items.findIndex((x) => x.id === id);
      if (i < 0) return false;
      items.splice(i, 1);
      return true;
    },
    get(id) {
      return items.find((x) => x.id === id) ?? null;
    },
    replaceAll(next) {
      items.splice(0, items.length, ...next);
    },
  };
}

/* ---------------------------------------------------------------------------
 * Generic delete registry — so `deleteOwnedRow` (which only knows the
 * Supabase table name) can dispatch to the right mock store in mock mode.
 * Each mock file registers itself with its Supabase table name.
 * ------------------------------------------------------------------------- */

interface RemovableStore {
  remove(id: string): boolean;
}

const registry = new Map<string, RemovableStore>();

export function registerMockStore(table: string, store: RemovableStore): void {
  registry.set(table, store);
}

export function deleteFromMock(table: string, id: string): boolean {
  return registry.get(table)?.remove(id) ?? false;
}

/* Stable id generator for mock-created entities. Uses a counter + timestamp
 * so ids stay sortable and unique within a session. */
let _idCounter = 0;
export function mockId(prefix: string): string {
  _idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${_idCounter}`;
}

/** ISO timestamp helper for createdAt / updatedAt. */
export function nowIso(): string {
  return new Date().toISOString();
}
