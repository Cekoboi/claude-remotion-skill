// theme.ts — "kedai" launch palette: near-black stage, ONE amber hero that is
// both the brand color and the only light source. Fonts are the self-hosted
// Unbounded / Inter / JetBrains Mono registered by loadKLFonts() in Root.
import { Easing } from "remotion";
import timing from "./timing.json";

export const kedaiTheme = {
  colors: {
    bg: "#0A0B0D",
    bgLift: "#121417",
    panel: "rgba(30,32,37,0.92)",
    panelHi: "rgba(44,47,54,0.96)",
    line: "rgba(255,255,255,0.08)",
    skeleton: "rgba(255,255,255,0.07)",
    hero: "#FF9F43", // THE hero color — light, logo, one word per line
    heroSoft: "rgba(255,159,67,0.16)",
    glow: "rgba(255,140,50,0.85)",
    text: "#F5F3EF",
    textDim: "#9AA0A8",
    white: "#FFFFFF",
    thumbs: ["#C98B5A", "#B4553C", "#5E7C9A", "#6B4A3A", "#8C7A3E", "#4F6B5A"],
    apps: ["#2B2F36", "#343A42", "#3A3F47", "#2F353D", "#41464F"],
  },
  fonts: {
    display: "Unbounded",
    body: "Inter",
    mono: "JetBrains Mono",
  },
  ease: {
    out: Easing.bezier(0.16, 1, 0.3, 1), // entrances
    inOut: Easing.bezier(0.83, 0, 0.17, 1), // camera + focus moves
    in: Easing.bezier(0.7, 0, 0.84, 0), // exits only
    push: Easing.bezier(0.55, 0, 0.9, 0.45), // camera accelerating into the screen
  },
  spring: {
    snappy: { damping: 14, stiffness: 160, mass: 0.6 }, // UI pops, words
    smooth: { damping: 20, stiffness: 90, mass: 1 }, // big elements, camera
    morph: { damping: 13, stiffness: 120, mass: 0.8 }, // pill -> card
  },
  timing,
} as const;

export const T = timing;
export type ShotName = keyof typeof timing.shots;
