// The seven shots of the "Gerak 2.0" behind-the-build promo. Frame numbers
// inside each are local to its Sequence; all of them come from timing.json.
import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { measureText } from "@remotion/layout-utils";
import { gerakTheme as G, GT } from "../theme";
import { AssembleMark, Billboard, EaseGraph, EditorSet, Halftone, KeyTracks, Manggis, ParticleText, Shards, TypeLine, WorkingPill, mascotAt } from "../kit";
import { Cursor, useClick } from "../../prompt/kit";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const C = G.colors;
const center = { alignItems: "center", justifyContent: "center" } as const;
const S = GT.set;

// What the preview shows; drawn at 1100 x 620 inside the editor and scaled to
// full frame for the next shot, so the push-in is a match cut.
const PREVIEW = { w: 1100, h: 620 };
export const PreviewContent: React.FC<{ scale: number; title: number; glow: number; assemble: number; disperse: number }> = ({
  scale,
  title,
  glow,
  assemble,
  disperse,
}) => (
  <div style={{ position: "relative", width: PREVIEW.w * scale, height: PREVIEW.h * scale, overflow: "hidden" }}>
    <AbsoluteFill style={{ background: C.preview, opacity: 1 - glow }} />
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 50%, #2A1B33, ${C.bg} 70%)`, opacity: glow }} />
    {glow > 0 && (
      <ParticleText text="2.0" size={330 * scale} step={Math.max(4, Math.round(5 * scale))} dot={1.6 * scale} assemble={assemble} disperse={disperse} width={PREVIEW.w * scale} height={PREVIEW.h * scale} />
    )}
    <AbsoluteFill style={center}>
      <div
        style={{
          fontFamily: G.fonts.display,
          fontWeight: 700,
          fontSize: 96 * scale,
          letterSpacing: "-0.03em",
          color: C.text,
          opacity: title * (1 - disperse),
          scale: interpolate(title, [0, 1], [0.8, 1]),
          textShadow: `0 0 ${30 * glow * scale}px ${C.heroGlow}`,
        }}
      >
        Gerak <span style={{ color: glow > 0.5 ? C.hero : C.text }}>2.0</span>
      </div>
    </AbsoluteFill>
  </div>
);

const MENU = ["Fail", "Edit", "Komposisi", "Lapisan", "Kesan", "Animasi", "Paparan", "Tetingkap"];
const EFFECTS = ["Cahaya", "Kabur", "Gerak Masuk", "Zarah", "Lantun"];
const TRACKS = [
  { label: "Tajuk", from: 0.02, to: 0.7 },
  { label: "Cahaya", from: 0.18, to: 0.9 },
  { label: "Zarah", from: 0.35, to: 0.98 },
  { label: "Audio", from: 0, to: 1 },
];

