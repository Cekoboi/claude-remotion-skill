import React from "react";
import { interpolate } from "remotion";
import { ig, neon, NeonDefs, NeonPath, tube } from "../neonKit";

const C = neon.colors;
const W = 1080;
const H = 1920;
const SCREEN = { x: 90, y: 400, w: 900, h: 1000 };
const POHON = { x: 540, y: 960 };

// Pohon Beringin — the tree-of-life puppet that opens every Kelantan wayang kulit
const OUTLINE = "M 0 -380 C 60 -300 200 -160 220 20 C 235 170 140 300 0 340 C -140 300 -235 170 -220 20 C -200 -160 -60 -300 0 -380 Z";
const INNER = "M 0 -330 C 52 -262 174 -140 192 18 C 205 148 122 262 0 298 C -122 262 -205 148 -192 18 C -174 -140 -52 -262 0 -330 Z";
const TRUNK = "M 0 222 C -8 150 8 90 0 30 C -6 -60 6 -170 0 -280";
const BRANCHES = [
  "M 0 150 C -60 118 -118 82 -150 24",
  "M 0 150 C 60 118 118 82 150 24",
  "M 0 60 C -48 4 -96 -58 -112 -140",
  "M 0 60 C 48 4 96 -58 112 -140",
  "M 0 -40 C -36 -92 -58 -150 -50 -222",
  "M 0 -40 C 36 -92 58 -150 50 -222",
  "M -150 24 C -172 4 -170 -24 -150 -30",
  "M 150 24 C 172 4 170 -24 150 -30",
  "M -112 -140 C -132 -160 -122 -184 -104 -184",
  "M 112 -140 C 132 -160 122 -184 104 -184",
];
const DOOR = "M -62 300 L -62 236 Q 0 190 62 236 L 62 300";
const LEAVES: [number, number][] = [
  [-150, 24], [150, 24], [-112, -140], [112, -140], [-50, -222], [50, -222], [0, -280], [-96, 70], [96, 70],
  [-70, -60], [70, -60], [-130, -60], [130, -60], [-30, -150], [30, -150],
];

export const Wayang: React.FC<{ f: number; dur: number; fps: number }> = ({ f, dur, fps }) => {
  const screen = tube(f, ig("wayang", "screen", fps), dur, 4);
  const lamp = tube(f, ig("wayang", "lamp", fps), dur, 5);
  const pohonOn = ig("wayang", "pohon", fps);
  const pohon = tube(f, pohonOn, dur, 6);
  // the dalang twirls the puppet in: spin (scaleX = cos θ) while it glides to center
  const travel = interpolate(f, [pohonOn, pohonOn + Math.round(1.6 * fps)], [0, 1], {
    easing: neon.ease.out,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const theta = (1 - travel) * Math.PI * 5;
  const spinX = Math.cos(theta);
  const px = interpolate(travel, [0, 1], [-260, POHON.x]);
  const sway = Math.sin(f * 0.07) * 3 * travel;
  const lampFlicker = lamp * (0.85 + 0.15 * Math.sin(f * 0.9) * Math.sin(f * 0.37));
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute" }}>
      <NeonDefs />
      <defs>
        <radialGradient id="way-light" cx="50%" cy="22%" r="80%">
          <stop offset="0%" stopColor="#FFD9A0" stopOpacity={0.55} />
          <stop offset="45%" stopColor={C.amber} stopOpacity={0.18} />
          <stop offset="100%" stopColor={C.amber} stopOpacity={0.03} />
        </radialGradient>
        <clipPath id="way-screen">
          <rect x={SCREEN.x} y={SCREEN.y} width={SCREEN.w} height={SCREEN.h} rx={18} />
        </clipPath>
      </defs>
      <rect x={0} y={0} width={W} height={H} fill="#0A0508" />
      {/* lamp-lit kelir */}
      <rect x={SCREEN.x} y={SCREEN.y} width={SCREEN.w} height={SCREEN.h} rx={18} fill="url(#way-light)" opacity={lampFlicker} />

      {/* the shadow and its neon edge, inside the screen */}
      <g clipPath="url(#way-screen)">
        <g transform={`translate(${px + 26} ${POHON.y + 30}) rotate(${sway}) scale(${spinX * 1.06} 1.06)`} opacity={0.55 * lampFlicker}>
          <path d={OUTLINE} fill="#000" style={{ filter: "blur(10px)" }} />
        </g>
        <g transform={`translate(${px} ${POHON.y}) rotate(${sway}) scale(${spinX} 1)`}>
          <path d={OUTLINE} fill="#140A06" />
          <NeonPath d={OUTLINE} color={C.amber} width={7} bright={pohon} />
          <NeonPath d={INNER} color={C.red} width={3} bright={pohon * 0.9} />
          <NeonPath d={TRUNK} color={C.yellow} width={5} bright={tube(f, pohonOn + 3, dur, 7)} />
          {BRANCHES.map((d, i) => (
            <NeonPath key={i} d={d} color={C.yellow} width={4} bright={tube(f, pohonOn + 4 + i, dur, 8 + i)} />
          ))}
          <NeonPath d={DOOR} color={C.red} width={5} bright={tube(f, pohonOn + 8, dur, 20)} />
          <g filter="url(#neon-glow)" opacity={tube(f, pohonOn + 12, dur, 21)}>
            {LEAVES.map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r={7} fill={i % 3 ? C.pink : C.yellow} />
            ))}
          </g>
          {/* kayu — the handling rod */}
          <NeonPath d="M 0 340 L 0 640" color={C.amber} width={4} bright={pohon * 0.6} />
        </g>
      </g>

      {/* screen frame and scalloped valance */}
      <NeonPath d={`M ${SCREEN.x} ${SCREEN.y + 18} Q ${SCREEN.x} ${SCREEN.y} ${SCREEN.x + 18} ${SCREEN.y} L ${SCREEN.x + SCREEN.w - 18} ${SCREEN.y} Q ${SCREEN.x + SCREEN.w} ${SCREEN.y} ${SCREEN.x + SCREEN.w} ${SCREEN.y + 18} L ${SCREEN.x + SCREEN.w} ${SCREEN.y + SCREEN.h - 18} Q ${SCREEN.x + SCREEN.w} ${SCREEN.y + SCREEN.h} ${SCREEN.x + SCREEN.w - 18} ${SCREEN.y + SCREEN.h} L ${SCREEN.x + 18} ${SCREEN.y + SCREEN.h} Q ${SCREEN.x} ${SCREEN.y + SCREEN.h} ${SCREEN.x} ${SCREEN.y + SCREEN.h - 18} Z`} color={C.amber} width={7} bright={screen} />
      <NeonPath
        d={Array.from({ length: 10 }).map((_, i) => `${i ? "" : `M ${SCREEN.x} ${SCREEN.y + 6} `}Q ${SCREEN.x + 45 + i * 90} ${SCREEN.y + 70} ${SCREEN.x + 90 + i * 90} ${SCREEN.y + 6}`).join(" ")}
        color={C.red}
        width={5}
        bright={tube(f, ig("wayang", "screen", fps) + 4, dur, 9)}
      />
      {/* pelita flame behind the screen top */}
      <g transform={`translate(540 ${SCREEN.y + 100})`}>
        <NeonPath d={`M 0 ${-46 - Math.sin(f * 0.8) * 6} C 18 -20 20 0 0 14 C -20 0 -18 -20 0 ${-46 - Math.sin(f * 0.8) * 6} Z`} color={C.yellow} width={4} bright={lampFlicker} fill={C.amber} fillOpacity={0.6} />
      </g>
    </svg>
  );
};
