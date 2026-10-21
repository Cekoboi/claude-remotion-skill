import React from "react";
import { GROUND, rng } from "./skyline";
import { beatFrame, FireworkColor, klTheme } from "./theme3";

type Shell = (typeof klTheme.timing.fireworks)[number];
type Kind = "peony" | "ring" | "willow" | "heart";

const LAUNCH_S = 0.47; // rocket climb time — burst lands ON the beat

// per-kind physics: initial speed (px/s), drag (1/s), gravity (px/s²),
// life (s), trail length (s)
const PHYSICS: Record<
  Kind,
  { n: number; speed: number; drag: number; g: number; life: number; trail: number; width: number }
> = {
  peony: { n: 96, speed: 560, drag: 1.9, g: 150, life: 1.5, trail: 0.1, width: 4.6 },
  ring: { n: 56, speed: 470, drag: 1.7, g: 120, life: 1.2, trail: 0.08, width: 4.4 },
  willow: { n: 72, speed: 380, drag: 2.3, g: 130, life: 2.4, trail: 0.42, width: 3.2 },
  heart: { n: 80, speed: 0, drag: 0, g: 210, life: 2.6, trail: 0.06, width: 5 },
};
const HEART_HOLD_S = 1.25;

type Particle = { vx: number; vy: number; tx: number; ty: number; sparkle: number };

const particlesFor = (shell: Shell, index: number): Particle[] => {
  const kind = shell.kind as Kind;
  const ph = PHYSICS[kind];
  const r = rng(1000 + index * 77);
  return Array.from({ length: ph.n }, (_, i) => {
    const sparkle = r();
    if (kind === "heart") {
      // classic parametric heart, y flipped for screen space
      const a = (i / ph.n) * Math.PI * 2;
      const s = 11 * shell.size;
      return {
        vx: 0,
        vy: 0,
        tx: 16 * Math.pow(Math.sin(a), 3) * s,
        ty:
          -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) * s,
        sparkle,
      };
    }
    const angle = (i / ph.n) * Math.PI * 2 + (kind === "ring" ? 0 : (r() - 0.5) * 0.18);
    const speed =
      ph.speed * shell.size * (kind === "ring" ? 1 : kind === "willow" ? 0.85 + r() * 0.25 : 0.3 + Math.sqrt(r()) * 0.75);
    return { vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, tx: 0, ty: 0, sparkle };
  });
};

const position = (kind: Kind, p: Particle, t: number) => {
  const ph = PHYSICS[kind];
  if (kind === "heart") {
    const form = 1 - Math.exp(-7 * t);
    const fall = Math.max(0, t - HEART_HOLD_S);
    return { x: p.tx * form, y: p.ty * form + 0.5 * ph.g * fall * fall };
  }
  const d = (1 - Math.exp(-ph.drag * t)) / ph.drag;
  return { x: p.vx * d, y: p.vy * d + 0.5 * ph.g * t * t };
};

const alphaAt = (kind: Kind, t: number, sparkle: number, frame: number) => {
  const ph = PHYSICS[kind];
  const fadeFrom = kind === "heart" ? HEART_HOLD_S : ph.life * 0.5;
  const fade = Math.min(1, Math.max(0, (t - fadeFrom) / (ph.life - fadeFrom)));
  // ease-in fade: stays bright, then dies quickly
  let a = 1 - fade * fade;
  // end-of-life crackle: deterministic per-frame flicker
  if (fade > 0.25 && Math.sin(frame * 2.7 + sparkle * 40) > 0.35) a *= 0.25;
  return Math.max(0, a);
};

const SHELLS = klTheme.timing.fireworks.map((s, i) => ({
  ...s,
  particles: particlesFor(s, i),
}));

// Camera punch: summed decaying kick from every burst
export const burstPunch = (frame: number, fps: number) =>
  SHELLS.reduce((acc, s) => {
    const t = (frame - beatFrame(s.beat, fps)) / fps;
    return t >= 0 ? acc + 0.016 * s.size * Math.exp(-t * 9) : acc;
  }, 0);

// Sky flash behind the city: each burst briefly lights the sky in its color
export const FireworkFlashes: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => (
  <g>
    <defs>
      {SHELLS.map((s, i) => (
        <radialGradient key={i} id={`flash-${i}`}>
          <stop offset="0%" stopColor={klTheme.fireworks[s.color as FireworkColor]} stopOpacity={1} />
          <stop offset="100%" stopColor={klTheme.fireworks[s.color as FireworkColor]} stopOpacity={0} />
        </radialGradient>
      ))}
    </defs>
    {SHELLS.map((s, i) => {
      const t = (frame - beatFrame(s.beat, fps)) / fps;
      if (t < 0 || t > 0.9) return null;
      return (
        <circle
          key={i}
          cx={s.x}
          cy={s.y}
          r={560 * s.size}
          fill={`url(#flash-${i})`}
          opacity={0.34 * Math.exp(-t * 6)}
        />
      );
    })}
  </g>
);

export const Fireworks: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => (
  <g filter="url(#fwGlow)">
    {SHELLS.map((s, si) => {
      const kind = s.kind as Kind;
      const ph = PHYSICS[kind];
      const burst = beatFrame(s.beat, fps);
      const launch = burst - Math.round(LAUNCH_S * fps);
      const color = klTheme.fireworks[s.color as FireworkColor];
      if (frame < launch) return null;

      if (frame < burst) {
        // rocket: ease-out climb, slight wobble, fading spark trail
        const p = (frame - launch) / (burst - launch);
        const climb = (q: number) => 1 - Math.pow(1 - q, 3);
        const yAt = (q: number) => GROUND - (GROUND - s.y) * climb(Math.max(0, q));
        const x = s.x + Math.sin(p * 9 + si) * 3;
        return (
          <g key={si}>
            <line
              x1={x}
              y1={yAt(p - 0.22)}
              x2={x}
              y2={yAt(p)}
              stroke={klTheme.fireworks.warm}
              strokeWidth={3}
              strokeLinecap="round"
              opacity={0.7}
            />
            <circle cx={x} cy={yAt(p)} r={3.6} fill={klTheme.fireworks.white} />
          </g>
        );
      }

      const t = (frame - burst) / fps;
      if (t > ph.life) return null;
      const tail = Math.max(0, t - ph.trail);
      return (
        <g key={si}>
          {t < 0.12 && (
            <circle cx={s.x} cy={s.y} r={46 * s.size * (1 - t / 0.12)} fill={klTheme.fireworks.white} opacity={0.9} />
          )}
          {s.particles.map((p, pi) => {
            const a = alphaAt(kind, t, p.sparkle, frame + pi);
            if (a <= 0.01) return null;
            const head = position(kind, p, t);
            const back = position(kind, p, tail);
            return (
              <line
                key={pi}
                x1={s.x + back.x}
                y1={s.y + back.y}
                x2={s.x + head.x}
                y2={s.y + head.y}
                stroke={color}
                strokeWidth={ph.width}
                strokeLinecap="round"
                opacity={a}
              />
            );
          })}
          {kind === "ring" &&
            s.particles.slice(0, 16).map((p, pi) => {
              // inner white core so rings don't read hollow
              const a = alphaAt("peony", t * 1.3, p.sparkle, frame);
              const head = position("ring", p, t);
              return (
                <circle
                  key={`c${pi}`}
                  cx={s.x + head.x * 0.38}
                  cy={s.y + head.y * 0.38}
                  r={2.2}
                  fill={klTheme.fireworks.white}
                  opacity={a}
                />
              );
            })}
        </g>
      );
    })}
  </g>
);
