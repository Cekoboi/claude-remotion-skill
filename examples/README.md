# Examples

Ten videos built with the remotion-motion-graphics skill, in one Remotion project. Claude Code produced each one by following the skill: theme object, five-layer scene stack, spring entrances, staggered timing, and the mandatory render, extract frames, inspect, fix, re-render loop. The audio comes from the scripts in `scripts/`, which synthesize every sound as a WAV; there are no asset downloads.

| Composition | What it is |
|---|---|
| `HaidrrrryPromo` | 12s profile promo: spark logo sting, word reveals, staggered cards, glow CTA |
| `FocusCatPromo` | 15.5s app promo: pixel-art mascot drawn in code (2-frame walk cycle), animated focus ring, synthesized SFX, warm ambient pad |
| `SelfFix` | 18.5s "watch this video fix itself": one scene opens deliberately bad (linear easing, flat background, no stagger, no grade) and upgrades live as each rule stamps in |
| `CodeEdit` | 20s beat-synced code edit: camera inside a syntax-glow code world, zoom punches on beats, RGB-split glitch pass, 3D code-shatter finale, original 120 BPM track |
| `KLNight` | 20.4s 9:16 Reel: Kuala Lumpur skyline drawn in SVG (wireframe draw-on, 388 windows lighting up with a live counter, river reflection with a ripple filter), physics fireworks ending in a heart, original 100 BPM stereo track with each firework panned to its burst position |
| `TanahAirku` | 25.3s 9:16 Reel: a wau bulan flies over a Kedah paddy at dawn, whip-pans to a Terengganu perahu at sunset, match-cuts through the kite's center motif into a canting-drawn batik where a bunga raya blooms, and the bloom irises open onto a waving Jalur Gemilang. Original 90 BPM zapin score (Karplus-Strong gambus, marwas, seruling, gong) |
| `MalaysiaNeon` | 25.2s 9:16 Reel in neon: Gunung Kinabalu over a synthwave sun and grid floor, a Pohon Beringin twirled onto a wayang kulit screen, a nasi lemak sign igniting tube by tube on a brick wall, and MALAYSIA lit letter by letter with a wet-street reflection. A virtual camera adds handheld drift, kick-synced punches, decaying impact shakes with RGB split, and a move per scene (crane, dolly, orbit, push). Original 100 BPM synthwave score with a serunai-and-gendang wayang section |
| `KedaiLaunch` | 23.5s 16:9 app-launch promo for an invented Malaysian shop app, built from `references/product-promo.md`: a logo lockup that unmasks and bookends the video, a CSS phone that tilts in and zooms through its app icon, a product list with rack focus, a live dashboard under a tilted 3D camera with a dotted Malaysia map, streak-type tagline, and the line collapsing into a pill that springs open into the first order notification. One amber orb is the only light source. Finished with real camera motion blur and a two-pass bloom, a gTTS Bahasa Melayu voice-over, and an original synthesized bed (ducked under the voice), whooshes, ticks and the order ding |
| `PromptToVideo` | 15s 16:9 demo of this skill in the `references/ai-demo.md` style: a play mark and wordmark converge over violet silk, collapse into a pill that splits into chips, a cursor clicks "Logo", a prompt types itself with a hot tail as the camera dollies out, Remotion code streams past in perspective, and a player swings in playing the generated Kopi Senja logo intro. The camera whips down to a second prompt ("Tukar jadi tema malam.") and back to the night version, then the sign-off flies in along a curve. Motion blur, bloom, synthesized key ticks, whooshes and chimes |
| `KerjaMakanGajiVsKerjaSendiri` | 56s 9:16 isometric explainer in Bahasa Melayu: hook, office worker (spinning clock, salary in, expenses out), online seller (orders, packing, sales, revenue graph), split-screen pros and cons, and a comment CTA. Original 120 BPM track, beat-analyzed; camera moves, whip-pans, cards, VO phrases and SFX all land on beats. gTTS Malay voice-over and captions |

