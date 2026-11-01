import { describe, expect, it } from "vitest";
import { blockBrowserIO } from "@/test/blocked-browser-io";

describe("isolated hook I/O blocker proof", () => {
  it("rejects and counts an actual fetch attempt, then restores its exact descriptor", () => {
    const before = Object.getOwnPropertyDescriptor(globalThis, "fetch");
    const guard = blockBrowserIO();
    try {
      expect(() => fetch("https://fixture.invalid/")).toThrow("forbids network I/O");
      expect(guard.counts).toEqual({ network: 1, storage: 0 });
      expect(guard.installed).toContain("network:fetch");
    } finally {
      guard.restore();
    }
    expect(Object.getOwnPropertyDescriptor(globalThis, "fetch")).toEqual(before);
  });
  it("rejects and counts an actual storage write and restores the untouched storage", () => {
    localStorage.removeItem("isolated-io-proof");
    const before = Object.getOwnPropertyDescriptor(Storage.prototype, "setItem");
    const guard = blockBrowserIO();
    try {
      expect(() => localStorage.setItem("isolated-io-proof", "never stored")).toThrow(
        "forbids storage I/O",
      );
      expect(guard.counts).toEqual({ network: 0, storage: 1 });
      expect(guard.installed).toContain("storage:setItem");
    } finally {
      guard.restore();
    }
    expect(Object.getOwnPropertyDescriptor(Storage.prototype, "setItem")).toEqual(before);
    expect(localStorage.getItem("isolated-io-proof")).toBeNull();
  });
  it("fails explicitly for an existing nonconfigurable API", () => {
    const globalObject = Object.defineProperty({}, "fetch", {
      value: () => {},
      configurable: false,
    });
    expect(() => blockBrowserIO({ globalObject, storagePrototype: {} })).toThrow(
      "Cannot block existing network:fetch",
    );
  });
  it("restores earlier overrides when a later existing API cannot be blocked", () => {
    const original = () => {};
    const globalObject = { fetch: original };
    const before = Object.getOwnPropertyDescriptor(globalObject, "fetch");
    const storagePrototype = Object.defineProperty({}, "setItem", {
      value: () => {},
      configurable: false,
    });
    expect(() => blockBrowserIO({ globalObject, storagePrototype })).toThrow(
      "Cannot block existing storage:setItem",
    );
    expect(globalObject.fetch).toBe(original);
    expect(Object.getOwnPropertyDescriptor(globalObject, "fetch")).toEqual(before);
  });
  it("reports genuinely absent APIs separately from installed blockers", () => {
    const guard = blockBrowserIO({ globalObject: {}, storagePrototype: {} });
    try {
      expect(guard.installed).toEqual([]);
      expect(guard.absent).toContain("network:fetch");
      expect(guard.absent).toContain("storage:setItem");
      expect(guard.absent).toHaveLength(9);
    } finally {
      guard.restore();
    }
  });
});
