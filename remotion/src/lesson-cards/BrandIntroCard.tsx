import { AbsoluteFill, Img, staticFile, useCurrentFrame, interpolate } from "remotion";
import { palette, rtl, bgGradient } from "../theme";

type Props = { tagline?: string };

export const BrandIntroCard: React.FC<Props> = ({ tagline = "رحلتك تبدأ من هنا" }) => {
  const f = useCurrentFrame();
  // Total: 75 frames. Fade-in 0-12, hold 12-60, fade-out 60-75.
  const fadeIn = interpolate(f, [0, 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fadeOut = interpolate(f, [60, 75], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const opacity = Math.min(fadeIn, fadeOut);
  const scale = interpolate(f, [0, 30], [0.96, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const taglineOp = interpolate(f, [18, 32], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const taglineY = interpolate(f, [18, 32], [16, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: bgGradient }}>
      <AbsoluteFill style={{ ...rtl, justifyContent: "center", alignItems: "center", textAlign: "center", opacity }}>
        <div style={{ transform: `scale(${scale})`, display: "flex", flexDirection: "column", alignItems: "center", gap: 36 }}>
          <Img
            src={staticFile("brand/masaarat-logo-lockup.png")}
            style={{ width: 720, height: "auto", display: "block" }}
          />
          <p style={{
            margin: 0,
            fontSize: 38,
            fontWeight: 600,
            color: palette.inkSoft,
            letterSpacing: 0,
            lineHeight: 1.3,
            opacity: taglineOp,
            transform: `translateY(${taglineY}px)`,
          }}>
            {tagline}
          </p>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
