import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { SAMPLE, calculateCabinet } from "../../../src/lib/furniture-pilot/model";
import { ASSEMBLY_PANELS, panelFaces, panelOrigin, project } from "./geometry";
import scripts from "./script.json";

const steps = [
  {
    at: 0,
    title: "من قائمة القطع إلى الوحدة",
    detail: "ستة ألواح • رف واحد • فتحتان متساويتان",
    ids: [],
    formula: "600 × 600 × 300 mm",
  },
  {
    at: 4,
    title: "١ — الجانبان بكامل الارتفاع",
    detail: "سمك كل جانب 18 مم، وعمق الهيكل 294 مم.",
    ids: ["A1", "A2"],
    formula: "A1 + A2 : 600 × 294 × 18 mm",
  },
  {
    at: 8,
    title: "٢ — القاع بين الجانبين",
    detail: "نطرح سمك الجانبين من العرض الخارجي.",
    ids: ["B2"],
    formula: "600 − (2 × 18) = 564 mm",
  },
  {
    at: 12,
    title: "٣ — السقف بين الجانبين",
    detail: "السقف والقاع لهما المقاس نفسه.",
    ids: ["B1"],
    formula: "B1 + B2 : 564 × 294 × 18 mm",
  },
  {
    at: 16,
    title: "٤ — الرف في المنتصف",
    detail: "نقسم الارتفاع الصافي إلى فتحتين متساويتين.",
    ids: ["C1"],
    formula: "(600 − 3 × 18) ÷ 2 = 273 mm",
  },
  {
    at: 20,
    title: "٥ — الظهر يغطي الهيكل من الخارج",
    detail: "العمق النهائي يشمل سمك الظهر، وهو 6 مم.",
    ids: ["D1"],
    formula: "294 + 6 = 300 mm",
  },
  {
    at: 24,
    title: "راجع الرسم وقائمة القطع",
    detail: "الحركة توضح مواضع الألواح. الوصلات والتثبيت والسماحات تحتاج اعتماد الورشة.",
    ids: [],
    formula: "6 panels · 2 openings · 273 mm each",
  },
];

