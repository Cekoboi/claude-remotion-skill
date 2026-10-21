// Building blocks for the "kedai" launch video, adapted from
// remotion-motion-graphics/references/product-promo.md.
import React, { useId } from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { kedaiTheme as K } from "./theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Glow pass: copies that keep only the bright parts (contrast crushes the
// darks), blurred and screened back over the original — what a finishing
// app's Glow/bloom node does, in plain CSS. One wide pass for the bloom, one
// tight pass for the halation around bright edges.
const GLOW_PASSES = [
  { radius: 30, strength: 0.85 },
  { radius: 7, strength: 0.4 },
];
export const Bloom: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill>
    <AbsoluteFill>{children}</AbsoluteFill>
    {GLOW_PASSES.map((g) => (
      <AbsoluteFill
        key={g.radius}
        style={{
          mixBlendMode: "screen",
          opacity: g.strength,
          filter: `brightness(1.1) contrast(1.9) saturate(1.15) blur(${g.radius}px)`,
        }}
      >
        {children}
      </AbsoluteFill>
    ))}
  </AbsoluteFill>
);

// Every shot enters and leaves through blur, never a hard cut. Exits are faster.
export const Shot: React.FC<{ dur: number; inF?: number; outF?: number; children: React.ReactNode }> = ({
  dur,
  inF = 10,
  outF = 8,
  children,
}) => {
  const frame = useCurrentFrame();
  const a = interpolate(frame, [0, inF], [0, 1], { ...clamp, easing: K.ease.out });
  const b = interpolate(frame, [dur - outF, dur], [1, 0], { ...clamp, easing: K.ease.in });
  const blur = (1 - a) * 14 + (1 - b) * 14;
  return (
    <AbsoluteFill style={{ opacity: Math.min(a, b), filter: blur > 0.2 ? `blur(${blur}px)` : "none" }}>
      {children}
    </AbsoluteFill>
  );
};

