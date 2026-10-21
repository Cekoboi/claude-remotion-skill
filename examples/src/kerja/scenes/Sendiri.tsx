import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { beatPulse, camAt, camTransform } from "../camera";
import { iso, IsoBox, IsoDefs, IsoPlane, IsoShadow, Person } from "../iso";
import { bf, EASE, ev, evf, FONTS, FPB, K, SCENE, SPRING } from "../theme";
import { Background, Card, Chip, Icon } from "../ui";

const W = 1080;
const H = 1920;
const U = 58;
const [OX, OY] = iso(3.5, 3, 0, U);
const at = (x: number, y: number, z: number): [number, number] => {
  const [a, b] = iso(x, y, z, U);
  return [a - OX, b - OY];
};
const LAPTOP = at(2.6, 2.9, 1.6);
const PACK = at(5.4, 3.3, 1.3);

const SALES = [
  { id: "sale1" as const, value: "+RM 89" },
  { id: "sale2" as const, value: "+RM 149" },
  { id: "sale3" as const, value: "+RM 59" },
  { id: "sale4" as const, value: "+RM 220" },
];
// monthly revenue: steady climb, a spike, then a dry month
const MONTHS = ["Jan", "Feb", "Mac", "Apr", "Mei", "Jun"];
const VALUES = [1200, 2100, 1600, 3400, 8200, 1900];
const BAR_BEATS = [0, 0.5, 1, 1.5, 2, 3]; // offsets from graphUp; peak lands on graphPeak, dip on graphDip

