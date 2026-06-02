import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { palette, rtl } from "../theme";
import type { SceneAccent } from "./types";

type Props = { term: string; definition: string; tag: string; accent: SceneAccent };

export const ConceptCard: React.FC<Props> = ({ term, definition, tag, accent }) => {
  const f = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const out = interpolate(f, [durationInFrames - 12, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const sCard = spring({ frame: f - 2,  fps, config: { damping: 16 } });
  const sTerm = spring({ frame: f - 14, fps, config: { damping: 12, stiffness: 140 } });
  const sDef  = spring({ frame: f - 34, fps, config: { damping: 16 } });
  const sTag  = spring({ frame: f - 54, fps, config: { damping: 18 } });
  const accentColor = palette[accent];

  return (
    <AbsoluteFill style={{ ...rtl, padding: "0 140px", justifyContent: "center", alignItems: "center", opacity: out }}>
      <div style={{
        opacity: sCard, transform: `translateY(${interpolate(sCard,[0,1],[24,0])}px) scale(${interpolate(sCard,[0,1],[0.96,1])})`,
        background: palette.white, borderRadius: 36, padding: "72px 80px", maxWidth: 1500, width: "100%",
        boxShadow: `0 30px 60px -20px ${palette.ink}22`, border: `2px solid ${accentColor}40`,
      }}>
        <div style={{ opacity: sTerm, transform: `translateY(${interpolate(sTerm,[0,1],[20,0])}px)` }}>
          <span style={{ display: "inline-block", padding: "10px 26px", background: accentColor, color: palette.ink, borderRadius: 14, fontSize: 28, fontWeight: 800, letterSpacing: 1, marginBottom: 24 }}>
            مصطلح
          </span>
          <h1 style={{ fontSize: 150, fontWeight: 900, color: palette.ink, margin: 0, lineHeight: 1, letterSpacing: -2 }}>
            {term}
          </h1>
        </div>
        <div style={{ height: 4, width: 120, background: accentColor, margin: "32px 0", borderRadius: 2,
          opacity: sDef, transform: `scaleX(${sDef})`, transformOrigin: "right" }} />
        <p style={{ fontSize: 44, color: palette.ink, margin: 0, lineHeight: 1.45, fontWeight: 600,
          opacity: sDef, transform: `translateY(${interpolate(sDef,[0,1],[16,0])}px)` }}>
          {definition}
        </p>
        <p style={{ fontSize: 30, color: palette.inkSoft, margin: "28px 0 0", lineHeight: 1.4,
          opacity: sTag, transform: `translateY(${interpolate(sTag,[0,1],[12,0])}px)` }}>
          {tag}
        </p>
      </div>
    </AbsoluteFill>
  );
};