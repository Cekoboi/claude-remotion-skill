import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { beatPulse, camAt } from "../camera";
import { IsoDefs } from "../iso";
import { EASE, ev, evf, EventId, FONTS, FPB, K, SPRING, T } from "../theme";
import { Background, Icon } from "../ui";
import { OfficeTower, Shop } from "./Hook";

const W = 1080;
const H = 1920;

type Row = { id: EventId; text: string; good: boolean };
const LEFT: Row[] = [
  { id: "gajiPro1", text: "Gaji stabil", good: true },
  { id: "gajiPro2", text: "KWSP & cuti", good: true },
  { id: "gajiCon", text: "Pendapatan terhad", good: false },
];
const RIGHT: Row[] = [
  { id: "sendiriPro1", text: "Masa fleksibel", good: true },
  { id: "sendiriPro2", text: "Potensi tanpa had", good: true },
  { id: "sendiriCon", text: "Risiko lebih tinggi", good: false },
];
const ROW_Y = [830, 975, 1225];

const RowCard: React.FC<{ row: Row; x: number; accent: string }> = ({ row, x, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - evf(row.id), fps, config: SPRING.pop });
  const i = [...LEFT, ...RIGHT].indexOf(row) % 3;
  const iconColor = row.good ? accent : K.coral;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: ROW_Y[i],
        width: 470,
        height: 118,
        borderRadius: 28,
        background: K.navy700,
        border: `3px solid ${row.good ? accent + "66" : K.coral + "66"}`,
        boxShadow: "0 18px 40px rgba(3,8,28,0.45)",
        display: "flex",
        alignItems: "center",
        gap: 20,
        padding: "0 22px",
        opacity: Math.min(1, p * 1.6),
        transform: `translateY(${(1 - p) * 60}px) scale(${0.85 + 0.15 * p})`,
      }}
    >
      <svg width={72} height={72} style={{ flexShrink: 0 }}>
        <circle cx={36} cy={36} r={34} fill={iconColor} />
        <g transform="translate(36 36)">
          <Icon name={row.good ? "check" : "cross"} s={44} color={K.navy900} />
        </g>
      </svg>
      <div style={{ fontFamily: FONTS.body, fontWeight: 800, fontSize: 38, color: K.white, lineHeight: 1.1 }}>{row.text}</div>
    </div>
  );
};

const Header: React.FC<{ x: number; lines: string[]; color: string; at: number }> = ({ x, lines, color, at }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - at, fps, config: SPRING.pop });
  return (
    <div style={{ position: "absolute", left: x, top: 545, width: 470, textAlign: "center", opacity: p, transform: `scale(${0.8 + 0.2 * p})` }}>
      {lines.map((l) => (
        <div key={l} style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 56, color, lineHeight: 1.05, letterSpacing: "-0.02em" }}>
          {l}
        </div>
      ))}
    </div>
  );
};

const Label: React.FC<{ x: number; y: number; text: string; at: number }> = ({ x, y, text, at }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - at, fps, config: SPRING.smooth });
  return (
    <div style={{ position: "absolute", left: x, top: y, width: 470, textAlign: "center", fontFamily: FONTS.body, fontWeight: 800, fontSize: 28, letterSpacing: "0.28em", color: K.mist, opacity: p }}>
      {text}
    </div>
  );
};

