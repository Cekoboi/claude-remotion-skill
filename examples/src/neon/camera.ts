// camera.ts — a deterministic virtual camera for MalaysiaNeon.
// Three layers, summed:
//   1. handheld: slow layered sines, always on
//   2. kick punches: a short zoom + drop on every kick in timing.camera.kicks
//      (the same list scripts/gen-neon.mjs uses to place the kick drum)
//   3. impacts: decaying shakes on every tube ignition, every power cut and
//      the hand-placed hits (gong, drop)
// Plus a per-scene move (crane, dolly, orbit, push) chosen by the edit.
import { interpolate } from "remotion";
import { beatFrame, neon, SCENE_ORDER, SceneKey, sceneFrames } from "./neonKit";

const CAM = neon.timing.camera;
const DIE_LEN = neon.timing.flicker.die.length;

type Impact = { frame: number; amp: number; decay: number; seed: number };

const impactsFor = (fps: number): Impact[] => {
  const S = sceneFrames(fps);
  const out: Impact[] = [];
  let seed = 1;
  for (const k of SCENE_ORDER) {
    const ignite = neon.timing.ignite[k] as Record<string, number>;
    for (const [name, beat] of Object.entries(ignite)) {
      if (name === "letterGap") continue;
      if (name === "letters") {
        for (let i = 0; i < 8; i++) {
          out.push({ frame: S[k].from + beatFrame(beat + i * ignite.letterGap, fps), amp: CAM.igniteAmp * 0.6, decay: 10, seed: seed++ });
        }
        continue;
      }
      out.push({ frame: S[k].from + beatFrame(beat, fps), amp: CAM.igniteAmp, decay: 9, seed: seed++ });
    }
    // power cut: the jolt lands as the picture collapses
    out.push({ frame: S[k].from + S[k].dur - Math.round(DIE_LEN / 2), amp: CAM.cutAmp, decay: 8, seed: seed++ });
  }
  for (const h of CAM.hits) out.push({ frame: beatFrame(h.beat, fps), amp: h.amp, decay: 6, seed: seed++ });
  return out;
};

const kickFrames = (fps: number) => {
  const out: number[] = [];
  for (const [from, to] of CAM.kicks) for (let beat = from; beat < to; beat++) out.push(beatFrame(beat, fps));
  return out;
};

let cache: { fps: number; impacts: Impact[]; kicks: number[] } | null = null;
const events = (fps: number) => {
  if (!cache || cache.fps !== fps) cache = { fps, impacts: impactsFor(fps), kicks: kickFrames(fps) };
  return cache;
};

export type CameraState = { x: number; y: number; rot: number; zoom: number; energy: number };

export const cameraAt = (frame: number, fps: number): CameraState => {
  const { impacts, kicks } = events(fps);
  // 1. handheld
  const hh = CAM.handheld;
  let x = (hh * (Math.sin(frame * 0.031) + 0.6 * Math.sin(frame * 0.071 + 1) + 0.3 * Math.sin(frame * 0.137 + 2))) / 1.9;
  let y = (hh * (Math.sin(frame * 0.027 + 3) + 0.6 * Math.sin(frame * 0.083 + 4) + 0.3 * Math.sin(frame * 0.151 + 5))) / 1.9;
  let rot = 0.3 * (Math.sin(frame * 0.019 + 6) + 0.5 * Math.sin(frame * 0.061 + 7)) / 1.5;
  let zoom = 0;
  let energy = 0;
  // 2. kick punches
  for (const k of kicks) {
    const t = (frame - k) / fps;
    if (t < 0 || t > 0.4) continue;
    const env = Math.exp(-t * 11);
    zoom += CAM.kickZoom * env;
    y += CAM.kickAmp * env * Math.cos(t * 40);
  }
  // 3. impacts: decaying, two incommensurate frequencies per axis
  for (const im of impacts) {
    const t = (frame - im.frame) / fps;
    if (t < 0 || t > 1.2) continue;
    const env = im.amp * Math.exp(-t * im.decay);
    x += env * Math.sin(t * 2 * Math.PI * 9 + im.seed);
    y += env * Math.sin(t * 2 * Math.PI * 7.3 + im.seed * 1.7);
    rot += env * 0.035 * Math.sin(t * 2 * Math.PI * 5.1 + im.seed * 2.3);
    zoom += env * 0.0009;
    energy += env;
  }
  return { x, y, rot, zoom, energy };
};

// per-scene camera move, local frame -> transform pieces
const clampEase = (f: number, dur: number, a: number, b: number, ease = neon.ease.inOut) =>
  interpolate(f, [0, dur], [a, b], { easing: ease, extrapolateLeft: "clamp", extrapolateRight: "clamp" });

export const sceneMove = (scene: SceneKey, f: number, dur: number) => {
  switch (scene) {
    case "kinabalu": // crane down onto the horizon while pushing in
      return { x: 0, y: clampEase(f, dur, -80, 10, neon.ease.out), rot: 0, scale: clampEase(f, dur, 1.1, 1.0, neon.ease.out) };
    case "wayang": // slow lateral dolly past the screen
      return { x: clampEase(f, dur, 60, -40), y: 0, rot: 0, scale: 1.04 };
    case "nasi": // gentle orbit: roll and push toward the plate
      return { x: 0, y: 0, rot: clampEase(f, dur, -1.8, 1.2), scale: clampEase(f, dur, 1.02, 1.09) };
    case "malaysia": // hold, then push in on the sign after the drop
      return { x: 0, y: clampEase(f, dur, 0, -30), rot: 0, scale: clampEase(f, dur, 1.0, 1.08) };
  }
};
