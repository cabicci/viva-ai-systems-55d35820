import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { palette, safeFrame, type } from "../theme";
import type { SceneAccent } from "./types";

type Props = { term: string; definition: string; tag: string; accent: SceneAccent };

export const ConceptCard: React.FC<Props> = ({ term, definition, tag, accent }) => {
  const f = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const out = interpolate(f, [durationInFrames - 14, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const sCard = spring({ frame: f - 2,  fps, config: { damping: 16 } });
  const sTerm = spring({ frame: f - 12, fps, config: { damping: 14 } });
  const sDef  = spring({ frame: f - 26, fps, config: { damping: 16 } });
  const sTag  = spring({ frame: f - 42, fps, config: { damping: 18 } });
  const accentColor = palette[accent];

  return (
    <AbsoluteFill style={{ ...safeFrame, alignItems: "center", opacity: out }}>
      <div style={{
        opacity: sCard, transform: `translateY(${interpolate(sCard,[0,1],[20,0])}px) scale(${interpolate(sCard,[0,1],[0.97,1])})`,
        background: palette.white, borderRadius: 32, padding: "56px 64px", maxWidth: 1500, width: "100%",
        boxShadow: `0 30px 60px -20px ${palette.ink}22`, border: `2px solid ${accentColor}40`,
      }}>
        <div style={{ opacity: sTerm, transform: `translateY(${interpolate(sTerm,[0,1],[14,0])}px)` }}>
          <span style={{ display: "inline-block", padding: "8px 22px", background: accentColor, color: palette.ink, borderRadius: 12, fontSize: type.captionSm, fontWeight: 800, letterSpacing: 0, marginBottom: 20 }}>
            مصطلح
          </span>
          <h1 style={{ fontSize: type.h1, fontWeight: 900, color: palette.ink, margin: 0, lineHeight: type.lhHeading, letterSpacing: 0 }}>
            {term}
          </h1>
        </div>
        <div style={{ height: 4, width: 120, background: accentColor, margin: "28px 0", borderRadius: 2,
          opacity: sDef, transform: `scaleX(${sDef})`, transformOrigin: "right" }} />
        <p style={{ fontSize: type.bodyLg, color: palette.ink, margin: 0, lineHeight: type.lhBodyRelaxed, fontWeight: 600, letterSpacing: 0,
          opacity: sDef, transform: `translateY(${interpolate(sDef,[0,1],[14,0])}px)` }}>
          {definition}
        </p>
        <p style={{ fontSize: type.caption, color: palette.inkSoft, margin: "24px 0 0", lineHeight: type.lhBody, letterSpacing: 0,
          opacity: sTag, transform: `translateY(${interpolate(sTag,[0,1],[10,0])}px)` }}>
          {tag}
        </p>
      </div>
    </AbsoluteFill>
  );
};
