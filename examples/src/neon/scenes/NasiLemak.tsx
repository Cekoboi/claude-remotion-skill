import React from "react";
import { ig, neon, NeonDefs, NeonPath, neonTextStyle, tube } from "../neonKit";

const C = neon.colors;
const W = 1080;
const H = 1920;
const PLATE = { x: 540, y: 1010, r: 300 };

const FISH = "M -24 0 Q 0 -11 20 0 L 31 -9 L 31 9 L 20 0 Q 0 11 -24 0";
const PEANUT = "M -12 0 C -12 -9 -3 -9 0 -4 C 3 -9 12 -9 12 0 C 12 9 3 9 0 4 C -3 9 -12 9 -12 0 Z";
const SAMBAL =
  "M -70 0 C -78 -36 -40 -62 -6 -52 C 26 -70 70 -46 66 -12 C 86 10 60 46 26 40 C 0 60 -46 52 -54 28 C -80 26 -84 10 -70 0 Z";

// Brick wall that only exists where the sign's light reaches it
const Wall: React.FC<{ glow: number }> = ({ glow }) => (
  <g>
    <defs>
      <pattern id="bricks" width={140} height={64} patternUnits="userSpaceOnUse">
        <rect width={140} height={64} fill={C.mortar} />
        <rect x={3} y={3} width={134} height={26} rx={3} fill={C.wall} />
        <rect x={-67} y={35} width={134} height={26} rx={3} fill={C.wall} />
        <rect x={73} y={35} width={134} height={26} rx={3} fill={C.wall} />
      </pattern>
      <radialGradient id="wall-light" cx="50%" cy="48%" r="60%">
        <stop offset="0%" stopColor="#fff" stopOpacity={1} />
        <stop offset="100%" stopColor="#fff" stopOpacity={0.3} />
      </radialGradient>
      <mask id="wall-mask">
        <rect width={W} height={H} fill="url(#wall-light)" />
      </mask>
      <radialGradient id="wall-tint" cx="50%" cy="48%" r="55%">
        <stop offset="0%" stopColor={C.pink} stopOpacity={0.28} />
        <stop offset="60%" stopColor={C.green} stopOpacity={0.08} />
        <stop offset="100%" stopColor={C.bg} stopOpacity={0} />
      </radialGradient>
    </defs>
    <rect width={W} height={H} fill={C.bg} />
    <rect width={W} height={H} fill="url(#bricks)" mask="url(#wall-mask)" opacity={0.4 + 0.6 * glow} />
    <rect width={W} height={H} fill="url(#wall-tint)" opacity={glow} />
  </g>
);

