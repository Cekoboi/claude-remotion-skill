// theme.ts — "laju" delivery promo: near-black stage, ONE teal hero (the route
// mark, the light, the buy button, the route on the map), warm cardboard for
// the box. Fonts are the self-hosted ones registered in Root.
import { Easing } from "remotion";
import timing from "./timing.json";

export const lajuTheme = {
  colors: {
    bg: "#06090B",
    hero: "#14B8A6",
    heroHot: "#5EEAD4",
    heroGlow: "rgba(20,184,166,0.55)",
    text: "#F1F5F4",
    dim: "#94A3A8",
    panel: "#111719",
    panelHi: "#1A2326",
    line: "rgba(255,255,255,0.09)",
    star: "#FBBF24",
    city: { ground: "#0B1017", top: "#263241", left: "#1A232E", right: "#131A22", edge: "#36475A" },
    jar: ["#F3D9A4", "#E7B96A", "#C98B3C"],
  },
  fonts: {
    display: "Unbounded",
    body: "Inter",
  },
  ease: {
    out: Easing.bezier(0.16, 1, 0.3, 1),
    inOut: Easing.bezier(0.83, 0, 0.17, 1),
    in: Easing.bezier(0.7, 0, 0.84, 0),
  },
  spring: {
    snappy: { damping: 14, stiffness: 160, mass: 0.6 },
    smooth: { damping: 20, stiffness: 90, mass: 1 },
    bouncy: { damping: 11, stiffness: 170, mass: 0.7 },
  },
} as const;

export const LT = timing;
// the brand's one shape: a route that ends in a pin (viewBox 0 0 200 120)
export const ROUTE_MARK = "M 16 96 C 56 96, 64 44, 104 44 S 150 76, 176 32";
export const PIN = { x: 176, y: 32 };
