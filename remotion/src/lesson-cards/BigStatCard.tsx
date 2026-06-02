import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { palette, rtl } from "../theme";
import type { SceneAccent } from "./types";

type Props = { intro: string; big: string; outro: string; accent: SceneAccent };

export const BigStatCard: React.FC<Props> = ({ intro, big, outro, accent }) => {
  const f = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const out = interpolate(f, [durationInFrames - 12, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const sIntro = spring({ frame: f - 4,  fps, config: { damping: 18 } });
  const sBig   = spring({ frame: f - 18, fps, config: { damping: 10, stiffness: 100, mass: 1.1 } });
  const sOutro = spring({ frame: f - 60, fps, config: { damping: 18 } });
  // continuous subtle pulse on the big word
  const pulse = 1 + Math.sin(Math.max(f - 32, 0) / 18) * 0.012;
  const accentColor = palette[accent];

  return (
    <AbsoluteFill style={{ ...rtl, padding: "0 140px", justifyContent: "center", alignItems: "center", textAlign: "center", opacity: out }}>
      <p style={{ fontSize: 50, color: palette.inkSoft, margin: 0, opacity: sIntro, transform: `translateY(${interpolate(sIntro,[0,1],[14,0])}px)` }}>
        {intro}
      </p>
      <h1 style={{
        fontSize: 320, fontWeight: 900, color: accentColor, margin: "8px 0 0", lineHeight: 1, letterSpacing: -6,
        opacity: sBig,
        transform: `translateY(${interpolate(sBig,[0,1],[60,0])}px) scale(${interpolate(sBig,[0,1],[0.7,1]) * pulse})`,
        textShadow: `0 12px 0 ${palette.ink}10`,
      }}>
        {big}
      </h1>
      <p style={{ fontSize: 38, color: palette.ink, margin: "32px auto 0", maxWidth: 1300, lineHeight: 1.5, fontWeight: 600,
        opacity: sOutro, transform: `translateY(${interpolate(sOutro,[0,1],[14,0])}px)` }}>
        {outro}
      </p>
    </AbsoluteFill>
  );
};