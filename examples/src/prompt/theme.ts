// theme.ts — "Prompt to Video" palette: black stage, ONE violet hero (silk,
// mark, send button, the newest typed letters), and the two looks of the
// Kopi Senja logo intro the demo "generates" (sunset, then night).
import { Easing } from "remotion";
import timing from "./timing.json";

export const promptTheme = {
  colors: {
    bg: "#05040A",
    hero: "#8B5CF6",
    heroHot: "#C4B5FD",
    heroGlow: "rgba(139,92,246,0.55)",
    silk: ["#12062E", "#6D28D9", "#C4B5FD"] as [string, string, string],
    text: "#F5F3FF",
    dim: "#9CA3AF",
    panel: "#121117",
    panelHi: "#1B1A22",
    line: "rgba(255,255,255,0.09)",
    code: { tag: "#FF7A90", str: "#7CE38B", num: "#79B8FF", kw: "#C792EA", plain: "#E6E6E6" },
  },
  // the generated video's two looks
  looks: {
    day: { sky: ["#2B1206", "#C2410C", "#FDBA74"], disc: "#FFE2B0", ink: "#FFF7ED", tag: "Buka setiap petang" },
    night: { sky: ["#020617", "#1E3A8A", "#60A5FA"], disc: "#E0E7FF", ink: "#EEF2FF", tag: "Buka sampai lewat malam" },
  },
  fonts: {
    display: "Fraunces",
    body: "Inter",
    mono: "JetBrains Mono",
  },
  ease: {
    out: Easing.bezier(0.16, 1, 0.3, 1), // entrances
    inOut: Easing.bezier(0.83, 0, 0.17, 1), // camera whips, dolly
    in: Easing.bezier(0.7, 0, 0.84, 0), // exits, code stream
  },
  spring: {
    snappy: { damping: 14, stiffness: 160, mass: 0.6 },
    smooth: { damping: 20, stiffness: 90, mass: 1 },
    bouncy: { damping: 11, stiffness: 170, mass: 0.7 },
  },
} as const;

export const PT = timing;
export type Look = keyof typeof promptTheme.looks;
