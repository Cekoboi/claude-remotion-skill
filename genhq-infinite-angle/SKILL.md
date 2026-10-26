---
name: genhq-infinite-angle
description: GenHQ Infinite Angle Skill. Turns one single-angle video into a short, timestamped Seedance 2.5 prompt that keeps the same people, action, words and timing but re-shoots it from new camera angles. It analyses the clip, then asks one question: keep the same look, or a cinematic interpretation? Use whenever someone shares a video and wants new camera angles, multi-cam coverage, "infinite camera angles", "change the camera angle", or a Seedance video-to-video prompt, even if they don't say "prompt".
---

# GenHQ Infinite Angle Skill

**What it does:** the user gives you one video. You give back one short prompt for Seedance 2.5 (for example in Higgsfield). They upload that same video as **@Video1** alongside it. Seedance keeps everything — who, where, what happens and when — and only the camera changes, cutting to new angles that line up with the action.

If the user hasn't shared a video yet, say in one line what this skill does and ask them for the clip.

---

## 1. Analyse the video first

**If you can run commands**, pull timestamped frames (2–4 fps for the whole clip, 10–12 fps over any fast moment):
```bash
bash <skill-dir>/scripts/extract_frames.sh "<video>" "<scratch>/frames" 4
bash <skill-dir>/scripts/extract_frames.sh "<video>" "<scratch>/fast" 12 4.5 5.5
```
Frames are named by time (`t_03.25.jpg` = 3.25s). Look at every one. If there's speech, get word timings (e.g. whisper.cpp: `whisper-cli -m ggml-small.en.bin -f audio.wav -ml 1 -sow`) — they tell you where to cut.

**If you can't read the video**, ask for screenshots every half-second with the time on each, or a short description of what happens when. Never guess the action.

Make private notes (don't show them all):
- Length, aspect ratio.
- **The original angle** in physical words (where the camera is, its height, what it's pointed at). This angle is forbidden later.
- **The layout**: where every person and object is, what's LEFT/RIGHT from the original camera, and landmarks (door, window, desk) to describe positions by.
- **The key moments** with times: each spoken line, turns, gestures, where the person looks or points.

## 2. Ask the one question

Give a one-line summary of what you saw (length and what happens), then ask:

> **Do you want this to keep the same look, or have a cinematic interpretation?**
> - **Same look:** it looks exactly like your original footage (same camera quality, colour and light). Only the camera angles change, as if more cameras were rolling.
> - **Cinematic interpretation:** the same action and timing, re-shot like a film, with a film camera, lenses, grain and a proper grade.

In the same message you can also ask, optionally: any shots they definitely want, and whether the opening should stay exactly like the original. Don't ask anything else, and skip anything they've already told you.

## 3. Plan the shots

- **Let the dialogue direct.** If the speaker mentions a camera or angle ("cut to the camera over here", "I'm waving to that camera", "let's orbit around"), cut on that line, put the camera where they look or point, and do the move they describe.
- **Cut on a line or a clear action.** Cover the whole clip, with no gaps. Aim for about one cut every 3–4 seconds; fewer, longer shots are safer.
- **Vary it.** Close-up, wide, low, high, over-the-shoulder, top-down, a profile, an insert on hands or props, an orbit. Back-to-back shots must be different SIZES (close-up → wide), or the cut won't read.
- **Never** use the original angle or something close to it, unless the user wants the opening kept the same.
- Use the user's own timecodes and shots exactly if they give them. Moves relative to the original are fine ("about 1 metre to the LEFT, same height").

## 4. Write the prompt: SHORT

Long prompts fail: Seedance ignores the detail and drifts back to the original angle. Keep it to about **120–200 words**, one line per shot:

```
{CINEMATIC ONLY — one camera/lens/film line from the table below.}
Keep everything in @Video1 exactly the same — {the people}, their words and lip sync, every movement at the same moment, the location{, the light, the {phone/camera} look | , but re-shot on that film look}. Only the camera angle changes. Never use @Video1's {original angle in a few physical words}.

0:00–0:0X — {SHOT TYPE}: {where the camera physically is, one sentence}.
0:0X–0:0Y — "{the line said here}" — Cut to {where the camera is}. {One short sentence on what we see.}
...

Audio: @Video1's original audio. No music, no text.
```

Rules that stop the common failures:
- Be physical about WHERE the camera is ("his left side, head height, 2 metres away"). That's the only detail that matters.
- Put the spoken line in quotes on its shot. It anchors the timing.
- Side shots: write "full PROFILE, 90° to him. Not from the front."
- Orbits: write "keeps moving the whole time, one wide 180° orbit from X to Y."
- An object seen in several shots gets the same short description each time.
- A kept opening: "Identical to @Video1. Same camera position, same framing, nothing changed."
- No character, lighting or action paragraphs. @Video1 carries all of that.
- Extra reference images, if they have any: one line each at the end, `@Image1 = {what it's for}`.
- Seedance 2.5 handles 20+ second clips in one go. Only split the clip if the tool refuses its length.

**Cinematic header** (pick one to match the mood):

| Mood | Header |
|---|---|
| Everyday / drama | `Arricam LT, Cooke S4/i prime, 35mm Vision3 500T, 1.85:1, T2.8, halation, organic grain, milky blacks, no sharpening.` |
| Epic / outdoors | `ARRI Alexa 65, Panavision Sphero 65, 2.39:1, T2.8, deep focus, soft highlight roll-off, fine grain.` |
| Intimate / portrait | `ARRI Alexa Mini LF, Canon K35 primes, 1.85:1, T1.5, shallow depth of field, creamy bokeh, gentle halation.` |
| Documentary / gritty | `Aaton XTR, 16mm Vision3 500T, 1.66:1, handheld, heavy organic grain, slight gate weave.` |
| Commercial / product | `ARRI Alexa 35, Zeiss Supreme Primes, 2.39:1, T2, clean highlights, controlled contrast, subtle grain.` |
| Night / neon | `Sony Venice 2, Cooke Anamorphic/i, 2.39:1, T2.3, oval bokeh, blue flares, deep shadows.` |

## 5. Deliver

Send the prompt in one code block. Follow it with one line on how to run it: upload the original as @Video1, select Seedance 2.5, set the duration about 1 second longer than the clip, and keep the same aspect ratio. Then offer one tweak.

## If the result comes back wrong

- **It kept the original angle:** make the prompt shorter, describe the original angle more physically in the "Never use" line, and make the first shot very different (a profile or top-down).
- **The timing drifted:** add the spoken line in quotes to that shot.
- **Left and right are flipped:** describe positions by landmarks ("toward the window"), not by screen direction.
- **The look changed (same-look mode):** add "same image quality, no cinematic grade" to the first line.
- **The people changed:** add a clean still or a character sheet as @Image1, with "@Image1 = how the person looks".
