#!/bin/bash
# Usage: getCommitsSinceRelease.sh <prev_tag>
# Outputs a COMMITS heredoc to $GITHUB_OUTPUT, grouped by conventional commit type.
# Commits matching chore(release) are excluded.

set -euo pipefail

PREV_TAG="${1:-}"
REPO="https://github.com/jordanleven/force-refresh/commit"

if [ -z "$PREV_TAG" ]; then
  RAW=$(git log --no-merges --format='%h %s' HEAD | grep -vE 'chore.*\(release\)' || true)
else
  RAW=$(git log "${PREV_TAG}..HEAD" --no-merges --format='%h %s' | grep -vE 'chore.*\(release\)' || true)
fi

section() {
  local title="$1" pattern="$2" strip="$3" invert="${4:-0}"
  local lines
  if [ "$invert" = "1" ]; then
    lines=$(echo "$RAW" | grep -vE "$pattern" || true)
  else
    lines=$(echo "$RAW" | grep -E "$pattern" || true)
  fi
  [ -z "$lines" ] && return
  echo "### $title"
  while IFS= read -r line; do
    [ -z "$line" ] && continue
    hash="${line%% *}"
    subj="${line#* }"
    [ "$strip" = "1" ] && subj=$(echo "$subj" | sed -E 's/^[a-z]+(\([^)]+\))?: //')
    echo "- [$hash]($REPO/$hash) $subj"
  done <<< "$lines"
  echo ""
}

{
  section "Features" '^[a-f0-9]+ feat(\(|:)' 1
  section "Bug Fixes" '^[a-f0-9]+ fix(\(|:)' 1
  section "Other" '^[a-f0-9]+ (feat|fix)(\(|:)' 1 1
} | { echo "COMMITS<<EOF"; cat; echo "EOF"; } >> "$GITHUB_OUTPUT"
