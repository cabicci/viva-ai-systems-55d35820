import { loadFont } from "@remotion/google-fonts/Cairo";

// Load both Arabic and Latin subsets so mixed text (AI, Software, →, ↙ ↘, digits)
// renders correctly instead of falling back to tofu boxes.
export const { fontFamily: cairoBase } = loadFont("normal", {
  weights: ["400", "600", "700", "900"],
  subsets: ["arabic", "latin", "latin-ext"],
});

// Stack with system fallbacks for any glyph Cairo doesn't include.
export const cairo = `${cairoBase}, "Noto Sans Arabic", "Segoe UI", system-ui, sans-serif`;

export const palette = {
  cream: "#F4EDE0",
  creamDeep: "#ECE2CF",
  peach: "#F0A988",
  pink: "#E08AA0",
  mint: "#82C39E",
  mintDeep: "#5DA980",
  lavender: "#A797C8",
  yellow: "#F2D27A",
  ink: "#2A2620",
  inkSoft: "#5C544A",
  white: "#FBF7EE",
};

// Reusable pastel gradient — mirrors the platform's --gradient-hero
// (mint + lavender + soft yellow over a light blue/white base).
// Use this for scene backgrounds instead of palette.cream.
export const bgGradient =
  "linear-gradient(135deg, #EAF5FF 0%, #DCEFE3 30%, #E8E0F2 65%, #FBF1D6 100%)";

// Canvas: 1920x1080. Safe area: 1680x880 (120 horizontal, 100 vertical).
// Mobile-safe center: 1400x787.
export const safeArea = {
  width: 1680,
  height: 880,
  padX: 120,
  padY: 100,
  mobileCenterWidth: 1400,
  mobileCenterHeight: 787,
};

// Typography scale — Arabic-tuned. Never use negative letter-spacing on Arabic.
export const type = {
  display: 132, // big stat / hero highlight
  h1: 110,      // title H1
  h1Small: 96,
  subtitle: 34,
  bodyLg: 36,
  body: 32,
  caption: 28,
  captionSm: 26,
  // Line-heights
  lhHeading: 1.2,
  lhBody: 1.4,
  lhBodyRelaxed: 1.5,
  // Letter-spacing — Arabic MUST be 0
  lsArabic: 0,
};

// Brand intro length in frames (30fps → ~2.5s)
export const BRAND_INTRO_FRAMES = 75;

export const rtl: React.CSSProperties = {
  direction: "rtl",
  fontFamily: cairo,
  textAlign: "right",
  letterSpacing: 0,
};

// Reusable safe-area frame for any scene root.
export const safeFrame: React.CSSProperties = {
  ...rtl,
  paddingLeft: safeArea.padX,
  paddingRight: safeArea.padX,
  paddingTop: safeArea.padY,
  paddingBottom: safeArea.padY,
  justifyContent: "center",
};