export const NasiLemak: React.FC<{ f: number; dur: number; fps: number }> = ({ f, dur, fps }) => {
  const t = (k: keyof typeof neon.timing.ignite.nasi, seed: number) => tube(f, ig("nasi", k, fps), dur, seed);
  const plate = t("plate", 1);
  const leaf = t("leaf", 2);
  const rice = t("rice", 3);
  const egg = t("egg", 4);
  const sambal = t("sambal", 5);
  const cucumber = t("cucumber", 6);
  const bilis = t("bilis", 7);
  const kacang = t("kacang", 8);
  const steam = t("steam", 9);
  const buka = t("buka", 10);
  const { x, y } = PLATE;
  return (
    <>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute" }}>
        <NeonDefs />
        <Wall glow={Math.max(plate, leaf * 0.8)} />
        <g transform={`translate(${x} ${y})`}>
          <NeonPath d={`M ${-PLATE.r} 0 A ${PLATE.r} ${PLATE.r} 0 1 0 ${PLATE.r} 0 A ${PLATE.r} ${PLATE.r} 0 1 0 ${-PLATE.r} 0 Z`} color={C.cyan} width={7} bright={plate} />
          <NeonPath d={`M ${-PLATE.r + 26} 0 A ${PLATE.r - 26} ${PLATE.r - 26} 0 1 0 ${PLATE.r - 26} 0 A ${PLATE.r - 26} ${PLATE.r - 26} 0 1 0 ${-PLATE.r + 26} 0 Z`} color={C.cyan} width={3} bright={plate * 0.7} />
          {/* daun pisang */}
          <g transform="rotate(-18)">
            <NeonPath d="M -250 10 C -160 -170 160 -170 250 10 C 160 150 -160 150 -250 10 Z" color={C.green} width={6} bright={leaf} />
            <NeonPath d="M -236 10 L 236 10" color={C.green} width={3} bright={leaf * 0.8} />
            {[-160, -90, -20, 50, 120, 180].map((vx, i) => (
              <NeonPath key={i} d={`M ${vx} 10 Q ${vx + 26} -40 ${vx + 40} -80 M ${vx} 10 Q ${vx + 26} 56 ${vx + 40} 92`} color={C.green} width={2} bright={leaf * 0.55} />
            ))}
          </g>
          {/* nasi */}
          <g transform="translate(-50 -10)">
            <NeonPath d="M -125 40 C -125 -115 125 -115 125 40 Z" color={C.white} width={7} bright={rice} fill={C.white} fillOpacity={0.06} />
            {[[-60, -10], [-20, -40], [30, -20], [70, 10], [-80, 20], [10, 15]].map(([gx, gy], i) => (
              <NeonPath key={i} d={`M ${gx - 7} ${gy} q 7 -6 14 0`} color={C.white} width={2.4} bright={rice * 0.8} />
            ))}
          </g>
          {/* telur rebus */}
          <g transform="translate(118 74) rotate(-12)">
            <NeonPath d="M -72 0 C -72 -48 72 -48 72 0 C 72 48 -72 48 -72 0 Z" color={C.white} width={6} bright={egg} />
            <NeonPath d="M -30 0 A 30 30 0 1 0 30 0 A 30 30 0 1 0 -30 0 Z" color={C.yellow} width={6} bright={egg} fill={C.yellow} fillOpacity={0.25} />
          </g>
          {/* sambal */}
          <g transform="translate(110 -110)">
            <NeonPath d={SAMBAL} color={C.red} width={6} bright={sambal} fill={C.red} fillOpacity={0.18} />
            {[[-30, -10], [10, -24], [30, 8], [-6, 18]].map(([sx, sy], i) => (
              <circle key={i} cx={sx} cy={sy} r={4} fill={C.red} opacity={sambal} />
            ))}
          </g>
          {/* timun */}
          {[[-176, 92], [-118, 132]].map(([cx, cy], i) => (
            <g key={i} transform={`translate(${cx} ${cy})`}>
              <NeonPath d="M -36 0 A 36 36 0 1 0 36 0 A 36 36 0 1 0 -36 0 Z" color={C.green} width={5} bright={cucumber} />
              <NeonPath d="M -18 0 A 18 18 0 1 0 18 0 A 18 18 0 1 0 -18 0 Z" color={C.green} width={2} bright={cucumber * 0.7} />
            </g>
          ))}
          {/* ikan bilis */}
          {[[-150, -120, -20], [-100, -150, 10], [-190, -70, 30], [-60, -170, -10]].map(([fx, fy, r], i) => (
            <g key={i} transform={`translate(${fx} ${fy}) rotate(${r})`}>
              <NeonPath d={FISH} color={C.amber} width={4} bright={tube(f, ig("nasi", "bilis", fps) + i * 2, dur, 30 + i)} />
            </g>
          ))}
          {/* kacang */}
          {[[-10, 150, 10], [30, 175, -20], [70, 150, 40], [-50, 180, 0], [110, 180, 15]].map(([kx, ky, r], i) => (
            <g key={i} transform={`translate(${kx} ${ky}) rotate(${r})`}>
              <NeonPath d={PEANUT} color={C.amber} width={3.5} bright={tube(f, ig("nasi", "kacang", fps) + i, dur, 40 + i)} />
            </g>
          ))}
          {/* wap — steam rising off the rice */}
          {[-110, -50, 10].map((sx, i) => {
            const rise = (f * 1.4 + i * 30) % 90;
            const wob = Math.sin(f * 0.12 + i) * 10;
            return (
              <g key={i} opacity={1 - rise / 90}>
                <NeonPath d={`M ${sx} ${-130 - rise} q ${12 + wob} -22 0 -44 q ${-12 - wob} -22 0 -44`} color={C.white} width={3} bright={steam * 0.7} />
              </g>
            );
          })}
        </g>

        {/* "BUKA 24 JAM" box sign */}
        <g transform="translate(540 1560)">
          <NeonPath d="M -220 -60 L 220 -60 Q 240 -60 240 -40 L 240 40 Q 240 60 220 60 L -220 60 Q -240 60 -240 40 L -240 -40 Q -240 -60 -220 -60 Z" color={C.blue} width={5} bright={buka} />
        </g>
      </svg>
      <div
        style={{
          position: "absolute",
          top: 1560 - 34,
          width: W,
          textAlign: "center",
          fontFamily: neon.fonts.display,
          fontWeight: 700,
          fontSize: 54,
          letterSpacing: "0.08em",
          ...neonTextStyle(C.red, tube(f, ig("nasi", "buka", fps) + 6, dur, 11), 54),
        }}
      >
        BUKA 24 JAM
      </div>
    </>
  );
};
