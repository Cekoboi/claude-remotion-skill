// The logo intro the demo "generates": Kopi Senja, in a sunset look and,
// after the second prompt, a night look. Drawn at 720 x 405 inside the player.
import React from "react";
import { AbsoluteFill, interpolate, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { promptTheme as P, PT, Look } from "../theme";
import { TrackingReveal } from "../kit";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const M = PT.mini;

const STEAM = ["M 0 0 C -10 -14, 10 -26, 0 -40 S -10 -64, 0 -78", "M 0 0 C 10 -14, -10 -26, 0 -40 S 10 -64, 0 -78"];

export const KopiSenja: React.FC<{ look: Look }> = ({ look }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = P.looks[look];
  const night = look === "night";
  const rise = spring({ frame: frame - M.sun, fps, config: P.spring.smooth });
  const cup = spring({ frame: frame - M.cup, fps, config: P.spring.bouncy });
  const steam = interpolate(frame, [M.steam, M.steam + 20], [0, 1], { ...clamp, easing: P.ease.out });
  const tag = spring({ frame: frame - M.tag, fps, config: P.spring.smooth });
  const discY = interpolate(rise, [0, 1], [460, 36]);
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${L.sky[0]} 0%, ${L.sky[1]} 68%, ${L.sky[2]} 100%)`, overflow: "hidden" }}>
      {night &&
        Array.from({ length: 26 }).map((_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: random(`sx${i}`) * 720,
              top: random(`sy${i}`) * 230,
              width: 3,
              height: 3,
              borderRadius: 2,
              background: "white",
              opacity: (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(frame / 6 + i))) * rise,
            }}
          />
        ))}
      {/* sun, or a crescent moon: the same disc with a transparent bite masked out */}
      <div
        style={{
          position: "absolute",
          left: 556,
          top: discY,
          width: 120,
          height: 120,
          borderRadius: "50%",
          background: L.disc,
          boxShadow: night ? "none" : `0 0 70px ${L.disc}`,
          filter: night ? `drop-shadow(0 0 22px ${L.disc})` : "none",
          maskImage: night ? "radial-gradient(circle at 78% 30%, transparent 46%, black 47%)" : "none",
        }}
      />
      {/* cup on a saucer, with steam drawing upward */}
      <svg width={200} height={220} viewBox="-100 -150 200 220" style={{ position: "absolute", left: 60, top: 140, scale: cup, transformOrigin: "50% 90%" }}>
        {STEAM.map((d, i) => (
          <path
            key={i}
            d={d}
            transform={`translate(${-22 + i * 30}, -16)`}
            fill="none"
            stroke={L.ink}
            strokeWidth={5}
            strokeLinecap="round"
            strokeDasharray={80}
            strokeDashoffset={80 * (1 - steam)}
            opacity={0.75}
          />
        ))}
        <path d="M -50 -6 H 50 L 40 48 Q 38 58 28 58 H -28 Q -38 58 -40 48 Z" fill={L.ink} />
        <path d="M 46 4 q 26 0 22 20 q -4 16 -26 14" fill="none" stroke={L.ink} strokeWidth={8} />
        <ellipse cx={0} cy={62} rx={74} ry={9} fill={L.ink} opacity={0.85} />
      </svg>
      <div style={{ position: "absolute", left: 250, top: 190 }}>
        <TrackingReveal text="Kopi Senja" start={M.word} spread={18} style={{ fontFamily: P.fonts.display, fontSize: 70, fontWeight: 600, color: L.ink, fontStyle: "italic" }} />
        <div
          style={{
            marginTop: 14,
            fontFamily: P.fonts.body,
            fontSize: 20,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: L.ink,
            opacity: 0.85 * tag,
            translate: `0 ${interpolate(tag, [0, 1], [14, 0])}px`,
          }}
        >
          {L.tag}
        </div>
      </div>
    </AbsoluteFill>
  );
};