export const Banding: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const beat = frame / FPB;
  const c1 = T.phrases.find((p) => p.id === "c1")!;
  const c2 = T.phrases.find((p) => p.id === "c2")!;
  // focus follows the voice: lean into the side being described
  const cam = camAt(
    [
      { beat: ev("split"), x: 0, y: 0, zoom: 1 },
      { beat: c1.beat, x: -18, y: 0, zoom: 1.025, move: 1 },
      { beat: c2.beat, x: 18, y: 0, zoom: 1.025, move: 1.5 },
      { beat: c2.endBeat + 1, x: 0, y: 0, zoom: 1.0, move: 1.5 },
    ],
    beat,
  );
  const pulse = beatPulse(frame, fps);
  const split = spring({ frame: frame - evf("split"), fps, config: SPRING.smooth });
  const focusL = interpolate(beat, [c2.beat - 1, c2.beat], [1, 0.42], { easing: EASE.inOut, extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const focusR = interpolate(beat, [c1.beat - 1, c1.beat, c2.beat - 1, c2.beat, c2.endBeat + 0.5, c2.endBeat + 1.5], [1, 0.42, 0.42, 1, 1, 1], {
    easing: EASE.inOut,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const allOn = interpolate(beat, [c2.endBeat + 0.5, c2.endBeat + 1.5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const lOp = Math.max(focusL, allOn);
  const vs = spring({ frame: frame - evf("split") - 4, fps, config: SPRING.pop });
  return (
    <AbsoluteFill>
      <Background tint={K.cyan} />
      <AbsoluteFill style={{ transform: `translateX(${-cam.x}px) scale(${cam.zoom * (1 + pulse)})` }}>
        {/* halves */}
        <div style={{ position: "absolute", left: 0, top: 0, width: W / 2, height: H, background: `linear-gradient(180deg, ${K.cyan}22, ${K.cyan}08)`, transform: `translateX(${(1 - split) * -W / 2}px)`, opacity: lOp }} />
        <div style={{ position: "absolute", left: W / 2, top: 0, width: W / 2, height: H, background: `linear-gradient(180deg, ${K.orange}22, ${K.orange}08)`, transform: `translateX(${(1 - split) * W / 2}px)`, opacity: focusR }} />
        <div style={{ position: "absolute", left: W / 2 - 2, top: 300 + (1 - split) * 800, width: 4, height: 1100 * split, background: `linear-gradient(180deg, ${K.cyan}, ${K.orange})`, borderRadius: 4 }} />
        {/* iso icons */}
        <svg width={W} height={H} style={{ position: "absolute" }}>
          <IsoDefs />
          <g transform={`translate(270 ${470 + (1 - split) * 300}) scale(${split})`} opacity={lOp}>
            <OfficeTower u={30} floors={4} />
          </g>
          <g transform={`translate(810 ${470 + (1 - split) * 300}) scale(${split})`} opacity={focusR}>
            <Shop u={30} frame={frame} />
          </g>
        </svg>
        <div style={{ opacity: lOp }}>
          <Header x={35} lines={["MAKAN", "GAJI"]} color={K.cyan} at={evf("split") + 2} />
          <Label x={35} y={765} text="KELEBIHAN" at={evf("gajiPro1") - 4} />
          <Label x={35} y={1160} text="CABARAN" at={evf("gajiCon") - 4} />
          {LEFT.map((r) => (
            <RowCard key={r.id} row={r} x={35} accent={K.cyan} />
          ))}
        </div>
        <div style={{ opacity: focusR }}>
          <Header x={575} lines={["KERJA", "SENDIRI"]} color={K.orange} at={evf("split") + 5} />
          <Label x={575} y={765} text="KELEBIHAN" at={evf("sendiriPro1") - 4} />
          <Label x={575} y={1160} text="CABARAN" at={evf("sendiriCon") - 4} />
          {RIGHT.map((r) => (
            <RowCard key={r.id} row={r} x={575} accent={K.orange} />
          ))}
        </div>
        <div style={{ position: "absolute", left: W / 2 - 60, top: 265, width: 120, height: 120 }}>
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: 999,
              background: K.white,
              color: K.navy800,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: FONTS.display,
              fontWeight: 900,
              fontSize: 46,
              transform: `scale(${vs}) rotate(${(1 - vs) * 180}deg)`,
              boxShadow: `0 0 0 8px ${K.navy800}, 0 18px 40px rgba(0,0,0,0.45)`,
            }}
          >
            VS
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
