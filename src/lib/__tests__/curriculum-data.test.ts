import { describe, it, expect } from "vitest";
import {
  PATHS,
  getPath,
  pathLessonIds,
  findLessonRoute,
  totalAvailableLessons,
  totalLessons,
} from "@/lib/curriculum-data";

describe("curriculum-data: structure", () => {
  it("includes the 5 real paths plus intro (no 'coming soon' labels)", () => {
    const ids = PATHS.map((p) => p.id).sort();
    expect(ids).toEqual(
      ["analyst", "automator", "builder", "business", "creator", "intro"].sort(),
    );
    // None of the 5 real paths should be marked 'soon'
    for (const p of PATHS) {
      if (p.id === "intro") continue;
      expect(p.status, `${p.id} must be open`).toBe("open");
    }
  });

  it("every lesson has a non-empty id and title", () => {
    for (const p of PATHS) {
      for (const m of p.modules) {
        for (const l of m.lessons) {
          expect(l.id, `lesson in ${p.id}/${m.id}`).toBeTruthy();
          expect(typeof l.id).toBe("string");
          expect(l.title.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("all lesson ids are globally unique", () => {
    const seen = new Map<string, string>();
    for (const p of PATHS) {
      for (const m of p.modules) {
        for (const l of m.lessons) {
          const where = `${p.id}/${m.id}`;
          expect(
            seen.has(l.id),
            `duplicate lesson id "${l.id}" in ${where} (also in ${seen.get(l.id)})`,
          ).toBe(false);
          seen.set(l.id, where);
        }
      }
    }
  });

  it("available lessons in non-intro paths carry a route and follow {pathId}-{...} convention", () => {
    for (const p of PATHS) {
      if (p.id === "intro") continue;
      for (const m of p.modules) {
        for (const l of m.lessons) {
          if (l.state !== "available") continue;
          expect(l.route, `${l.id} must have a route`).toBeTruthy();
          expect(l.route!.startsWith(`/learn/${p.id}/`)).toBe(true);
          // Convention: lesson id starts with its path id
          expect(
            l.id.startsWith(`${p.id}-`),
            `lesson id "${l.id}" should start with "${p.id}-"`,
          ).toBe(true);
        }
      }
    }
  });

  it("module orders are strictly increasing & unique within each path", () => {
    for (const p of PATHS) {
      const orders = p.modules.map((m) => m.order);
      // strictly increasing
      for (let i = 1; i < orders.length; i++) {
        expect(
          orders[i] > orders[i - 1],
          `module orders in ${p.id} must be strictly increasing, got ${orders.join(", ")}`,
        ).toBe(true);
      }
      // unique
      expect(new Set(orders).size, `unique module orders in ${p.id}`).toBe(orders.length);
    }
  });

  it("lesson orders are sequential within each module", () => {
    for (const p of PATHS) {
      for (const m of p.modules) {
        const orders = m.lessons.map((l) => l.order);
        const expected = orders.map((_, i) => i + 1);
        expect(orders, `lesson orders in ${p.id}/${m.id}`).toEqual(expected);
      }
    }
  });
});

describe("curriculum-data: helpers", () => {
  it("getPath returns the matching path", () => {
    for (const id of ["intro", "business", "creator", "analyst", "automator", "builder"] as const) {
      expect(getPath(id)?.id).toBe(id);
    }
  });

  it("pathLessonIds returns all lessons (including coming-soon) in module order", () => {
    const builder = getPath("builder")!;
    const ids = pathLessonIds(builder);
    const flat = builder.modules.flatMap((m) => m.lessons.map((l) => l.id));
    expect(ids).toEqual(flat);
  });

  it("findLessonRoute resolves available lessons to {pathId, slug}", () => {
    let checked = 0;
    for (const p of PATHS) {
      for (const m of p.modules) {
        for (const l of m.lessons) {
          if (l.state !== "available" || !l.route) continue;
          const r = findLessonRoute(l.id);
          expect(r, `findLessonRoute("${l.id}")`).not.toBeNull();
          expect(r!.pathId).toBe(p.id);
          expect(`/learn/${r!.pathId}/${r!.slug}`).toBe(l.route);
          checked++;
        }
      }
    }
    expect(checked).toBeGreaterThan(0);
  });

  it("findLessonRoute returns null for unknown id", () => {
    expect(findLessonRoute("nope-does-not-exist")).toBeNull();
  });

  it("totalAvailableLessons <= totalLessons and both > 0", () => {
    const avail = totalAvailableLessons();
    const all = totalLessons();
    expect(all).toBeGreaterThan(0);
    expect(avail).toBeGreaterThan(0);
    expect(avail).toBeLessThanOrEqual(all);
  });
});