import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Series,
  random,
} from "remotion";
import { cairo, rtl } from "../theme";

// ============ Deep Space Gold palette ============
const C = {
  bg0: "#050505",
  bg1: "#0d0d0d",
  bg2: "#1a1a1a",
  gold: "#c9a84c",
  goldLight: "#f0d78c",
  goldGlow: "rgba(201,168,76,0.35)",
  ink: "#0a0a0a",
  dim: "#8a7a4a",
};

// ============ Shared cosmic background ============
const CosmicBackground: React.FC = () => {
  const f = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();

  // Subtle drifting nebula gradient (slow rotation feel)
  const drift = interpolate(f, [0, durationInFrames], [0, 360]);
  // Slow zoom from 1.0 → 1.08
  const zoom = interpolate(f, [0, durationInFrames], [1.0, 1.08]);

  // Star field (deterministic via random with seed)
  const stars = Array.from({ length: 120 }).map((_, i) => {
    const sx = random(`sx-${i}`) * width;
    const sy = random(`sy-${i}`) * height;
    const sr = 0.6 + random(`sr-${i}`) * 1.8;
    const tw = 0.3 + random(`tw-${i}`) * 0.7;
    const phase = random(`p-${i}`) * Math.PI * 2;
    const tw2 = tw * (0.6 + 0.4 * Math.sin(f / 14 + phase));
    return { sx, sy, sr, op: tw2, key: i };
  });

  return (
    <AbsoluteFill style={{ background: C.bg0, overflow: "hidden" }}>
      {/* Animated radial gold glow */}
      <AbsoluteFill
        style={{
          transform: `scale(${zoom})`,
          background: `radial-gradient(ellipse at 50% 55%, rgba(201,168,76,0.18) 0%, rgba(201,168,76,0.06) 25%, transparent 55%), radial-gradient(circle at 20% 80%, rgba(240,215,140,0.08), transparent 40%), radial-gradient(circle at 80% 20%, rgba(201,168,76,0.10), transparent 40%)`,
        }}
      />
      {/* Drifting conic accent */}
      <AbsoluteFill
        style={{
          opacity: 0.18,
          background: `conic-gradient(from ${drift}deg at 50% 50%, transparent 0deg, rgba(201,168,76,0.6) 60deg, transparent 120deg, transparent 240deg, rgba(240,215,140,0.3) 300deg, transparent 360deg)`,
          mixBlendMode: "screen",
        }}
      />
      {/* Stars */}
      <svg
        width={width}
        height={height}
        style={{ position: "absolute", inset: 0 }}
      >
        {stars.map((s) => (
          <circle
            key={s.key}
            cx={s.sx}
            cy={s.sy}
            r={s.sr}
            fill={C.goldLight}
            opacity={s.op}
          />
        ))}
      </svg>
      {/* Vignette */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.7) 100%)",
        }}
      />
      {/* Subtle film grain */}
      <AbsoluteFill
        style={{
          opacity: 0.06,
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.7'/></svg>\")",
          mixBlendMode: "overlay",
        }}
      />
    </AbsoluteFill>
  );
};

// ============ Helpers ============
const useFadeOut = (tail = 12) => {
  const f = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return interpolate(
    f,
    [durationInFrames - tail, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
};

const GoldLine: React.FC<{ delay?: number; width?: number | string }> = ({
  delay = 0,
  width = 320,
}) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - delay, fps, config: { damping: 28 } });
  return (
    <div
      style={{
        height: 2,
        width,
        transform: `scaleX(${s})`,
        transformOrigin: "right",
        background: `linear-gradient(90deg, transparent, ${C.gold}, transparent)`,
        boxShadow: `0 0 16px ${C.goldGlow}`,
      }}
    />
  );
};

