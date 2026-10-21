"""Generate the KedaiLaunch Bahasa Melayu voice-over with gTTS, one clip per
phrase in src/kedai/timing.json ("vo"). Each clip is trimmed of silence, sped
up 1.1x and loudness-normalized into public/kedai/vo/<id>.wav. Durations go to
src/kedai/vo-durations.json, which the composition and gen-kedai.mjs (music
ducking) both read. Fails if a phrase would overrun its slot ("until").
Needs network access (gTTS calls Google Translate TTS) and ffmpeg. Run:
  python3 scripts/kedai/gen-vo.py
"""
import json, os, subprocess, sys
from gtts import gTTS

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
SRC = os.path.join(ROOT, "src", "kedai")
OUT = os.path.join(ROOT, "public", "kedai", "vo")
os.makedirs(OUT, exist_ok=True)
timing = json.load(open(os.path.join(SRC, "timing.json")))
fps = timing["fps"]

durations = {}
overruns = []
for ph in timing["vo"]:
    mp3 = os.path.join(OUT, ph["id"] + ".mp3")
    wav = os.path.join(OUT, ph["id"] + ".wav")
    gTTS(ph["text"], lang="ms").save(mp3)
    subprocess.run([
        "ffmpeg", "-v", "error", "-y", "-i", mp3, "-af",
        "silenceremove=start_periods=1:start_threshold=-45dB,areverse,"
        "silenceremove=start_periods=1:start_threshold=-45dB,areverse,"
        "atempo=1.1,loudnorm=I=-16:TP=-1.5:LRA=7,aresample=44100",
        "-ac", "1", wav,
    ], check=True)
    os.remove(mp3)
    d = float(subprocess.check_output([
        "ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", wav,
    ]).decode().strip())
    durations[ph["id"]] = round(d, 3)
    slot = (ph["until"] - ph["at"]) / fps
    flag = "" if d <= slot else "  OVERRUN"
    print(f"{ph['id']}: {d:.2f}s of {slot:.2f}s slot  {ph['text']}{flag}", file=sys.stderr)
    if d > slot:
        overruns.append(ph["id"])

json.dump(durations, open(os.path.join(SRC, "vo-durations.json"), "w"), indent=2)
if overruns:
    sys.exit(f"phrases overrun their slots: {', '.join(overruns)}")
