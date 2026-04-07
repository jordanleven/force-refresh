#!/bin/sh

production_branch="master"

getCurrentBranchName() {
  git branch | sed -n -e 's/^\* \(.*\)/\1/p'
}

getReleaseOverride() {
  release_option=$1
  case $release_option in
    --major) echo 'major' ;;
    --minor) echo 'minor' ;;
    --patch) echo 'patch' ;;
    *)       echo ''      ;;
  esac
}

getNextVersion() {
  override=$1
  if [ -n "$override" ]; then
    npx changie next "$override"
  else
    npx changie next auto
  fi
}

hasUnreleasedFragments() {
  [ -n "$(ls .changes/unreleased/*.yaml 2>/dev/null)" ]
}

prependToChangelog() {
  version=$1
  {
    head -n 4 CHANGELOG.md
    cat ".changes/${version}.md"
    printf "\n"
    tail -n +5 CHANGELOG.md
  } > CHANGELOG.tmp && mv CHANGELOG.tmp CHANGELOG.md
}

bumpVersion() {
  version=$1
  npx changie batch "$version"
  prependToChangelog "$version"
  npm version "$version" --no-git-tag-version
  ./.github/scripts/bumpWordPressPluginVersion.sh
  git add CHANGELOG.md package.json package-lock.json .changes/
  git commit -m "chore(release): ${version}"
  git tag -a "v${version}" -m "v${version}"
}

current_branch=$(getCurrentBranchName)
release_override=$(getReleaseOverride "$1")

if [ "$current_branch" != "$production_branch" ]; then
  printf "\033[1;31mCannot release while on branch %s\n\033[0m" "$current_branch"
  exit 1
fi

if ! hasUnreleasedFragments; then
  printf "\033[1;31mNo unreleased changie fragments found. Run 'npm run release:note' before releasing.\n\033[0m"
  exit 1
fi

next_version=$(getNextVersion "$release_override")

printf "\033[37m=====================\033[0m\n"
printf "\033[37m%s\033[0m\n" "Preparing to release version ${next_version}."
printf "\033[33m\n\nPress \"y\" to proceed with this release or press any other key to abort.\033[0m\n"

read -r REPLY
if echo "$REPLY" | grep -q "^[Yy]$"
then
  bumpVersion "$next_version"
  git push --follow-tags
  printf "\033[1;32mPackage successfully updated and pushed to the remote.\033[0m\n"
else
  printf "\033[1;31mRelease was aborted.\033[0m\n"
fi
