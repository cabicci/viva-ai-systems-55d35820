const SAMPLE = { width: 600, height: 600, thickness: 18, backThickness: 6 };
const calculateCabinet = (_sample: typeof SAMPLE) => ({ innerWidth: 564, bodyDepth: 294, clearOpeningHeight: 273 });

export type Vec3 = [number, number, number];
export type AssemblyPanel = {
  id: string;
  name: string;
  origin: Vec3;
  size: Vec3;
  offset: Vec3;
  start: number;
};
const { width: w, height: h, thickness: t, backThickness: b } = SAMPLE;
const { innerWidth: inner, bodyDepth: d, clearOpeningHeight: opening } = calculateCabinet(SAMPLE);

// Millimetres. x=left→right, y=bottom→top, z=front→rear.
export const ASSEMBLY_PANELS: AssemblyPanel[] = [
  {
    id: "A1",
    name: "الجانب الأيسر",
    origin: [0, 0, 0],
    size: [t, h, d],
    offset: [-180, 0, 0],
    start: 4,
  },
  {
    id: "A2",
    name: "الجانب الأيمن",
    origin: [w - t, 0, 0],
    size: [t, h, d],
    offset: [180, 0, 0],
    start: 4,
  },
  {
    id: "B2",
    name: "القاع",
    origin: [t, 0, 0],
    size: [inner, t, d],
    offset: [0, -130, 0],
    start: 8,
  },
  {
    id: "B1",
    name: "السقف",
    origin: [t, h - t, 0],
    size: [inner, t, d],
    offset: [0, 130, 0],
    start: 12,
  },
  {
    id: "C1",
    name: "الرف الأوسط",
    origin: [t, t + opening, 0],
    size: [inner, t, d],
    offset: [0, 0, -260],
    start: 16,
  },
  {
    id: "D1",
    name: "الظهر الخارجي",
    origin: [0, 0, d],
    size: [w, h, b],
    offset: [0, 0, 200],
    start: 20,
  },
];

const smooth = (value: number) => {
  const n = Math.min(1, Math.max(0, value));
  return n * n * (3 - 2 * n);
};

export function panelOrigin(panel: AssemblyPanel, seconds: number): Vec3 {
  const explode = smooth((seconds - 2.5) / 1);
  const assembled = smooth((seconds - panel.start) / 2.5);
  return panel.origin.map(
    (value, axis) => value + panel.offset[axis] * explode * (1 - assembled),
  ) as Vec3;
}

export function project([x, y, z]: Vec3): [number, number] {
  return [270 + 0.86 * x + 0.5 * z, 810 - 0.86 * y - 0.28 * z];
}

export function panelFaces(panel: AssemblyPanel, seconds: number) {
  const [x, y, z] = panelOrigin(panel, seconds);
  const [w, h, d] = panel.size;
  const corners: Vec3[] = [
    [x, y, z],
    [x + w, y, z],
    [x + w, y + h, z],
    [x, y + h, z],
    [x, y, z + d],
    [x + w, y, z + d],
    [x + w, y + h, z + d],
    [x, y + h, z + d],
  ];
  return [
    { indices: [0, 1, 2, 3], shade: "#E5C9A1" },
    { indices: [1, 5, 6, 2], shade: "#B78D62" },
    { indices: [3, 2, 6, 7], shade: "#F3DEC0" },
  ].map(({ indices, shade }, index) => {
    const points = indices.map((i) => corners[i]);
    return {
      key: `${panel.id}-${index}`,
      panel,
      shade,
      points: points.map((p) => project(p).join(",")).join(" "),
      // Camera sees +x, +y, -z. Paint distant faces first.
      depth: points.reduce((sum, [a, b, c]) => sum + a + b - c, 0) / 4,
    };
  });
}
