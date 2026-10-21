// theme.ts — palette, fonts and the beat clock for "Kerja Makan Gaji vs Kerja Sendiri".
// Everything time-based reads timing.json (the plan) or beats.json (the analysis).
import { continueRender, delayRender, Easing, staticFile } from "remotion";
import beatsData from "./beats.json";
import timing from "./timing.json";

export const K = {
  navy900: "#060F2E",
  navy800: "#0A1A44",
  navy700: "#11275C",
  navy600: "#193575",
  navy500: "#234690",
  navy400: "#3A62B3",
  cyan: "#22D3EE",
  cyanDeep: "#0EA5C6",
  cyanSoft: "#A5F3FC",
  orange: "#FF8A3D",
  orangeDeep: "#E8661C",
  orangeSoft: "#FFD2B0",
  white: "#F4F8FF",
  mist: "#B4C3E6",
  coral: "#FF6B6B",
  skin: "#F2B48C",
  skinShade: "#D9946B",
  hair: "#1B1430",
  shadow: "rgba(3, 8, 28, 0.42)",
} as const;

export const FONTS = { display: "Unbounded", body: "Inter" };

export const EASE = {
  out: Easing.bezier(0.16, 1, 0.3, 1),
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  in: Easing.bezier(0.7, 0, 0.84, 0),
};
export const SPRING = {
  pop: { damping: 12, stiffness: 180, mass: 0.6 },
  smooth: { damping: 20, stiffness: 110, mass: 0.9 },
  soft: { damping: 24, stiffness: 70, mass: 1 },
};

export const T = timing;
export const BEATS = beatsData;
export const FPB = timing.framesPerBeat; // 15 frames per beat at 120 BPM / 30 fps
export const bf = (beat: number) => Math.round(beat * FPB); // beat -> frame
export const TOTAL_FRAMES = bf(timing.totalBeats);

const EVENTS = Object.fromEntries(timing.events.map((e) => [e.id, e.beat]));
export type EventId = (typeof timing.events)[number]["id"];
export const ev = (id: EventId) => EVENTS[id] as number; // event -> beat
export const evf = (id: EventId) => bf(ev(id)); // event -> frame

export type SceneId = (typeof timing.scenes)[number]["id"];
export const SCENE = Object.fromEntries(timing.scenes.map((s) => [s.id, s])) as Record<SceneId, { id: SceneId; from: number; beats: number }>;

export const loadKerjaFonts = () => {
  if (typeof document === "undefined") return;
  const handle = delayRender("Kerja fonts");
  const faces = [
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

export const shade = (hex: string, k: number) => {
  const n = parseInt(hex.slice(1), 16);
  const ch = (s: number) => {
    const c = (n >> s) & 255;
    return Math.round(k >= 0 ? c + (255 - c) * k : c * (1 + k));
  };
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
};