export type AssemblyProps = {
  locale: "ar-EG" | "ar-MSA" | "ar-Gulf" | "en";
  sceneFrames: number[];
  narrated: boolean;
};
export const FurnitureAssembly = ({ locale, sceneFrames, narrated }: AssemblyProps) => {
  const frame = useCurrentFrame();
  let index = 0,
    start = 0;
  while (index < sceneFrames.length - 1 && frame >= start + sceneFrames[index])
    start += sceneFrames[index++];
  const seconds = steps[index].at + ((frame - start) / sceneFrames[index]) * (index === 6 ? 6 : 4);
  const step = { ...steps[index], ...scripts[locale][index] };
  const english = locale === "en";
  const dir = english ? "ltr" : "rtl";
  const faces = ASSEMBLY_PANELS.flatMap((panel) => panelFaces(panel, seconds)).sort(
    (a, b) => a.depth - b.depth,
  );
  const geometry = calculateCabinet(SAMPLE);
  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg,#EAF5FF,#DCEFE3 55%,#F5E7ED)",
        color: "#203F45",
        fontFamily: '"DejaVu Sans", sans-serif',
      }}
    >
      <header
        style={{
          position: "absolute",
          top: 65,
          right: 100,
          left: 100,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Img
          src={staticFile("brand/masaarat-logo-lockup.png")}
          style={{ width: 250, height: 65, objectFit: "contain" }}
        />
        <span dir={dir} style={{ fontSize: 29 }}>
          {english ? "Furniture pilot · assembly diagram" : "تجربة تعليم الأثاث • شرح مكان الألواح"}
        </span>
      </header>
      <svg
        width="1160"
        height="1000"
        style={{ position: "absolute", left: 20, top: 30 }}
        aria-label="Cabinet panel placement animation"
      >
        <ellipse cx="615" cy="855" rx="355" ry="33" fill="#305D68" opacity="0.08" />
        {faces.map((face) => (
          <polygon
            key={face.key}
            points={face.points}
            fill={face.shade}
            stroke={step.ids.includes(face.panel.id) ? "#087F8C" : "#876642"}
            strokeWidth={step.ids.includes(face.panel.id) ? 3 : 1.1}
            strokeLinejoin="round"
          />
        ))}
        {ASSEMBLY_PANELS.map((panel) => {
          const [x, y, z] = panelOrigin(panel, seconds);
          const [px, py] = project([x + panel.size[0] / 2, y + panel.size[1] / 2, z]);
          // Labels stay visible while exploded or while their panel is being discussed.
          if (!(seconds >= 3 && seconds < 4) && !step.ids.includes(panel.id)) return null;
          return (
            <g key={panel.id} transform={`translate(${px},${py})`}>
              <rect x="-32" y="-23" width="64" height="46" rx="12" fill="#203F45" />
              <text
                textAnchor="middle"
                dominantBaseline="middle"
                fill="white"
                fontSize="26"
                fontWeight="700"
              >
                {panel.id}
              </text>
            </g>
          );
        })}
        {seconds >= 24 && (
          <g fill="#305D68" fontSize="27" fontWeight="700">
            <text x="220" y="920">
              600 × 600 × 300 mm
            </text>
            <text x="220" y="965">
              {geometry.clearOpeningHeight} mm + {geometry.clearOpeningHeight} mm
            </text>
          </g>
        )}
      </svg>
      <aside
        dir={dir}
        style={{
          position: "absolute",
          right: 95,
          top: 235,
          width: 660,
          padding: 45,
          boxSizing: "border-box",
          borderRadius: 35,
          background: "rgba(255,255,255,0.85)",
          border: "2px solid #D0E2DE",
        }}
      >
        <div style={{ fontSize: 24, color: "#387B83", marginBottom: 22 }}>
          {english ? "From drawing to cut list" : "من الرسم لقائمة القطع"}
        </div>
        <h1 style={{ fontSize: 43, lineHeight: 1.5, margin: "0 0 30px" }}>{step.title}</h1>
        <p style={{ fontSize: 30, lineHeight: 1.9, margin: "0 0 35px" }}>{step.detail}</p>
        <div
          dir="ltr"
          style={{
            fontSize: 27,
            lineHeight: 1.7,
            textAlign: "center",
            background: "#EDF5F3",
            borderRadius: 18,
            padding: "22px 12px",
          }}
        >
          {step.formula}
        </div>
        <p style={{ fontSize: 23, lineHeight: 1.8, margin: "35px 0 0", color: "#5B7175" }}>
          {english
            ? "A simplified panel diagram; joints and machine operation are outside this demonstration."
            : locale === "ar-MSA"
              ? "توضح الحركة مواضع الألواح؛ تتطلب الوصلات وتشغيل الماكينات مراجعة وتدريبًا منفصلين."
              : locale === "ar-Gulf"
                ? "الحركة توضّح مكان الألواح؛ الوصلات وتشغيل الماكينات تحتاج مراجعة وتدريب منفصل."
                : "شرح مبسط لمكان الألواح؛ نوع الوصلات وتشغيل الماكينات محتاجين تدريب منفصل."}
        </p>
      </aside>
      <footer dir={dir} style={{ position: "absolute", bottom: 57, right: 100, fontSize: 24 }}>
        {narrated
          ? english
            ? "Furniture teaching pilot"
            : "تجربة تعليم الأثاث"
          : english
            ? "Silent animation preview"
            : "معاينة للحركة بدون صوت"}
      </footer>
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          height: 9,
          width: `${Math.min(frame / sceneFrames.reduce((a, b) => a + b, 0), 1) * 100}%`,
          background: "#387B83",
        }}
      />
    </AbsoluteFill>
  );
};
