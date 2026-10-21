import React from "react";
import { interpolate, spring } from "remotion";
import { rng } from "../../kl/skyline";
import { myTheme } from "../theme5";

const C = myTheme.jalur;
const W = 1080;
const H = 1920;

// Flag geometry (flat, 2:1). Canton spans 8 of the 14 stripes.
export const FLAG = { x: 150, y: 620, w: 840, h: 420 };
const STRIPE = FLAG.h / 14;
const CANTON = { w: FLAG.w / 2, h: STRIPE * 8 };
const SLICE = 10;

// 14-point star (Bintang Persekutuan)
const starPath = (cx: number, cy: number, R: number, r: number) => {
  let d = "";
  for (let i = 0; i < 28; i++) {
    const rad = i % 2 === 0 ? R : r;
    const a = -Math.PI / 2 + (i * Math.PI) / 14;
    d += `${i ? "L" : "M"} ${(cx + Math.cos(a) * rad).toFixed(2)} ${(cy + Math.sin(a) * rad).toFixed(2)} `;
  }
  return `${d}Z`;
};

const FlagFlat: React.FC = () => (
  <g>
    {Array.from({ length: 14 }).map((_, i) => (
      <rect key={i} x={0} y={i * STRIPE} width={FLAG.w} height={STRIPE + 0.5} fill={i % 2 === 0 ? C.red : C.white} />
    ))}
    <rect x={0} y={0} width={CANTON.w} height={CANTON.h} fill={C.blue} />
    <circle cx={CANTON.w * 0.36} cy={CANTON.h / 2} r={CANTON.h * 0.4} fill={C.yellow} />
    <circle cx={CANTON.w * 0.36 + CANTON.h * 0.1} cy={CANTON.h / 2} r={CANTON.h * 0.34} fill={C.blue} />
    <path d={starPath(CANTON.w * 0.68, CANTON.h / 2, CANTON.h * 0.36, CANTON.h * 0.16)} fill={C.yellow} />
  </g>
);

const CLOUDS = (() => {
  const r = rng(5);
  return Array.from({ length: 5 }, (_, i) => ({
    x: r() * W,
    y: 160 + i * 230 + r() * 60,
    s: 0.7 + r() * 0.8,
    v: 6 + r() * 10,
  }));
})();

const Cloud: React.FC<{ x: number; y: number; s: number }> = ({ x, y, s }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={0.42} filter="url(#cloud-soft)">
    {[
      [-90, 10, 60],
      [-30, -20, 80],
      [50, -6, 70],
      [110, 14, 48],
    ].map(([cx, cy, r], i) => (
      <circle key={i} cx={cx} cy={cy} r={r} fill="url(#cloud-fill)" />
    ))}
    <rect x={-150} y={14} width={300} height={60} fill="url(#cloud-fill)" rx={30} />
  </g>
);

export const Jalur: React.FC<{ f: number; dur: number; fps: number }> = ({ f, dur, fps }) => {
  const t = f / fps;
  const unfurl = spring({ frame: f - 4, fps, config: myTheme.spring.soft });
  // wave: amplitude grows from the pole, travels outward; settles after unfurl
  const amp = 26 + (1 - unfurl) * 30;
  const omega = 4.2;
  const k = (Math.PI * 2) / 520;
  const dy = (x: number) => amp * (x / FLAG.w) * Math.sin(k * x - omega * t);
  const slope = (x: number) => Math.cos(k * x - omega * t);
  const revealW = FLAG.w * unfurl;
  const slices = Math.ceil(FLAG.w / SLICE);
  const hills = interpolate(f, [0, dur], [0, -30], { easing: myTheme.ease.inOut, extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute" }}>
      <defs>
        <linearGradient id="jal-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.skyTop} />
          <stop offset="55%" stopColor={C.skyMid} />
          <stop offset="100%" stopColor={C.horizon} />
        </linearGradient>
        <linearGradient id="cloud-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.cloud} />
          <stop offset="100%" stopColor="#B8A6C8" />
        </linearGradient>
        <filter id="cloud-soft" x="-30%" y="-60%" width="160%" height="220%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
        <g id="flag-flat">
          <FlagFlat />
        </g>
        {Array.from({ length: slices }).map((_, i) => (
          <clipPath key={i} id={`fs-${i}`}>
            <rect x={i * SLICE - 0.6} y={-60} width={SLICE + 1.2} height={FLAG.h + 120} />
          </clipPath>
        ))}
        <clipPath id="flag-reveal">
          <rect x={-10} y={-80} width={revealW + 10} height={FLAG.h + 160} />
        </clipPath>
      </defs>
      <rect x={0} y={0} width={W} height={H} fill="url(#jal-sky)" />
      {CLOUDS.map((c, i) => (
        <Cloud key={i} x={((c.x + t * c.v + 300) % (W + 600)) - 300} y={c.y} s={c.s} />
      ))}

      {/* tiang bendera */}
      <rect x={FLAG.x - 12} y={FLAG.y - 30} width={10} height={H} fill={C.pole} />
      <rect x={FLAG.x - 6} y={FLAG.y - 30} width={3} height={H} fill="#FFFFFF" opacity={0.5} />
      <circle cx={FLAG.x - 7} cy={FLAG.y - 44} r={16} fill={C.yellow} />

      <g transform={`translate(${FLAG.x} ${FLAG.y})`} clipPath="url(#flag-reveal)">
        {Array.from({ length: slices }).map((_, i) => {
          const xm = i * SLICE + SLICE / 2;
          const s = slope(xm) * (xm / FLAG.w);
          return (
            <g key={i} clipPath={`url(#fs-${i})`}>
              <g transform={`translate(0 ${dy(xm).toFixed(2)})`}>
                <use href="#flag-flat" />
                <rect x={i * SLICE} y={0} width={SLICE} height={FLAG.h} fill={s > 0 ? "#FFFFFF" : "#000000"} opacity={Math.abs(s) * 0.2} />
              </g>
            </g>
          );
        })}
      </g>

      {/* bukit at dusk — gives the title a calm, dark floor */}
      <g transform={`translate(0 ${hills})`}>
        <path d="M 0 1480 C 200 1420 380 1440 560 1470 C 760 1430 900 1400 1080 1440 L 1080 1960 L 0 1960 Z" fill="#3D4F7C" />
        <path d="M 0 1560 C 260 1520 420 1560 640 1540 C 820 1520 960 1530 1080 1550 L 1080 1960 L 0 1960 Z" fill="#26325A" />
        <path d="M 0 1660 C 300 1630 600 1660 1080 1640 L 1080 1960 L 0 1960 Z" fill="#161D3A" />
      </g>
    </svg>
  );
};
