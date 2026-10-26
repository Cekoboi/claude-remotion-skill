#!/bin/sh
# Rebuild the .skill files (the Claude Desktop install artifacts) from their
# skill folders. Run after ANY edit to a skill.
set -e
cd "$(dirname "$0")/.."
for skill in remotion-motion-graphics genhq-infinite-angle; do
  rm -f "$skill.skill"
  zip -r "$skill.skill" "$skill" -x "*.DS_Store"
  echo "rebuilt $skill.skill:"
  unzip -l "$skill.skill"
done
