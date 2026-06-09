import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { palette, safeFrame, type } from "../theme";
import type { SceneAccent } from "./types";

type Props = { title: string; bullets: string[]; accent: SceneAccent };

export const BulletsCard: React.FC<Props> = ({ title, bullets, accent }) => {
  const f = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const out = interpolate(f, [durationInFrames - 14, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const sTitle = spring({ frame: f - 2, fps, config: { damping: 16 } });
  const accentColor = palette[accent];
  // Hard cap to 5 bullets to keep within safe area
  const items = bullets.slice(0, 5);

  return (
    <AbsoluteFill style={{ ...safeFrame, alignItems: "flex-start", opacity: out }}>
      <div style={{ width: "100%", maxWidth: 1500 }}>
        <h2 style={{ fontSize: type.h1Small, fontWeight: 800, color: palette.ink, margin: "0 0 36px", lineHeight: type.lhHeading, letterSpacing: 0,
          opacity: sTitle, transform: `translateY(${interpolate(sTitle,[0,1],[16,0])}px)` }}>
          {title}
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 22, width: "100%" }}>
          {items.map((b, i) => {
            const s = spring({ frame: f - (14 + i * 8), fps, config: { damping: 16 } });
            return (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 28,
                padding: "22px 30px", background: palette.white, borderRadius: 20,
                borderRight: `8px solid ${accentColor}`,
                boxShadow: `0 10px 24px -12px ${palette.ink}22`,
                opacity: s, transform: `translateX(${interpolate(s,[0,1],[32,0])}px)`,
              }}>
                <span style={{
                  flex: "0 0 auto", width: 52, height: 52, borderRadius: "50%",
                  background: accentColor, color: palette.ink, display: "flex",
                  alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 900,
                }}>{i + 1}</span>
                <span style={{ fontSize: type.body, color: palette.ink, fontWeight: 600, lineHeight: type.lhBody, letterSpacing: 0 }}>{b}</span>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
