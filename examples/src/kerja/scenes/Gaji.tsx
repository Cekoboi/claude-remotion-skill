import React from "react";
import { AbsoluteFill, interpolate, interpolateColors, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { beatPulse, camAt, camTransform } from "../camera";
import { iso, IsoBox, IsoDefs, IsoPlane, IsoShadow, Person } from "../iso";
import { bf, EASE, ev, evf, FONTS, FPB, K, SCENE, SPRING } from "../theme";
import { Background, Card, Chip } from "../ui";

const W = 1080;
const H = 1920;
const U = 58;
// room center (3.5, 3) projected, so the room sits on the world origin
const [OX, OY] = iso(3.5, 3, 0, U);
const at = (x: number, y: number, z: number): [number, number] => {
  const [a, b] = iso(x, y, z, U);
  return [a - OX, b - OY];
};
const CLOCK = at(5.4, 0, 2.95);

const EXPENSES = [
  { id: "rent" as const, icon: "home", title: "Sewa rumah", amount: 900 },
  { id: "car" as const, icon: "car", title: "Ansuran kereta", amount: 650 },
  { id: "bills" as const, icon: "bolt", title: "Bil & makan", amount: 1200 },
];
const SALARY = 3500;
const rm = (n: number) => `RM ${Math.round(n).toLocaleString("en-US")}`;

export const Gaji: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const beat = frame / FPB;
  const start = SCENE.gaji.from;
  const end = start + SCENE.gaji.beats;
  const cam = camAt(
    [
      { beat: start, x: 0, y: -20, zoom: 0.92 },
      { beat: start + 1, x: 0, y: -10, zoom: 0.98, move: 1 },
      { beat: ev("clockStart"), x: CLOCK[0], y: CLOCK[1] + 40, zoom: 1.75, move: 2 },
      { beat: ev("clockEnd") + 1, x: 40, y: -40, zoom: 1.0, move: 1.5 },
      { beat: ev("salary") - 1, x: 300, y: -40, zoom: 1.05, move: 1.5 },
      { beat: ev("rent") - 0.5, x: 300, y: 60, zoom: 1.0, move: 1.5 },
      { beat: ev("balance"), x: 300, y: 110, zoom: 1.08, move: 1 },
    ],
    beat,
  );
  const pulse = beatPulse(frame, fps);
  const enter = spring({ frame: frame - bf(start), fps, config: SPRING.smooth });

  // clock: 09:00 -> 18:00 between clockStart and clockEnd
  const clockP = interpolate(beat, [ev("clockStart"), ev("clockEnd")], [0, 1], { easing: EASE.inOut, extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const minutes = 540 + clockP * 540;
  const hourDeg = (minutes / 60) * 30;
  const minDeg = (minutes % 60) * 6 + Math.floor(minutes / 60) * 360;
  const hh = String(Math.floor(minutes / 60)).padStart(2, "0");
  const mm = String(Math.floor(minutes % 60)).padStart(2, "0");

  // balance steps down as each expense lands
  let balance = SALARY;
  for (const e of EXPENSES) {
    const p = spring({ frame: frame - evf(e.id), fps, config: SPRING.smooth });
    balance -= e.amount * p;
  }
  const lowP = spring({ frame: frame - evf("balance"), fps, config: SPRING.pop });
  const type = (frame / (FPB / 2)) % 1; // a tap every eighth note
  const salaryP = spring({ frame: frame - evf("salary"), fps, config: SPRING.pop });

  return (
    <AbsoluteFill>
      <Background camX={cam.x} camY={cam.y} tint={K.cyan} />
      <svg width={W} height={H} style={{ position: "absolute" }}>
        <IsoDefs />
        <g transform={camTransform(cam, pulse)}>
          <g transform={`translate(${-OX} ${-OY + (1 - enter) * 120})`} opacity={Math.min(1, enter * 1.5)}>
            <IsoShadow x={0} y={0} w={7} d={6} u={U} spread={0.8} />
            {/* walls */}
            <IsoBox x={-0.3} y={0} w={0.3} d={6} h={4.2} u={U} color={K.navy500} top={K.navy400} />
            <IsoBox x={0} y={-0.3} w={7} d={0.3} h={4.2} u={U} color={K.navy600} top={K.navy400} />
            {/* window with the city */}
            <IsoPlane kind="wallY" x={0} y={0.8} z={3.5} u={U}>
              <rect x={0} y={0} width={3} height={2} rx={0.08} fill={K.cyanDeep} />
              <rect x={0} y={1.1} width={3} height={0.9} fill={K.cyan} opacity={0.35} />
              {[0.2, 0.7, 1.1, 1.6, 2.1, 2.5].map((bx, i) => (
                <rect key={bx} x={bx} y={2 - (0.6 + ((i * 37) % 9) / 10)} width={0.34} height={0.6 + ((i * 37) % 9) / 10} fill={K.navy700} opacity={0.85} />
              ))}
              <rect x={0} y={0} width={3} height={2} rx={0.08} fill="none" stroke={K.white} strokeWidth={0.08} />
              <line x1={1.5} y1={0} x2={1.5} y2={2} stroke={K.white} strokeWidth={0.06} />
            </IsoPlane>
            {/* wall clock */}
            <IsoPlane kind="wallX" x={4.6} y={0} z={3.75} u={U}>
              <circle cx={0.8} cy={0.8} r={0.72} fill={K.white} />
              <circle cx={0.8} cy={0.8} r={0.72} fill="none" stroke={K.orange} strokeWidth={0.09} />
              {Array.from({ length: 12 }).map((_, i) => (
                <line key={i} x1={0.8} y1={0.16} x2={0.8} y2={0.26} stroke={K.navy700} strokeWidth={0.05} transform={`rotate(${i * 30} 0.8 0.8)`} />
              ))}
              <line x1={0.8} y1={0.8} x2={0.8} y2={0.42} stroke={K.navy800} strokeWidth={0.09} strokeLinecap="round" transform={`rotate(${hourDeg} 0.8 0.8)`} />
              <line x1={0.8} y1={0.8} x2={0.8} y2={0.22} stroke={K.orangeDeep} strokeWidth={0.05} strokeLinecap="round" transform={`rotate(${minDeg} 0.8 0.8)`} />
              <circle cx={0.8} cy={0.8} r={0.06} fill={K.navy800} />
            </IsoPlane>
            {/* poster */}
            <IsoPlane kind="wallX" x={1.1} y={0} z={3.3} u={U}>
              <rect x={0} y={0} width={1.4} height={1.0} rx={0.06} fill={K.navy400} />
              {[0.25, 0.5, 0.75].map((bx, i) => (
                <rect key={bx} x={bx * 1.4 - 0.1} y={0.85 - (i + 1) * 0.18} width={0.2} height={(i + 1) * 0.18} fill={K.cyan} />
              ))}
            </IsoPlane>
            {/* floor + rug */}
            <IsoBox x={0} y={0} w={7} d={6} h={0.25} z={-0.25} u={U} color={K.navy600} top="#2A4F9E" />
            <IsoPlane kind="floor" x={1.6} y={1.6} z={0.001} u={U}>
              <rect x={0} y={0} width={4.2} height={3.2} rx={0.3} fill={K.navy400} opacity={0.6} />
            </IsoPlane>
            {/* cabinet */}
            <IsoShadow x={0.2} y={4.2} w={1} d={1.3} u={U} />
            <IsoBox x={0.2} y={4.2} w={1} d={1.3} h={1.7} u={U} color={K.navy400} top={K.mist} />
            {[0.45, 1.0].map((dz) => (
              <IsoPlane key={dz} kind="wallY" x={1.2} y={4.4} z={dz + 0.5} u={U}>
                <rect x={0} y={0} width={0.9} height={0.08} rx={0.04} fill={K.cyanSoft} />
              </IsoPlane>
            ))}
            {/* chair + employee + desk */}
            <IsoBox x={3.1} y={1.2} w={1.0} d={0.9} h={0.9} u={U} color={K.navy800} />
            <IsoBox x={3.1} y={1.1} w={1.0} d={0.2} h={1.9} u={U} color={K.navy800} />
            <Person x={3.6} y={1.75} z={0.9} u={U} shirt={K.cyanDeep} type={type} cheer={salaryP * (1 - lowP)} bob={Math.abs(Math.sin(beat * Math.PI)) * 0.03} />
            <IsoShadow x={2.2} y={2.5} w={2.8} d={1.4} u={U} />
            <IsoBox x={2.2} y={2.5} w={2.8} d={1.4} h={1.2} u={U} color={K.white} top={K.white} />
            <IsoPlane kind="floor" x={3.0} y={2.65} z={1.201} u={U}>
              <rect x={0} y={0} width={1.2} height={0.45} rx={0.06} fill={K.navy700} />
              {Array.from({ length: 12 }).map((_, i) => (
                <rect key={i} x={0.08 + (i % 6) * 0.18} y={0.08 + Math.floor(i / 6) * 0.18} width={0.13} height={0.12} rx={0.02} fill={K.mist} opacity={0.8} />
              ))}
            </IsoPlane>
            {/* monitor, screen glowing cyan */}
            <IsoBox x={4.25} y={2.7} w={0.5} d={0.5} h={0.12} z={1.2} u={U} color={K.navy700} />
            <IsoBox x={4.35} y={2.85} w={0.2} d={0.2} h={0.5} z={1.32} u={U} color={K.navy700} />
            <IsoBox x={3.9} y={2.55} w={1.0} d={0.1} h={0.85} z={1.75} u={U} color={K.navy800} />
            <IsoPlane kind="wallX" x={3.95} y={2.65} z={2.55} u={U}>
              <rect x={0} y={0} width={0.9} height={0.72} rx={0.04} fill={K.cyan} opacity={0.85} />
              {[0.15, 0.3, 0.45].map((ly) => (
                <rect key={ly} x={0.1} y={ly} width={0.5 + ((ly * 10) % 3) * 0.08} height={0.06} fill={K.navy700} opacity={0.6} />
              ))}
            </IsoPlane>
            {/* mug + plant */}
            <IsoBox x={2.45} y={3.2} w={0.3} d={0.3} h={0.35} z={1.2} u={U} color={K.orange} />
            <IsoShadow x={5.8} y={4.4} w={0.8} d={0.8} u={U} />
            <IsoBox x={5.8} y={4.4} w={0.8} d={0.8} h={0.8} u={U} color={K.orangeDeep} />
            {[[-0.3, -1.5, 0.42], [0.25, -1.8, 0.38], [0, -2.2, 0.34], [-0.2, -2.6, 0.28]].map(([dx, dy, r], i) => {
              const [px, py] = iso(6.2, 4.8, 0.8, U);
              return <circle key={i} cx={px + dx * U} cy={py + dy * U * 0.55 + Math.sin(frame * 0.06 + i) * 2} r={r * U} fill={i % 2 ? K.cyanDeep : "#159AB8"} />;
            })}
          </g>

          {/* money story, floating to the right of the room */}
          <Card x={300} y={-300} at={evf("salary")} from={[260, 0]} icon="bank" accent={K.cyanDeep} title="Gaji masuk" value={`+${rm(SALARY)}`} valueColor={K.cyanDeep} />
          {frame >= evf("stable") - 1 && (
            <g transform={`translate(440 ${-385}) scale(${spring({ frame: frame - evf("stable"), fps, config: SPRING.pop })})`}>
              <rect x={-120} y={-34} width={240} height={68} rx={34} fill={K.cyan} />
              <text x={0} y={12} textAnchor="middle" fontFamily={FONTS.display} fontWeight={800} fontSize={30} fill={K.navy900}>
                STABIL
              </text>
            </g>
          )}
          {EXPENSES.map((e, i) => (
            <Card key={e.id} x={300} y={-110 + i * 150} at={evf(e.id)} from={[0, -260]} icon={e.icon} accent={K.orange} title={e.title} value={`-${rm(e.amount)}`} valueColor={K.orangeDeep} />
          ))}
          {frame >= evf("rent") - 2 && (
            <g transform={`translate(300 ${370}) scale(${1 + 0.08 * lowP * Math.exp(-(frame - evf("balance")) / 12)})`}>
              <rect x={-260} y={-80} width={520} height={160} rx={36} fill={interpolateColors(Math.min(1, lowP), [0, 1], [K.navy500, K.orangeDeep])} />
              <text x={-220} y={-18} fontFamily={FONTS.body} fontWeight={700} fontSize={30} fill={K.white} opacity={0.85}>
                Baki hujung bulan
              </text>
              <text x={-220} y={46} fontFamily={FONTS.display} fontWeight={800} fontSize={54} fill={K.white}>
                {rm(balance)}
              </text>
            </g>
          )}
        </g>
      </svg>
      <Chip text="KERJA MAKAN GAJI" color={K.cyan} at={bf(start) + 4} out={bf(end)} />
      {/* digital time readout while the clock spins */}
      {beat >= ev("clockStart") - 0.5 && beat < ev("clockEnd") + 2 && (
        <div
          style={{
            position: "absolute",
            top: 1270,
            width: W,
            textAlign: "center",
            opacity: interpolate(beat, [ev("clockStart") - 0.5, ev("clockStart"), ev("clockEnd") + 1.5, ev("clockEnd") + 2], [0, 1, 1, 0]),
          }}
        >
          <div style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 120, color: K.white, letterSpacing: "-0.03em", textShadow: "0 10px 40px rgba(3,8,28,0.6)" }}>
            {hh}:{mm}
          </div>
          <div style={{ fontFamily: FONTS.body, fontWeight: 800, fontSize: 40, color: K.cyan, marginTop: 6 }}>{clockP < 0.5 ? "MASUK 9 PAGI" : "BALIK 6 PETANG"}</div>
        </div>
      )}
    </AbsoluteFill>
  );
};
