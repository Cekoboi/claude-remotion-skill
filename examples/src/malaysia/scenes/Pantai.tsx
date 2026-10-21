import React from "react";
import { interpolate } from "remotion";
import { rng } from "../../kl/skyline";
import { myTheme } from "../theme5";
import { Palm } from "./Palm";

const C = myTheme.pantai;
const W = 1080;
const H = 1920;
const HORIZON = 1100;

// sun-path glitter: short horizontal glints widening toward the viewer
const GLINTS = (() => {
  const r = rng(77);
  return Array.from({ length: 90 }, () => {
    const d = Math.pow(r(), 1.3);
    const y = HORIZON + 6 + d * 760;
    return {
      y,
      x: 540 + (r() - 0.5) * (50 + d * 520),
      w: 10 + d * 70 * (0.4 + r()),
      phase: r() * 20,
    };
  });
})();

const wavePath = (base: number, amp: number, len: number, speed: number, f: number) => {
  let d = `M -20 ${H}`;
  for (let x = -20; x <= W + 20; x += 18) {
    const y = base + Math.sin((x / len) * Math.PI * 2 + f * speed) * amp + Math.sin((x / (len * 0.43)) * Math.PI * 2 - f * speed * 1.6) * amp * 0.3;
    d += ` L ${x} ${y.toFixed(1)}`;
  }
  return `${d} L ${W + 20} ${H} Z`;
};

const crestPath = (base: number, amp: number, len: number, speed: number, f: number) => {
  let d = "";
  for (let x = -20; x <= W + 20; x += 18) {
    const y = base + Math.sin((x / len) * Math.PI * 2 + f * speed) * amp + Math.sin((x / (len * 0.43)) * Math.PI * 2 - f * speed * 1.6) * amp * 0.3;
    d += `${d ? " L" : "M"} ${x} ${y.toFixed(1)}`;
  }
  return d;
};

// perahu: high curled bow and stern, painted bands, a fisherman casting
const Perahu: React.FC<{ x: number; y: number; s: number; rot: number; frame: number }> = ({ x, y, s, rot, frame }) => {
  const cast = Math.sin(frame * 0.06) * 6;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <path
        d="M -150 -2 Q -176 -48 -166 -86 Q -158 -96 -150 -88 Q -160 -60 -138 -24 Q -70 -12 0 -10 Q 90 -12 128 -40 Q 136 -70 150 -74 Q 160 -40 140 -6 Q 100 26 0 30 Q -110 26 -150 -2 Z"
        fill={C.silhouette}
      />
      {/* bangau prow ornament */}
      <path d="M -166 -86 Q -186 -104 -170 -116 Q -156 -120 -156 -106" stroke={C.silhouette} strokeWidth={7} fill="none" strokeLinecap="round" />
      <path d="M -138 -24 Q -70 -12 0 -10 Q 90 -12 128 -40" stroke={C.crest} strokeWidth={2.4} fill="none" opacity={0.85} />
      <path d="M -140 4 Q 0 22 136 -10" stroke="#C8102E" strokeWidth={4} fill="none" opacity={0.55} />
      <path d="M -136 12 Q 0 30 130 0" stroke="#1F7A5A" strokeWidth={3} fill="none" opacity={0.5} />
      {/* fisherman */}
      <g transform={`rotate(${cast} 30 -10)`}>
        <line x1={30} y1={-10} x2={30} y2={-74} stroke={C.silhouette} strokeWidth={10} strokeLinecap="round" />
        <circle cx={30} cy={-88} r={11} fill={C.silhouette} />
        <path d="M 30 -60 L 66 -84 L 120 -140" stroke={C.silhouette} strokeWidth={4} fill="none" strokeLinecap="round" />
        <path d="M 120 -140 Q 150 -90 156 -20" stroke={C.crest} strokeWidth={1.2} fill="none" opacity={0.6} />
      </g>
    </g>
  );
};

const Gull: React.FC<{ x: number; y: number; s: number; frame: number }> = ({ x, y, s, frame }) => {
  const w = Math.sin(frame * 0.3 + x) * 8;
  return (
    <path
      d={`M ${x - 18 * s} ${y + w * s * 0.5} Q ${x - 8 * s} ${y - 8 * s} ${x} ${y} Q ${x + 8 * s} ${y - 8 * s} ${x + 18 * s} ${y + w * s * 0.5}`}
      stroke={C.silhouette}
      strokeWidth={3 * s}
      fill="none"
      strokeLinecap="round"
    />
  );
};

