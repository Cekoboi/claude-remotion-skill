// camera.ts — beat-locked camera. Moves are keyframes that ARRIVE on a beat
// (ease-in-out over `move` beats); during holds the camera keeps a slow push.
// On top sits a rhythmic zoom pulse driven by the analyzed beats.json:
// downbeats get a bigger pulse, weaker beats a smaller one scaled by their
// measured strength. No random shake anywhere.
import { interpolate } from "remotion";
import { BEATS, EASE, FPB } from "./theme";

export type CamKey = { beat: number; x: number; y: number; zoom: number; move?: number };
export type Cam = { x: number; y: number; zoom: number };

export const camAt = (keys: CamKey[], beatNow: number): Cam => {
  let cur: Cam = { x: keys[0].x, y: keys[0].y, zoom: keys[0].zoom };
  let lastArrive = keys[0].beat;
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    const move = k.move ?? 1.5;
    if (beatNow < k.beat - move) break;
    const p = interpolate(beatNow, [k.beat - move, k.beat], [0, 1], { easing: EASE.inOut, extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    cur = { x: cur.x + (k.x - cur.x) * p, y: cur.y + (k.y - cur.y) * p, zoom: cur.zoom + (k.zoom - cur.zoom) * p };
    if (p >= 1) lastArrive = k.beat;
  }
  // slow push during holds so the frame never feels frozen
  const hold = Math.max(0, beatNow - lastArrive);
  return { ...cur, zoom: cur.zoom * (1 + Math.min(hold, 8) * 0.004) };
};

const PEAK = Math.max(...BEATS.beats.map((b) => b.strength));

// beat pulse: 0..~0.02 extra zoom, decaying ~0.25 s after each detected beat
export const beatPulse = (frame: number, fps: number) => {
  let p = 0;
  for (const b of BEATS.beats) {
    const dt = (frame - b.frame) / fps;
    if (dt < 0 || dt > 0.45) continue;
    const amp = b.downbeat ? 0.02 : 0.004 + 0.008 * (b.strength / PEAK);
    p += amp * Math.exp(-dt * 11);
  }
  return p;
};

// beats since the last downbeat (0..4) — for alternating rhythmic accents
export const barPhase = (frame: number) => (frame / FPB) % 4;

export const camTransform = (c: Cam, pulse = 0, cx = 540, cy = 960) =>
  `translate(${cx} ${cy}) scale(${c.zoom * (1 + pulse)}) translate(${-c.x} ${-c.y})`;
