import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { palette, rtl } from "../theme";
import type { SceneAccent } from "./types";

type Props = { title: string; bullets: string[]; accent: SceneAccent };

export const BulletsCard: React.FC<Props> = ({ title, bullets, accent }) => {
  const f = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const out = interpolate(f, [durationInFrames - 12, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const sTitle = spring({ frame: f - 2, fps, config: { damping: 16 } });
  const accentColor = palette[accent];

  return (
    <AbsoluteFill style={{ ...rtl, padding: "0 160px", justifyContent: "center", alignItems: "flex-start", opacity: out }}>
      <h2 style={{ fontSize: 64, fontWeight: 800, color: palette.ink, margin: "0 0 48px", lineHeight: 1.1,
        opacity: sTitle, transform: `translateY(${interpolate(sTitle,[0,1],[20,0])}px)` }}>
        {title}
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 28, width: "100%", maxWidth: 1500 }}>
        {bullets.map((b, i) => {
          const s = spring({ frame: f - (18 + i * 22), fps, config: { damping: 14 } });
          return (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 32,
              padding: "26px 36px", background: palette.white, borderRadius: 22,
              borderRight: `8px solid ${accentColor}`,
              boxShadow: `0 10px 24px -12px ${palette.ink}22`,
              opacity: s, transform: `translateX(${interpolate(s,[0,1],[40,0])}px)`,
            }}>
              <span style={{
                flex: "0 0 auto", width: 56, height: 56, borderRadius: "50%",
                background: accentColor, color: palette.ink, display: "flex",
                alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 900,
              }}>{i + 1}</span>
              <span style={{ fontSize: 40, color: palette.ink, fontWeight: 600, lineHeight: 1.3 }}>{b}</span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};