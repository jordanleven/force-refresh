#!/bin/sh

production_branch="master"

getCurrentBranchName() {
  git branch | sed -n -e 's/^\* \(.*\)/\1/p'
}

getNextVersion() {
  release_kind=$1
  npx changie next "$release_kind"
}

appendUniqueOption() {
  version=$1
  label=$2

  [ -n "$version" ] || return
  [ "$version" = "$option_1_version" ] && return
  [ "$version" = "$option_2_version" ] && return
  [ "$version" = "$option_3_version" ] && return
  [ "$version" = "$option_4_version" ] && return

  if [ -z "$option_1_version" ]; then
    option_1_version=$version
    option_1="${version}  (${label})"
  elif [ -z "$option_2_version" ]; then
    option_2_version=$version
    option_2="${version}  (${label})"
  elif [ -z "$option_3_version" ]; then
    option_3_version=$version
    option_3="${version}  (${label})"
  elif [ -z "$option_4_version" ]; then
    option_4_version=$version
    option_4="${version}  (${label})"
  fi
}

selectReleaseVersion() {
  auto_version=$(getNextVersion auto)
  major_version=$(getNextVersion major)
  minor_version=$(getNextVersion minor)
  patch_version=$(getNextVersion patch)

  option_1_version=''
  option_2_version=''
  option_3_version=''
  option_4_version=''
  option_1=''
  option_2=''
  option_3=''
  option_4=''

  appendUniqueOption "$auto_version" auto
  appendUniqueOption "$major_version" major
  appendUniqueOption "$minor_version" minor
  appendUniqueOption "$patch_version" patch

  if [ -n "$option_4" ]; then
    node "$(dirname "$0")/selectVersion.js" \
      "Select a version to release" \
      "$option_1" \
      "$option_2" \
      "$option_3" \
      "$option_4"
  elif [ -n "$option_3" ]; then
    node "$(dirname "$0")/selectVersion.js" \
      "Select a version to release" \
      "$option_1" \
      "$option_2" \
      "$option_3"
  elif [ -n "$option_2" ]; then
    node "$(dirname "$0")/selectVersion.js" \
      "Select a version to release" \
      "$option_1" \
      "$option_2"
  else
    node "$(dirname "$0")/selectVersion.js" \
      "Select a version to release" \
      "$option_1"
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
  node "$(dirname "$0")/dedupeUnreleasedDependencyFragments.js"
  npx changie batch "$version"
  prependToChangelog "$version"
  npm version "$version" --no-git-tag-version
  ./.github/scripts/bumpWordPressPluginVersion.sh
  git add CHANGELOG.md package.json package-lock.json .changes/
  git commit -m "chore(release): ${version}"
  git tag -a "v${version}" -m "v${version}"
}

current_branch=$(getCurrentBranchName)

if [ "$current_branch" != "$production_branch" ]; then
  printf "\033[1;31mCannot release while on branch %s\n\033[0m" "$current_branch"
  exit 1
fi

if ! hasUnreleasedFragments; then
  printf "\033[1;31mNo unreleased changie fragments found. Run 'npm run changelog:note' before releasing.\n\033[0m"
  exit 1
fi

selection=$(selectReleaseVersion) || {
  printf "\033[1;31mRelease was aborted.\033[0m\n"
  exit 1
}

next_version=${selection%%  *}

printf "\033[37m=====================\033[0m\n"
printf "\033[37m%s\033[0m\n" "Preparing to release version ${next_version}."

bumpVersion "$next_version"
git push --follow-tags
printf "\033[1;32mPackage successfully updated and pushed to the remote.\033[0m\n"
