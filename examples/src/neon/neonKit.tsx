// neonKit.tsx — palette, beat grid, fonts and the neon primitives every
// scene shares: a three-radius glow filter, a tube-with-hot-core path, and the
// deterministic flicker used when a sign powers on or dies.
import React from "react";
import { continueRender, delayRender, Easing, staticFile } from "remotion";
import timing from "./timing.json";

export const neon = {
  colors: {
    bg: "#06030D",
    wall: "#2A1830",
    mortar: "#0B0612",
    cyan: "#22F3FF",
    magenta: "#FF2BD6",
    pink: "#FF4FA0",
    yellow: "#FFE14D",
    amber: "#FF9E2C",
    green: "#39FF88",
    red: "#FF3B3B",
    white: "#F4F1FF",
    blue: "#3D7BFF",
    purple: "#9B5CFF",
    text: "#FFF6FF",
  },
  fonts: { script: "Pacifico", display: "Unbounded", sans: "Inter" },
  ease: {
    out: Easing.bezier(0.16, 1, 0.3, 1),
    inOut: Easing.bezier(0.83, 0, 0.17, 1),
    in: Easing.bezier(0.7, 0, 0.84, 0),
  },
  spring: {
    snappy: { damping: 14, stiffness: 160, mass: 0.6 },
    smooth: { damping: 20, stiffness: 90, mass: 1 },
    soft: { damping: 26, stiffness: 60, mass: 1.2 },
  },
  timing,
} as const;

export type NeonColor = keyof typeof neon.colors;

export const framesPerBeat = (fps: number) => (fps * 60) / timing.bpm;
export const beatFrame = (beat: number, fps: number) => Math.round(beat * framesPerBeat(fps));

export type SceneKey = keyof typeof timing.scenes;
export const SCENE_ORDER: SceneKey[] = ["kinabalu", "wayang", "nasi", "malaysia"];
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
// frame (within its scene) at which a named tube ignites
export const ig = <S extends SceneKey>(scene: S, key: keyof (typeof timing.ignite)[S], fps: number) =>
  beatFrame((timing.ignite[scene] as Record<string, number>)[key as string], fps);

export const NEON_TOTAL_BEATS =SCENE_ORDER.reduce((n, k) => n + timing.scenes[k], 0);

export const loadNeonFonts = () => {
  if (typeof document === "undefined") return;
  const handle = delayRender("Neon fonts");
  const faces = [
    new FontFace("Pacifico", `url(${staticFile("fonts/Pacifico.woff2")}) format("woff2")`),
    new FontFace("Unbounded", `url(${staticFile("fonts/Unbounded.woff2")}) format("woff2")`, { weight: "100 900" }),
    new FontFace("Inter", `url(${staticFile("fonts/Inter.woff2")}) format("woff2")`, { weight: "100 900" }),
  ];
  Promise.all(
    faces.map((f) => {
      document.fonts.add(f);
      return f.load();
    }),
  ).then(() => continueRender(handle));
};

// ---------- flicker ----------
// A real tube stutters before it holds: on, off, on-on, off... then steady.
// The patterns live in timing.json, shared with scripts/gen-neon.mjs, so every
// visible flicker has its buzz-click in the soundtrack.
export const IGNITE: readonly number[] = timing.flicker.ignite;
export const DIE: readonly number[] = timing.flicker.die;

const hash = (n: number) => {
  const s = Math.sin(n * 127.1) * 43758.5453;
  return s - Math.floor(s);
};

// brightness 0..1 for a tube that ignites at `on` and (optionally) dies at `off`
export const tube = (frame: number, on: number, off = Infinity, seed = 0) => {
  if (frame < on) return 0;
  const i = frame - on;
  let b = i < IGNITE.length ? IGNITE[i] : 1;
  // steady hum, with a rare dip that sells the "old sign" feel
  if (i >= IGNITE.length) b = 0.92 + 0.08 * Math.sin(frame * 1.7 + seed) - (hash(frame * 0.37 + seed) > 0.985 ? 0.6 : 0);
  const d = frame - (off - DIE.length);
  if (d >= 0) b *= d < DIE.length ? DIE[d] : 0;
  return Math.max(0, b);
};

// ---------- SVG primitives ----------
const mixWhite = (hex: string, amt: number) => {
  const n = parseInt(hex.slice(1), 16);
  const ch = (s: number) => Math.round(((n >> s) & 255) + (255 - ((n >> s) & 255)) * amt);
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
};

export const NeonDefs: React.FC<{ w?: number; h?: number }> = ({ w = 1080, h = 1920 }) => (
  <defs>
    <filter id="neon-glow" filterUnits="userSpaceOnUse" x={-1500} y={-1500} width={w + 3000} height={h + 3000}>
      <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="b1" />
      <feGaussianBlur in="SourceGraphic" stdDeviation="11" result="b2" />
      <feGaussianBlur in="SourceGraphic" stdDeviation="28" result="b3" />
      <feMerge>
        <feMergeNode in="b3" />
        <feMergeNode in="b2" />
        <feMergeNode in="b2" />
        <feMergeNode in="b1" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
);

export const NeonPath: React.FC<{
  d: string;
  color: string;
  width?: number;
  bright?: number;
  draw?: number;
  fill?: string;
  fillOpacity?: number;
}> = ({ d, color, width = 6, bright = 1, draw = 1, fill, fillOpacity = 0 }) => {
  if (bright <= 0.01) {
    // unlit tube: a dim glass outline is still faintly visible
    return <path d={d} stroke={color} strokeOpacity={0.12} strokeWidth={width * 0.7} fill="none" strokeLinecap="round" strokeLinejoin="round" />;
  }
  const dash = draw < 1 ? { pathLength: 1, strokeDasharray: "1 1", strokeDashoffset: 1 - draw } : {};
  return (
    <g filter="url(#neon-glow)" opacity={bright}>
      {fill && <path d={d} fill={fill} fillOpacity={fillOpacity} stroke="none" />}
      <path d={d} stroke={color} strokeWidth={width} fill="none" strokeLinecap="round" strokeLinejoin="round" {...dash} />
      <path d={d} stroke={mixWhite(color, 0.72)} strokeWidth={width * 0.38} fill="none" strokeLinecap="round" strokeLinejoin="round" {...dash} />
    </g>
  );
};

// HTML neon lettering: hot white-ish core, stacked colored glow
export const neonTextStyle = (color: string, bright: number, size: number): React.CSSProperties => ({
  color: bright > 0.05 ? mixWhite(color, 0.65) : color,
  opacity: bright > 0.05 ? bright : 0.14,
  textShadow:
    bright > 0.05
      ? `0 0 ${size * 0.04}px #fff, 0 0 ${size * 0.1}px ${color}, 0 0 ${size * 0.22}px ${color}, 0 0 ${size * 0.45}px ${color}, 0 0 ${size * 0.9}px ${color}`
      : "none",
});
