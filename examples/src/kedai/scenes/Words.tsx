// S05–S09: the tagline lines, the pill -> notification payoff, the logo
// bookend and the credit.
import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { kedaiTheme as K, T } from "../theme";
import { KedaiIcon, LogoLockup, PillToNotification, StreakLine } from "../kit";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const center = { alignItems: "center", justifyContent: "center" } as const;

export const Line1: React.FC = () => {
  const l = T.lines.line1;
  return (
    <AbsoluteFill style={center}>
      <StreakLine id="l1" words={l.words} hero={l.hero} stagger={l.stagger} />
    </AbsoluteFill>
  );
};

// Second line, then the whole line squashes into a bright bar: the pill's first frame.
export const Line2: React.FC = () => {
  const frame = useCurrentFrame();
  const l = T.lines.line2;
  const c = interpolate(frame, [l.collapse, l.collapse + 10], [0, 1], { ...clamp, easing: K.ease.in });
  return (
    <AbsoluteFill style={center}>
      <div style={{ scale: `${interpolate(c, [0, 1], [1, 0.22])} ${interpolate(c, [0, 1], [1, 0.05])}`, filter: c > 0 ? `brightness(${1 + 2.5 * c}) blur(${c * 4}px)` : "none" }}>
        <StreakLine id="l2" words={l.words} hero={l.hero} stagger={l.stagger} />
      </div>
      <div
        style={{
          position: "absolute",
          width: 220,
          height: 22,
          borderRadius: 11,
          background: "rgba(255,226,190,0.9)",
          boxShadow: `0 0 40px ${K.colors.glow}`,
          opacity: interpolate(c, [0.5, 1], [0, 1], clamp),
        }}
      />
    </AbsoluteFill>
  );
};

export const Payoff: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const float = Math.sin(frame / 14) * 3;
  const icon = spring({ frame: frame - T.payoff.open - 8, fps, config: K.spring.snappy });
  return (
    <AbsoluteFill style={center}>
      <div style={{ translate: `0 ${float}px` }}>
        <PillToNotification open={T.payoff.open}>
          <div style={{ display: "flex", alignItems: "center", gap: 18, fontFamily: K.fonts.body, color: K.colors.text }}>
            <div style={{ width: 58, height: 58, borderRadius: 15, background: "#1C1D21", display: "grid", placeItems: "center", flexShrink: 0, scale: interpolate(icon, [0, 1], [0.6, 1]) }}>
              <KedaiIcon size={42} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, fontWeight: 700 }}>
                <span>Pesanan #1001</span>
                <span style={{ fontSize: 16, fontWeight: 500, color: K.colors.textDim }}>sekarang</span>
              </div>
              <div style={{ fontSize: 18, marginTop: 4, color: "#D9D6D0" }}>RM18.00, 1 item dari Kedai Online · Kuih Lapis</div>
            </div>
          </div>
        </PillToNotification>
      </div>
    </AbsoluteFill>
  );
};

export const Logo: React.FC<{ disclaimer?: boolean }> = ({ disclaimer }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={center}>
      <LogoLockup />
      {disclaimer && (
        <div
          style={{
            position: "absolute",
            bottom: 70,
            fontFamily: K.fonts.body,
            fontSize: 17,
            color: K.colors.textDim,
            letterSpacing: "0.02em",
            opacity: interpolate(frame, [30, 44], [0, 0.8], clamp),
          }}
        >
          Contoh rekaan · jenama &ldquo;kedai&rdquo; tidak wujud
        </div>
      )}
    </AbsoluteFill>
  );
};

// The only white light in the video: a streak that resolves into the credit.
export const Credit: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const bar = interpolate(frame, [0, 14], [0, 1], { ...clamp, easing: K.ease.out });
  const reveal = interpolate(frame, [12, 30], [0, 1], { ...clamp, easing: K.ease.out });
  const fadeOut = interpolate(frame, [durationInFrames - 14, durationInFrames], [1, 0], { ...clamp, easing: K.ease.in });
  return (
    <AbsoluteFill style={{ ...center, opacity: fadeOut }}>
      <div
        style={{
          position: "absolute",
          width: 760,
          height: 420,
          borderRadius: "50%",
          background: "radial-gradient(closest-side, rgba(255,255,255,0.13), transparent)",
          opacity: reveal,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: interpolate(bar, [0, 1], [0, 300]) * (1 - reveal * 0.6),
          height: 3,
          borderRadius: 2,
          background: K.colors.white,
          boxShadow: "0 0 24px rgba(255,255,255,0.9)",
          opacity: 1 - reveal,
        }}
      />
      <div style={{ textAlign: "center", fontFamily: K.fonts.body, color: K.colors.white, clipPath: `inset(0 ${50 - reveal * 50}% 0 ${50 - reveal * 50}%)` }}>
        <div style={{ fontSize: 16, letterSpacing: "0.12em", textTransform: "uppercase", color: "#C9C9C9" }}>dibuat dengan</div>
        <div style={{ fontFamily: K.fonts.mono, fontSize: 34, fontWeight: 600, marginTop: 8, textShadow: "0 0 18px rgba(255,255,255,0.45)" }}>
          remotion-motion-graphics
        </div>
      </div>
    </AbsoluteFill>
  );
};
