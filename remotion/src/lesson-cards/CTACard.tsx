import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { palette, rtl } from "../theme";
import type { SceneAccent } from "./types";

type Props = { eyebrow: string; title: string; highlight: string; tagline: string; accent: SceneAccent };

export const CTACard: React.FC<Props> = ({ eyebrow, title, highlight, tagline, accent }) => {
  const f = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const out = interpolate(f, [durationInFrames - 12, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const sEye = spring({ frame: f - 2,  fps, config: { damping: 18 } });
  const sT1  = spring({ frame: f - 16, fps, config: { damping: 14 } });
  const sT2  = spring({ frame: f - 36, fps, config: { damping: 10, stiffness: 110 } });
  const sTag = spring({ frame: f - 62, fps, config: { damping: 18 } });
  const accentColor = palette[accent];

  return (
    <AbsoluteFill style={{ ...rtl, padding: "0 140px", justifyContent: "center", alignItems: "flex-start", opacity: out }}>
      <span style={{
        display: "inline-block", padding: "10px 24px", background: palette.ink, color: palette.cream,
        borderRadius: 999, fontSize: 26, fontWeight: 800, letterSpacing: 1, marginBottom: 30,
        opacity: sEye, transform: `translateY(${interpolate(sEye,[0,1],[16,0])}px)`,
      }}>{eyebrow}</span>
      <h1 style={{ fontSize: 110, fontWeight: 900, color: palette.ink, margin: 0, lineHeight: 1.05,
        opacity: sT1, transform: `translateY(${interpolate(sT1,[0,1],[24,0])}px)` }}>
        {title}
      </h1>
      <h1 style={{
        fontSize: 240, fontWeight: 900, color: accentColor, margin: "8px 0 0", lineHeight: 1, letterSpacing: -4,
        opacity: sT2, transform: `translateY(${interpolate(sT2,[0,1],[40,0])}px) scale(${interpolate(sT2,[0,1],[0.8,1])})`,
        textShadow: `0 8px 0 ${palette.ink}10`,
      }}>
        {highlight}
      </h1>
      <p style={{ fontSize: 42, color: palette.inkSoft, marginTop: 36, lineHeight: 1.4, fontWeight: 600,
        opacity: sTag, transform: `translateY(${interpolate(sTag,[0,1],[16,0])}px)` }}>
        {tagline}
      </p>
    </AbsoluteFill>
  );
};