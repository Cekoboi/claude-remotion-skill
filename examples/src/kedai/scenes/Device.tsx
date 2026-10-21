// S02: phone tilts in under the orb; screen goes off -> lock -> home, then the
// camera zooms through the kedai icon into the app (screen takeover).
import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { kedaiTheme as K, T } from "../theme";
import { KedaiIcon, Phone } from "../kit";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const D = T.device;

// Home grid geometry, in screen pixels (screen is 280 x 600)
const COLS = 4;
const CELL = 54;
const GAP_X = (280 - 2 * 20 - COLS * CELL) / (COLS - 1);
const GRID_TOP = 150;
const ROW_STEP = 74;
const KEDAI_SLOT = { r: 1, c: 1 };
export const slotCenter = (r: number, c: number) => ({
  x: 20 + c * (CELL + GAP_X) + CELL / 2,
  y: GRID_TOP + r * ROW_STEP + CELL / 2,
});

const Lock: React.FC<{ t: number }> = ({ t }) => (
  <AbsoluteFill
    style={{
      background: "radial-gradient(120% 80% at 30% 85%, #6B3412 0%, #26140A 45%, #08090B 80%)",
      alignItems: "center",
      color: K.colors.text,
      fontFamily: K.fonts.body,
    }}
  >
    <div style={{ marginTop: 70, fontSize: 15, opacity: 0.75, fontWeight: 500 }}>Selasa, 21 Oktober</div>
    <div style={{ fontSize: 82, fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1, scale: interpolate(t, [0, 1], [1.06, 1]) }}>
      9:41
    </div>
    <div style={{ position: "absolute", bottom: 14, width: 110, height: 5, borderRadius: 3, background: "rgba(255,255,255,0.7)" }} />
  </AbsoluteFill>
);

const Home: React.FC<{ local: number }> = ({ local }) => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: "radial-gradient(120% 80% at 30% 85%, #4A250D 0%, #1A0F08 50%, #08090B 85%)", fontFamily: K.fonts.body }}>
      {/* sales widget */}
      <div
        style={{
          position: "absolute",
          left: 20,
          right: 20,
          top: 50,
          height: 78,
          borderRadius: 20,
          background: "rgba(255,255,255,0.1)",
          padding: "14px 16px",
          boxSizing: "border-box",
          color: K.colors.text,
          opacity: interpolate(spring({ frame: local, fps, config: K.spring.snappy }), [0, 1], [0, 1]),
        }}
      >
        <div style={{ fontSize: 11, opacity: 0.6 }}>Jualan hari ini</div>
        <div style={{ fontSize: 26, fontWeight: 700, marginTop: 4 }}>RM0.00</div>
      </div>
      {Array.from({ length: 4 * COLS }).map((_, i) => {
        const r = Math.floor(i / COLS);
        const c = i % COLS;
        const s = spring({ frame: local - 2 - i * 1, fps, config: K.spring.snappy });
        const { x, y } = slotCenter(r, c);
        const isKedai = r === KEDAI_SLOT.r && c === KEDAI_SLOT.c;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x - CELL / 2,
              top: y - CELL / 2,
              width: CELL,
              height: CELL,
              borderRadius: 14,
              overflow: "hidden",
              background: isKedai ? "#1C1D21" : K.colors.apps[(r * 3 + c * 2) % K.colors.apps.length],
              display: "grid",
              placeItems: "center",
              opacity: s,
              scale: interpolate(s, [0, 1], [0.6, 1]),
              boxShadow: isKedai ? `0 0 22px ${K.colors.glow}` : "none",
            }}
          >
            {isKedai ? (
              <KedaiIcon size={40} />
            ) : (
              <div style={{ width: 20, height: 20, borderRadius: (r + c) % 2 ? 10 : 5, background: "rgba(255,255,255,0.18)" }} />
            )}
          </div>
        );
      })}
      {/* dock */}
      <div style={{ position: "absolute", left: 14, right: 14, bottom: 16, height: 76, borderRadius: 26, background: "rgba(255,255,255,0.1)", display: "flex", justifyContent: "space-around", alignItems: "center" }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{ width: CELL, height: CELL, borderRadius: 14, background: K.colors.apps[i] }} />
        ))}
      </div>
    </AbsoluteFill>
  );
};

export const Device: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const tilt = spring({ frame, fps, config: K.spring.smooth });
  const breathe = Math.sin(frame / 18) * 1.2;
  const rotX = interpolate(tilt, [0, 1], [22, 6]);
  const rotY = interpolate(tilt, [0, 1], [-30, -4]) + breathe;

  // screen states crossfade over 6 frames each
  const lockA = interpolate(frame, [D.lock, D.lock + 6], [0, 1], clamp);
  const homeA = interpolate(frame, [D.home, D.home + 6], [0, 1], clamp);

  // takeover: push into the kedai icon until the screen is bigger than the frame
  const p = interpolate(frame, [D.takeover, D.takeover + D.takeoverDur], [0, 1], { ...clamp, easing: K.ease.push });
  const icon = slotCenter(KEDAI_SLOT.r, KEDAI_SLOT.c);
  const ox = width / 2 - 140 + icon.x;
  const oy = height / 2 - 300 + icon.y;

  return (
    <AbsoluteFill
      style={{
        transformOrigin: `${ox}px ${oy}px`,
        scale: interpolate(p, [0, 1], [1, 9]),
        filter: p > 0.35 ? `blur(${interpolate(p, [0.35, 1], [0, 14])}px)` : "none",
        opacity: interpolate(p, [0.6, 0.95], [1, 0], clamp),
      }}
    >
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          translate: `0 ${interpolate(tilt, [0, 1], [70, 0])}px`,
          scale: interpolate(tilt, [0, 1], [0.86, 1]),
        }}
      >
        <Phone rotX={rotX * (1 - p)} rotY={rotY * (1 - p)}>
          <AbsoluteFill style={{ background: "#050506" }} />
          <AbsoluteFill style={{ opacity: lockA * (1 - homeA) }}>
            <Lock t={lockA} />
          </AbsoluteFill>
          <AbsoluteFill style={{ opacity: homeA, scale: interpolate(homeA, [0, 1], [1.05, 1]) }}>
            <Home local={frame - D.home} />
          </AbsoluteFill>
        </Phone>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
