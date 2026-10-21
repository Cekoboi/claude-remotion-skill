// The five shots of "Prompt to Video". Frame numbers inside each are local to
// its Sequence; all of them come from timing.json.
import React from "react";
import { AbsoluteFill, interpolate, Sequence, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { measureText } from "@remotion/layout-utils";
import { promptTheme as P, PT } from "../theme";
import { ChipSplit, chipLayout, CodeStream, Cursor, PathText, PlayMark, PromptBox, TrackingReveal, useClick, World } from "../kit";
import { KopiSenja } from "./KopiSenja";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const CHIPS = ["Logo", "Reel", "Explainer", "Kapsyen", "Promo"];
const CHIP_SIZE = 28;
const ROW_Y = 600;

// S01: mark spins in, wordmark converges, both collapse to a pill that splits into chips
export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const I = PT.intro;
  const mark = spring({ frame: frame - I.mark, fps, config: P.spring.smooth });
  const c = interpolate(frame, [I.collapse, I.collapse + 10], [0, 1], { ...clamp, easing: P.ease.in });
  const press = useClick(I.click);
  const { widths, lefts } = chipLayout(CHIPS, CHIP_SIZE);
  const target: [number, number] = [960 + lefts[0] + widths[0] / 2 - 6, ROW_Y - 6];
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: c >= 1 ? 0 : 1 }}>
        <div style={{ marginTop: -60, rotate: `${interpolate(mark, [0, 1], [-140, 0])}deg`, scale: interpolate(mark, [0, 1], [0.4, 1]) * (1 - c), opacity: mark }}>
          <PlayMark size={130} />
        </div>
        <div
          style={{
            marginTop: 34,
            scale: `${interpolate(c, [0, 1], [1, 0.22])} ${interpolate(c, [0, 1], [1, 0.06])}`,
            filter: c > 0 ? `brightness(${1 + 3 * c}) blur(${c * 4}px)` : "none",
          }}
        >
          <TrackingReveal text="remotion-motion-graphics" start={I.word} spread={26} style={{ fontFamily: P.fonts.mono, fontSize: 56, fontWeight: 600, color: P.colors.text }} />
        </div>
      </AbsoluteFill>
      {frame >= I.split - 2 && (
        <div style={{ position: "absolute", left: 960, top: ROW_Y }}>
          <ChipSplit labels={CHIPS} start={I.split} size={CHIP_SIZE} active={(i) => (i === 0 ? press : 0)} />
        </div>
      )}
      <Cursor from={[1560, 960]} to={target} start={I.cursorFrom} dur={I.cursorDur} clickAt={I.click} />
    </AbsoluteFill>
  );
};

// S02: extreme close-up on the first words, dolly out to the whole box, send
export const Prompt: React.FC = () => {
  const frame = useCurrentFrame();
  const Q = PT.prompt;
  const zoom = interpolate(frame, [Q.dollyFrom, Q.dollyTo], [2.5, 1], { ...clamp, easing: P.ease.inOut });
  const lift = interpolate(frame, [Q.send + 4, Q.send + 14], [0, -420], { ...clamp, easing: P.ease.in });
  return (
    <AbsoluteFill style={{ scale: zoom, transformOrigin: "23.5% 43%" }}>
      <div style={{ position: "absolute", left: 410, top: 420, translate: `0 ${lift}px` }}>
        <PromptBox text={Q.text} start={Q.type} cps={Q.cps} sendAt={Q.send} />
      </div>
    </AbsoluteFill>
  );
};

const CODE = [
  "import { AbsoluteFill, spring, useCurrentFrame } from 'remotion';",
  "import { TrackingReveal } from './kit';",
  "",
  "export const KopiSenja = ({ look }) => {",
  "  const frame = useCurrentFrame();",
  "  const rise = spring({ frame, fps: 30, config: theme.spring.smooth });",
  "  return (",
  "    <AbsoluteFill style={{ background: look.sky }}>",
  "      <Sun y={interpolate(rise, [0, 1], [460, 120])} />",
  "      <Cup scale={spring({ frame: frame - 10, fps: 30 })} />",
  "      <Steam progress={interpolate(frame, [14, 34], [0, 1])} />",
  "      <TrackingReveal text=\"Kopi Senja\" start={22} />",
  "      <Tagline text={look.tag} start={36} />",
  "    </AbsoluteFill>",
  "  );",
  "};",
];

// S03: the code that "builds" the intro rushes past
export const Code: React.FC = () => <CodeStream lines={CODE} dur={PT.code.stream} />;

