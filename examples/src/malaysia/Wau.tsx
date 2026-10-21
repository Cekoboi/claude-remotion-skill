import React from "react";
import { myTheme } from "./theme5";

const K = myTheme.wau;

// Wau bulan in local units, centered on (0,0), ~300 wide × ~330 tall.
// MOTIF is the gold flower on the central disc — the match-cut point into batik.
export const MOTIF = { x: 0, y: -58, r: 24, flowerR: 15 };

const WING =
  "M -12 -100 C -54 -128 -126 -120 -160 -86 C -146 -46 -90 -20 -14 -14 Z";
const WING_PANEL =
  "M -24 -90 C -60 -110 -110 -104 -138 -84 C -124 -56 -80 -36 -24 -28 Z";
const BODY = "M -16 -100 L -14 -24 L -10 44 L 10 44 L 14 -24 L 16 -100 Z";
const HEAD = "M 0 -162 L -10 -126 L -16 -100 L 16 -100 L 10 -126 Z";
const TAIL = "M -10 40 Q -60 54 -118 24 Q -102 138 0 144 Q 102 138 118 24 Q 60 54 10 40 Z";
const TAIL_PANEL = "M -8 54 Q -55 66 -96 48 Q -84 118 0 126 Q 84 118 96 48 Q 55 66 8 54 Z";

export const MotifFlower: React.FC<{ cx: number; cy: number; r: number; color: string; center: string; petals?: number }> = ({
  cx,
  cy,
  r,
  color,
  center,
  petals = 8,
}) => (
  <g>
    {Array.from({ length: petals }).map((_, i) => (
      <ellipse
        key={i}
        cx={cx}
        cy={cy - r * 0.6}
        rx={r * 0.26}
        ry={r * 0.52}
        fill={color}
        transform={`rotate(${(360 / petals) * i} ${cx} ${cy})`}
      />
    ))}
    <circle cx={cx} cy={cy} r={r * 0.24} fill={center} />
  </g>
);

const Tassel: React.FC<{ x: number; y: number; sway: number }> = ({ x, y, sway }) => (
  <g transform={`rotate(${sway} ${x} ${y})`}>
    {[-6, 0, 6].map((dx, i) => (
      <path
        key={i}
        d={`M ${x} ${y} Q ${x + dx} ${y + 18} ${x + dx * 1.6} ${y + 34 + i * 3}`}
        stroke={i === 1 ? K.gold : K.red}
        strokeWidth={2.6}
        fill="none"
        strokeLinecap="round"
      />
    ))}
  </g>
);

const Wing: React.FC<{ flip?: boolean }> = ({ flip }) => (
  <g transform={flip ? "scale(-1 1)" : undefined}>
    <path d={WING} fill={K.red} stroke={K.gold} strokeWidth={3} strokeLinejoin="round" />
    <path d={WING_PANEL} fill={K.teal} stroke={K.gold} strokeWidth={2} />
    {/* awan larat — the classic scrolling-cloud motif, simplified */}
    <path d="M -36 -70 C -46 -84 -66 -82 -66 -70 C -66 -62 -56 -60 -52 -66" stroke={K.gold} strokeWidth={2.2} fill="none" strokeLinecap="round" />
    <path d="M -76 -74 C -86 -88 -106 -84 -104 -74 C -102 -66 -92 -66 -90 -72" stroke={K.gold} strokeWidth={2.2} fill="none" strokeLinecap="round" />
    <circle cx={-120} cy={-84} r={3} fill={K.cream} />
    <circle cx={-46} cy={-50} r={2.6} fill={K.cream} />
  </g>
);

export const Wau: React.FC<{
  x: number;
  y: number;
  scale: number;
  rot: number;
  frame: number;
  stringTo?: { x: number; y: number };
  opacity?: number;
}> = ({ x, y, scale, rot, frame, stringTo, opacity = 1 }) => {
  const sway = (phase: number) => Math.sin(frame * 0.22 + phase) * 14;
  return (
    <g opacity={opacity}>
      {stringTo && (
        <path
          d={`M ${x} ${y + 30 * scale} Q ${(x + stringTo.x) / 2 + 60} ${(y + stringTo.y) / 2 + 120} ${stringTo.x} ${stringTo.y}`}
          stroke={K.cream}
          strokeOpacity={0.55}
          strokeWidth={1.6}
          fill="none"
        />
      )}
      <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${scale})`}>
        {/* busur — the humming bow */}
        <path d="M -74 -126 Q 0 -196 74 -126" stroke={K.cream} strokeWidth={3} fill="none" strokeLinecap="round" />
        <line x1={-74} y1={-126} x2={74} y2={-126} stroke={K.cream} strokeOpacity={0.7} strokeWidth={1.2} />
        <Tassel x={-160} y={-86} sway={sway(0)} />
        <Tassel x={160} y={-86} sway={sway(1.3)} />
        <Tassel x={-118} y={24} sway={sway(2.1)} />
        <Tassel x={118} y={24} sway={sway(0.7)} />
        <Wing />
        <Wing flip />
        <path d={TAIL} fill={K.red} stroke={K.gold} strokeWidth={3} strokeLinejoin="round" />
        <path d={TAIL_PANEL} fill={K.teal} stroke={K.gold} strokeWidth={2} />
        {[-70, -42, -14, 14, 42, 70].map((cx, i) => (
          <circle key={i} cx={cx} cy={98 + Math.abs(cx) * -0.36 + 12} r={4} fill={i % 2 ? K.gold : K.cream} />
        ))}
        <path d={BODY} fill={K.red} stroke={K.gold} strokeWidth={2.4} />
        <path d={HEAD} fill={K.cream} stroke={K.gold} strokeWidth={2.4} />
        <circle cx={MOTIF.x} cy={MOTIF.y} r={MOTIF.r} fill={K.teal} stroke={K.gold} strokeWidth={2.6} />
        <MotifFlower cx={MOTIF.x} cy={MOTIF.y} r={MOTIF.flowerR} color={K.gold} center={K.red} />
        <circle cx={0} cy={10} r={7} fill={K.gold} />
      </g>
    </g>
  );
};
