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

export const rtl: React.CSSProperties = {
  direction: "rtl",
  fontFamily: cairo,
  textAlign: "right",
};