export const Sendiri: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const beat = frame / FPB;
  const start = SCENE.sendiri.from;
  const end = start + SCENE.sendiri.beats;
  const cam = camAt(
    [
      { beat: start, x: 0, y: -20, zoom: 0.92 },
      { beat: ev("typing"), x: LAPTOP[0], y: LAPTOP[1] + 30, zoom: 1.5, move: 1 },
      { beat: ev("order") - 0.5, x: PACK[0] - 40, y: PACK[1] - 40, zoom: 1.35, move: 1.5 },
      { beat: ev("sale1") - 0.5, x: 280, y: -110, zoom: 1.02, move: 1.5 },
      { beat: ev("graphUp"), x: 0, y: -560, zoom: 1.0, move: 1.5 },
      { beat: ev("graphPeak"), x: 0, y: -580, zoom: 1.06, move: 1 },
      { beat: ev("graphDip") + 1, x: 0, y: -540, zoom: 1.0, move: 1.5 },
    ],
    beat,
  );
  const pulse = beatPulse(frame, fps);
  const enter = spring({ frame: frame - bf(start), fps, config: SPRING.smooth });
  const type = (frame / (FPB / 2)) % 1;
  const cheer = spring({ frame: frame - evf("sale1"), fps, config: SPRING.smooth }) * (1 - spring({ frame: frame - evf("graphUp"), fps, config: SPRING.smooth }));

  // parcel: lid drops on "bungkus", slides out on "hantar"
  const lid = spring({ frame: frame - evf("pack"), fps, config: SPRING.pop });
  const ship = interpolate(frame, [evf("ship"), evf("ship") + 12], [0, 1], { easing: EASE.in, extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const nextBox = spring({ frame: frame - evf("ship") - 8, fps, config: SPRING.pop });

  return (
    <AbsoluteFill>
      <Background camX={cam.x} camY={cam.y} tint={K.orange} />
      <svg width={W} height={H} style={{ position: "absolute" }}>
        <IsoDefs />
        <g transform={camTransform(cam, pulse)}>
          <g transform={`translate(${-OX} ${-OY + (1 - enter) * 120})`} opacity={Math.min(1, enter * 1.5)}>
            <IsoShadow x={0} y={0} w={7} d={6} u={U} spread={0.8} />
            <IsoBox x={-0.3} y={0} w={0.3} d={6} h={4.2} u={U} color={K.navy500} top={K.navy400} />
            <IsoBox x={0} y={-0.3} w={7} d={0.3} h={4.2} u={U} color={K.navy600} top={K.navy400} />
            {/* shelf of stock on the back wall */}
            {[1.4, 2.6].map((z) => (
              <React.Fragment key={z}>
                <IsoBox x={3.8} y={0} w={2.8} d={0.7} h={0.1} z={z} u={U} color={K.mist} />
                {[0, 1, 2].map((i) => (
                  <IsoBox key={i} x={3.95 + i * 0.9} y={0.1} w={0.7} d={0.5} h={0.55} z={z + 0.1} u={U} color={i % 2 ? "#D9A066" : "#C98A4E"} />
                ))}
              </React.Fragment>
            ))}
            {/* sign on the side wall */}
            <IsoPlane kind="wallY" x={0} y={1.0} z={3.6} u={U}>
              <rect x={0} y={0} width={2.8} height={1.0} rx={0.16} fill={K.orange} />
              {/* wallY's u axis runs right-to-left on screen: flip so the lettering reads */}
              <text x={-1.4} y={0.66} transform="scale(-1 1)" textAnchor="middle" fontFamily={FONTS.display} fontWeight={800} fontSize={0.34} fill={K.navy900}>
                KEDAI ONLINE
              </text>
            </IsoPlane>
            <IsoBox x={0} y={0} w={7} d={6} h={0.25} z={-0.25} u={U} color={K.navy600} top="#2A4F9E" />
            <IsoPlane kind="floor" x={1.2} y={1.8} z={0.001} u={U}>
              <rect x={0} y={0} width={5} height={3.4} rx={0.3} fill={K.orange} opacity={0.22} />
            </IsoPlane>
            {/* entrepreneur at the laptop */}
            <IsoBox x={1.9} y={1.4} w={0.9} d={0.9} h={0.85} u={U} color={K.navy800} />
            <Person x={2.35} y={1.95} z={0.85} u={U} shirt={K.orange} type={type} cheer={cheer} bob={Math.abs(Math.sin(beat * Math.PI)) * 0.03} />
            <IsoShadow x={1.4} y={2.6} w={2.4} d={1.2} u={U} />
            <IsoBox x={1.4} y={2.6} w={2.4} d={1.2} h={1.15} u={U} color={K.white} top={K.white} />
            <IsoBox x={2.1} y={2.75} w={1.1} d={0.75} h={0.06} z={1.15} u={U} color={K.navy700} />
            <IsoBox x={2.1} y={2.7} w={1.1} d={0.07} h={0.72} z={1.2} u={U} color={K.navy800} />
            <IsoPlane kind="wallX" x={2.15} y={2.77} z={1.88} u={U}>
              <rect x={0} y={0} width={1.0} height={0.64} rx={0.04} fill={K.orangeSoft} />
              {[0.2, 0.35, 0.5].map((h, i) => (
                <rect key={i} x={0.12 + i * 0.26} y={0.56 - h * (0.6 + 0.4 * Math.abs(Math.sin(beat * Math.PI * 0.5 + i)))} width={0.16} height={h * (0.6 + 0.4 * Math.abs(Math.sin(beat * Math.PI * 0.5 + i)))} fill={K.orangeDeep} />
              ))}
            </IsoPlane>
            {/* packing table */}
            <IsoShadow x={4.6} y={2.8} w={2} d={1.3} u={U} />
            <IsoBox x={4.6} y={2.8} w={2} d={1.3} h={1.0} u={U} color={K.navy400} top={K.mist} />
            <g transform={`translate(${ship * 260} ${ship * 150})`} opacity={1 - ship}>
              <IsoBox x={5.0} y={3.0} w={0.9} d={0.8} h={0.6} z={1.0} u={U} color="#C98A4E" top={lid > 0.5 ? "#D9A066" : "#6B4423"} />
              {frame >= evf("pack") - 2 && (
                <g transform={`translate(0 ${(1 - lid) * -120})`} opacity={Math.min(1, lid * 2)}>
                  <IsoBox x={4.98} y={2.98} w={0.94} d={0.84} h={0.08} z={1.6} u={U} color="#D9A066" />
                  <IsoPlane kind="floor" x={5.35} y={2.98} z={1.681} u={U}>
                    <rect x={0} y={0} width={0.2} height={0.84 * Math.min(1, lid)} fill={K.cyan} />
                  </IsoPlane>
                </g>
              )}
            </g>
            {frame >= evf("ship") + 6 && (
              <g transform={`translate(0 ${(1 - nextBox) * -100})`} opacity={nextBox}>
                <IsoBox x={5.0} y={3.0} w={0.9} d={0.8} h={0.6} z={1.0} u={U} color="#C98A4E" top="#6B4423" />
              </g>
            )}
            <IsoBox x={6.5} y={4.7} w={0.3} d={0.3} h={0.1} u={U} color={K.orange} />
          </g>

          {/* notifications */}
          <Card x={PACK[0] + 40} y={PACK[1] - 260} at={evf("order")} from={[0, -200]} icon="cart" accent={K.orange} title="Order baru #1024" value="1 x Tudung" valueColor={K.navy700} out={evf("sale1") - 2} />
          {SALES.map((s, i) => (
            <Card key={s.id} x={290} y={-330 + i * 155} w={480} h={130} at={evf(s.id)} from={[220, 0]} icon="coin" accent={K.orange} title="Jualan baru" value={s.value} valueColor={K.orangeDeep} out={evf("graphUp") + 4} />
          ))}

          {/* revenue graph panel */}
          <Graph frame={frame} fps={fps} />
        </g>
      </svg>
      <Chip text="KERJA SENDIRI" color={K.orange} at={bf(start) + 4} out={bf(end)} />
    </AbsoluteFill>
  );
};

const Graph: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const show = spring({ frame: frame - evf("graphUp") + 6, fps, config: SPRING.smooth });
  if (show <= 0.001) return null;
  const gx = -390;
  const gy = -830;
  const gw = 780;
  const gh = 560;
  const plotX = gx + 70;
  const plotW = gw - 120;
  const base = gy + gh - 90;
  const maxV = 9000;
  const barW = plotW / MONTHS.length;
  const heights = VALUES.map((v, i) => {
    const p = spring({ frame: frame - (evf("graphUp") + Math.round(BAR_BEATS[i] * FPB)), fps, config: SPRING.pop });
    return { p, h: (v / maxV) * (gh - 200) * p };
  });
  const pts = heights.map((hgt, i) => [plotX + barW * (i + 0.5), base - hgt.h] as const);
  const drawn = heights.filter((hgt) => hgt.p > 0.02).length;
  const line = pts.slice(0, drawn).map(([x, y], i) => `${i ? "L" : "M"} ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const dip = spring({ frame: frame - evf("graphDip"), fps, config: SPRING.pop });
  const peak = spring({ frame: frame - evf("graphPeak"), fps, config: SPRING.pop });
  return (
    <g opacity={show} transform={`translate(0 ${(1 - show) * 60})`}>
      <rect x={gx + 14} y={gy + 30} width={gw} height={gh} rx={40} fill={K.shadow} filter="url(#iso-soft)" />
      <rect x={gx} y={gy} width={gw} height={gh} rx={40} fill={K.white} />
      <g transform={`translate(${gx + 56} ${gy + 62})`}>
        <circle r={26} fill={K.orange} />
        <Icon name="trend" s={30} color={K.white} />
      </g>
      <text x={gx + 100} y={gy + 74} fontFamily={FONTS.body} fontWeight={800} fontSize={34} fill={K.navy700}>
        Pendapatan bulanan
      </text>
      {[0.25, 0.5, 0.75, 1].map((g) => (
        <line key={g} x1={plotX} x2={plotX + plotW} y1={base - g * (gh - 200)} y2={base - g * (gh - 200)} stroke={K.mist} strokeOpacity={0.5} strokeWidth={2} />
      ))}
      {heights.map((hgt, i) => (
        <g key={i}>
          <rect
            x={plotX + barW * i + barW * 0.18}
            y={base - hgt.h}
            width={barW * 0.64}
            height={Math.max(0, hgt.h)}
            rx={10}
            fill={i === 4 ? K.orange : i === 5 ? K.navy400 : K.orangeSoft}
          />
          <text x={plotX + barW * (i + 0.5)} y={base + 42} textAnchor="middle" fontFamily={FONTS.body} fontWeight={700} fontSize={26} fill={K.navy400}>
            {MONTHS[i]}
          </text>
        </g>
      ))}
      {drawn > 1 && <path d={line} stroke={K.navy700} strokeWidth={6} fill="none" strokeLinejoin="round" strokeLinecap="round" />}
      {pts.slice(0, drawn).map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={9} fill={K.white} stroke={K.navy700} strokeWidth={5} />
      ))}
      {peak > 0.01 && (
        <g transform={`translate(${pts[4][0] - 175} ${pts[4][1] + 40}) scale(${peak})`}>
          <rect x={-110} y={-34} width={220} height={60} rx={30} fill={K.orange} />
          <text x={0} y={8} textAnchor="middle" fontFamily={FONTS.display} fontWeight={800} fontSize={28} fill={K.navy900}>
            RM 8,200
          </text>
        </g>
      )}
      {dip > 0.01 && (
        <g transform={`translate(${gx + gw - 130} ${gy + 62}) scale(${dip})`}>
          <rect x={-110} y={-30} width={220} height={60} rx={30} fill={K.navy700} />
          <path d="M -78 -10 L -78 12 M -88 2 L -78 12 L -68 2" stroke={K.coral} strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <text x={14} y={10} textAnchor="middle" fontFamily={FONTS.body} fontWeight={800} fontSize={26} fill={K.white}>
            Bulan sepi
          </text>
        </g>
      )}
    </g>
  );
};
