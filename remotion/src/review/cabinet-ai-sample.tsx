import React from "react";
import { AbsoluteFill, Composition, Img, interpolate, registerRoot, staticFile, useCurrentFrame } from "remotion";
import { bgGradient, cairo, palette, type } from "../theme";
import { ASSEMBLY_PANELS, panelFaces, panelOrigin, project } from "./cabinet-geometry";
import scenes from "./cabinet-scenes.json";

// Review-only entry point. Existing lesson compositions and mappings are untouched.
const sceneFrames = [234, 252, 258, 294, 316, 247, 301];
const starts = [0, 4, 8, 12, 16, 20, 24];
const ids = [[], ["A1", "A2"], ["B2"], ["B1"], ["C1"], ["D1"], []];
const accents = [palette.lavender, palette.mint, palette.peach, palette.pink, palette.yellow, palette.lavender, palette.mint];
const formulas = ["600 × 600 × 300 mm", "600 × 294 × 18 mm", "600 − (2 × 18) = 564 mm", "564 × 294 × 18 mm", "(600 − 3 × 18) ÷ 2 = 273 mm", "294 + 6 = 300 mm", "6 panels · 2 openings · 273 mm"];
const names = ["الجانبان", "القاع", "السقف", "الرف", "الظهر"];
const panelColors: Record<string, string[]> = {
  A1: [palette.mint, palette.mintDeep, "#b9dfca"], A2: [palette.mint, palette.mintDeep, "#b9dfca"],
  B2: [palette.peach, "#d48c6d", "#f7c5af"], B1: [palette.pink, "#bc6c83", "#efb4c4"],
  C1: [palette.yellow, "#c8aa56", "#f8e4a9"], D1: [palette.lavender, "#8371aa", "#c5badc"],
};

