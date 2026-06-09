import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { palette, safeFrame, type } from "../theme";
import type { SceneAccent } from "./types";

type Props = { eyebrow: string; title: string; highlight: string; tagline: string; accent: SceneAccent };

export const CTACard: React.FC<Props> = ({ eyebrow, title, highlight, tagline, accent }) => {
  const f = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const out = interpolate(f, [durationInFrames - 14, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const sEye = spring({ frame: f - 2,  fps, config: { damping: 18 } });
  const sT1  = spring({ frame: f - 12, fps, config: { damping: 16 } });
  const sT2  = spring({ frame: f - 24, fps, config: { damping: 14 } });
  const sTag = spring({ frame: f - 44, fps, config: { damping: 18 } });
  const accentColor = palette[accent];

  return (
    <AbsoluteFill style={{ ...safeFrame, alignItems: "flex-start", opacity: out }}>
      <div style={{ width: "100%", maxWidth: 1680 }}>
        <span style={{
          display: "inline-block", padding: "10px 24px", background: palette.ink, color: palette.cream,
          borderRadius: 999, fontSize: type.captionSm, fontWeight: 800, letterSpacing: 0, marginBottom: 28,
          opacity: sEye, transform: `translateY(${interpolate(sEye,[0,1],[14,0])}px)`,
        }}>{eyebrow}</span>
        <h1 style={{ fontSize: type.h1Small, fontWeight: 900, color: palette.ink, margin: 0, lineHeight: type.lhHeading, letterSpacing: 0,
          opacity: sT1, transform: `translateY(${interpolate(sT1,[0,1],[20,0])}px)`, maxWidth: 1680 }}>
          {title}
        </h1>
        <h1 style={{
          fontSize: type.display, fontWeight: 900, color: accentColor, margin: "12px 0 0", lineHeight: type.lhHeading, letterSpacing: 0,
          opacity: sT2, transform: `translateY(${interpolate(sT2,[0,1],[32,0])}px) scale(${interpolate(sT2,[0,1],[0.85,1])})`,
          maxWidth: 1680,
        }}>
          {highlight}
        </h1>
        <p style={{ fontSize: type.bodyLg, color: palette.inkSoft, marginTop: 32, lineHeight: type.lhBodyRelaxed, fontWeight: 600, letterSpacing: 0, maxWidth: 1400,
          opacity: sTag, transform: `translateY(${interpolate(sTag,[0,1],[14,0])}px)` }}>
          {tagline}
        </p>
      </div>
    </AbsoluteFill>
  );
};
