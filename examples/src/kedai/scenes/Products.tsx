// S03: the app opens on a skeleton list, rows fill in, then focus racks from
// row to row (sharp + lifted) while the camera follows and the rest blur.
import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { kedaiTheme as K, T } from "../theme";
import { Camera3D, velocityBlur } from "../kit";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const P = T.products;
const ROW_H = 96;
const DUR = T.shots.products.dur;

const ROWS = [
  { title: "Kuih Lapis", meta: "RM18.00 · 24 dalam stok" },
  { title: "Sambal Bilis", meta: "RM12.50 · 40 dalam stok" },
  { title: "Tote Batik", meta: "RM45.00 · 12 dalam stok" },
  { title: "Kopi Tenom", meta: "RM22.00 · 30 dalam stok" },
  { title: "Dodol Durian", meta: "RM15.00 · 18 dalam stok" },
  { title: "Kain Pelikat", meta: "RM60.00 · 8 dalam stok" },
];

// [frame, row] stops -> a continuous focus value that holds, then glides.
const focusAt = (frame: number, move = 10) => {
  const input: number[] = [];
  const output: number[] = [];
  P.focus.forEach(([f, row], i) => {
    if (i > 0) {
      input.push(f - move);
      output.push(P.focus[i - 1][1]);
    }
    input.push(f);
    output.push(row);
  });
  return interpolate(frame, input, output, { ...clamp, easing: K.ease.inOut });
};

const Thumb: React.FC<{ i: number }> = ({ i }) => (
  <div
    style={{
      width: 56,
      height: 56,
      borderRadius: 12,
      flexShrink: 0,
      background: `linear-gradient(145deg, ${K.colors.thumbs[i]}, ${K.colors.thumbs[(i + 3) % K.colors.thumbs.length]})`,
      display: "grid",
      placeItems: "center",
    }}
  >
    <div style={{ width: 22, height: 22, borderRadius: i % 2 ? 11 : 4, background: "rgba(255,255,255,0.35)" }} />
  </div>
);

export const Products: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // takeover landing: the UI settles from slightly too big
  const land = interpolate(frame, [0, 12], [1.15, 1], { ...clamp, easing: K.ease.out });
  // focus effect fades in once rows are filled
  const on = interpolate(frame, [P.focus[0][0] - 10, P.focus[0][0]], [0, 1], clamp);
  const focus = focusAt(frame);
  const camY = (f: number) => -focusAt(f) * ROW_H;

  return (
    <AbsoluteFill style={{ scale: land }}>
      <Camera3D dur={DUR} rotX={[16, 7]} rotY={[-9, 5]} z={[-120, 40]}>
        <div style={{ width: 820, fontFamily: K.fonts.body, color: K.colors.text, translate: `0 ${190 + camY(frame) * on}px`, filter: `blur(${velocityBlur(camY, frame, 0.3, 6)}px)` }}>
          <div style={{ fontSize: 40, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 14, opacity: 1 - 0.6 * on }}>Produk</div>
          <div style={{ display: "flex", gap: 10, marginBottom: 22, opacity: 1 - 0.6 * on }}>
            {["Semua", "Aktif", "Draf"].map((t, i) => (
              <div key={t} style={{ padding: "6px 16px", borderRadius: 20, fontSize: 16, fontWeight: 600, background: i === 0 ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.05)", color: i === 0 ? K.colors.text : K.colors.textDim }}>
                {t}
              </div>
            ))}
          </div>
          {ROWS.map((r, i) => {
            const fill = spring({ frame: frame - P.fill - i * 4, fps, config: K.spring.snappy });
            const d = Math.min(Math.abs(i - focus), 2) * on;
            const near = Math.max(0, 1 - Math.abs(i - focus)) * on;
            return (
              <div
                key={r.title}
                style={{
                  position: "relative",
                  zIndex: near > 0.5 ? 2 : 1,
                  height: ROW_H - 14,
                  marginBottom: 14,
                  borderRadius: 18,
                  padding: "0 22px",
                  display: "flex",
                  alignItems: "center",
                  gap: 18,
                  background: near > 0 ? `rgba(48,51,58,${0.6 + 0.36 * near})` : K.colors.panel,
                  boxShadow: `0 ${24 * near}px ${70 * near}px rgba(0,0,0,${0.55 * near}), 0 0 0 1px rgba(255,255,255,${0.06 + 0.14 * near})`,
                  scale: 1 + 0.09 * near,
                  filter: d > 0.05 ? `blur(${d * 2.6}px)` : "none",
                  opacity: 1 - d * 0.32,
                }}
              >
                {/* skeleton underneath, real content fades over it */}
                <div style={{ position: "absolute", inset: "0 22px", display: "flex", alignItems: "center", gap: 18, opacity: 1 - fill }}>
                  <div style={{ width: 56, height: 56, borderRadius: 12, background: K.colors.skeleton }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ width: 180, height: 14, borderRadius: 7, background: K.colors.skeleton }} />
                    <div style={{ width: 120, height: 10, borderRadius: 5, marginTop: 10, background: K.colors.skeleton }} />
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 18, flex: 1, opacity: fill, translate: `${interpolate(fill, [0, 1], [16, 0])}px 0` }}>
                  <Thumb i={i} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 24, fontWeight: 650 }}>{r.title}</div>
                    <div style={{ fontSize: 16, color: K.colors.textDim, marginTop: 4 }}>{r.meta}</div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: K.colors.hero, background: K.colors.heroSoft, padding: "5px 12px", borderRadius: 8 }}>Aktif</div>
                  <div style={{ fontSize: 22, color: K.colors.textDim }}>›</div>
                </div>
              </div>
            );
          })}
        </div>
      </Camera3D>
    </AbsoluteFill>
  );
};