const CabinetSample = () => {
  const frame = useCurrentFrame();
  let index = 0, start = 0;
  while (index < sceneFrames.length - 1 && frame >= start + sceneFrames[index]) start += sceneFrames[index++];
  const local = frame - start, progress = local / sceneFrames[index];
  const seconds = starts[index] + progress * (index === 6 ? 6 : 4);
  const enter = interpolate(local, [0, 18], [0, 1], { extrapolateRight: "clamp" });
  const scene = scenes[index], accent = accents[index];
  const faces = ASSEMBLY_PANELS.flatMap(panel => panelFaces(panel, seconds)).sort((a, b) => a.depth - b.depth);
  const total = sceneFrames.reduce((a, b) => a + b, 0);
  const formulaParts = formulas[index].split(" = ");
  const resultVisible = formulaParts.length === 1 || progress > 0.42;
  return <AbsoluteFill style={{ background: bgGradient, color: palette.ink, fontFamily: cairo, letterSpacing: 0 }}>
    <header style={{ position: "absolute", left: 120, right: 120, top: 62, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <Img src={staticFile("brand/masaarat-logo-lockup.png")} style={{ width: 250, height: 70, objectFit: "contain" }}/>
      <div dir="rtl" style={{ textAlign: "right" }}>
        <div style={{ fontSize: type.caption, color: palette.inkSoft, fontWeight: 600 }}>مسارات الفني · من الرسم إلى قائمة القطع</div>
        <div style={{ fontSize: 44, lineHeight: 1.5, fontWeight: 900 }}>شاهد كيف تتكوّن الوحدة</div>
      </div>
    </header>
    <svg viewBox="0 0 1160 1000" width="970" height="785" style={{ position: "absolute", left: 70, top: 140 }}>
      <ellipse cx="615" cy="855" rx="355" ry="33" fill={palette.ink} opacity="0.07"/>
      {faces.map(face => <polygon key={face.key} points={face.points}
        fill={panelColors[face.panel.id][Number(face.key.slice(-1))]}
        stroke={ids[index].includes(face.panel.id) ? palette.ink : palette.inkSoft}
        strokeWidth={ids[index].includes(face.panel.id) ? 4 : 1.5} strokeLinejoin="round"
        opacity={ids[index].length && !ids[index].includes(face.panel.id) ? 0.62 : 1}/>) }
      {ASSEMBLY_PANELS.map(panel => {
        if (!(seconds >= 3 && seconds < 4) && !ids[index].includes(panel.id)) return null;
        const [x, y, z] = panelOrigin(panel, seconds);
        const [px, py] = project([x + panel.size[0] / 2, y + panel.size[1] / 2, z]);
        return <g key={panel.id} transform={`translate(${px},${py})`}>
          <rect x="-36" y="-26" width="72" height="52" rx="14" fill={palette.ink}/>
          <text textAnchor="middle" dominantBaseline="middle" fill={palette.white} fontSize="32" fontWeight="900">{panel.id}</text>
        </g>;
      })}
      {index === 4 && progress > .55 && [0, 1].map(i => <g key={i} opacity={Math.min(1, (progress - .55) * 6)}>
        <rect x="690" y={440 + i * 240} width="190" height="66" rx="18" fill={palette.white} stroke={palette.yellow} strokeWidth="3"/>
        <text x="785" y={482 + i * 240} textAnchor="middle" fontSize="35" fontWeight="900" fill={palette.ink}>273 mm</text>
      </g>)}
      {index === 6 && <text x="610" y="948" textAnchor="middle" fontSize="38" fontWeight="700" fill={palette.ink}>600 × 600 × 300 mm</text>}
    </svg>
    <aside dir="rtl" style={{ position: "absolute", right: 120, top: 235, width: 745, minHeight: 650, boxSizing: "border-box", padding: "42px 44px", borderRadius: 32, background: palette.white, border: `2px solid ${accent}80`, boxShadow: `0 30px 60px -20px ${palette.ink}22`, opacity: enter, transform: `translateY(${(1 - enter) * 20}px)` }}>
      <span style={{ display: "inline-block", background: accent, borderRadius: 12, padding: "8px 22px", fontSize: type.captionSm, fontWeight: 900 }}>{index === 0 ? "الفكرة" : index === 6 ? "المراجعة" : `خطوة ${index} من ٥`}</span>
      <h1 style={{ fontSize: type.h1Small * .72, fontWeight: 900, lineHeight: type.lhHeading, margin: "24px 0 26px" }}>{scene.title}</h1>
      <p style={{ fontSize: type.bodyLg, fontWeight: 600, lineHeight: type.lhBodyRelaxed, margin: "0 0 28px" }}>{scene.detail}</p>
      <div dir="ltr" style={{ fontSize: 36, fontWeight: 700, textAlign: "center", lineHeight: 1.55, background: `${accent}40`, padding: "24px 12px", borderRadius: 20 }}>
        <span>{formulaParts[0]}</span>
        {formulaParts.length > 1 && <span style={{ opacity: resultVisible ? 1 : 0 }}> = <strong style={{ fontWeight: 900 }}>{formulaParts[1]}</strong></span>}
      </div>
      {index === 6 && <p style={{ fontSize: type.caption, color: palette.inkSoft, lineHeight: 1.5, marginTop: 24 }}>الوصلات والتثبيت وسماحات التشغيل تُعتمد قبل التصنيع.</p>}
    </aside>
    <div dir="rtl" style={{ position: "absolute", bottom: 71, left: 120, right: 120, display: "flex", gap: 16 }}>
      {names.map((name, i) => <div key={name} style={{ flex: 1, textAlign: "center", borderRadius: 18, padding: "13px 12px", fontSize: type.caption, fontWeight: index === i + 1 ? 900 : 600, color: index === i + 1 ? palette.ink : palette.inkSoft, background: index === i + 1 ? accents[i + 1] : `${palette.white}cc`, border: `2px solid ${index > i + 1 ? palette.mint : "transparent"}` }}>{name}</div>)}
    </div>
    <div style={{ position: "absolute", bottom: 0, left: 0, width: `${100 * frame / total}%`, height: 9, background: accent }}/>
  </AbsoluteFill>;
};

registerRoot(() => <Composition id="cabinet-ai-review" component={CabinetSample} fps={30} width={1920} height={1080} durationInFrames={sceneFrames.reduce((a, b) => a + b, 0)}/>);
