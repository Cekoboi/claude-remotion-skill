import React from "react";
import { interpolate, spring } from "remotion";
import { MotifFlower } from "../Wau";
import { myTheme } from "../theme5";

const C = myTheme.bunga;
const W = 1080;
const H = 1920;
export const BLOOM_CENTER = { x: 540, y: 900 };

// half-drop batik grid: rows 135px apart, alternate rows shifted half a tile
const MOTIFS = (() => {
  const out: { x: number; y: number; d: number; i: number }[] = [];
  let i = 0;
  for (let r = -7; r <= 8; r++) {
    const y = BLOOM_CENTER.y + r * 135;
    const off = r % 2 === 0 ? 0 : 135;
    for (let x = BLOOM_CENTER.x + off - 270 * 3; x <= W + 140; x += 270) {
      if (x < -140) continue;
      out.push({ x, y, d: Math.hypot(x - BLOOM_CENTER.x, y - BLOOM_CENTER.y), i: i++ });
    }
  }
  return out;
})();

const drawOn = (p: number) => ({ pathLength: 1, strokeDasharray: "1 1", strokeDashoffset: 1 - p });

const ramp = (v: number, a: number, b: number) =>
  interpolate(v, [a, b], [0, 1], { easing: myTheme.ease.out, extrapolateLeft: "clamp", extrapolateRight: "clamp" });

// a canting draws each motif: petals, a dotted ring (isen-isen), four leaves;
// dye floods in after the wax line has passed
const BatikMotif: React.FC<{ x: number; y: number; p: number; dye: number; i: number; center?: boolean }> = ({ x, y, p, dye, i, center }) => {
  const dyeColor = C.batikDye[i % C.batikDye.length];
  return (
    <g>
      {[45, 135, 225, 315].map((a) => (
        <path
          key={a}
          d={`M ${x} ${y - 70} Q ${x + 26} ${y - 100} ${x} ${y - 128} Q ${x - 26} ${y - 100} ${x} ${y - 70} Z`}
          transform={`rotate(${a} ${x} ${y})`}
          fill={dyeColor}
          fillOpacity={dye * 0.6}
          stroke={C.batikLine}
          strokeWidth={2.2}
          {...drawOn(p)}
        />
      ))}
      <circle cx={x} cy={y} r={62} fill="none" stroke={C.batikLine} strokeWidth={2.6} strokeDasharray="0.1 11" strokeLinecap="round" opacity={p} />
      {center ? (
        <MotifFlower cx={x} cy={y} r={46} color={C.batikLine} center={myTheme.wau.red} />
      ) : (
        Array.from({ length: 8 }).map((_, k) => (
          <ellipse
            key={k}
            cx={x}
            cy={y - 46 * 0.6}
            rx={46 * 0.26}
            ry={46 * 0.52}
            transform={`rotate(${45 * k} ${x} ${y})`}
            fill={C.batikLine}
            fillOpacity={dye * 0.75}
            stroke={C.batikLine}
            strokeWidth={2}
            {...drawOn(p)}
          />
        ))
      )}
    </g>
  );
};

const PETAL =
  "M 0 0 C -52 -28 -118 -100 -100 -182 C -92 -214 -64 -236 -36 -230 C -24 -248 6 -252 20 -236 C 48 -248 84 -230 94 -196 C 118 -112 58 -30 0 0 Z";
const VEINS = [-60, -30, 0, 30, 60].map((dx) => `M 0 -10 Q ${dx * 0.6} -110 ${dx} -205`);
const ANTHERS = Array.from({ length: 22 }, (_, i) => ({
  t: 0.55 + (i / 22) * 0.35,
  side: i % 2 ? 1 : -1,
  len: 10 + (i % 3) * 4,
}));
const columnPoint = (t: number) => {
  // quadratic from (0,0) via (40,-120) to (150,-235)
  const p0 = [0, 0];
  const p1 = [40, -120];
  const p2 = [150, -235];
  return [
    (1 - t) * (1 - t) * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0],
    (1 - t) * (1 - t) * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1],
  ];
};

