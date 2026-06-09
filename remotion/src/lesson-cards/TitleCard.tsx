import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { palette, safeFrame, type } from "../theme";
import type { SceneAccent } from "./types";

type Props = { chip: string; title: string; highlight: string; subtitle: string; accent: SceneAccent };

export const TitleCard: React.FC<Props> = ({ chip, title, highlight, subtitle, accent }) => {
  const f = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const out = interpolate(f, [durationInFrames - 14, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const sChip = spring({ frame: f - 2,  fps, config: { damping: 18 } });
  const sT1   = spring({ frame: f - 12, fps, config: { damping: 16 } });
  const sT2   = spring({ frame: f - 24, fps, config: { damping: 16 } });
  const sSub  = spring({ frame: f - 38, fps, config: { damping: 18 } });
  const accentColor = palette[accent];

  return (
    <AbsoluteFill style={{ ...safeFrame, alignItems: "flex-start", opacity: out }}>
      <div style={{ width: "100%", maxWidth: 1680 }}>
        <div style={{ opacity: sChip, transform: `translateY(${interpolate(sChip, [0,1], [16,0])}px)`, marginBottom: 24 }}>
          <span style={{ display: "inline-block", padding: "10px 24px", background: accentColor, color: palette.ink, borderRadius: 999, fontSize: type.caption, fontWeight: 800, letterSpacing: 0 }}>
            {chip}
          </span>
        </div>
        <h1 style={{ fontSize: type.h1Small, fontWeight: 900, color: palette.ink, margin: 0, lineHeight: type.lhHeading, letterSpacing: 0, opacity: sT1, transform: `translateY(${interpolate(sT1,[0,1],[22,0])}px)`, maxWidth: 1680 }}>
          {title}
        </h1>
        <h1 style={{ fontSize: type.display, fontWeight: 900, color: accentColor, margin: "12px 0 0", lineHeight: type.lhHeading, letterSpacing: 0, opacity: sT2, transform: `translateY(${interpolate(sT2,[0,1],[28,0])}px)`, maxWidth: 1680 }}>
          {highlight}
        </h1>
        <p style={{ fontSize: type.subtitle, color: palette.inkSoft, marginTop: 32, maxWidth: 1400, lineHeight: type.lhBodyRelaxed, letterSpacing: 0, opacity: sSub, transform: `translateY(${interpolate(sSub,[0,1],[14,0])}px)` }}>
          {subtitle}
        </p>
      </div>
    </AbsoluteFill>
  );
};