// S01: Manggis builds the title inside the editor
export const SetShot: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const m = mascotAt(frame, S.stations, S.hop);
  const ride = interpolate(frame, S.ride, [0, 1], { ...clamp, easing: G.ease.inOut });
  const playX = interpolate(ride, [0, 1], S.playhead);
  const riding = frame >= S.ride[0];
  const mx = riding ? playX : m.x;
  const title = spring({ frame: frame - S.title, fps, config: G.spring.bouncy });
  const glow = interpolate(frame, [S.drop, S.drop + 10], [0, 1], { ...clamp, easing: G.ease.out });
  const carrying = frame >= S.stations[2].at + 12 && frame < S.drop;
  const dropped = interpolate(frame, [S.drop, S.drop + 8], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <EditorSet cams={S.cams}>
        <div style={{ position: "absolute", left: 0, top: -40, width: 2400, height: 1440, borderRadius: 30, background: C.set, boxShadow: `0 0 0 2px ${C.line}`, fontFamily: G.fonts.body, color: C.text }}>
          <div style={{ position: "absolute", left: 40, top: 8, display: "flex", gap: 34, fontSize: 22, color: C.dim }}>
            {MENU.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
          {/* toolbar; button 6 is the text tool */}
          <div style={{ position: "absolute", left: 40, top: 80, display: "flex", gap: 14 }}>
            {Array.from({ length: 16 }).map((_, i) => {
              const on = i === 6 && m.station === 1;
              return (
                <div key={i} style={{ width: 64, height: 64, borderRadius: 14, background: on ? C.hero : C.panel, display: "grid", placeItems: "center", fontSize: 30, fontWeight: 700, color: on ? C.bg : C.dim, translate: on ? "0 3px" : "0 0" }}>
                  {i === 6 ? "T" : <div style={{ width: 22, height: 22, borderRadius: i % 3 ? 6 : 11, border: `3px solid ${on ? C.bg : "#5B5263"}` }} />}
                </div>
              );
            })}
          </div>
          {/* project panel */}
          <div style={{ position: "absolute", left: 40, top: 240, width: 420, height: 620, borderRadius: 18, background: C.panel, padding: 26, boxSizing: "border-box", fontSize: 21 }}>
            <div style={{ fontWeight: 700, marginBottom: 18 }}>Projek</div>
            {["intro-gerak.mp4", "Tajuk — Gerak 2.0", "latar.png", "muzik.wav"].map((t) => (
              <div key={t} style={{ padding: "12px 0", color: C.dim, borderBottom: `1px solid ${C.line}` }}>
                {t}
              </div>
            ))}
          </div>
          {/* preview */}
          <div style={{ position: "absolute", left: 500, top: 240, borderRadius: 10, overflow: "hidden", boxShadow: `0 0 ${60 * glow}px ${C.heroGlow}` }}>
            <PreviewContent scale={1} title={title} glow={glow} assemble={ride} disperse={0} />
          </div>
          {/* effects panel */}
          <div style={{ position: "absolute", left: 1660, top: 240, width: 680, height: 620, borderRadius: 18, background: C.panel, padding: 26, boxSizing: "border-box", fontSize: 24 }}>
            <div style={{ fontWeight: 700, marginBottom: 18 }}>Kesan &amp; Pratetap</div>
            {EFFECTS.map((t, i) => {
              const on = i === 0 && (m.station === 2 || carrying);
              return (
                <div key={t} style={{ height: 60, marginBottom: 14, borderRadius: 12, padding: "0 20px", display: "flex", alignItems: "center", gap: 14, background: on ? "rgba(163,230,53,0.18)" : C.panelHi, boxShadow: on ? `0 0 0 2px ${C.hero}` : "none", color: on ? C.heroHot : C.text, opacity: i === 0 && carrying ? 0.5 : 1 }}>
                  <span style={{ color: C.hero }}>✦</span>
                  {t}
                </div>
              );
            })}
          </div>
          {/* timeline */}
          <div style={{ position: "absolute", left: 160, top: 920, width: 2160, height: 440, borderRadius: 18, background: C.panel }}>
            <div style={{ position: "absolute", left: 240, right: 60, top: 18, display: "flex", justifyContent: "space-between", fontSize: 18, color: C.dim }}>
              {["00:00", "00:02", "00:04", "00:06", "00:08", "00:10"].map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
            {TRACKS.map((tr, i) => (
              <div key={tr.label} style={{ position: "absolute", left: 30, right: 60, top: 80 + i * 80, height: 56, display: "flex", alignItems: "center" }}>
                <div style={{ width: 210, fontSize: 22, color: C.dim }}>{tr.label}</div>
                <div style={{ position: "relative", flex: 1, height: 44 }}>
                  <div style={{ position: "absolute", top: 0, bottom: 0, left: `${tr.from * 100}%`, width: `${(tr.to - tr.from) * 100}%`, borderRadius: 12, background: C.tracks[i], opacity: 0.85 }} />
                </div>
              </div>
            ))}
          </div>
          {/* playhead (in set coordinates: the timeline starts at x 400) */}
          <div style={{ position: "absolute", left: playX - 2, top: 930, width: 4, height: 420, background: C.hero, boxShadow: `0 0 12px ${C.hero}` }} />
          <div style={{ position: "absolute", left: playX - 14, top: 916, width: 28, height: 28, rotate: "45deg", borderRadius: 6, background: C.hero }} />
          <Shards x={1050} y={600} start={S.shatter} />
        </div>
        {/* Manggis stands up off the plane; carries the Cahaya effect overhead */}
        <Billboard cams={S.cams} x={mx} y={riding ? 890 : m.y}>
          <div style={{ position: "relative" }}>
            {(carrying || dropped < 1) && frame < S.drop + 8 && (
              <div style={{ position: "absolute", left: "50%", top: -64, translate: "-50% 0", padding: "8px 18px", borderRadius: 14, background: C.hero, color: C.bg, fontFamily: G.fonts.body, fontWeight: 700, fontSize: 24, whiteSpace: "nowrap", opacity: frame >= S.drop ? dropped : 1, scale: frame >= S.drop ? dropped : 1, boxShadow: `0 0 20px ${C.heroGlow}` }}>
                ✦ Cahaya
              </div>
            )}
            <Manggis size={150} air={riding ? 0 : m.air} landed={riding ? frame - S.ride[0] + 30 : m.landed} dir={riding ? 1 : m.dir} />
          </div>
        </Billboard>
      </EditorSet>
    </AbsoluteFill>
  );
};

// S02: full frame — the preview's particles hold, then blow away
export const ParticlesShot: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const scale = width / PREVIEW.w;
  const disperse = interpolate(frame, GT.particles.disperse, [0, 1], { ...clamp, easing: G.ease.in });
  return (
    <AbsoluteFill style={{ ...center, background: C.bg }}>
      <div style={{ marginTop: (height - PREVIEW.h * scale) / 2 }}>
        <PreviewContent scale={scale} title={1} glow={1} assemble={1} disperse={disperse} />
      </div>
    </AbsoluteFill>
  );
};

