import React from "react";
import { interpolate } from "remotion";
import { rng } from "../../kl/skyline";
import { ig, neon, NeonDefs, NeonPath, tube } from "../neonKit";

const C = neon.colors;
const W = 1080;
const H = 1920;
const HORIZON = 1150;
const VP = { x: 540, y: HORIZON };

// Kinabalu's granite crown: Low's Peak, the Donkey's Ears, South Peak...
const RIDGE: [number, number][] = [
  [-30, 1120], [120, 1060], [250, 968], [330, 905], [384, 862], [404, 822], [420, 790], [438, 814],
  [458, 762], [476, 800], [498, 724], [516, 702], [532, 744], [548, 694], [564, 738], [588, 700],
  [616, 650], [646, 708], [676, 688], [700, 740], [728, 718], [758, 790], [800, 832], [862, 884],
  [960, 962], [1110, 1042],
];
const ridgeLine = RIDGE.map(([x, y], i) => `${i ? "L" : "M"} ${x} ${y}`).join(" ");
const ridgeFill = `${ridgeLine} L 1110 ${HORIZON + 4} L -30 ${HORIZON + 4} Z`;
const FOOTHILLS =
  "M -30 1150 C 120 1112 240 1096 360 1108 C 480 1120 560 1090 700 1098 C 820 1104 960 1084 1110 1112";

const STARS = (() => {
  const r = rng(808);
  return Array.from({ length: 120 }, () => ({ x: r() * W, y: r() * 760, s: 0.6 + r() * 1.8, p: r() * 6 }));
})();

export const Kinabalu: React.FC<{ f: number; dur: number; fps: number }> = ({ f, dur, fps }) => {
  const sun = tube(f, ig("kinabalu", "sun", fps), dur, 1);
  const mtn = tube(f, ig("kinabalu", "mountain", fps), dur, 2);
  const grid = tube(f, ig("kinabalu", "grid", fps), dur, 3);
  const draw = interpolate(f, [ig("kinabalu", "mountain", fps), ig("kinabalu", "mountain", fps) + Math.round(1.3 * fps)], [0, 1], {
    easing: neon.ease.out,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const push = interpolate(f, [0, dur], [1.06, 1], { easing: neon.ease.out, extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const phase = (f * 0.035) % 1;
  const rows = 14;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute" }}>
      <NeonDefs />
      <defs>
        <linearGradient id="kin-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.bg} />
          <stop offset="65%" stopColor="#1A0630" />
          <stop offset="100%" stopColor="#45104F" />
        </linearGradient>
        <linearGradient id="kin-sun" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.yellow} />
          <stop offset="55%" stopColor={C.amber} />
          <stop offset="100%" stopColor={C.magenta} />
        </linearGradient>
        <radialGradient id="kin-halo">
          <stop offset="0%" stopColor={C.magenta} stopOpacity={0.55} />
          <stop offset="100%" stopColor={C.magenta} stopOpacity={0} />
        </radialGradient>
        <mask id="kin-slits">
          <rect x={0} y={0} width={W} height={H} fill="#fff" />
          {Array.from({ length: 8 }).map((_, i) => {
            const y = 930 + i * 30 + i * i * 2.2;
            return <rect key={i} x={0} y={y - ((f * 0.6) % 30)} width={W} height={3 + i * 2.2} fill="#000" />;
          })}
        </mask>
      </defs>
      <g transform={`translate(540 1100) scale(${push}) translate(-540 -1100)`}>
        <rect x={0} y={0} width={W} height={HORIZON} fill="url(#kin-sky)" />
        {STARS.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.s} fill={C.white} opacity={0.25 + 0.5 * (0.5 + 0.5 * Math.sin(f * 0.13 + s.p))} />
        ))}

        <circle cx={540} cy={960} r={560} fill="url(#kin-halo)" opacity={sun} />
        <circle cx={540} cy={960} r={300} fill="url(#kin-sun)" mask="url(#kin-slits)" opacity={sun > 0.05 ? sun : 0.06} />

        <path d={ridgeFill} fill="#0A0414" />
        <NeonPath d={FOOTHILLS} color={C.magenta} width={4} bright={mtn * 0.8} draw={draw} />
        <NeonPath d={ridgeLine} color={C.cyan} width={6} bright={mtn} draw={draw} />

        {/* synth grid floor, rows rushing toward the viewer */}
        <rect x={0} y={HORIZON} width={W} height={H - HORIZON} fill="#08020F" />
        <g filter="url(#neon-glow)" opacity={grid}>
          {Array.from({ length: rows }).map((_, k) => {
            const z = (k + phase) / rows;
            const y = HORIZON + (H - HORIZON) * Math.pow(z, 2.2);
            return <line key={k} x1={0} x2={W} y1={y} y2={y} stroke={C.magenta} strokeWidth={1 + z * 3.5} opacity={0.25 + z * 0.75} />;
          })}
          {Array.from({ length: 23 }).map((_, k) => {
            const bx = -1600 + k * (4280 / 22);
            return <line key={`v${k}`} x1={VP.x + (bx - VP.x) * 0.04} y1={HORIZON} x2={bx} y2={H} stroke={C.magenta} strokeWidth={2.4} opacity={0.75} />;
          })}
          <line x1={0} x2={W} y1={HORIZON} y2={HORIZON} stroke={C.pink} strokeWidth={3} />
        </g>
      </g>
    </svg>
  );
};
