// S04: live dashboard under a tilted 3D camera. Cards cascade in, a dotted
// Malaysia map pulses on Kuala Lumpur, and the visitor and cart counters tick 0 -> 1.
import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { kedaiTheme as K, T } from "../theme";
import { Camera3D } from "../kit";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const L = T.live;
const DUR = T.shots.live.dur;

// Stylized outlines in map-card pixels (520 x 250): the peninsula and Sarawak + Sabah.
const PENINSULA = [[96, 18], [128, 22], [146, 58], [170, 112], [184, 168], [174, 214], [150, 206], [128, 164], [110, 112], [94, 62]];
const BORNEO = [[236, 196], [276, 168], [318, 156], [360, 134], [398, 104], [428, 68], [462, 40], [496, 54], [488, 92], [452, 116], [418, 138], [378, 160], [336, 182], [294, 200], [256, 212]];
const KL = { x: 140, y: 150 };

const inside = (x: number, y: number, poly: number[][]) => {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
};
const DOTS: { x: number; y: number; land: boolean }[] = [];
for (let y = 8; y < 250; y += 10) {
  for (let x = 8; x < 520; x += 10) {
    DOTS.push({ x, y, land: inside(x, y, PENINSULA) || inside(x, y, BORNEO) });
  }
}

const Card: React.FC<{ i: number; w: number; h: number; children: React.ReactNode }> = ({ i, w, h, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - 4 - i * L.cardStagger, fps, config: K.spring.smooth });
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: 22,
        background: K.colors.panel,
        boxShadow: `0 0 0 1px ${K.colors.line}, 0 30px 70px rgba(0,0,0,0.45)`,
        padding: 22,
        boxSizing: "border-box",
        position: "relative",
        overflow: "hidden",
        opacity: interpolate(s, [0, 0.5], [0, 1], clamp),
        translate: `0 ${interpolate(s, [0, 1], [50, 0])}px`,
        scale: interpolate(s, [0, 1], [0.94, 1]),
      }}
    >
      {children}
    </div>
  );
};

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontSize: 15, color: K.colors.textDim, fontWeight: 500 }}>{children}</div>
);

// Counter that flips 0 -> 1 with a small pop on the frame it changes
const Count: React.FC<{ at: number; size?: number }> = ({ at, size = 40 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: frame - at, fps, config: K.spring.snappy });
  return (
    <div style={{ fontSize: size, fontWeight: 700, marginTop: 6, scale: frame >= at ? interpolate(pop, [0, 0.5, 1], [1, 1.25, 1]) : 1, transformOrigin: "left", color: frame >= at ? K.colors.hero : K.colors.text }}>
      {frame >= at ? 1 : 0}
    </div>
  );
};

const Spark: React.FC = () => (
  <svg width={200} height={40} style={{ position: "absolute", left: 22, top: 70 }}>
    <path d="M0 30 H200" stroke={K.colors.hero} strokeOpacity={0.6} strokeWidth={2} fill="none" />
    <circle cx={200 - 3} cy={30} r={3} fill={K.colors.hero} />
  </svg>
);

export const LiveView: React.FC = () => {
  const frame = useCurrentFrame();
  const ph = (frame % 30) / 30;
  const mapOn = interpolate(frame, [14, 34], [0, 1], clamp);
  return (
    <Camera3D dur={DUR} rotX={[24, 9]} rotY={[-12, 6]} z={[-240, 30]}>
      <div style={{ width: 1120, fontFamily: K.fonts.body, color: K.colors.text }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginBottom: 22 }}>
          <div style={{ fontSize: 38, fontWeight: 700, letterSpacing: "-0.02em" }}>Paparan Langsung</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 15, color: K.colors.textDim }}>
            <div style={{ width: 8, height: 8, borderRadius: 4, background: K.colors.hero, opacity: 0.5 + 0.5 * Math.cos(ph * Math.PI * 2) }} />
            Sekarang
          </div>
        </div>
        <div style={{ display: "flex", gap: 20 }}>
          <Card i={0} w={600} h={330}>
            <svg width={520} height={250} style={{ position: "absolute", left: 40, top: 16 }}>
              {DOTS.map((d, i) => (
                <circle key={i} cx={d.x} cy={d.y} r={d.land ? 2.6 : 1.2} fill={d.land ? "#8B9098" : "#2E3238"} opacity={d.land ? 0.35 + 0.65 * mapOn : 1} />
              ))}
              {frame >= L.visitor - 4 && (
                <>
                  <circle cx={KL.x} cy={KL.y} r={6 + ph * 22} fill="none" stroke={K.colors.hero} strokeWidth={2} opacity={1 - ph} />
                  <circle cx={KL.x} cy={KL.y} r={6} fill={K.colors.hero} />
                </>
              )}
            </svg>
            <div style={{ position: "absolute", left: 22, bottom: 18 }}>
              <Label>Pelawat sekarang</Label>
              <Count at={L.visitor} />
            </div>
          </Card>
          <Card i={1} w={240} h={330}>
            <Spark />
            <div style={{ position: "absolute", left: 22, bottom: 18 }}>
              <Label>Jumlah jualan</Label>
              <div style={{ fontSize: 40, fontWeight: 700, marginTop: 6 }}>RM0.00</div>
            </div>
          </Card>
          <Card i={2} w={240} h={330}>
            <Spark />
            <div style={{ position: "absolute", left: 22, bottom: 18 }}>
              <Label>Pesanan</Label>
              <div style={{ fontSize: 40, fontWeight: 700, marginTop: 6 }}>0</div>
            </div>
          </Card>
        </div>
        <div style={{ fontSize: 20, fontWeight: 650, margin: "26px 0 14px", opacity: interpolate(frame, [4 + 3 * L.cardStagger, 14 + 3 * L.cardStagger], [0, 1], clamp) }}>
          Gelagat pelanggan
        </div>
        <div style={{ display: "flex", gap: 20 }}>
          <Card i={3} w={360} h={130}>
            <Label>Troli aktif</Label>
            <Count at={L.cart} size={34} />
          </Card>
          <Card i={4} w={360} h={130}>
            <Label>Sedang bayar</Label>
            <div style={{ fontSize: 34, fontWeight: 700, marginTop: 6 }}>0</div>
          </Card>
          <Card i={5} w={360} h={130}>
            <Label>Dibeli</Label>
            <div style={{ fontSize: 34, fontWeight: 700, marginTop: 6 }}>0</div>
          </Card>
        </div>
      </div>
    </Camera3D>
  );
};
