import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { beatPulse } from "../camera";
import { IsoDefs } from "../iso";
import { bf, EASE, evf, FONTS, FPB, K, SCENE, SPRING, T } from "../theme";
import { Background, Icon, Words } from "../ui";
import { OfficeTower, Shop } from "./Hook";

const W = 1080;

const Option: React.FC<{ letter: string; label: string; color: string; at: number; top: number; accentBeat: 0 | 1; children: React.ReactNode }> = ({
  letter,
  label,
  color,
  at,
  top,
  accentBeat,
  children,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - at, fps, config: SPRING.pop });
  // after both land, the options pulse alternately on the beat: A on even beats, B on odd
  const beat = frame / FPB;
  const sinceBeat = (beat % 1) * FPB;
  const myBeat = Math.floor(beat) % 2 === accentBeat && frame > at + FPB;
  const pulse = myBeat ? 0.07 * Math.exp(-sinceBeat / 5) : 0;
  return (
    <div
      style={{
        position: "absolute",
        top,
        left: 110,
        width: 860,
        height: 150,
        borderRadius: 40,
        background: K.navy700,
        border: `4px solid ${color}`,
        boxShadow: `0 20px 60px ${color}${myBeat ? "66" : "33"}`,
        display: "flex",
        alignItems: "center",
        gap: 26,
        padding: "0 30px",
        opacity: Math.min(1, p * 1.5),
        transform: `translateX(${(1 - p) * (accentBeat ? 300 : -300)}px) scale(${(0.9 + 0.1 * p) * (1 + pulse)})`,
      }}
    >
      <div style={{ width: 92, height: 92, borderRadius: 999, background: color, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONTS.display, fontWeight: 900, fontSize: 48, color: K.navy900 }}>
        {letter}
      </div>
      <div style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 50, color: K.white, letterSpacing: "-0.02em", flex: 1 }}>{label}</div>
      <svg width={120} height={140} style={{ flexShrink: 0 }}>
        <IsoDefs />
        <g transform="translate(60 118)">{children}</g>
      </svg>
    </div>
  );
};

export const Ending: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const start = SCENE.ending.from;
  const end = bf(start + SCENE.ending.beats);
  const pulse = beatPulse(frame, fps);
  const e2 = T.phrases.find((p) => p.id === "e2")!;
  const comment = spring({ frame: frame - evf("comment"), fps, config: SPRING.pop });
  const beat = frame / FPB;
  const bounce = frame > evf("comment") ? Math.abs(Math.sin((beat % 1) * Math.PI)) * 22 : 0;
  const pullBack = interpolate(beat, [e2.endBeat, start + SCENE.ending.beats], [1, 0.94], { easing: EASE.inOut, extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fade = interpolate(frame, [end - 8, end - 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill>
      <Background tint={K.orange} />
      <AbsoluteFill style={{ transform: `scale(${pullBack * (1 + pulse)})` }}>
        <div style={{ position: "absolute", top: 330, width: W }}>
          <Words text="KAU PILIH" at={evf("question2")} size={112} />
          <Words text="YANG MANA?" at={evf("question2") + 6} size={112} highlight={{ "MANA?": K.orange }} />
        </div>
        <Option letter="A" label="MAKAN GAJI" color={K.cyan} at={evf("optionA")} top={720} accentBeat={0}>
          <OfficeTower u={20} floors={4} />
        </Option>
        <Option letter="B" label="KERJA SENDIRI" color={K.orange} at={evf("optionB")} top={910} accentBeat={1}>
          <Shop u={20} frame={frame} />
        </Option>
        <div style={{ position: "absolute", top: 1200, width: W, display: "flex", justifyContent: "center", opacity: comment, transform: `scale(${0.7 + 0.3 * comment})` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 22, padding: "26px 48px", borderRadius: 999, background: K.white, boxShadow: "0 24px 60px rgba(3,8,28,0.5)" }}>
            <svg width={70} height={70}>
              <circle cx={35} cy={35} r={35} fill={K.orange} />
              <g transform="translate(35 37)">
                <Icon name="chat" s={42} color={K.navy900} />
              </g>
            </svg>
            <div style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 54, color: K.navy800 }}>Komen di bawah!</div>
          </div>
        </div>
        <svg width={W} height={200} style={{ position: "absolute", top: 1390, opacity: comment }}>
          <g transform={`translate(540 ${60 + bounce})`}>
            <path d="M -40 -20 L 0 20 L 40 -20" stroke={K.orange} strokeWidth={16} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M -40 20 L 0 60 L 40 20" stroke={K.cyan} strokeWidth={16} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.7} />
          </g>
        </svg>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: K.navy900, opacity: fade }} />
    </AbsoluteFill>
  );
};
