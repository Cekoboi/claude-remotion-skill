// theme5.ts — "Tanah Airku" palette. One hero (Jalur Gemilang yellow) used on at
// most one element per frame; each scene has its own light, all defined here.
import { continueRender, delayRender, Easing, staticFile } from "remotion";
import timing from "./timing.json";

export const myTheme = {
  colors: {
    hero: "#FFCC00", // Jalur Gemilang yellow
    text: "#FFF8EC",
    textDim: "#F3E3C8",
    ink: "#1B1530",
  },
  sawah: {
    skyTop: "#4E6FAE",
    skyMid: "#F4A88E",
    horizon: "#FFE0B0",
    sun: "#FFF3D6",
    mountainFar: "#A497BC",
    mountainNear: "#857FA6",
    paddy: ["#8DBF4B", "#7AB03F", "#9CC855", "#6FA638"],
    water: "#FFE6C2",
    palm: "#3E4A5E",
    stalk: "#4F8A2A",
    grain: "#D9C46A",
    egret: "#FFFFFF",
  },
  pantai: {
    skyTop: "#3A2A5C",
    skyMid: "#E8604C",
    horizon: "#FFB25E",
    sun: "#FFD98A",
    seaTop: "#E58052",
    seaBottom: "#2E1E40",
    wave: ["#7A3C55", "#5A2B4E", "#3B2045"],
    crest: "#FFB98A",
    glitter: "#FFE3A8",
    silhouette: "#24162F",
  },
  bunga: {
    bg: "#0E2A3B",
    batikLine: "#E3B54A",
    batikDye: ["#1F5E63", "#7A2238", "#C2873A"],
    petalDark: "#7A0A1E",
    petal: "#E3123B",
    petalEdge: "#FF5A72",
    leaf: "#2F7D46",
    leafDark: "#1D5A31",
    pollen: "#FFD23F",
  },
  jalur: {
    skyTop: "#21407A",
    skyMid: "#6C7FB8",
    horizon: "#F6C27A",
    red: "#CC0001",
    white: "#FFFFFF",
    blue: "#010066",
    yellow: "#FFCC00",
    pole: "#D8D2C4",
    cloud: "#FFE9D2",
  },
  wau: {
    red: "#C8102E",
    teal: "#0E2A3B",
    gold: "#E3B54A",
    cream: "#FFF1D0",
    green: "#1F7A5A",
  },
  fonts: {
    serif: "Fraunces",
    sans: "Inter",
  },
  ease: {
    out: Easing.bezier(0.16, 1, 0.3, 1), // entrances
    inOut: Easing.bezier(0.83, 0, 0.17, 1), // moves
    in: Easing.bezier(0.7, 0, 0.84, 0), // exits only
  },
  spring: {
    snappy: { damping: 14, stiffness: 160, mass: 0.6 },
    smooth: { damping: 20, stiffness: 90, mass: 1 },
    soft: { damping: 26, stiffness: 60, mass: 1.2 },
    bouncy: { damping: 11, stiffness: 170, mass: 0.7 },
  },
  timing,
} as const;

export const framesPerBeat = (fps: number) => (fps * 60) / timing.bpm;
export const beatFrame = (beat: number, fps: number) => Math.round(beat * framesPerBeat(fps));

export type SceneKey = keyof typeof timing.scenes;
export const SCENE_ORDER: SceneKey[] = ["sawah", "pantai", "bunga", "jalur"];

export const sceneFrames = (fps: number) => {
  let beat = 0;
  const out = {} as Record<SceneKey, { from: number; dur: number }>;
  for (const k of SCENE_ORDER) {
    const from = beatFrame(beat, fps);
    beat += timing.scenes[k];
    out[k] = { from, dur: beatFrame(beat, fps) - from };
  }
  return { ...out, total: beatFrame(beat, fps) };
};

export const MY_TOTAL_BEATS = SCENE_ORDER.reduce((n, k) => n + timing.scenes[k], 0);

// Self-hosted fonts (public/fonts) — call once at module scope from Root
export const loadMyFonts = () => {
  if (typeof document === "undefined") return;
  const handle = delayRender("Tanah Airku fonts");
  const faces = [
    new FontFace("Fraunces", `url(${staticFile("fonts/Fraunces.woff2")}) format("woff2")`, { weight: "100 900" }),
    new FontFace("Fraunces", `url(${staticFile("fonts/Fraunces-Italic.woff2")}) format("woff2")`, {
      weight: "100 900",
      style: "italic",
    }),
    new FontFace("Inter", `url(${staticFile("fonts/Inter.woff2")}) format("woff2")`, { weight: "100 900" }),
  ];
  Promise.all(
    faces.map((f) => {
      document.fonts.add(f);
      return f.load();
    }),
  ).then(() => continueRender(handle));
};
