import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { palette, safeFrame, type } from "../theme";
import type { SceneAccent } from "./types";

type Props = { intro: string; big: string; outro: string; accent: SceneAccent };

export const BigStatCard: React.FC<Props> = ({ intro, big, outro, accent }) => {
  const f = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const out = interpolate(f, [durationInFrames - 14, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const sIntro = spring({ frame: f - 4,  fps, config: { damping: 18 } });
  const sBig   = spring({ frame: f - 16, fps, config: { damping: 12, stiffness: 110 } });
  const sOutro = spring({ frame: f - 44, fps, config: { damping: 18 } });
  const pulse = 1 + Math.sin(Math.max(f - 30, 0) / 18) * 0.01;
  const accentColor = palette[accent];

  return (
    <AbsoluteFill style={{ ...safeFrame, alignItems: "center", textAlign: "center", opacity: out }}>
      <p style={{ fontSize: type.bodyLg, color: palette.inkSoft, margin: 0, lineHeight: type.lhBody, letterSpacing: 0, maxWidth: 1400, opacity: sIntro, transform: `translateY(${interpolate(sIntro,[0,1],[12,0])}px)` }}>
        {intro}
      </p>
      <h1 style={{
        fontSize: type.display, fontWeight: 900, color: accentColor, margin: "24px 0 0", lineHeight: type.lhHeading, letterSpacing: 0,
        opacity: sBig,
        transform: `translateY(${interpolate(sBig,[0,1],[40,0])}px) scale(${interpolate(sBig,[0,1],[0.8,1]) * pulse})`,
      }}>
        {big}
      </h1>
      <p style={{ fontSize: type.bodyLg, color: palette.ink, margin: "32px auto 0", maxWidth: 1300, lineHeight: type.lhBodyRelaxed, fontWeight: 600, letterSpacing: 0,
        opacity: sOutro, transform: `translateY(${interpolate(sOutro,[0,1],[12,0])}px)` }}>
        {outro}
      </p>
    </AbsoluteFill>
  );
};