const CHIPS = ["Tulis kod", "Analisis data", "Grafik gerak", "Kaji mendalam", "Belajar"];
const CHIP = { size: 20, pad: 20, gap: 12 };
const chipX = () => {
  const widths = CHIPS.map((c) => measureText({ text: c, fontFamily: G.fonts.body, fontSize: CHIP.size, fontWeight: 500 }).width + CHIP.pad * 2);
  const total = widths.reduce((a, b) => a + b, 0) + CHIP.gap * (CHIPS.length - 1);
  return { widths, centers: widths.map((w, i) => 960 - total / 2 + widths.slice(0, i).reduce((a, b) => a + b, 0) + CHIP.gap * i + w / 2) };
};

// S03: greeting, prompt, chip, send — then it all squashes toward the pill
export const PromptShot: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const Q = GT.prompt;
  const hello = spring({ frame: frame - Q.hello, fps, config: G.spring.smooth });
  const box = spring({ frame: frame - Q.box, fps, config: G.spring.smooth });
  const click = useClick(Q.click);
  const send = useClick(Q.send);
  const squash = interpolate(frame, [durationInFrames - 12, durationInFrames], [0, 1], { ...clamp, easing: G.ease.in });
  const { widths, centers } = chipX();
  const ROW = 700;
  return (
    <AbsoluteFill style={{ scale: `${interpolate(squash, [0, 1], [1, 0.35])} ${interpolate(squash, [0, 1], [1, 0.08])}`, filter: squash > 0 ? `brightness(${1 + 2 * squash}) blur(${squash * 6}px)` : "none" }}>
      <div style={{ position: "absolute", left: 410, top: 250, fontFamily: G.fonts.serif, color: C.text, opacity: hello, translate: `0 ${interpolate(hello, [0, 1], [20, 0])}px` }}>
        <div style={{ fontSize: 34, color: C.dim, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ color: C.hero }}>✦</span> Hai!
        </div>
        <div style={{ fontSize: 76, fontWeight: 500, letterSpacing: "-0.01em" }}>Nak buat apa hari ini?</div>
      </div>
      <div style={{ position: "absolute", left: 410, top: 440, width: 1100, height: 200, borderRadius: 30, background: C.panel, boxShadow: `0 0 0 1px ${C.line}, 0 30px 80px rgba(0,0,0,0.5)`, padding: "30px 36px", boxSizing: "border-box", fontFamily: G.fonts.body, opacity: box, scale: interpolate(box, [0, 1], [0.96, 1]) }}>
        <TypeLine text={Q.text} start={Q.type} cps={Q.cps} style={{ fontSize: 34, color: C.text }} />
        <div style={{ position: "absolute", left: 36, right: 30, bottom: 24, display: "flex", alignItems: "center", gap: 16, fontSize: 20, color: C.dim }}>
          <span style={{ fontSize: 34, color: C.text, fontWeight: 300 }}>+</span>
          <div style={{ flex: 1 }} />
          <span>Gerak 2.0 ▾</span>
          <div style={{ width: 46, height: 46, borderRadius: 14, background: C.hero, display: "grid", placeItems: "center", scale: 1 - 0.12 * send, boxShadow: `0 0 ${8 + 26 * send}px ${C.heroGlow}` }}>
            <svg width={22} height={22} viewBox="0 0 22 22">
              <path d="M11 18 V4 M5 10 L11 4 L17 10" stroke={C.bg} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>
      {CHIPS.map((c, i) => {
        const s = spring({ frame: frame - Q.box - 6 - i * 2, fps, config: G.spring.snappy });
        const on = i === 2 && frame >= Q.click;
        return (
          <div key={c} style={{ position: "absolute", left: centers[i] - widths[i] / 2, top: ROW - 22, width: widths[i], height: 44, borderRadius: 22, boxSizing: "border-box", display: "grid", placeItems: "center", fontFamily: G.fonts.body, fontSize: CHIP.size, fontWeight: 500, color: on ? C.bg : C.text, background: on ? C.hero : C.panelHi, boxShadow: `0 0 0 1px ${on ? C.hero : C.line}`, opacity: s, scale: (1 - 0.08 * (i === 2 ? click : 0)) * interpolate(s, [0, 1], [0.9, 1]) }}>
            {c}
          </div>
        );
      })}
      <Cursor from={[1560, 960]} to={[centers[2] - 6, ROW - 4]} start={Q.cursor} dur={14} clickAt={Q.click} />
    </AbsoluteFill>
  );
};

