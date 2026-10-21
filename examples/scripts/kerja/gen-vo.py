"""Generate the Bahasa Melayu voice-over, one clip per phrase, with gTTS.

Each phrase becomes public/kerja/vo/<id>.wav (sped up 1.12x, trimmed of
leading/trailing silence, loudness-normalized). Durations go to
scripts/kerja/vo-durations.json, which build-timing.mjs uses to place every
phrase on a beat. Needs network access (gTTS calls Google Translate TTS) and
ffmpeg. Run:  python3 scripts/kerja/gen-vo.py
"""
import json, os, subprocess, sys
from gtts import gTTS

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
OUT = os.path.join(ROOT, "public", "kerja", "vo")
os.makedirs(OUT, exist_ok=True)
spec = json.load(open(os.path.join(HERE, "narration.json")))

durations = {}
for scene in spec["scenes"]:
    for ph in scene["phrases"]:
        mp3 = os.path.join(OUT, ph["id"] + ".mp3")
        wav = os.path.join(OUT, ph["id"] + ".wav")
        gTTS(ph["text"], lang="ms").save(mp3)
        subprocess.run([
            "ffmpeg", "-v", "error", "-y", "-i", mp3, "-af",
            "silenceremove=start_periods=1:start_threshold=-45dB,areverse,"
            "silenceremove=start_periods=1:start_threshold=-45dB,areverse,"
            "atempo=1.12,loudnorm=I=-16:TP=-1.5:LRA=7,aresample=44100",
            "-ac", "1", wav,
        ], check=True)
        os.remove(mp3)
        d = float(subprocess.check_output([
            "ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", wav,
        ]).decode().strip())
        durations[ph["id"]] = round(d, 3)
        print(f"{ph['id']}: {d:.2f}s  {ph['text']}", file=sys.stderr)

json.dump(durations, open(os.path.join(HERE, "vo-durations.json"), "w"), indent=2)
