/** Original teaching geometry. Nominal sizes; no approved machining or load specification. */
export type CabinetInput = {
  width: number;
  height: number;
  depth: number;
  thickness: number;
  backThickness: number;
};

export const PILOT_ID = "furniture-m1-cut-list";
export const SAMPLE: CabinetInput = {
  width: 600,
  height: 600,
  depth: 300,
  thickness: 18,
  backThickness: 6,
};

export type PanelKey = "sides" | "horizontal" | "shelf" | "back";
export type Panel = {
  key: PanelKey;
  ids: string[];
  quantity: number;
  length: number;
  width: number;
  thickness: number;
};

export function calculateCabinet(input: CabinetInput) {
  const { width: w, height: h, depth: d, thickness: t, backThickness: b } = input;
  if (
    Object.values(input).some((value) => !Number.isFinite(value) || value <= 0) ||
    w <= 2 * t ||
    h <= 3 * t ||
    d <= b
  ) {
    throw new Error("INVALID_GEOMETRY");
  }
  const innerWidth = w - 2 * t;
  const bodyDepth = d - b;
  const clearOpeningHeight = (h - 3 * t) / 2;
  const panels: Panel[] = [
    { key: "sides", ids: ["A1", "A2"], quantity: 2, length: h, width: bodyDepth, thickness: t },
    {
      key: "horizontal",
      ids: ["B1", "B2"],
      quantity: 2,
      length: innerWidth,
      width: bodyDepth,
      thickness: t,
    },
    { key: "shelf", ids: ["C1"], quantity: 1, length: innerWidth, width: bodyDepth, thickness: t },
    { key: "back", ids: ["D1"], quantity: 1, length: w, width: h, thickness: b },
  ];
  const areaByThickness = panels.reduce<Record<number, number>>((areas, panel) => {
    areas[panel.thickness] =
      (areas[panel.thickness] ?? 0) + (panel.length * panel.width * panel.quantity) / 1_000_000;
    return areas;
  }, {});
  return { panels, innerWidth, bodyDepth, clearOpeningHeight, areaByThickness };
}

export type QuizAnswer = Record<string, number>;
export function checkAssignment(values: {
  innerWidth: string;
  bodyDepth: string;
  opening: string;
}) {
  const expected = calculateCabinet({
    width: 800,
    height: 700,
    depth: 350,
    thickness: 18,
    backThickness: 6,
  });
  return [
    {
      id: "innerWidth",
      correct:
        values.innerWidth.trim() !== "" &&
        Math.abs(Number(values.innerWidth) - expected.innerWidth) <= 0.01,
    },
    {
      id: "bodyDepth",
      correct:
        values.bodyDepth.trim() !== "" &&
        Math.abs(Number(values.bodyDepth) - expected.bodyDepth) <= 0.01,
    },
    {
      id: "opening",
      correct:
        values.opening.trim() !== "" &&
        Math.abs(Number(values.opening) - expected.clearOpeningHeight) <= 0.01,
    },
  ];
}