// The one light source: a blurred amber orb that travels to whatever matters.
export const Spotlight: React.FC<{ keys: readonly (readonly number[])[] }> = ({ keys }) => {
  const frame = useCurrentFrame();
  const at = (i: number) =>
    interpolate(
      frame,
      keys.map((k) => k[0]),
      keys.map((k) => k[i]),
      { ...clamp, easing: K.ease.inOut },
    );
  const size = at(3);
  const x = at(1) + Math.sin(frame / 40) * 10;
  const y = at(2) + Math.cos(frame / 53) * 8;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: x - size / 2,
          top: y - size / 2,
          width: size,
          height: size,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${K.colors.glow} 0%, rgba(255,120,40,0.25) 38%, transparent 66%)`,
          filter: "blur(60px)",
          opacity: at(4),
        }}
      />
    </AbsoluteFill>
  );
};

// Shopfront awning over a rounded counter — the invented "kedai" mark.
export const KedaiIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <rect x={14} y={30} width={72} height={60} rx={14} fill={K.colors.hero} />
    <path
      d="M8 34 L18 12 H82 L92 34 Q92 44 80.5 44 Q69 44 69 34 Q69 44 57.5 44 Q46 44 46 34 Q46 44 34.5 44 Q23 44 23 34 Q23 44 15.5 44 Q8 44 8 34 Z"
      fill="#FFD29E"
    />
    <rect x={40} y={58} width={20} height={32} rx={5} fill={K.colors.bg} opacity={0.85} />
  </svg>
);

export const Wordmark: React.FC<{ size?: number }> = ({ size = 92 }) => (
  <div
    style={{
      fontFamily: K.fonts.display,
      fontWeight: 700,
      fontSize: size,
      letterSpacing: "-0.03em",
      color: K.colors.text,
      lineHeight: 1,
      whiteSpace: "nowrap",
    }}
  >
    kedai
  </div>
);

// Icon starts centered and alone; the wordmark container grows from zero width,
// so the centered row pushes the icon left. Then the lockup drifts up.
export const LogoLockup: React.FC<{ wordmarkWidth?: number }> = ({ wordmarkWidth = 320 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ring = spring({ frame: frame - 2, fps, config: K.spring.smooth });
  const open = spring({ frame: frame - Math.round(0.5 * fps), fps, config: K.spring.smooth });
  const drift = interpolate(frame, [Math.round(1.05 * fps), Math.round(1.7 * fps)], [0, -28], {
    ...clamp,
    easing: K.ease.inOut,
  });
  const C = 2 * Math.PI * 78;
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", translate: `0 ${drift}px` }}>
      <div
        style={{
          position: "relative",
          width: 110,
          height: 110,
          display: "grid",
          placeItems: "center",
          scale: interpolate(ring, [0, 1], [0.7, 1]),
          opacity: interpolate(ring, [0, 0.4], [0, 1], clamp),
        }}
      >
        <svg
          width={180}
          height={180}
          style={{ position: "absolute", left: -35, top: -35, opacity: interpolate(open, [0, 0.6], [0.55, 0], clamp) }}
        >
          <circle
            cx={90}
            cy={90}
            r={78}
            fill="none"
            stroke={K.colors.white}
            strokeOpacity={0.4}
            strokeWidth={1.5}
            strokeDasharray={C}
            strokeDashoffset={C * (1 - ring)}
          />
        </svg>
        <KedaiIcon size={104} />
      </div>
      <div style={{ width: open * (wordmarkWidth + 24), overflow: "hidden" }}>
        <div style={{ paddingLeft: 24, width: wordmarkWidth + 24, translate: `${interpolate(open, [0, 1], [-40, 0])}px 0` }}>
          <Wordmark />
        </div>
      </div>
    </div>
  );
};

// CSS phone: bezel, perspective tilt and a glare that follows the rotation.
export const Phone: React.FC<{ rotX: number; rotY: number; children: React.ReactNode }> = ({ rotX, rotY, children }) => (
  <div style={{ perspective: 1400 }}>
    <div
      style={{
        width: 300,
        height: 620,
        borderRadius: 52,
        padding: 10,
        background: "#0B0B0C",
        boxShadow: "0 0 0 2px #2C2C31, 0 40px 120px rgba(0,0,0,0.65)",
        transform: `rotateX(${rotX}deg) rotateY(${rotY}deg)`,
        transformStyle: "preserve-3d",
      }}
    >
      <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 42, overflow: "hidden", background: "#000" }}>
        {children}
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background: `linear-gradient(${115 + rotY * 2}deg, rgba(255,255,255,0.13) 0%, transparent 36%)`,
          }}
        />
      </div>
    </div>
  </div>
);

// One wrapper is the camera: flat layout inside, perspective tilt and push outside.
export const Camera3D: React.FC<{
  dur: number;
  rotX: [number, number];
  rotY: [number, number];
  z: [number, number];
  children: React.ReactNode;
}> = ({ dur, rotX, rotY, z, children }) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [0, dur], [0, 1], { ...clamp, easing: K.ease.inOut });
  return (
    <AbsoluteFill style={{ perspective: 1800, alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          transform: `translateZ(${interpolate(t, [0, 1], z)}px) rotateX(${interpolate(t, [0, 1], rotX)}deg) rotateY(${interpolate(t, [0, 1], rotY)}deg)`,
          transformStyle: "preserve-3d",
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};

// Blur proportional to how far something moved this frame.
export const velocityBlur = (motion: (f: number) => number, frame: number, k = 0.35, max = 16) =>
  Math.min(Math.abs(motion(frame) - motion(frame - 1)) * k, max);

// CSS blur() is round; a one-axis Gaussian reads as a horizontal streak.
export const StreakFilter: React.FC<{ id: string; x: number }> = ({ id, x }) => (
  <svg width={0} height={0} style={{ position: "absolute" }}>
    <filter id={id} x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation={`${x} 0`} />
    </filter>
  </svg>
);

export const StreakLine: React.FC<{ id: string; words: readonly string[]; hero: number; stagger: number }> = ({
  id,
  words,
  hero,
  stagger,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // motion blur + bloom render this several times per frame; each copy needs its own filter ids
  const uid = `${id}${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const line = spring({ frame: frame - (hero + 1) * stagger - 4, fps, config: K.spring.smooth });
  return (
    <div
      style={{
        display: "flex",
        gap: 22,
        fontFamily: K.fonts.body,
        fontSize: 76,
        fontWeight: 600,
        letterSpacing: "-0.02em",
        color: K.colors.text,
      }}
    >
      {words.map((w, i) => {
        const s = spring({ frame: frame - i * stagger, fps, config: K.spring.snappy });
        const streak = interpolate(s, [0, 1], [22, 0]);
        const isHero = i === hero;
        return (
          <span
            key={i}
            style={{
              position: "relative",
              display: "inline-block",
              opacity: interpolate(s, [0, 0.3], [0, 1], clamp),
              translate: `${interpolate(s, [0, 1], [80, 0])}px 0`,
              scale: `${interpolate(s, [0, 1], [1.3, 1])} 1`,
              color: isHero ? K.colors.hero : undefined,
              filter: streak > 0.2 ? `url(#${uid}-${i})` : "none",
            }}
          >
            <StreakFilter id={`${uid}-${i}`} x={streak} />
            {w}
            {isHero && (
              <span
                style={{
                  position: "absolute",
                  left: 2,
                  right: 2,
                  bottom: -4,
                  height: 4,
                  borderRadius: 2,
                  background: K.colors.hero,
                  transformOrigin: "left",
                  scale: `${line} 1`,
                }}
              />
            )}
          </span>
        );
      })}
    </div>
  );
};

// One element changes shape: a glowing pill springs open into a notification card.
export const PillToNotification: React.FC<{ open: number; children: React.ReactNode }> = ({ open: openAt, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const open = spring({ frame: frame - openAt, fps, config: K.spring.morph });
  const glow = interpolate(open, [0, 1], [1, 0.22]);
  const reveal = interpolate(open, [0.7, 1], [0, 1], clamp);
  return (
    <div
      style={{
        width: interpolate(open, [0, 1], [200, 760]),
        height: interpolate(open, [0, 1], [26, 116]),
        borderRadius: interpolate(open, [0, 1], [13, 30]),
        background: `rgba(24,25,28,${interpolate(open, [0, 1], [0.1, 0.94])})`,
        border: `1.5px solid rgba(255,190,120,${0.25 + 0.6 * glow})`,
        boxShadow: `0 0 ${50 * glow}px rgba(255,150,60,${0.85 * glow}), inset 0 0 ${26 * glow}px rgba(255,220,170,${glow}), 0 30px 80px rgba(0,0,0,${0.5 * open})`,
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        padding: "0 24px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ width: "100%", opacity: reveal, translate: `0 ${interpolate(reveal, [0, 1], [10, 0])}px` }}>{children}</div>
    </div>
  );
};
