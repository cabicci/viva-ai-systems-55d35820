import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { palette, rtl } from "../theme";
import type { SceneAccent } from "./types";

type Props = { chip: string; title: string; highlight: string; subtitle: string; accent: SceneAccent };

export const TitleCard: React.FC<Props> = ({ chip, title, highlight, subtitle, accent }) => {
  const f = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const out = interpolate(f, [durationInFrames - 12, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const sChip = spring({ frame: f - 2,  fps, config: { damping: 18 } });
  const sT1   = spring({ frame: f - 16, fps, config: { damping: 14 } });
  const sT2   = spring({ frame: f - 36, fps, config: { damping: 12 } });
  const sSub  = spring({ frame: f - 58, fps, config: { damping: 18 } });
  const accentColor = palette[accent];

  return (
    <AbsoluteFill style={{ ...rtl, padding: "0 140px", justifyContent: "center", alignItems: "flex-start", opacity: out }}>
      <div style={{ opacity: sChip, transform: `translateY(${interpolate(sChip, [0,1], [20,0])}px)`, marginBottom: 32 }}>
        <span style={{ display: "inline-block", padding: "12px 28px", background: accentColor, color: palette.ink, borderRadius: 999, fontSize: 28, fontWeight: 800, letterSpacing: 0.5 }}>
          {chip}
        </span>
      </div>
      <h1 style={{ fontSize: 140, fontWeight: 900, color: palette.ink, margin: 0, lineHeight: 1.05, opacity: sT1, transform: `translateY(${interpolate(sT1,[0,1],[28,0])}px)` }}>
        {title}
      </h1>
      <h1 style={{ fontSize: 180, fontWeight: 900, color: accentColor, margin: "4px 0 0", lineHeight: 1, opacity: sT2, transform: `translateY(${interpolate(sT2,[0,1],[36,0])}px)` }}>
        {highlight}
      </h1>
      <p style={{ fontSize: 38, color: palette.inkSoft, marginTop: 38, maxWidth: 1200, lineHeight: 1.4, opacity: sSub, transform: `translateY(${interpolate(sSub,[0,1],[18,0])}px)` }}>
        {subtitle}
      </p>
    </AbsoluteFill>
  );
};