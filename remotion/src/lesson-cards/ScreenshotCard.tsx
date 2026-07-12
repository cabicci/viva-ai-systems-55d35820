import {
  AbsoluteFill,
  Img,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import { palette, textDirectionStyle } from "../theme";
import type { SceneAccent } from "./types";
import { usePresentationLocale } from "./PresentationLocaleContext";

type Props = {
  eyebrow: string;
  title: string;
  caption: string;
  src: string; // path relative to remotion/public/
  accent: SceneAccent;
};

export const ScreenshotCard: React.FC<Props> = ({
  eyebrow,
  title,
  caption,
  src,
  accent,
}) => {
  const locale = usePresentationLocale();
  const f = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const out = interpolate(
    f,
    [durationInFrames - 12, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const sEye = spring({ frame: f - 2, fps, config: { damping: 18 } });
  const sTitle = spring({ frame: f - 14, fps, config: { damping: 14 } });
  const sShot = spring({ frame: f - 28, fps, config: { damping: 16 } });
  const sCap = spring({ frame: f - 60, fps, config: { damping: 18 } });
  const accentColor = palette[accent];

  return (
    <AbsoluteFill
      style={{
        ...textDirectionStyle(locale),
        padding: "0 120px",
        justifyContent: "center",
        alignItems: "flex-start",
        opacity: out,
      }}
    >
      <span
        style={{
          display: "inline-block",
          padding: "10px 24px",
          background: accentColor,
          color: palette.ink,
          borderRadius: 999,
          fontSize: 26,
          fontWeight: 800,
          letterSpacing: 1,
          marginBottom: 22,
          opacity: sEye,
          transform: `translateY(${interpolate(sEye, [0, 1], [16, 0])}px)`,
        }}
      >
        {eyebrow}
      </span>
      <h2
        style={{
          fontSize: 60,
          fontWeight: 900,
          color: palette.ink,
          margin: "0 0 32px",
          lineHeight: 1.1,
          opacity: sTitle,
          transform: `translateY(${interpolate(sTitle, [0, 1], [20, 0])}px)`,
        }}
      >
        {title}
      </h2>
      <div
        style={{
          width: "100%",
          maxWidth: 1600,
          borderRadius: 28,
          overflow: "hidden",
          boxShadow: `0 30px 70px -25px ${palette.ink}44`,
          border: `3px solid ${accentColor}55`,
          opacity: sShot,
          transform: `translateY(${interpolate(sShot, [0, 1], [40, 0])}px) scale(${interpolate(sShot, [0, 1], [0.96, 1])})`,
          background: palette.white,
        }}
      >
        <Img
          src={staticFile(src)}
          style={{ width: "100%", height: "auto", display: "block" }}
        />
      </div>
      <p
        style={{
          fontSize: 30,
          color: palette.inkSoft,
          margin: "24px 0 0",
          lineHeight: 1.45,
          maxWidth: 1400,
          opacity: sCap,
          transform: `translateY(${interpolate(sCap, [0, 1], [12, 0])}px)`,
        }}
      >
        {caption}
      </p>
    </AbsoluteFill>
  );
};