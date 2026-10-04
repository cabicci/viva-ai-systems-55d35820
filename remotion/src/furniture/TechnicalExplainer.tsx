import { AbsoluteFill, Img, staticFile, useCurrentFrame, interpolate } from "remotion";
import { TechnicalDiagram } from "../../../src/components/technical-education/TechnicalDiagram";
import type { SupportedLocale } from "../../../src/lib/locale/types";

export type TechnicalScene = {
  title: string;
  detail: string;
  spoken: string;
  diagram: "brief" | "survey" | "scope" | "workflow";
};
export type TechnicalExplainerProps = {
  locale: SupportedLocale;
  title: string;
  scenes: TechnicalScene[];
  sceneFrames: number[];
};
export function TechnicalExplainer({
  locale,
  title,
  scenes,
  sceneFrames,
}: TechnicalExplainerProps) {
  const frame = useCurrentFrame();
  let index = 0,
    start = 0;
  while (index < sceneFrames.length - 1 && frame >= start + sceneFrames[index])
    start += sceneFrames[index++];
  const scene = scenes[index];
  const localFrame = frame - start;
  const opacity = interpolate(localFrame, [0, 12], [0, 1], { extrapolateRight: "clamp" });
  const y = interpolate(localFrame, [0, 18], [24, 0], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill
      dir={locale === "en" ? "ltr" : "rtl"}
      style={{
        background: "linear-gradient(135deg,#EAF5FF,#DCEFE3 55%,#F5E7ED)",
        color: "#203f45",
        fontFamily: '"DejaVu Sans",sans-serif',
      }}
    >
      <header
        style={{
          position: "absolute",
          insetInline: 100,
          top: 65,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 80,
        }}
      >
        <Img
          src={staticFile("brand/masaarat-logo-lockup.png")}
          style={{ width: 250, height: 65, objectFit: "contain" }}
        />
        <span style={{ fontSize: 28, maxWidth: 1250 }}>{title}</span>
      </header>
      <div
        style={{
          position: "absolute",
          left: 75,
          top: 230,
          width: 880,
          opacity,
          transform: `translateY(${y}px)`,
        }}
      >
        <TechnicalDiagram kind={scene.diagram} locale={locale} title={scene.title} />
      </div>
      <aside
        style={{
          position: "absolute",
          right: 95,
          top: 235,
          width: 780,
          minHeight: 510,
          padding: 50,
          borderRadius: 35,
          background: "rgba(255,255,255,0.88)",
          opacity,
          transform: `translateY(${y}px)`,
        }}
      >
        <p style={{ fontSize: 25, color: "#387b83", margin: "0 0 20px" }}>
          TECH · {index + 1} / {scenes.length}
        </p>
        <h1 style={{ fontSize: 44, lineHeight: 1.5, margin: "0 0 28px" }}>{scene.title}</h1>
        <p style={{ fontSize: 32, lineHeight: 1.85, margin: 0 }}>{scene.detail}</p>
      </aside>
      <footer style={{ position: "absolute", bottom: 50, insetInline: 100, fontSize: 24 }}>
        {locale === "en"
          ? "Design and fabrication planning · Masaarat"
          : "تصميم الأثاث والتخطيط للتصنيع · مسارات"}
      </footer>
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          height: 9,
          width: `${(frame / sceneFrames.reduce((a, b) => a + b, 0)) * 100}%`,
          background: "#387b83",
        }}
      />
    </AbsoluteFill>
  );
}
