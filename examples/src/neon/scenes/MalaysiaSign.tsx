import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { ig, neon, NeonDefs, NeonPath, neonTextStyle, tube } from "../neonKit";

const C = neon.colors;
const W = 1080;
const H = 1920;
export const FLOOR_Y = 1250;

// crescent from two circles: outer r=120 at (0,0), inner r=100 at (40,0)
const CRESCENT = "M 75 -93.7 A 120 120 0 1 0 75 93.7 A 100 100 0 1 1 75 -93.7 Z";
const star = (R: number, r: number) => {
  let d = "";
  for (let i = 0; i < 28; i++) {
    const rad = i % 2 === 0 ? R : r;
    const a = -Math.PI / 2 + (i * Math.PI) / 14;
    d += `${i ? "L" : "M"} ${(Math.cos(a) * rad).toFixed(1)} ${(Math.sin(a) * rad).toFixed(1)} `;
  }
  return `${d}Z`;
};
const STAR = star(92, 40);

const Sign: React.FC<{ f: number; dur: number; fps: number }> = ({ f, dur, fps }) => {
  const emblem = tube(f, ig("malaysia", "star", fps), dur, 1);
  const lettersOn = ig("malaysia", "letters", fps);
  const gap = ig("malaysia", "letterGap", fps);
  const rule = tube(f, ig("malaysia", "rule", fps), dur, 3);
  const tag = tube(f, ig("malaysia", "tag", fps), dur, 4);
  const ruleDraw = interpolate(f, [ig("malaysia", "rule", fps), ig("malaysia", "rule", fps) + Math.round(0.6 * fps)], [0, 1], {
    easing: neon.ease.out,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute" }}>
        <NeonDefs />
        <g transform="translate(450 600)">
          <NeonPath d={CRESCENT} color={C.yellow} width={8} bright={emblem} fill={C.yellow} fillOpacity={0.12} />
        </g>
        <g transform={`translate(650 600) rotate(${f * 0.15})`}>
          <NeonPath d={STAR} color={C.yellow} width={6} bright={tube(f, ig("malaysia", "star", fps) + 5, dur, 2)} fill={C.yellow} fillOpacity={0.1} />
        </g>
        <NeonPath d="M 170 1012 L 910 1012" color={C.blue} width={7} bright={rule} draw={ruleDraw} />
        <NeonPath d="M 210 1040 L 870 1040" color={C.white} width={4} bright={rule * 0.9} draw={ruleDraw} />
      </svg>
      <div style={{ position: "absolute", top: 820, width: W, display: "flex", justifyContent: "center", gap: 6 }}>
        {"MALAYSIA".split("").map((ch, i) => {
          const b = tube(f, lettersOn + i * gap, dur, 10 + i);
          return (
            <span
              key={i}
              style={{
                fontFamily: neon.fonts.display,
                fontWeight: 800,
                fontSize: 124,
                letterSpacing: "-0.02em",
                color: "transparent",
                WebkitTextStroke: `4px ${b > 0.05 ? "#FFD3D3" : C.red}`,
                opacity: b > 0.05 ? b : 0.16,
                filter: b > 0.05 ? `drop-shadow(0 0 3px ${C.red}) drop-shadow(0 0 12px ${C.red}) drop-shadow(0 0 30px ${C.red})` : undefined,
              }}
            >
              {ch}
            </span>
          );
        })}
      </div>
      <div
        style={{
          position: "absolute",
          top: 1080,
          width: W,
          textAlign: "center",
          fontFamily: neon.fonts.sans,
          fontWeight: 600,
          fontSize: 40,
          letterSpacing: "0.42em",
          paddingLeft: "0.42em",
          ...neonTextStyle(C.cyan, tag, 40),
        }}
      >
        {neon.timing.titles.malaysia.place}
      </div>
    </AbsoluteFill>
  );
};

export const MalaysiaSign: React.FC<{ f: number; dur: number; fps: number }> = ({ f, dur, fps }) => (
  <AbsoluteFill style={{ background: C.bg }}>
    <AbsoluteFill style={{ background: `radial-gradient(ellipse 70% 40% at 50% 45%, #2A0A2A, ${C.bg} 70%)` }} />
    <Sign f={f} dur={dur} fps={fps} />
    {/* wet street: the sign mirrored, rippled and fading */}
    <AbsoluteFill
      style={{
        top: FLOOR_Y,
        overflow: "hidden",
        background: "linear-gradient(180deg, #0D0618, #05020A)",
      }}
    >
      <AbsoluteFill
        style={{
          top: -FLOOR_Y,
          height: H,
          // mirror about the floor line (global y = FLOOR_Y)
          transform: "scaleY(-1)",
          transformOrigin: `50% ${FLOOR_Y}px`,
          opacity: 0.32,
          filter: "blur(5px)",
          WebkitMaskImage: "linear-gradient(180deg, rgba(0,0,0,0) 25%, #000 62%)",
          maskImage: "linear-gradient(180deg, rgba(0,0,0,0) 25%, #000 62%)",
        }}
      >
        <Sign f={f} dur={dur} fps={fps} />
      </AbsoluteFill>
      {Array.from({ length: 9 }).map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: 30 + i * 70 + Math.sin(f * 0.08 + i) * 6,
            left: 120 + ((i * 137) % 500),
            width: 160 + ((i * 53) % 220),
            height: 2,
            background: i % 2 ? C.red : C.yellow,
            opacity: 0.18,
            filter: "blur(1px)",
          }}
        />
      ))}
    </AbsoluteFill>
  </AbsoluteFill>
);
