import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { beatPulse, camAt, camTransform } from "../camera";
import { IsoBox, IsoDefs, IsoPlane, IsoShadow } from "../iso";
import { evf, FONTS, FPB, K, SPRING } from "../theme";
import { Background, Words } from "../ui";

const W = 1080;
const H = 1920;
const U = 44;

// mini office tower: windows mapped onto both visible walls
export const OfficeTower: React.FC<{ u: number; floors?: number; lit?: number }> = ({ u, floors = 5, lit = 1 }) => (
  <g>
    <IsoShadow x={-1} y={-1} w={2} d={2} u={u} />
    <IsoBox x={-1} y={-1} w={2} d={2} h={floors * 0.8} u={u} color={K.navy400} top={K.cyanSoft} />
    {Array.from({ length: floors }).map((_, f) => (
      <React.Fragment key={f}>
        <IsoPlane kind="wallX" x={-1} y={1} z={f * 0.8 + 0.62} u={u}>
          {[0.25, 0.85, 1.45].map((wx) => (
            <rect key={wx} x={wx} y={0} width={0.32} height={0.36} rx={0.04} fill={K.cyan} opacity={lit * (f % 2 ? 0.95 : 0.7)} />
          ))}
        </IsoPlane>
        <IsoPlane kind="wallY" x={1} y={-1} z={f * 0.8 + 0.62} u={u}>
          {[0.25, 0.85, 1.45].map((wx) => (
            <rect key={wx} x={wx} y={0} width={0.32} height={0.36} rx={0.04} fill={K.cyanDeep} opacity={lit * 0.75} />
          ))}
        </IsoPlane>
      </React.Fragment>
    ))}
  </g>
);

// mini shop: orange box, striped awning, door, parcel stack
export const Shop: React.FC<{ u: number; frame: number }> = ({ u, frame }) => (
  <g>
    <IsoShadow x={-1.2} y={-1} w={2.4} d={2} u={u} />
    <IsoBox x={-1.2} y={-1} w={2.4} d={2} h={2.1} u={u} color={K.orange} top={K.orangeSoft} />
    <IsoPlane kind="wallX" x={-1.2} y={1} z={2.1} u={u}>
      {Array.from({ length: 6 }).map((_, i) => (
        <path key={i} d={`M ${i * 0.4} 0 L ${i * 0.4 + 0.4} 0 L ${i * 0.4 + 0.4} 0.42 Q ${i * 0.4 + 0.2} 0.6 ${i * 0.4} 0.42 Z`} fill={i % 2 ? K.white : K.orangeDeep} />
      ))}
      <rect x={0.9} y={0.95} width={0.6} height={1.15} rx={0.06} fill={K.navy700} />
      <rect x={0.18} y={0.95} width={0.52} height={0.5} rx={0.05} fill={K.cyanSoft} opacity={0.9} />
    </IsoPlane>
    <g transform={`translate(0 ${Math.sin(frame * 0.12) * 2})`}>
      <IsoBox x={1.4} y={0.2} w={0.7} d={0.7} h={0.6} u={u} color="#C98A4E" />
      <IsoBox x={1.5} y={0.3} w={0.5} d={0.5} h={0.45} z={0.6} u={u} color="#D9A066" />
    </g>
  </g>
);

const Platform: React.FC<{ u: number; color: string; top: string }> = ({ u, color, top }) => (
  <g>
    <IsoShadow x={-2.4} y={-2.4} w={4.8} d={4.8} u={u} spread={0.5} />
    <IsoBox x={-2.4} y={-2.4} w={4.8} d={4.8} h={0.55} u={u} color={color} top={top} />
  </g>
);

export const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const beat = frame / FPB;
  const cam = camAt(
    [
      { beat: 0, x: 0, y: 120, zoom: 0.84 },
      { beat: 2, x: -30, y: 60, zoom: 1.0, move: 2 },
      { beat: 6, x: 30, y: 60, zoom: 1.03, move: 1.5 },
      { beat: 10, x: 0, y: 30, zoom: 1.08, move: 2 },
    ],
    beat,
  );
  const pulse = beatPulse(frame, fps);
  const left = spring({ frame: frame - evf("titleGaji"), fps, config: SPRING.smooth });
  const right = spring({ frame: frame - evf("titleSendiri"), fps, config: SPRING.smooth });
  const vs = spring({ frame: frame - evf("vs"), fps, config: SPRING.pop });
  const burst = (at: number, color: string) => {
    const t = (frame - at) / fps;
    if (t < 0 || t > 0.8) return null;
    return <circle cx={0} cy={-420} r={200 + t * 900} fill="none" stroke={color} strokeWidth={30 * (1 - t / 0.8)} opacity={0.5 * (1 - t / 0.8)} />;
  };
  return (
    <AbsoluteFill>
      <Background camX={cam.x} camY={cam.y} tint={beat < 6 ? K.cyan : K.orange} />
      <svg width={W} height={H} style={{ position: "absolute" }}>
        <IsoDefs />
        <g transform={camTransform(cam, pulse)}>
          {burst(evf("titleGaji"), K.cyan)}
          {burst(evf("titleSendiri"), K.orange)}
          <g transform={`translate(-250 ${330 + (1 - left) * 700})`} opacity={Math.min(1, left * 2)}>
            <g transform={`translate(0 ${Math.sin(frame * 0.05) * 8})`}>
              <Platform u={U} color={K.navy500} top={K.cyanDeep} />
              <g transform={`translate(0 ${-0.55 * U}) scale(${0.6 + 0.4 * left})`}>
                <OfficeTower u={U} lit={interpolate(frame, [evf("titleGaji") + 4, evf("titleGaji") + 20], [0.2, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
              </g>
            </g>
          </g>
          <g transform={`translate(250 ${330 + (1 - right) * 700})`} opacity={Math.min(1, right * 2)}>
            <g transform={`translate(0 ${Math.sin(frame * 0.05 + 1.5) * 8})`}>
              <Platform u={U} color={K.navy500} top={K.orangeDeep} />
              <g transform={`translate(0 ${-0.55 * U}) scale(${0.6 + 0.4 * right})`}>
                <Shop u={U} frame={frame} />
              </g>
            </g>
          </g>
        </g>
      </svg>
      {/* titles */}
      <div style={{ position: "absolute", top: 300, width: W }}>
        <Words text="KERJA MAKAN GAJI" at={evf("titleGaji")} size={92} highlight={{ GAJI: K.cyan }} style={{ maxWidth: 980, margin: "0 auto" }} />
      </div>
      <div style={{ position: "absolute", top: 560, width: W, display: "flex", justifyContent: "center" }}>
        <div
          style={{
            width: 150,
            height: 150,
            borderRadius: 999,
            background: K.white,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: FONTS.display,
            fontWeight: 900,
            fontSize: 60,
            color: K.navy800,
            opacity: Math.min(1, vs * 1.5),
            transform: `scale(${vs}) rotate(${(1 - vs) * -180}deg)`,
            boxShadow: `0 0 0 10px ${K.navy800}, 0 0 0 16px ${K.orange}, 0 20px 60px rgba(0,0,0,0.5)`,
          }}
        >
          VS
        </div>
      </div>
      <div style={{ position: "absolute", top: 750, width: W }}>
        <Words text="KERJA SENDIRI" at={evf("titleSendiri")} size={92} highlight={{ SENDIRI: K.orange }} />
      </div>
      <div style={{ position: "absolute", top: 1590, width: W }}>
        <Words text="Mana satu lebih berbaloi?" at={evf("question")} size={58} font={FONTS.body} weight={800} stagger={2} />
      </div>
    </AbsoluteFill>
  );
};