const Player: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const W = PT.world;
  const swing = spring({ frame: frame - W.swing, fps, config: P.spring.smooth });
  const isNight = frame >= W.night;
  const t = isNight ? frame - W.playNight : frame - W.play;
  const progress = interpolate(t, [0, PT.mini.dur], [0, 1], clamp);
  const secs = Math.min(5, Math.floor(progress * 5)); // the preview runs the 5s intro sped up
  return (
    <div style={{ perspective: 1600 }}>
      <div
        style={{
          width: 800,
          borderRadius: 26,
          background: P.colors.panel,
          boxShadow: `0 0 0 1px ${P.colors.line}, 0 0 90px rgba(139,92,246,0.35), 0 50px 120px rgba(0,0,0,0.6)`,
          overflow: "hidden",
          fontFamily: P.fonts.body,
          transform: `translateX(${interpolate(swing, [0, 1], [320, 0])}px) rotateY(${interpolate(swing, [0, 1], [55, -4]) + Math.sin(frame / 24) * 1.5}deg)`,
          opacity: interpolate(swing, [0, 0.3], [0, 1], clamp),
        }}
      >
        <div style={{ height: 46, display: "flex", alignItems: "center", padding: "0 18px", gap: 8, color: P.colors.dim, fontSize: 16 }}>
          {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
            <div key={c} style={{ width: 12, height: 12, borderRadius: 6, background: c }} />
          ))}
          <div style={{ flex: 1, textAlign: "center", fontFamily: P.fonts.mono, marginRight: 52 }}>{isNight ? "kopi-senja-malam.mp4" : "kopi-senja.mp4"}</div>
        </div>
        <div style={{ position: "relative", width: 720, height: 405, margin: "0 40px", borderRadius: 14, overflow: "hidden" }}>
          <Sequence from={W.play} durationInFrames={W.night - W.play}>
            <KopiSenja look="day" />
          </Sequence>
          <Sequence from={W.playNight}>
            <KopiSenja look="night" />
          </Sequence>
        </div>
        <div style={{ height: 64, display: "flex", alignItems: "center", gap: 16, padding: "0 40px", color: P.colors.dim, fontSize: 15, fontFamily: P.fonts.mono }}>
          <svg width={16} height={18} viewBox="0 0 16 18">
            <path d="M2 1 L15 9 L2 17 Z" fill={P.colors.text} />
          </svg>
          <div style={{ flex: 1, height: 5, borderRadius: 3, background: "rgba(255,255,255,0.12)" }}>
            <div style={{ width: `${progress * 100}%`, height: "100%", borderRadius: 3, background: P.colors.hero }} />
          </div>
          <span>
            0:0{secs} / 0:05
          </span>
        </div>
      </div>
    </div>
  );
};

// S04: player above, second prompt below, on one canvas the camera whips across
export const WorldShot: React.FC = () => {
  const W = PT.world;
  return (
    <World cams={W.cams}>
      <div style={{ position: "absolute", left: 960 - 400, top: 540 - 280 }}>
        <Player />
      </div>
      <div style={{ position: "absolute", left: 410, top: 1340 }}>
        <PromptBox text={W.text} start={W.type} cps={W.cps} sendAt={W.send} />
      </div>
    </World>
  );
};

// S05: mark glows, the sign-off flies in along a curve, then stretches away
export const Sign: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const S = PT.sign;
  const size = 54;
  const width = S.text.split("").reduce((a, ch) => a + measureText({ text: ch, fontFamily: P.fonts.display, fontSize: size, fontWeight: 600 }).width, 0);
  const x = 960 - width / 2;
  const pop = spring({ frame, fps, config: P.spring.bouncy });
  const out = interpolate(frame, [S.exit, S.exit + 8], [0, 1], { ...clamp, easing: P.ease.in });
  return (
    <AbsoluteFill style={{ scale: `1 ${1 + out * 2.5}`, filter: out > 0 ? `blur(${out * 12}px)` : "none", opacity: 1 - out }}>
      <div style={{ position: "absolute", left: 960 - 55, top: 330, scale: pop }}>
        <PlayMark size={110} glow={1.6} />
      </div>
      <PathText
        text={S.text}
        d={`M 120 1060 C 420 640, 760 1000, ${x + width - 40} 600`}
        x={x}
        y={600}
        size={size}
        travel={S.travel}
        settleAt={S.settle}
      />
    </AbsoluteFill>
  );
};
