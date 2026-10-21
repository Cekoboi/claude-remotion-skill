import React from "react";

// Coconut palm silhouette: curved trunk, drooping fronds with leaflets.
// The crown sways on a slow sine; each frond adds its own small phase.
const FROND_ANGLES = [-172, -148, -122, -96, -64, -34, -8, 152, 196];

const quad = (p0: number[], p1: number[], p2: number[], t: number) => [
  (1 - t) * (1 - t) * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0],
  (1 - t) * (1 - t) * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1],
];

export const Palm: React.FC<{ x: number; y: number; h: number; lean: number; frame: number; color: string }> = ({
  x,
  y,
  h,
  lean,
  frame,
  color,
}) => {
  const top = [x + lean * 4, y - h];
  const L = h * 0.58;
  const crownSway = Math.sin(frame * 0.045 + x) * 3;
  return (
    <g>
      <path
        d={`M ${x} ${y} Q ${x + lean * 0.6} ${y - h * 0.55} ${top[0]} ${top[1]}`}
        stroke={color}
        strokeWidth={h * 0.045}
        fill="none"
        strokeLinecap="round"
      />
      <g transform={`rotate(${crownSway} ${top[0]} ${top[1]})`}>
        {FROND_ANGLES.map((deg, i) => {
          const a = ((deg + Math.sin(frame * 0.07 + i * 1.3) * 4) * Math.PI) / 180;
          const end = [top[0] + Math.cos(a) * L, top[1] + Math.sin(a) * L * 0.55 + L * 0.42];
          const ctrl = [top[0] + Math.cos(a) * L * 0.62, top[1] + Math.sin(a) * L * 0.62 - L * 0.22];
          const leaflets = [];
          for (let k = 1; k <= 18; k++) {
            const t = k / 19;
            const p = quad(top, ctrl, end, t);
            const q = quad(top, ctrl, end, Math.min(1, t + 0.02));
            const nx = -(q[1] - p[1]);
            const ny = q[0] - p[0];
            const n = Math.hypot(nx, ny) || 1;
            const len = h * 0.11 * Math.sin(Math.PI * Math.min(1, t * 1.15));
            for (const side of [-1, 1]) {
              const tx = p[0] + (nx / n) * len * side + (q[0] - p[0]) * 4;
              const ty = p[1] + (ny / n) * len * side + len * 0.55;
              const bw = Math.max(1.5, len * 0.09);
              const ux = (q[0] - p[0]) / (Math.hypot(q[0] - p[0], q[1] - p[1]) || 1);
              const uy = (q[1] - p[1]) / (Math.hypot(q[0] - p[0], q[1] - p[1]) || 1);
              leaflets.push(
                <path
                  key={`${k}${side}`}
                  d={`M ${p[0] - ux * bw} ${p[1] - uy * bw} Q ${(p[0] + tx) / 2 + ux * bw} ${(p[1] + ty) / 2 + uy * bw - len * 0.08} ${tx} ${ty} Q ${(p[0] + tx) / 2 - ux * bw} ${(p[1] + ty) / 2 - uy * bw} ${p[0] + ux * bw} ${p[1] + uy * bw} Z`}
                  fill={color}
                />,
              );
            }
          }
          return (
            <g key={i}>
              <path d={`M ${top[0]} ${top[1]} Q ${ctrl[0]} ${ctrl[1]} ${end[0]} ${end[1]}`} stroke={color} strokeWidth={Math.max(2.5, h * 0.012)} fill="none" strokeLinecap="round" />
              {leaflets}
            </g>
          );
        })}
        <circle cx={top[0]} cy={top[1] + h * 0.02} r={h * 0.035} fill={color} />
      </g>
    </g>
  );
};