// ============ Scene 1: HOOK ============
const Scene1: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const out = useFadeOut();
  const s1 = spring({ frame: f - 6, fps, config: { damping: 16 } });
  const s2 = spring({ frame: f - 28, fps, config: { damping: 14 } });
  const s3 = spring({ frame: f - 60, fps, config: { damping: 14 } });
  const breath = 1 + Math.sin(f / 22) * 0.015;
  return (
    <AbsoluteFill
      style={{
        ...rtl,
        opacity: out,
        alignItems: "center",
        justifyContent: "center",
        padding: "0 120px",
      }}
    >
      <div
        style={{
          opacity: s1,
          transform: `translateY(${interpolate(s1, [0, 1], [30, 0])}px)`,
          fontFamily: cairo,
          fontSize: 28,
          letterSpacing: 8,
          color: C.dim,
          marginBottom: 50,
        }}
      >
        AI · ECOSYSTEM · 2026
      </div>
      <div
        style={{
          opacity: s2,
          transform: `scale(${0.92 + 0.08 * s2}) scale(${breath})`,
          fontFamily: cairo,
          fontSize: 280,
          fontWeight: 900,
          color: C.goldLight,
          textShadow: `0 0 80px ${C.goldGlow}, 0 0 30px rgba(201,168,76,0.6)`,
          lineHeight: 1,
        }}
      >
        تخيّل.
      </div>
      <div
        style={{
          marginTop: 50,
          opacity: s3,
          transform: `translateY(${interpolate(s3, [0, 1], [20, 0])}px)`,
        }}
      >
        <GoldLine delay={64} width={420} />
      </div>
    </AbsoluteFill>
  );
};

// ============ Scene 2: PROMISE — AI without code ============
const Scene2: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const out = useFadeOut();
  const s1 = spring({ frame: f - 4, fps, config: { damping: 16 } });
  const s2 = spring({ frame: f - 26, fps, config: { damping: 14 } });
  const s3 = spring({ frame: f - 60, fps, config: { damping: 14 } });
  const drift = interpolate(f, [0, 120], [0, -12]);
  return (
    <AbsoluteFill
      style={{
        ...rtl,
        opacity: out,
        alignItems: "flex-end",
        justifyContent: "center",
        padding: "0 160px",
        transform: `translateY(${drift}px)`,
      }}
    >
      <div
        style={{
          opacity: s1,
          fontFamily: cairo,
          fontSize: 36,
          color: C.dim,
          letterSpacing: 4,
          marginBottom: 30,
        }}
      >
        تشتغل بالـ
      </div>
      <div
        style={{
          opacity: s2,
          transform: `translateX(${interpolate(s2, [0, 1], [60, 0])}px)`,
          fontFamily: cairo,
          fontSize: 220,
          fontWeight: 900,
          color: C.goldLight,
          textShadow: `0 0 60px ${C.goldGlow}`,
          lineHeight: 1,
        }}
      >
        ذكاء اصطناعي
      </div>
      <div
        style={{
          marginTop: 30,
          opacity: s3,
          fontFamily: cairo,
          fontSize: 64,
          fontWeight: 700,
          color: C.gold,
          letterSpacing: 2,
          borderTop: `1px solid ${C.gold}`,
          paddingTop: 24,
        }}
      >
        من غير برمجة.
      </div>
    </AbsoluteFill>
  );
};

// ============ Scene 3: SIMPLICITY — three pillars ============
const Pillar: React.FC<{
  delay: number;
  big: string;
  small: string;
}> = ({ delay, big, small }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - delay, fps, config: { damping: 16 } });
  return (
    <div
      style={{
        opacity: s,
        transform: `translateY(${interpolate(s, [0, 1], [40, 0])}px)`,
        flex: 1,
        textAlign: "center",
        padding: "0 30px",
      }}
    >
      <div
        style={{
          fontFamily: cairo,
          fontSize: 160,
          fontWeight: 900,
          color: C.goldLight,
          textShadow: `0 0 40px ${C.goldGlow}`,
          lineHeight: 1,
        }}
      >
        {big}
      </div>
      <div
        style={{
          marginTop: 18,
          fontFamily: cairo,
          fontSize: 36,
          color: C.gold,
          letterSpacing: 2,
        }}
      >
        {small}
      </div>
    </div>
  );
};

