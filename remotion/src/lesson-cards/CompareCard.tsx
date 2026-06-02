import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { palette, rtl } from "../theme";
import type { SceneAccent } from "./types";

type Side = { label: string; body: string };
type Props = { title: string; left: Side; right: Side; accent: SceneAccent };

export const CompareCard: React.FC<Props> = ({ title, left, right }) => {
  const f = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const out = interpolate(f, [durationInFrames - 12, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const sTitle = spring({ frame: f - 2,  fps, config: { damping: 16 } });
  const sL     = spring({ frame: f - 22, fps, config: { damping: 14 } });
  const sR     = spring({ frame: f - 44, fps, config: { damping: 14 } });

  const Side = ({ side, label, body, color, tilt, prog }:
    { side: "wrong" | "right"; label: string; body: string; color: string; tilt: number; prog: number }) => (
    <div style={{
      flex: 1, padding: "44px 44px", background: palette.white, borderRadius: 28,
      boxShadow: `0 24px 50px -20px ${palette.ink}22`,
      border: `2px solid ${color}55`,
      opacity: prog, transform: `translateY(${interpolate(prog,[0,1],[40,0])}px) rotate(${interpolate(prog,[0,1],[tilt, 0])}deg)`,
    }}>
      <span style={{
        display: "inline-block", padding: "8px 22px", background: color, color: palette.ink,
        borderRadius: 999, fontSize: 24, fontWeight: 800, letterSpacing: 1, marginBottom: 22,
      }}>{label}</span>
      <p style={{ fontSize: 34, color: palette.ink, margin: 0, lineHeight: 1.5, fontWeight: 600 }}>{body}</p>
    </div>
  );

  return (
    <AbsoluteFill style={{ ...rtl, padding: "0 120px", justifyContent: "center", alignItems: "flex-start", opacity: out }}>
      <h2 style={{ fontSize: 60, fontWeight: 800, color: palette.ink, margin: "0 0 40px",
        opacity: sTitle, transform: `translateY(${interpolate(sTitle,[0,1],[18,0])}px)` }}>
        {title}
      </h2>
      <div style={{ display: "flex", gap: 36, width: "100%" }}>
        <Side side="wrong" label={left.label}  body={left.body}  color={palette.pink} tilt={-2} prog={sL} />
        <Side side="right" label={right.label} body={right.body} color={palette.mint} tilt={ 2} prog={sR} />
      </div>
    </AbsoluteFill>
  );
};