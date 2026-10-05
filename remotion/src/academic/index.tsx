import React from "react";
import {
  AbsoluteFill,
  Composition,
  Img,
  registerRoot,
  staticFile,
  useCurrentFrame,
  interpolate,
} from "remotion";
import { AcademicDiagram } from "../../../experiments/academic/Diagram";
type Props = {
  locale: string;
  title: string;
  scenes: { id: string; title: string; detail: string; diagram: string; spoken: string }[];
  sceneFrames: number[];
};
function Explainer({ locale, title, scenes, sceneFrames }: Props) {
  const frame = useCurrentFrame();
  let index = 0,
    start = 0;
  while (index < sceneFrames.length - 1 && frame >= start + sceneFrames[index])
    start += sceneFrames[index++];
  const s = scenes[index];
  const english = locale === "en";
  return (
    <AbsoluteFill
      dir={english ? "ltr" : "rtl"}
      style={{
        background: "linear-gradient(135deg,#EAF5FF,#DCEFE3 55%,#F5E7ED)",
        color: "#203f45",
        fontFamily: "Tajawal,Arial,sans-serif",
      }}
    >
      <style>{`@font-face{font-family:Tajawal;src:url(${staticFile("academic-fonts/Tajawal-Regular.woff2")});font-weight:400}@font-face{font-family:Tajawal;src:url(${staticFile("academic-fonts/Tajawal-Bold.woff2")});font-weight:700}`}</style>
      <header
        style={{
          position: "absolute",
          insetInline: 90,
          top: 55,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 50,
        }}
      >
        <Img
          src={staticFile("brand/masaarat-logo-lockup.png")}
          style={{ width: 230, height: 65, objectFit: "contain" }}
        />
        <span style={{ fontSize: 28, maxWidth: 1200 }}>{title}</span>
      </header>
      <div
        style={{
          position: "absolute",
          left: 80,
          top: 245,
          width: 820,
          opacity: interpolate(frame - start, [0, 12], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        <AcademicDiagram kind={s.diagram} english={english} />
      </div>
      <aside
        style={{
          position: "absolute",
          right: 95,
          top: 240,
          width: 780,
          padding: 45,
          borderRadius: 35,
          background: "rgba(255,255,255,.9)",
        }}
      >
        <p style={{ fontSize: 26, color: "#387b83" }}>
          {english ? "Masaarat Academic" : "مسارات أكاديمي"} · {index + 1}/{scenes.length}
        </p>
        <h1 style={{ fontSize: 44, lineHeight: 1.5, margin: "20px 0" }}>{s.title}</h1>
        <p style={{ fontSize: 32, lineHeight: 1.9 }}>{s.detail}</p>
      </aside>
      <footer style={{ position: "absolute", bottom: 55, insetInline: 100, fontSize: 25 }}>
        {english ? "Produced by Masaarat" : "إنتاج مسارات"}
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
const defaults: Props = {
  locale: "ar-EG",
  title: "مسارات أكاديمي",
  scenes: [
    {
      id: "intro",
      title: "القيمة للعميل",
      detail: "من الاحتياج إلى نتيجة قابلة للتحقق",
      diagram: "value",
      spoken: "",
    },
  ],
  sceneFrames: [150],
};
function Root() {
  return (
    <Composition
      id="academic-pilot"
      component={Explainer}
      defaultProps={defaults}
      durationInFrames={150}
      fps={30}
      width={1920}
      height={1080}
      calculateMetadata={({ props }) => ({
        durationInFrames: props.sceneFrames.reduce((a, b) => a + b, 0),
      })}
    />
  );
}
registerRoot(Root);
