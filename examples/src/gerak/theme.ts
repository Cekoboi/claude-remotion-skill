// theme.ts — "Gerak 2.0" behind-the-build promo: deep plum stage, ONE lime
// hero (the glow, pressed tools, the mark), and Manggis the mangosteen mascot
// (purple body, green crown). Fonts are the self-hosted ones registered in Root.
import { Easing } from "remotion";
import timing from "./timing.json";

export const gerakTheme = {
  colors: {
    bg: "#0E0912",
    set: "#1A1520",
    panel: "#241D2B",
    panelHi: "#2F2638",
    line: "rgba(255,255,255,0.08)",
    hero: "#A3E635",
    heroHot: "#D9F99D",
    heroGlow: "rgba(163,230,53,0.5)",
    text: "#F4F1F7",
    dim: "#A59CB0",
    preview: "#3A3D44", // a dark neutral canvas: light canvases bloom into a lightbox, and the purple mascot needs a neutral ground
    tracks: ["#A3E635", "#8B5CF6", "#F59E0B", "#64748B"],
    manggis: { body: "#6B2A6F", shine: "#B06AB3", crown: "#5FA83A", face: "#1B0D1C" },
    pill: ["#A3E635", "#8B5CF6", "#F0ABFC"],
    halftone: "#4C2A55",
  },
  fonts: {
    display: "Unbounded",
    serif: "Fraunces",
    body: "Inter",
  },
  ease: {
    out: Easing.bezier(0.16, 1, 0.3, 1),
    inOut: Easing.bezier(0.83, 0, 0.17, 1),
    in: Easing.bezier(0.7, 0, 0.84, 0),
    back: Easing.out(Easing.back(1.7)), // shown in the app's graph AND used by the preview
  },
  spring: {
    snappy: { damping: 14, stiffness: 160, mass: 0.6 },
    smooth: { damping: 20, stiffness: 90, mass: 1 },
    bouncy: { damping: 11, stiffness: 170, mass: 0.7 },
  },
} as const;

export const GT = timing;
