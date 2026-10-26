#!/bin/sh
# Extract timestamped frames from a video for shot planning.
#
#   extract_frames.sh <video> <out_dir> [fps=4] [start_s] [end_s]
#
# Frames are named by their time in the source clip: t_03.25.jpg = 3.25s.
# Use 2-4 fps over the whole clip, 10-12 fps over a fast moment:
#   extract_frames.sh clip.mp4 frames 4
#   extract_frames.sh clip.mp4 fast 12 4.5 5.5
set -e

if [ $# -lt 2 ]; then
  echo "usage: $0 <video> <out_dir> [fps=4] [start_s] [end_s]" >&2
  exit 1
fi

video=$1
out=$2
fps=${3:-4}
start=${4:-0}
end=$5

command -v ffmpeg >/dev/null || { echo "ffmpeg not found" >&2; exit 1; }
command -v ffprobe >/dev/null || { echo "ffprobe not found" >&2; exit 1; }

duration=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$video")
size=$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height \
  -of csv=s=x:p=0 "$video" | head -n1 | sed 's/x*$//')
# Clamp the end to the clip length.
end=$(awk -v e="$end" -v d="$duration" 'BEGIN { print (e == "" || e > d) ? d : e }')

mkdir -p "$out"
tmp=$(mktemp -d "$out/.extract.XXXXXX")
trap 'rm -rf "$tmp"' EXIT

ffmpeg -v error -ss "$start" -i "$video" -t "$(awk -v s="$start" -v e="$end" 'BEGIN { print e - s }')" \
  -vf "fps=$fps,scale='min(960,iw)':-2" -q:v 3 "$tmp/%06d.jpg"

# Rename frame N to the source time it shows: start + (N-1)/fps.
count=0
for f in "$tmp"/*.jpg; do
  [ -e "$f" ] || continue
  n=$(basename "$f" .jpg)
  name=$(awk -v s="$start" -v n="$n" -v r="$fps" 'BEGIN { printf "t_%05.2f.jpg", s + (n - 1) / r }')
  mv "$f" "$out/$name"
  count=$((count + 1))
done

printf 'video: %s  %s  %.2fs\n' "$video" "$size" "$duration"
printf 'wrote %d frames (%s fps, %.2fs-%.2fs) to %s\n' "$count" "$fps" "$start" "$end" "$out"