export const BungaRaya: React.FC<{ f: number; dur: number; fps: number; zoomIn: number }> = ({ f, dur, fps, zoomIn }) => {
  const t = f / fps;
  const bloomStart = Math.round(0.9 * fps);
  const exitP = interpolate(f, [dur - Math.round(0.5 * fps), dur], [0, 1], {
    easing: myTheme.ease.in,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const leaf = spring({ frame: f - bloomStart + 6, fps, config: myTheme.spring.smooth });
  const column = ramp(t, 2.0, 2.9);
  const breathe = 1 + Math.sin(f * 0.06) * 0.012;
  const flowerScale = 1.3 * breathe * (1 + exitP * 9);
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute" }}>
      <defs>
        <radialGradient id="petal" gradientUnits="userSpaceOnUse" cx={0} cy={0} r={250}>
          <stop offset="0%" stopColor={C.petalDark} />
          <stop offset="22%" stopColor={C.petalDark} />
          <stop offset="38%" stopColor={C.petal} />
          <stop offset="86%" stopColor={C.petal} />
          <stop offset="100%" stopColor={C.petalEdge} />
        </radialGradient>
        <linearGradient id="bunga-scrim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.bg} stopOpacity={0} />
          <stop offset="45%" stopColor={C.bg} stopOpacity={0.88} />
          <stop offset="100%" stopColor={C.bg} stopOpacity={0.95} />
        </linearGradient>
        <radialGradient id="bloom-glow">
          <stop offset="0%" stopColor={C.petal} stopOpacity={0.35} />
          <stop offset="100%" stopColor={C.petal} stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect x={0} y={0} width={W} height={H} fill={C.bg} />
      {/* camera: arrives zoomed in from the wau's motif, pulls back as the canting works outward */}
      <g transform={`translate(${BLOOM_CENTER.x} ${BLOOM_CENTER.y}) scale(${zoomIn}) translate(${-BLOOM_CENTER.x} ${-BLOOM_CENTER.y})`} opacity={interpolate(t, [1.6, 2.6], [1, 0.62], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}>
        {MOTIFS.map((m) => {
          const start = 0.15 + m.d / 900;
          return (
            <BatikMotif
              key={m.i}
              x={m.x}
              y={m.y}
              i={m.i}
              center={m.d === 0}
              p={m.d === 0 ? 1 : ramp(t, start, start + 0.8)}
              dye={ramp(t, start + 0.7, start + 1.4)}
            />
          );
        })}
      </g>
      <rect x={0} y={1280} width={W} height={H - 1280} fill="url(#bunga-scrim)" />
      <circle cx={BLOOM_CENTER.x} cy={BLOOM_CENTER.y} r={520} fill="url(#bloom-glow)" opacity={ramp(t, 1, 2.2)} />

      <g transform={`translate(${BLOOM_CENTER.x} ${BLOOM_CENTER.y}) rotate(${-8 + t * 2 + exitP * 50}) scale(${flowerScale})`}>
        {[
          [-150, 1],
          [30, -1],
        ].map(([deg, flip], i) => (
          <g key={i} transform={`rotate(${deg}) scale(${leaf * 1.05} ${leaf * flip})`}>
            <path d="M 0 0 C 60 -40 170 -50 290 0 C 170 50 60 40 0 0 Z" fill={C.leaf} />
            <path d="M 0 0 L 285 0" stroke={C.leafDark} strokeWidth={3} />
            {[60, 110, 160, 210].map((x) => (
              <path key={x} d={`M ${x} 0 Q ${x + 25} -18 ${x + 40} -28`} stroke={C.leafDark} strokeWidth={2} fill="none" />
            ))}
          </g>
        ))}
        {[0, 1, 2, 3, 4].map((i) => {
          const p = spring({ frame: f - bloomStart - i * 4, fps, config: myTheme.spring.soft });
          return (
            <g key={i} transform={`rotate(${i * 72 + (1 - p) * -70}) scale(${0.12 + 0.88 * p})`}>
              <path d={PETAL} fill="url(#petal)" stroke={C.petalDark} strokeOpacity={0.35} strokeWidth={1.5} />
              {VEINS.map((d, k) => (
                <path key={k} d={d} stroke={C.petalDark} strokeOpacity={0.28} strokeWidth={1.6} fill="none" />
              ))}
            </g>
          );
        })}
        <circle r={22} fill={C.petalDark} />
        {/* staminal column grows out, then anthers pop along it */}
        <path d="M 0 0 Q 40 -120 150 -235" stroke={C.petalEdge} strokeWidth={9} fill="none" strokeLinecap="round" {...drawOn(column)} />
        {ANTHERS.map((a, i) => {
          const [px, py] = columnPoint(a.t);
          const pop = spring({ frame: f - Math.round(2.6 * fps) - i, fps, config: myTheme.spring.bouncy });
          return (
            <g key={i} opacity={Math.min(1, pop * 1.5)}>
              <line x1={px} y1={py} x2={px + a.side * a.len * pop} y2={py - a.len * 0.6 * pop} stroke={C.petalEdge} strokeWidth={2} />
              <circle cx={px + a.side * a.len * pop} cy={py - a.len * 0.6 * pop} r={4.4 * pop} fill={C.pollen} />
            </g>
          );
        })}
        {[0, 1, 2, 3, 4].map((k) => {
          const pop = spring({ frame: f - Math.round(3.2 * fps) - k * 2, fps, config: myTheme.spring.bouncy });
          const a = (-140 + k * 25) * (Math.PI / 180);
          return <circle key={k} cx={150 + Math.cos(a) * 16 * pop} cy={-235 + Math.sin(a) * 16 * pop} r={6.5 * pop} fill={C.petalDark} />;
        })}
      </g>
    </svg>
  );
};
