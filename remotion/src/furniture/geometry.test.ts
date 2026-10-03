import { describe, expect, it } from "bun:test";
import { ASSEMBLY_PANELS, panelOrigin } from "./geometry";

describe("cabinet animation construction", () => {
  it("ends with six non-overlapping panels inside 600 × 600 × 300 mm", () => {
    expect(ASSEMBLY_PANELS).toHaveLength(6);
    for (const panel of ASSEMBLY_PANELS) {
      const origin = panelOrigin(panel, 29);
      expect(origin).toEqual(panel.origin);
      origin.forEach((value, axis) => {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value + panel.size[axis]).toBeLessThanOrEqual([600, 600, 300][axis]);
      });
    }
    for (let a = 0; a < 6; a++)
      for (let b = a + 1; b < 6; b++) {
        const first = ASSEMBLY_PANELS[a],
          second = ASSEMBLY_PANELS[b];
        const overlaps = [0, 1, 2].every(
          (axis) =>
            Math.min(
              first.origin[axis] + first.size[axis],
              second.origin[axis] + second.size[axis],
            ) > Math.max(first.origin[axis], second.origin[axis]),
        );
        expect(overlaps).toBe(false);
      }
  });
  it("keeps two equal openings and an overlay back", () => {
    const shelf = ASSEMBLY_PANELS.find((panel) => panel.id === "C1")!;
    expect(shelf.origin[1] - 18).toBe(273);
    expect(582 - shelf.origin[1] - shelf.size[1]).toBe(273);
    expect(ASSEMBLY_PANELS.find((panel) => panel.id === "D1")!.origin[2]).toBe(294);
  });
});
