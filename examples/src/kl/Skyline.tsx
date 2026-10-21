import React from "react";
import { interpolate } from "remotion";
import {
  Building,
  buildingPath,
  FAR,
  GROUND,
  KLT,
  kltPath,
  NEAR,
  PETRONAS,
  petronasFloors,
  petronasPath,
  petronasRibs,
  SKYBRIDGE,
  W,
} from "./skyline";
import { klTheme } from "./theme3";

const C = klTheme.colors;

// clamped, eased 0→1 ramp between two times (seconds)
export const ramp = (
  tS: number,
  from: number,
  to: number,
  easing: (n: number) => number = klTheme.ease.out,
) =>
  interpolate(tS, [from, to], [0, 1], {
    easing,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

// Build schedule, in seconds from the start of the build scene
export const BUILD = {
  klt: [0, 1.6],
  towerL: [0.2, 2.0],
  towerR: [0.4, 2.2],
  towerFill: [1.8, 2.9],
  bridge: [2.2, 2.9],
  windows: [2.4, 6.4],
  floors: [3.0, 6.2],
  podRing: 6.0,
} as const;

const FLOORS_L = petronasFloors(PETRONAS.left);
const FLOORS_R = petronasFloors(PETRONAS.right);
const RIBS = [...petronasRibs(PETRONAS.left), ...petronasRibs(PETRONAS.right)];

export const litWindowCount = (tS: number) => {
  let n = 0;
  for (const b of [...FAR, ...NEAR])
    for (const w of b.windows)
      if (tS >= BUILD.windows[0] + w.t * (BUILD.windows[1] - BUILD.windows[0])) n++;
  return n;
};

// stroke draw-on via normalized pathLength
const drawOn = (p: number) => ({
  pathLength: 1,
  strokeDasharray: "1 1",
  strokeDashoffset: 1 - p,
});

const Block: React.FC<{ b: Building; tS: number; frame: number }> = ({ b, tS, frame }) => {
  const near = b.layer === "near";
  const start = (near ? 0.8 : 0.3) + (b.x / W) * 1.2;
  const draw = ramp(tS, start, start + (near ? 0.9 : 1.0));
  const fill = ramp(tS, start + 0.6, start + 1.4);
  const [w0, w1] = BUILD.windows;
  return (
    <g>
      <path
        d={buildingPath(b)}
        fill={near ? C.buildingNear : C.buildingFar}
        fillOpacity={fill}
        stroke={C.steel}
        strokeOpacity={interpolate(fill, [0, 1], [0.85, near ? 0.22 : 0.12])}
        strokeWidth={1.6}
        {...drawOn(draw)}
      />
      {b.windows.map((w, i) => {
        const on = ramp(tS, w0 + w.t * (w1 - w0), w0 + w.t * (w1 - w0) + 0.15);
        if (on <= 0) return null;
        // idle breathe: each lit window shimmers on its own phase
        const breathe = 0.82 + 0.18 * Math.sin(frame * 0.09 + w.x * 0.31 + w.y * 0.17);
        return (
          <rect
            key={i}
            x={w.x}
            y={w.y}
            width={6}
            height={9}
            rx={1}
            fill={C.window}
            opacity={on * breathe * (near ? 0.9 : 0.62)}
          />
        );
      })}
    </g>
  );
};

const Tower: React.FC<{ cx: number; draw: number; fill: number; floors: typeof FLOORS_L; floorP: number; frame: number }> = ({
  cx,
  draw,
  fill,
  floors,
  floorP,
  frame,
}) => (
  <g>
    <path
      d={petronasPath(cx)}
      fill="url(#towerSkin)"
      fillOpacity={fill}
      stroke={C.steel}
      strokeWidth={2.2}
      strokeOpacity={interpolate(fill, [0, 1], [1, 0.55])}
      {...drawOn(draw)}
    />
    {floors.map((fl) => {
      const lit = Math.min(1, Math.max(0, floorP * floors.length - fl.i));
      if (lit <= 0) return null;
      return (
        <line
          key={fl.i}
          x1={fl.x1}
          x2={fl.x1 + (fl.x2 - fl.x1) * lit}
          y1={fl.y}
          y2={fl.y}
          stroke={C.towerLight}
          strokeWidth={2.6}
          opacity={0.55 + 0.25 * Math.sin(frame * 0.07 + fl.i * 0.6)}
        />
      );
    })}
  </g>
);

export const Skyline: React.FC<{ tS: number; frame: number }> = ({ tS, frame }) => {
  const kltDraw = ramp(tS, BUILD.klt[0], BUILD.klt[1]);
  const towerFill = ramp(tS, BUILD.towerFill[0], BUILD.towerFill[1]);
  const floorP = ramp(tS, BUILD.floors[0], BUILD.floors[1], klTheme.ease.inOut);
  const bridge = ramp(tS, BUILD.bridge[0], BUILD.bridge[1]);
  const pod = ramp(tS, BUILD.podRing, BUILD.podRing + 0.35);
  const towerGlow = floorP * 14;
  // aviation lights blink once the structures exist
  const blink = (phase: number) => (Math.sin(frame * 0.21 + phase) > 0.55 ? 1 : 0.15);
  return (
    <g>
      {FAR.map((b, i) => (
        <Block key={`f${i}`} b={b} tS={tS} frame={frame} />
      ))}

      {/* Menara KL */}
      <g>
        <path
          d={kltPath()}
          fill={C.steelDark}
          fillOpacity={ramp(tS, 1.2, 2.2)}
          stroke={C.steel}
          strokeWidth={2}
          {...drawOn(kltDraw)}
        />
        <rect
          x={KLT.cx - 52}
          y={KLT.podY - 2}
          width={104}
          height={14}
          rx={7}
          fill={C.accent}
          opacity={pod * (0.75 + 0.2 * Math.sin(frame * 0.12))}
          style={{ filter: `drop-shadow(0 0 ${10 * pod}px ${C.accent})` }}
          transform={`translate(${KLT.cx} ${KLT.podY + 5}) scale(${0.4 + 0.6 * pod} 1) translate(${-KLT.cx} ${-(KLT.podY + 5)})`}
        />
        <circle cx={KLT.cx} cy={372} r={3.5} fill="#FF4D4D" opacity={kltDraw >= 1 ? blink(0) : 0} />
      </g>

      {/* Petronas podium, towers, skybridge */}
      <rect
        x={PETRONAS.left - 110}
        y={GROUND - 54}
        width={PETRONAS.right - PETRONAS.left + 220}
        height={54}
        fill={C.steelDark}
        fillOpacity={towerFill}
        stroke={C.steel}
        strokeOpacity={0.4}
        strokeWidth={1.5}
        {...drawOn(ramp(tS, 0.6, 1.8))}
      />
      <g style={{ filter: `drop-shadow(0 0 ${towerGlow}px ${C.towerLight}55)` }}>
        <Tower cx={PETRONAS.left} draw={ramp(tS, BUILD.towerL[0], BUILD.towerL[1])} fill={towerFill} floors={FLOORS_L} floorP={floorP} frame={frame} />
        <Tower cx={PETRONAS.right} draw={ramp(tS, BUILD.towerR[0], BUILD.towerR[1])} fill={towerFill} floors={FLOORS_R} floorP={Math.max(0, floorP - 0.03)} frame={frame} />
        {RIBS.map((r, i) => (
          <line key={i} x1={r.x} x2={r.x} y1={r.y1} y2={r.y2} stroke={C.steel} strokeOpacity={0.18 * towerFill} strokeWidth={1.2} />
        ))}
        <g opacity={bridge} transform={`translate(${W / 2} ${SKYBRIDGE.y}) scale(${bridge} 1) translate(${-W / 2} ${-SKYBRIDGE.y})`}>
          <rect x={SKYBRIDGE.x1} y={SKYBRIDGE.y} width={SKYBRIDGE.x2 - SKYBRIDGE.x1} height={SKYBRIDGE.h} fill={C.steelDark} stroke={C.steel} strokeWidth={1.8} />
          <line x1={SKYBRIDGE.x1 + 4} x2={SKYBRIDGE.x2 - 4} y1={SKYBRIDGE.y + 8} y2={SKYBRIDGE.y + 8} stroke={C.towerLight} strokeWidth={2.4} opacity={0.4 + 0.5 * floorP} />
          <line x1={W / 2} y1={SKYBRIDGE.y + SKYBRIDGE.h} x2={SKYBRIDGE.x1} y2={SKYBRIDGE.legsY} stroke={C.steel} strokeWidth={2} />
          <line x1={W / 2} y1={SKYBRIDGE.y + SKYBRIDGE.h} x2={SKYBRIDGE.x2} y2={SKYBRIDGE.legsY} stroke={C.steel} strokeWidth={2} />
        </g>
        {[PETRONAS.left, PETRONAS.right].map((cx, i) => (
          <circle key={i} cx={cx} cy={332} r={3} fill="#FF4D4D" opacity={towerFill >= 1 ? blink(1.7 + i) : 0} />
        ))}
      </g>

      {NEAR.map((b, i) => (
        <Block key={`n${i}`} b={b} tS={tS} frame={frame} />
      ))}
    </g>
  );
};
