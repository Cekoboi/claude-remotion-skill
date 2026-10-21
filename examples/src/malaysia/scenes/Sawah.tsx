import React from "react";
import { interpolate } from "remotion";
import { rng } from "../../kl/skyline";
import { myTheme } from "../theme5";
import { Palm } from "./Palm";

const C = myTheme.sawah;
const W = 1080;
const H = 1920;
const HORIZON = 1000;

// perspective paddy bands: each band 18% taller than the one behind it
const BANDS = (() => {
  const n = 16;
  const r = 1.18;
  const a = (H - HORIZON) / ((Math.pow(r, n) - 1) / (r - 1));
  let y = HORIZON;
  return Array.from({ length: n }, (_, i) => {
    const h = a * Math.pow(r, i);
    const band = { y, h, i };
    y += h;
    return band;
  });
})();

const STALKS = (() => {
  const r = rng(314);
  return Array.from({ length: 96 }, (_, i) => ({
    x: -20 + i * 11.8 + r() * 8,
    h: 170 + r() * 150,
    lean: (r() - 0.5) * 40,
    phase: r() * 6,
    shade: r(),
  }));
})();

const EGRETS = [
  { delay: 18, y: 640, speed: 5.2, s: 1 },
  { delay: 26, y: 690, speed: 4.8, s: 0.85 },
  { delay: 31, y: 610, speed: 5.0, s: 0.75 },
  { delay: 70, y: 560, speed: 4.4, s: 0.6 },
];

const Egret: React.FC<{ x: number; y: number; s: number; frame: number; phase: number }> = ({ x, y, s, frame, phase }) => {
  const flap = Math.sin(frame * 0.45 + phase);
  const wy = -16 * flap;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d={`M -34 ${wy} Q -16 ${wy * 0.4 - 6} 0 0 Q 16 ${wy * 0.4 - 6} 34 ${wy}`} stroke={C.egret} strokeWidth={5} fill="none" strokeLinecap="round" />
      <ellipse cx={4} cy={2} rx={14} ry={5} fill={C.egret} />
      <path d="M 16 0 Q 24 -6 30 -4" stroke={C.egret} strokeWidth={3.4} fill="none" strokeLinecap="round" />
    </g>
  );
};

