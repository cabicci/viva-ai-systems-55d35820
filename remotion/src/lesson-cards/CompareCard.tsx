import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { palette, safeFrame, type } from "../theme";
import type { SceneAccent } from "./types";

type Side = { label: string; body: string };
type Props = { title: string; left: Side; right: Side; accent: SceneAccent };

export const CompareCard: React.FC<Props> = ({ title, left, right }) => {
  const f = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const out = interpolate(f, [durationInFrames - 14, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const sTitle = spring({ frame: f - 2,  fps, config: { damping: 16 } });
  const sL     = spring({ frame: f - 14, fps, config: { damping: 16 } });
  const sR     = spring({ frame: f - 22, fps, config: { damping: 16 } });

  const Side = ({ label, body, color, prog }:
    { label: string; body: string; color: string; prog: number }) => (
    <div style={{
      flex: 1, padding: "38px 38px", background: palette.white, borderRadius: 24,
      boxShadow: `0 24px 50px -20px ${palette.ink}22`,
      border: `2px solid ${color}55`,
      opacity: prog, transform: `translateY(${interpolate(prog,[0,1],[28,0])}px)`,
      minWidth: 0,
    }}>
      <span style={{
        display: "inline-block", padding: "8px 22px", background: color, color: palette.ink,
        borderRadius: 999, fontSize: type.captionSm, fontWeight: 800, letterSpacing: 0, marginBottom: 18,
      }}>{label}</span>
      <p style={{ fontSize: type.body, color: palette.ink, margin: 0, lineHeight: type.lhBodyRelaxed, fontWeight: 600, letterSpacing: 0 }}>{body}</p>
    </div>
  );

  return (
    <AbsoluteFill style={{ ...safeFrame, alignItems: "flex-start", opacity: out }}>
      <div style={{ width: "100%", maxWidth: 1680 }}>
        <h2 style={{ fontSize: type.h1Small, fontWeight: 800, color: palette.ink, margin: "0 0 32px", lineHeight: type.lhHeading, letterSpacing: 0,
          opacity: sTitle, transform: `translateY(${interpolate(sTitle,[0,1],[16,0])}px)` }}>
          {title}
        </h2>
        <div style={{ display: "flex", gap: 32, width: "100%" }}>
          <Side label={left.label}  body={left.body}  color={palette.pink} prog={sL} />
          <Side label={right.label} body={right.body} color={palette.mint} prog={sR} />
        </div>
      </div>
    </AbsoluteFill>
  );
};
