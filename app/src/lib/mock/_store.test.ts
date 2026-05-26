import { describe, expect, it } from "vitest";
import { makeMockStore, registerMockStore, deleteFromMock, mockId } from "./_store";

interface Widget {
  id: string;
  name: string;
  qty: number;
}

describe("makeMockStore", () => {
  it("seeds with the provided fixtures and preserves the array reference", () => {
    const seed: Widget[] = [{ id: "w-1", name: "Alpha", qty: 1 }];
    const store = makeMockStore<Widget>(seed);
    expect(store.items).toEqual(seed);
    // Items is a stable reference — pages read from it across renders.
    const ref = store.items;
    store.add({ id: "w-2", name: "Beta", qty: 2 });
    expect(store.items).toBe(ref);
    expect(store.items).toHaveLength(2);
  });

  it("add() appends without mutating the input fixtures", () => {
    const seed: Widget[] = [{ id: "w-1", name: "Alpha", qty: 1 }];
    const store = makeMockStore<Widget>(seed);
    store.add({ id: "w-2", name: "Beta", qty: 2 });
    expect(seed).toHaveLength(1); // input untouched
    expect(store.items).toHaveLength(2);
  });

  it("update() patches in place and returns the merged item", () => {
    const store = makeMockStore<Widget>([{ id: "w-1", name: "Alpha", qty: 1 }]);
    const result = store.update("w-1", { qty: 99 });
    expect(result).toEqual({ id: "w-1", name: "Alpha", qty: 99 });
    expect(store.get("w-1")?.qty).toBe(99);
  });

  it("update() returns null when the id is unknown", () => {
    const store = makeMockStore<Widget>([]);
    expect(store.update("nope", { qty: 1 })).toBeNull();
  });

  it("remove() drops the item and returns true; returns false for unknown ids", () => {
    const store = makeMockStore<Widget>([{ id: "w-1", name: "Alpha", qty: 1 }]);
    expect(store.remove("w-1")).toBe(true);
    expect(store.get("w-1")).toBeNull();
    expect(store.remove("w-1")).toBe(false);
  });

  it("replaceAll() swaps the contents without changing identity", () => {
    const store = makeMockStore<Widget>([{ id: "w-1", name: "A", qty: 1 }]);
    const ref = store.items;
    store.replaceAll([
      { id: "w-2", name: "B", qty: 2 },
      { id: "w-3", name: "C", qty: 3 },
    ]);
    expect(store.items).toBe(ref);
    expect(store.items.map((w) => w.id)).toEqual(["w-2", "w-3"]);
  });
});

describe("deleteFromMock registry", () => {
  it("routes deletes through the registered store", () => {
    const store = makeMockStore<Widget>([{ id: "w-1", name: "Alpha", qty: 1 }]);
    registerMockStore("widgets-registry-test", store);
    expect(deleteFromMock("widgets-registry-test", "w-1")).toBe(true);
    expect(store.get("w-1")).toBeNull();
  });

  it("returns false when no store is registered for the table", () => {
    expect(deleteFromMock("table-that-does-not-exist", "id")).toBe(false);
  });
});

describe("mockId", () => {
  it("returns prefixed unique ids", () => {
    const a = mockId("x");
    const b = mockId("x");
    expect(a).not.toBe(b);
    expect(a.startsWith("x-")).toBe(true);
  });
});