export const Pantai: React.FC<{ f: number; dur: number; fps: number }> = ({ f, dur, fps }) => {
  const t = f / fps;
  const sunY = interpolate(f, [-20, dur], [1040, 1118], { easing: myTheme.ease.inOut, extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const bob = Math.sin(f * 0.08) * 7;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute" }}>
      <defs>
        <linearGradient id="pan-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.skyTop} />
          <stop offset="62%" stopColor={C.skyMid} />
          <stop offset="100%" stopColor={C.horizon} />
        </linearGradient>
        <linearGradient id="pan-sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.seaTop} />
          <stop offset="100%" stopColor={C.seaBottom} />
        </linearGradient>
        <radialGradient id="pan-glow">
          <stop offset="0%" stopColor={C.sun} stopOpacity={0.85} />
          <stop offset="35%" stopColor={C.horizon} stopOpacity={0.4} />
          <stop offset="100%" stopColor={C.horizon} stopOpacity={0} />
        </radialGradient>
        <clipPath id="pan-above">
          <rect x={0} y={0} width={W} height={HORIZON} />
        </clipPath>
      </defs>
      <rect x={0} y={0} width={W} height={HORIZON} fill="url(#pan-sky)" />
      {[
        [260, 520, 300, 10],
        [800, 430, 340, 12],
        [560, 700, 420, 9],
        [180, 820, 260, 7],
        [900, 900, 300, 6],
      ].map(([x, y, rx, ry], i) => (
        <ellipse key={i} cx={x - t * (6 + i * 3)} cy={y} rx={rx} ry={ry} fill="#FFB59A" opacity={0.5} />
      ))}
      <g clipPath="url(#pan-above)">
        <circle cx={540} cy={sunY} r={560} fill="url(#pan-glow)" />
        <circle cx={540} cy={sunY} r={150} fill={C.sun} />
      </g>
      {/* distant island */}
      <path d="M 40 1100 C 90 1062 150 1050 210 1066 C 250 1056 300 1070 340 1100 Z" fill={C.silhouette} opacity={0.75} />

      <rect x={0} y={HORIZON} width={W} height={H - HORIZON} fill="url(#pan-sea)" />
      <rect x={540 - 170} y={HORIZON} width={340} height={8} fill={C.glitter} opacity={0.7} rx={4} />
      {GLINTS.map((g, i) => {
        const a = Math.max(0, Math.sin(f * 0.32 + g.phase));
        return <rect key={i} x={g.x - g.w / 2} y={g.y} width={g.w} height={2 + (g.y - HORIZON) / 260} rx={2} fill={C.glitter} opacity={a * 0.85} />;
      })}

      <Perahu x={230} y={1150 + bob * 0.3} s={0.32} rot={Math.sin(f * 0.07 + 1) * 2} frame={f + 30} />
      <Perahu x={690} y={1470 + bob} s={1} rot={Math.sin(f * 0.07) * 3} frame={f} />

      {[0, 1, 2].map((i) => {
        const base = [1520, 1660, 1800][i];
        const amp = [10, 15, 22][i];
        const len = [260, 330, 400][i];
        const speed = [0.05, 0.07, 0.09][i];
        return (
          <g key={i}>
            <path d={wavePath(base, amp, len, speed, f)} fill={C.wave[i]} />
            <path d={crestPath(base, amp, len, speed, f)} stroke={C.crest} strokeWidth={2 + i} fill="none" opacity={0.35 + i * 0.1} />
          </g>
        );
      })}

      {[
        [360, 520, 1],
        [420, 560, 0.7],
        [700, 470, 0.8],
      ].map(([x, y, s], i) => (
        <Gull key={i} x={x + t * 26 * s} y={y + Math.sin(t * 2 + i) * 8} s={s} frame={f + i * 9} />
      ))}

      <Palm x={-40} y={1960} h={720} lean={36} frame={f} color={C.silhouette} />
    </svg>
  );
};