const Scene3: React.FC = () => {
  const out = useFadeOut();
  return (
    <AbsoluteFill
      style={{
        ...rtl,
        opacity: out,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        padding: "0 80px",
      }}
    >
      <div
        style={{
          fontFamily: cairo,
          fontSize: 42,
          color: C.dim,
          letterSpacing: 6,
          marginBottom: 60,
          textAlign: "center",
        }}
      >
        منصّة كاملة بالعربي
      </div>
      <div
        style={{
          display: "flex",
          width: "100%",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <Pillar delay={6} big="٠" small="برمجة" />
        <Pillar delay={24} big="٠" small="تعقيد" />
        <Pillar delay={42} big="١٠٠٪" small="بأسهل لغة" />
      </div>
      <div style={{ marginTop: 70 }}>
        <GoldLine delay={60} width={600} />
      </div>
    </AbsoluteFill>
  );
};

// ============ Scene 4: PATHS — 5 path names ============
const PathRow: React.FC<{
  delay: number;
  num: string;
  name: string;
  ar: string;
}> = ({ delay, num, name, ar }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - delay, fps, config: { damping: 18 } });
  return (
    <div
      style={{
        opacity: s,
        transform: `translateX(${interpolate(s, [0, 1], [-60, 0])}px)`,
        display: "flex",
        flexDirection: "row-reverse",
        alignItems: "center",
        gap: 36,
        borderBottom: `1px solid rgba(201,168,76,0.25)`,
        padding: "22px 0",
      }}
    >
      <div
        style={{
          fontFamily: cairo,
          fontSize: 28,
          color: C.dim,
          width: 60,
          textAlign: "left",
        }}
      >
        {num}
      </div>
      <div
        style={{
          fontFamily: cairo,
          fontSize: 78,
          fontWeight: 900,
          color: C.goldLight,
          textShadow: `0 0 30px ${C.goldGlow}`,
          letterSpacing: 1,
          minWidth: 380,
          textAlign: "left",
        }}
      >
        {name}
      </div>
      <div
        style={{
          fontFamily: cairo,
          fontSize: 38,
          color: C.gold,
          letterSpacing: 1,
        }}
      >
        {ar}
      </div>
    </div>
  );
};

const Scene4: React.FC = () => {
  const out = useFadeOut();
  return (
    <AbsoluteFill
      style={{
        ...rtl,
        opacity: out,
        flexDirection: "column",
        justifyContent: "center",
        padding: "0 180px",
      }}
    >
      <div
        style={{
          fontFamily: cairo,
          fontSize: 38,
          color: C.dim,
          letterSpacing: 6,
          marginBottom: 30,
          alignSelf: "flex-end",
        }}
      >
        خمس مسارات · اختار طريقك
      </div>
      <PathRow delay={2} num="01" name="Builder" ar="ابني" />
      <PathRow delay={14} num="02" name="Creator" ar="اصنع" />
      <PathRow delay={26} num="03" name="Automator" ar="أتمتة" />
      <PathRow delay={38} num="04" name="Analyst" ar="حلِّل" />
      <PathRow delay={50} num="05" name="Business" ar="شغّل" />
    </AbsoluteFill>
  );
};

// ============ Scene 5: CTA ============
const Scene5: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const out = useFadeOut(18);
  const s1 = spring({ frame: f - 4, fps, config: { damping: 16 } });
  const s2 = spring({ frame: f - 26, fps, config: { damping: 12 } });
  const s3 = spring({ frame: f - 60, fps, config: { damping: 18 } });
  const breath = 1 + Math.sin(f / 18) * 0.02;
  return (
    <AbsoluteFill
      style={{
        ...rtl,
        opacity: out,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          opacity: s1,
          fontFamily: cairo,
          fontSize: 44,
          color: C.gold,
          letterSpacing: 10,
          marginBottom: 40,
        }}
      >
        المستقبل وصل
      </div>
      <div
        style={{
          opacity: s2,
          transform: `scale(${0.9 + 0.1 * s2}) scale(${breath})`,
          fontFamily: cairo,
          fontSize: 260,
          fontWeight: 900,
          color: C.goldLight,
          textShadow: `0 0 100px ${C.gold}, 0 0 40px ${C.goldLight}`,
          lineHeight: 1,
        }}
      >
        ابدأ.
      </div>
      <div
        style={{
          marginTop: 60,
          opacity: s3,
          fontFamily: cairo,
          fontSize: 32,
          color: C.dim,
          letterSpacing: 8,
        }}
      >
        AI ECOSYSTEM PLATFORM
      </div>
      <div style={{ marginTop: 24, opacity: s3 }}>
        <GoldLine delay={64} width={520} />
      </div>
    </AbsoluteFill>
  );
};

// ============ Main composition ============
export type IntroVideoProps = {
  sceneFrames: number[]; // length 5
};

export const IntroVideo: React.FC<IntroVideoProps> = ({ sceneFrames }) => {
  const Scenes = [Scene1, Scene2, Scene3, Scene4, Scene5];
  return (
    <AbsoluteFill style={{ background: C.bg0 }}>
      <CosmicBackground />
      <Series>
        {Scenes.map((Sc, i) => (
          <Series.Sequence key={i} durationInFrames={sceneFrames[i] ?? 90}>
            <Sc />
          </Series.Sequence>
        ))}
      </Series>
    </AbsoluteFill>
  );
};