// S04: the working pill
export const PillShot: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const inn = spring({ frame, fps, config: G.spring.snappy });
  const out = interpolate(frame, [durationInFrames - 8, durationInFrames], [0, 1], { ...clamp, easing: G.ease.in });
  return (
    <AbsoluteFill style={center}>
      <div style={{ scale: interpolate(inn, [0, 1], [0.6, 1]) * interpolate(out, [0, 1], [1, 2.4]), opacity: 1 - out, filter: out > 0 ? `blur(${out * 16}px)` : "none" }}>
        <WorkingPill label="Sedang menganimasikan" />
      </div>
    </AbsoluteFill>
  );
};

// S05: the animation app — one progress value drives the preview, graph, bars and keyframes
export const AppShot: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const A = GT.app;
  const open = spring({ frame: frame - A.open, fps, config: G.spring.smooth });
  const local = frame - A.play;
  const scaleT = interpolate(local, [18, 40], [0, 1], clamp); // the "Skala" key range
  const scaleV = G.ease.back(scaleT);
  const text = spring({ frame: local - 44, fps, config: G.spring.smooth });
  const bars = [
    { label: "Posisi", v: interpolate(local, [0, 20], [0, 1], { ...clamp, easing: G.ease.out }) },
    { label: "Putaran", v: interpolate(local, [18, 40], [0, 1], { ...clamp, easing: G.ease.inOut }) },
    { label: "Skala", v: Math.min(1, scaleV) },
    { label: "Kelegapan", v: interpolate(local, [0, 12], [0, 1], clamp) },
  ];
  return (
    <AbsoluteFill style={center}>
      <div style={{ width: 1560, height: 860, borderRadius: 28, background: C.panel, boxShadow: `0 0 0 1px ${C.line}, 0 40px 120px rgba(0,0,0,0.6)`, overflow: "hidden", fontFamily: G.fonts.body, color: C.text, scale: interpolate(open, [0, 1], [0.35, 1]), opacity: open, filter: open < 0.95 ? `blur(${(1 - open) * 18}px)` : "none" }}>
        <div style={{ height: 52, display: "flex", alignItems: "center", gap: 9, padding: "0 22px", fontSize: 18, color: C.dim }}>
          {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
            <div key={c} style={{ width: 13, height: 13, borderRadius: 7, background: c }} />
          ))}
          <div style={{ flex: 1, textAlign: "center", marginRight: 60 }}>intro-gerak.mp4 · 1920×1080 · 30 fps</div>
        </div>
        <div style={{ display: "flex", gap: 24, padding: "0 28px" }}>
          <div style={{ position: "relative", width: 960, height: 540, borderRadius: 16, overflow: "hidden", background: C.preview }}>
            <AbsoluteFill style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.08) 2px, transparent 2.6px)", backgroundSize: "14px 14px" }} />
            <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 45%, rgba(58,61,68,1) 30%, rgba(58,61,68,0) 62%)" }} />
            <AbsoluteFill style={{ ...center, paddingBottom: 60 }}>
              <div style={{ scale: 0.7 + 0.3 * scaleV }}>
                <AssembleMark start={A.play} scale={1.1} />
              </div>
            </AbsoluteFill>
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 90, textAlign: "center", fontFamily: G.fonts.display, fontWeight: 700, fontSize: 52, color: C.text, opacity: text, translate: `0 ${interpolate(text, [0, 1], [16, 0])}px` }}>
              Gerak <span style={{ color: C.hero }}>2.0</span>
            </div>
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ borderRadius: 16, background: C.panelHi, padding: "16px 20px" }}>
              <div style={{ fontSize: 17, color: C.dim, marginBottom: 8 }}>Easing · easeOutBack</div>
              <EaseGraph ease={G.ease.back} t={scaleT} w={470} h={210} />
            </div>
            <div style={{ borderRadius: 16, background: C.panelHi, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
              {bars.map((b) => (
                <div key={b.label} style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 19 }}>
                  <span style={{ width: 110, color: C.dim }}>{b.label}</span>
                  <div style={{ flex: 1, height: 12, borderRadius: 6, background: "rgba(255,255,255,0.08)" }}>
                    <div style={{ width: `${b.v * 100}%`, height: "100%", borderRadius: 6, background: C.hero }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ margin: "22px 28px 0", borderRadius: 16, background: C.panelHi, padding: "14px 20px" }}>
          <KeyTracks
            frame={local}
            total={A.dur}
            w={1460}
            tracks={[
              { label: "Kelopak ×6", keys: [0, 3, 6, 9, 12, 15] },
              { label: "Hab", keys: [18, 30] },
              { label: "Skala", keys: [18, 40] },
              { label: "Teks", keys: [44, 64] },
            ]}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};

// S06: push into the preview — halftone window, the mark assembles big
export const MarkShot: React.FC = () => {
  const frame = useCurrentFrame();
  const open = interpolate(frame, [0, 14], [0, 1], { ...clamp, easing: G.ease.out });
  return (
    <AbsoluteFill>
      <Halftone open={open} />
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 50%, rgba(163,230,53,0.16), transparent 30%)` }} />
      <AbsoluteFill style={center}>
        <AssembleMark start={GT.mark.start} scale={2.4} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// S07: end card
export const EndShot: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const E = GT.end;
  const word = spring({ frame: frame - E.word, fps, config: G.spring.smooth });
  const tag = spring({ frame: frame - E.tag, fps, config: G.spring.smooth });
  return (
    <AbsoluteFill style={center}>
      <div style={{ marginTop: -150 }}>
        <AssembleMark start={-200} scale={1.3} />
      </div>
      <div style={{ marginTop: 150, fontFamily: G.fonts.display, fontWeight: 700, fontSize: 104, letterSpacing: "-0.03em", color: C.text, opacity: word, translate: `0 ${interpolate(word, [0, 1], [24, 0])}px` }}>
        Gerak <span style={{ color: C.hero }}>2.0</span>
      </div>
      <div style={{ marginTop: 18, fontFamily: G.fonts.body, fontSize: 32, color: C.dim, opacity: tag }}>Dari satu prompt, jadi gerak.</div>
      <div style={{ position: "absolute", bottom: 58, fontFamily: G.fonts.body, fontSize: 17, color: C.dim, opacity: 0.8 * tag }}>Contoh rekaan · produk &ldquo;Gerak&rdquo; tidak wujud</div>
    </AbsoluteFill>
  );
};
