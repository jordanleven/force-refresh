#!/bin/sh

hasUnreleasedFragments() {
  [ -n "$(ls .changes/unreleased/*.yaml 2>/dev/null)" ]
}

cleanup() {
  [ -f CHANGELOG.md.bak ] && mv CHANGELOG.md.bak CHANGELOG.md
  [ -n "$NEXT_VERSION" ] && rm -f ".changes/${NEXT_VERSION}.md"
}
trap cleanup EXIT

if ! hasUnreleasedFragments; then
  printf "\033[1;31mNo unreleased changie fragments found. Run 'npm run changelog:note' to add some.\n\033[0m"
  exit 1
fi

NEXT_VERSION=$(npx changie next auto)
printf "\033[37mPreviewing release notes for v%s...\033[0m\n\n" "$NEXT_VERSION"

cp CHANGELOG.md CHANGELOG.md.bak
npx changie batch "$NEXT_VERSION"
{
  head -n 4 CHANGELOG.md
  cat ".changes/${NEXT_VERSION}.md"
  printf "\n"
  tail -n +5 CHANGELOG.md
} > CHANGELOG.tmp && mv CHANGELOG.tmp CHANGELOG.md
npm run changelog:build

printf "\n\033[1;32mPreview complete. Inspect README.txt, then discard with: git restore README.txt\033[0m\n"
