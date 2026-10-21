// iso.tsx — a tiny isometric engine: true 30° projection, shaded boxes, soft
// floor shadows, flat artwork mapped onto floor/wall planes, and a person.
import React from "react";
import { K, shade } from "./theme";

export const C30 = Math.cos(Math.PI / 6);
export const S30 = 0.5;

// world (x right-down, y left-down, z up), in tiles -> screen px
export const iso = (x: number, y: number, z: number, u: number): [number, number] => [(x - y) * C30 * u, (x + y) * S30 * u - z * u];
const pts = (p: [number, number][]) => p.map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`).join(" ");

export const IsoDefs: React.FC = () => (
  <defs>
    <filter id="iso-soft" filterUnits="userSpaceOnUse" x={-4000} y={-4000} width={8000} height={8000}>
      <feGaussianBlur stdDeviation="9" />
    </filter>
    <filter id="iso-glow" filterUnits="userSpaceOnUse" x={-4000} y={-4000} width={8000} height={8000}>
      <feGaussianBlur stdDeviation="14" result="b" />
      <feMerge>
        <feMergeNode in="b" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
);

export type BoxProps = {
  x: number;
  y: number;
  z?: number;
  w: number;
  d: number;
  h: number;
  u: number;
  color: string;
  top?: string;
  opacity?: number;
  edge?: boolean;
};

// three visible faces: lit top, mid left (y+d), dark right (x+w)
export const IsoBox: React.FC<BoxProps> = ({ x, y, z = 0, w, d, h, u, color, top, opacity = 1, edge = true }) => {
  const P = (a: number, b: number, c: number) => iso(a, b, c, u);
  const tp = [P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)];
  const left = [P(x, y + d, z + h), P(x + w, y + d, z + h), P(x + w, y + d, z), P(x, y + d, z)];
  const right = [P(x + w, y, z + h), P(x + w, y + d, z + h), P(x + w, y + d, z), P(x + w, y, z)];
  return (
    <g opacity={opacity}>
      <polygon points={pts(left)} fill={shade(color, -0.12)} />
      <polygon points={pts(right)} fill={shade(color, -0.32)} />
      <polygon points={pts(tp)} fill={top ?? shade(color, 0.14)} />
      {edge && <polyline points={pts([tp[3], tp[0], tp[1]])} fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth={1.4} />}
      {edge && <polyline points={pts([tp[3], tp[2], tp[1]])} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={1.2} />}
    </g>
  );
};

// soft contact shadow on the floor, offset toward the light's far side
export const IsoShadow: React.FC<{ x: number; y: number; z?: number; w: number; d: number; u: number; spread?: number; opacity?: number }> = ({
  x,
  y,
  z = 0,
  w,
  d,
  u,
  spread = 0.25,
  opacity = 1,
}) => {
  const P = (a: number, b: number) => iso(a, b, z, u);
  const s = spread;
  return (
    <polygon
      points={pts([P(x - s * 0.2, y + s), P(x + w + s, y + s), P(x + w + s, y + d + s * 2.2), P(x - s * 0.2, y + d + s * 2.2)])}
      fill={K.shadow}
      filter="url(#iso-soft)"
      opacity={opacity}
    />
  );
};

// map flat artwork (in tile units) onto a plane
type PlaneKind = "floor" | "wallX" | "wallY";
export const IsoPlane: React.FC<{ kind: PlaneKind; x: number; y: number; z: number; u: number; children: React.ReactNode }> = ({
  kind,
  x,
  y,
  z,
  u,
  children,
}) => {
  const [ox, oy] = iso(x, y, z, u);
  const m =
    kind === "floor"
      ? [C30 * u, S30 * u, -C30 * u, S30 * u]
      : kind === "wallX" // plane y = const: u along +x, v downward (-z)
        ? [C30 * u, S30 * u, 0, u]
        : [-C30 * u, S30 * u, 0, u]; // plane x = const: u along +y
  return <g transform={`matrix(${m.join(" ")} ${ox} ${oy})`}>{children}</g>;
};

// A seated/standing person drawn as an upright sprite at a projected point.
// `type` 0..1 drives alternating hand taps; `cheer` raises both arms.
export const Person: React.FC<{
  x: number;
  y: number;
  z: number;
  u: number;
  shirt: string;
  hair?: string;
  scale?: number;
  type?: number;
  cheer?: number;
  bob?: number;
  headTilt?: number;
}> = ({ x, y, z, u, shirt, hair = K.hair, scale = 1, type = 0, cheer = 0, bob = 0, headTilt = 0 }) => {
  const [px, py] = iso(x, y, z, u);
  const s = u * 0.9 * scale;
  const tapL = Math.max(0, Math.sin(type * Math.PI * 2)) * 0.08 * s;
  const tapR = Math.max(0, -Math.sin(type * Math.PI * 2)) * 0.08 * s;
  const armUp = cheer;
  const sh = { lx: -0.34 * s, rx: 0.34 * s, y: -1.18 * s };
  const hand = (side: -1 | 1, tap: number) => {
    const down = { x: side * 0.42 * s, y: -0.55 * s - tap };
    const up = { x: side * 0.62 * s, y: -1.95 * s };
    return { x: down.x + (up.x - down.x) * armUp, y: down.y + (up.y - down.y) * armUp };
  };
  const hl = hand(-1, tapL);
  const hr = hand(1, tapR);
  return (
    <g transform={`translate(${px} ${py - bob * s})`}>
      <ellipse cx={0} cy={0.04 * s} rx={0.55 * s} ry={0.2 * s} fill={K.shadow} filter="url(#iso-soft)" />
      {/* torso */}
      <path
        d={`M ${-0.42 * s} 0 L ${-0.38 * s} ${-1.05 * s} Q ${-0.36 * s} ${-1.3 * s} 0 ${-1.32 * s} Q ${0.36 * s} ${-1.3 * s} ${0.38 * s} ${-1.05 * s} L ${0.42 * s} 0 Z`}
        fill={shirt}
      />
      <path d={`M ${0.05 * s} ${-1.3 * s} Q ${0.36 * s} ${-1.28 * s} ${0.38 * s} ${-1.05 * s} L ${0.42 * s} 0 L ${0.12 * s} 0 Z`} fill={shade(shirt, -0.25)} />
      {/* arms */}
      <path d={`M ${sh.lx} ${sh.y} Q ${-0.5 * s} ${-0.9 * s} ${hl.x} ${hl.y}`} stroke={shade(shirt, -0.08)} strokeWidth={0.2 * s} fill="none" strokeLinecap="round" />
      <path d={`M ${sh.rx} ${sh.y} Q ${0.5 * s} ${-0.9 * s} ${hr.x} ${hr.y}`} stroke={shade(shirt, -0.2)} strokeWidth={0.2 * s} fill="none" strokeLinecap="round" />
      <circle cx={hl.x} cy={hl.y} r={0.1 * s} fill={K.skin} />
      <circle cx={hr.x} cy={hr.y} r={0.1 * s} fill={K.skinShade} />
      {/* head */}
      <g transform={`rotate(${headTilt} 0 ${-1.55 * s})`}>
        <rect x={-0.08 * s} y={-1.48 * s} width={0.16 * s} height={0.2 * s} fill={K.skinShade} />
        <circle cx={0} cy={-1.72 * s} r={0.3 * s} fill={K.skin} />
        <path d={`M ${-0.31 * s} ${-1.72 * s} Q ${-0.32 * s} ${-2.08 * s} 0 ${-2.06 * s} Q ${0.34 * s} ${-2.06 * s} ${0.31 * s} ${-1.74 * s} Q ${0.1 * s} ${-1.9 * s} ${-0.31 * s} ${-1.72 * s} Z`} fill={hair} />
      </g>
    </g>
  );
};