export const Sawah: React.FC<{ f: number; dur: number; fps: number }> = ({ f, dur, fps }) => {
  const t = f / fps;
  const sunY = interpolate(f, [0, dur], [1075, 830], {
    easing: myTheme.ease.out,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const push = interpolate(f, [0, dur], [1, 1.06], { easing: myTheme.ease.inOut, extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute" }}>
      <defs>
        <linearGradient id="saw-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.skyTop} />
          <stop offset="70%" stopColor={C.skyMid} />
          <stop offset="100%" stopColor={C.horizon} />
        </linearGradient>
        <radialGradient id="saw-sun">
          <stop offset="0%" stopColor={C.sun} stopOpacity={0.9} />
          <stop offset="30%" stopColor={C.horizon} stopOpacity={0.45} />
          <stop offset="100%" stopColor={C.horizon} stopOpacity={0} />
        </radialGradient>
        <linearGradient id="saw-mist" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity={0} />
          <stop offset="50%" stopColor="#FFF4E2" stopOpacity={0.55} />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
        </linearGradient>
      </defs>
      <g transform={`translate(540 1000) scale(${push}) translate(-540 -1000)`}>
        <rect x={0} y={0} width={W} height={HORIZON + 10} fill="url(#saw-sky)" />
        <circle cx={700} cy={sunY} r={460} fill="url(#saw-sun)" />
        <circle cx={700} cy={sunY} r={66} fill={C.sun} />
        {[
          [180, 380, 210, 26],
          [760, 300, 260, 22],
          [520, 520, 180, 16],
          [930, 600, 150, 14],
        ].map(([x, y, rx, ry], i) => (
          <ellipse key={i} cx={x + t * (8 + i * 4)} cy={y} rx={rx} ry={ry} fill="#FFE1CF" opacity={0.42} />
        ))}

        {/* Gunung Jerai and the near ridge */}
        <path d="M 0 1000 L 0 905 C 110 870 220 790 330 770 C 430 790 520 850 640 880 C 760 862 880 828 1080 868 L 1080 1000 Z" fill={C.mountainFar} />
        <path d="M 0 1000 L 0 955 C 200 932 300 962 460 952 C 640 934 800 905 1080 942 L 1080 1000 Z" fill={C.mountainNear} />
        {/* rumah kampung on stilts */}
        <g transform="translate(850 968)" fill={C.mountainNear} stroke="#6D6890" strokeWidth={1.5}>
          <rect x={-36} y={-24} width={72} height={26} fill="#77729A" />
          <path d="M -48 -22 L 0 -56 L 48 -22 Z" fill="#6A6590" />
          {[-30, -10, 10, 30].map((x) => (
            <line key={x} x1={x} y1={2} x2={x} y2={30} />
          ))}
        </g>
        <Palm x={760} y={1004} h={150} lean={-6} frame={f} color="#6A6590" />
        <Palm x={300} y={1006} h={120} lean={8} frame={f + 20} color="#6A6590" />

        {/* paddy terraces, flooded edges catching the sunrise */}
        {BANDS.map((b) => {
          const wave = 0.5 + 0.5 * Math.sin(f * 0.11 - b.i * 0.55);
          return (
            <g key={b.i}>
              <path
                d={`M 0 ${b.y + 2} Q 540 ${b.y - 3 - b.i * 0.6} 1080 ${b.y + 2} L 1080 ${b.y + b.h + 2} L 0 ${b.y + b.h + 2} Z`}
                fill={C.paddy[b.i % C.paddy.length]}
              />
              <rect x={0} y={b.y} width={W} height={b.h} fill="#E8F59A" opacity={0.14 * wave} />
              {b.i % 3 === 1 && (
                <line x1={0} x2={W} y1={b.y + 1} y2={b.y + 1} stroke={C.water} strokeWidth={1 + b.i * 0.35} opacity={0.55} />
              )}
            </g>
          );
        })}
        {Array.from({ length: 44 }).map((_, i) => {
          const bx = -1400 + i * ((W + 2800) / 43);
          return <line key={i} x1={540 + (bx - 540) * 0.02} y1={HORIZON + 4} x2={bx} y2={H} stroke="#3F7A22" strokeWidth={1 + Math.abs(bx - 540) / 900} opacity={0.22} />;
        })}
        <rect x={0} y={930} width={W} height={150} fill="url(#saw-mist)" transform={`translate(${Math.sin(t * 0.6) * 30} 0)`} />

        <Palm x={150} y={1060} h={330} lean={10} frame={f} color={C.palm} />
        <Palm x={990} y={1080} h={280} lean={-12} frame={f + 40} color={C.palm} />

        {EGRETS.map((e, i) => (
          <Egret key={i} x={-80 + Math.max(0, f - e.delay) * e.speed} y={e.y + Math.sin(f * 0.05 + i) * 10} s={e.s} frame={f} phase={i * 1.7} />
        ))}

        {/* foreground rice: a gust rolls across, stalks bend in sequence */}
        {STALKS.map((s, i) => {
          const gust = Math.sin(f * 0.09 - s.x * 0.012 + s.phase * 0.2);
          const tipX = s.x + s.lean + gust * 34;
          const tipY = H + 30 - s.h + Math.abs(gust) * 10;
          const color = s.shade > 0.5 ? C.stalk : "#5C9A33";
          return (
            <g key={i}>
              <path d={`M ${s.x} ${H + 40} Q ${s.x + s.lean * 0.3} ${H - s.h * 0.4} ${tipX} ${tipY}`} stroke={color} strokeWidth={4} fill="none" strokeLinecap="round" />
              {[0, 1, 2, 3, 4].map((k) => (
                <ellipse
                  key={k}
                  cx={tipX + (k + 1) * 4 * Math.sign(gust || 1)}
                  cy={tipY + k * 9}
                  rx={3.4}
                  ry={6}
                  fill={C.grain}
                  transform={`rotate(${20 * Math.sign(gust || 1)} ${tipX} ${tipY})`}
                />
              ))}
            </g>
          );
        })}
      </g>
    </svg>
  );
};
