// theme3.ts — "KL Night" palette: deep night base, ONE gold hero, cool accent.
// Never inline colors/easings in the KL components; everything comes from here.
import { Easing } from "remotion";
import timing from "./timing.json";

export const klTheme = {
  colors: {
    night: "#050816",
    nightHorizon: "#1B2552",
    duskTop: "#2A1B4D",
    duskHorizon: "#E0795E",
    hero: "#F5B83D", // THE hero color — max one element per frame
    accent: "#5EE7FF",
    text: "#F6F1E7",
    textDim: "#A9B0C8",
    steel: "#8FA3C7", // tower outlines + skin
    steelDark: "#1A2140",
    buildingFar: "#0D1330",
    buildingNear: "#121A3D",
    window: "#FFE2A8",
    towerLight: "#EAF2FF",
    water: "#060A1C",
  },
  fireworks: {
    white: "#FFF4E0",
    cyan: "#5EE7FF",
    pink: "#FF6B9A",
    warm: "#FFB86B",
  },
  fonts: {
    display: "Unbounded",
    body: "Inter",
    mono: "JetBrains Mono",
  },
  ease: {
    out: Easing.bezier(0.16, 1, 0.3, 1), // entrances
    inOut: Easing.bezier(0.83, 0, 0.17, 1), // moves
    in: Easing.bezier(0.7, 0, 0.84, 0), // exits only
  },
  spring: {
    snappy: { damping: 14, stiffness: 160, mass: 0.6 },
    smooth: { damping: 20, stiffness: 90, mass: 1 },
    bouncy: { damping: 11, stiffness: 170, mass: 0.7 },
  },
  timing,
} as const;

export type FireworkColor = keyof typeof klTheme.fireworks;

// beat grid — every scene boundary and firework lands on a beat
export const framesPerBeat = (fps: number) => (fps * 60) / timing.bpm;
export const beatFrame = (beat: number, fps: number) =>
  Math.round(beat * framesPerBeat(fps));

export const sceneFrames = (fps: number) => {
  const { hook, build, night, outro } = timing.scenes;
  const b = (n: number) => beatFrame(n, fps);
  return {
    hook: { from: 0, dur: b(hook) },
    build: { from: b(hook), dur: b(build) },
    night: { from: b(hook + build), dur: b(night) },
    outro: { from: b(hook + build + night), dur: b(outro) },
    total: b(hook + build + night + outro),
  };
};

export const KL_TOTAL_BEATS =
  timing.scenes.hook + timing.scenes.build + timing.scenes.night + timing.scenes.outro;