Preview of `FocusCatPromo`. Click it for the MP4 with sound:

[![Focus Cat promo](videos/focus-cat.gif)](https://github.com/haidrrrry/claude-remotion-skill/raw/main/examples/videos/focus-cat-promo.mp4)

## Run

```bash
npm install
npm run audio            # writes deterministic 16-bit WAVs into public/sfx/
npm run studio           # browse all ten in Remotion Studio
npm run render:focuscat  # or render:prompt / render:kedai / render:kerja / render:neon / render:tanahairku / render:kl / render:selffix / render:codeedit / render:profile
```

Verify the way the skill demands, by looking at extracted stills:

```bash
npx remotion still src/index.ts SelfFix out/check_300.png --frame 300 --overwrite
```

## Notes

- `src/theme.ts` (dark tech) and `src/focuscat/theme2.ts` (warm editorial) are the two palettes from `references/design-rules.md`.
- `src/kl/timing.json` is the single beat grid for `KLNight`. The composition and `scripts/gen-kl.mjs` both read it, so every firework's whistle, boom, and crackle lands on its burst frame. Move a firework there and picture and sound move together.
- `TanahAirku` uses the same pattern: `src/malaysia/timing.json` drives both the scenes and `scripts/gen-my.mjs`. The Jalur Gemilang is cut into 10px vertical slices, each offset by a traveling wave and shaded by its slope, so it ripples without any mesh library.
- `MalaysiaNeon` keeps its flicker patterns in `src/neon/timing.json` too. `tube()` in `src/neon/neonKit.tsx` turns them into brightness per frame, and `scripts/gen-neon.mjs` turns the same arrays into buzz-clicks, so sound and flicker stay frame-locked. `src/neon/camera.ts` reads `timing.camera` the same way: the kick list places both the kick drum and the camera punch.
- `KerjaMakanGajiVsKerjaSendiri` is built as a pipeline (`scripts/kerja/`), in order:
  1. `npm run kerja:vo` generates one gTTS clip per phrase and measures its length.
  2. `npm run kerja:timing` places every phrase and visual event on a beat and fails if a phrase would overrun its slot.
  3. `npm run kerja:audio` synthesizes the music and SFX, then runs a blind beat analysis of the music (tempo by onset autocorrelation, downbeats by chroma change) into `src/kerja/beats.json`. It fails if the detected grid drifts more than one frame from the plan.

  The camera's rhythmic zoom pulse reads the analyzed beat strengths, so strong beats move more than weak ones. `scripts/kerja/NARRATION.md` is the timed narration script, for re-recording with another voice.
- `KedaiLaunch` keeps every shot, the focus stops, the counters, the orb's path and the voice-over slots in `src/kedai/timing.json`. `npm run kedai:vo` generates one gTTS clip per phrase and fails if one overruns its slot; `scripts/gen-kedai.mjs` derives every whoosh, tick and the ding from the same file and ducks the music under each phrase, so retiming a shot moves its sound with it. `<CameraMotionBlur>` and a CSS bloom pass make it render 18 times per frame, so it is the slowest example to render. The brand is invented, and the outro says so on screen.
- `PromptToVideo` places every shot, the typing, both prompts, the camera keys and the silk's opacity in `src/prompt/timing.json`; `scripts/gen-prompt.mjs` puts a key tick on every third typed character and a whoosh on every camera move from the same file. The Kopi Senja intro inside the player is a real composition (`src/prompt/scenes/KopiSenja.tsx`) rendered in two looks.
- `KLNight` self-hosts its fonts from `public/fonts/` (Unbounded, Inter, JetBrains Mono, all SIL Open Font License; `TanahAirku` adds Fraunces and `MalaysiaNeon` adds Pacifico, both OFL), so it renders without fetching from Google Fonts.
- `src/focuscat/PixelCat.tsx` draws the mascot as a CSS pixel grid; swap the sprite strings to make your own.
