#!/bin/sh

production_branch="master"

getCurrentBranchName() {
  git branch | sed -n -e 's/^\* \(.*\)/\1/p'
}

getPrereleaseName() {
  current_branch_name=$(getCurrentBranchName)
  commit_sha=$(git log master.."$current_branch_name" --oneline --format=format:%H | tail -1)
  if [ -z "$commit_sha" ]; then
    commit_sha=$(git rev-parse HEAD)
  fi
  prerelease_name=$(echo "$commit_sha" | cut -c1-6 | awk '{ print toupper($0) }')
  echo "$prerelease_name"
}

getCurrentPackageVersion() {
  node -e "process.stdout.write(require('./package.json').version)"
}

getCurrentBaseVersion() {
  getCurrentPackageVersion | sed 's/-.*//'
}

hasUnreleasedFragments() {
  [ -n "$(ls .changes/unreleased/*.yaml 2>/dev/null)" ]
}

getNextBaseVersion() {
  release_kind=$1
  npx changie next "$release_kind"
}

getExistingBuildNumber() {
  current_package_version=$(getCurrentPackageVersion)
  if echo "$current_package_version" | grep -q "-"
  then
      build_version=$(echo "$current_package_version" | sed 's/.*\.//')
      echo "$build_version"
  fi
}

getNextBuildNumber() {
  existing_build_number=$(getExistingBuildNumber)
  if [ -z "$existing_build_number" ]
    then
      echo 0
    else
      echo $((existing_build_number+1))
  fi
}

bumpVersionPackage() {
  release_version=$1
  npm version "$release_version" --no-git-tag-version >/dev/null
  git add package*
  ./.github/scripts/bumpWordPressPluginVersion.sh
  git commit -m "chore(release): ${release_version}"
  git tag -a "v$release_version" -m "v$release_version"
}

getNextBetaReleaseVersion() {
  current_release_version=$1
  next_build_number=$(getNextBuildNumber)
  release_without_build=$(echo "$current_release_version" | sed 's![^.]*$!!')
  echo "${release_without_build}${next_build_number}"
}

getBetaReleaseVersion() {
  next_base=$1
  current_base=$(getCurrentBaseVersion)
  prerelease_name=$(getPrereleaseName)

  if [ "$current_base" = "$next_base" ] && getCurrentPackageVersion | grep -q "-"; then
    beta_release_version="$(getNextBetaReleaseVersion "$(getCurrentPackageVersion)")"
  else
    beta_release_version="${next_base}-${prerelease_name}.0"
  fi

  echo "$beta_release_version"
}

runPrereleaseChecks() {
  printf "\033[37mRunning prerelease checks before cutting a beta.\033[0m\n"
  npm run prerelease:beta || return 1
  composer run lint || return 1
  composer run test || return 1
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
  auto_version=$(getBetaReleaseVersion "$(getNextBaseVersion auto)")
  major_version=$(getBetaReleaseVersion "$(getNextBaseVersion major)")
  minor_version=$(getBetaReleaseVersion "$(getNextBaseVersion minor)")
  patch_version=$(getBetaReleaseVersion "$(getNextBaseVersion patch)")

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

current_branch=$(getCurrentBranchName)

if ! hasUnreleasedFragments; then
  printf "\033[1;31mNo unreleased changie fragments found. Add one with 'npm run changelog:new' before releasing a beta.\n\033[0m"
  exit 1
fi

if [ "$current_branch" = "$production_branch" ]
  then
  printf "\033[1;31mCannot release betas while on branch %s\n\033[0m" "$production_branch"
  exit 1
fi

selection=$(selectReleaseVersion) || {
  printf "\033[1;31mRelease was aborted.\033[0m\n\n"
  exit 1
}

next_version=${selection%%  *}

printf "\033[37m=====================\033[0m\n"
printf "\033[37mPreparing to release beta version %s.\033[0m\n\n" "$next_version"

runPrereleaseChecks || {
  printf "\033[1;31mPrerelease checks failed. Beta release aborted.\033[0m\n\n"
  exit 1
}

bumpVersionPackage "$next_version"
git push --force-with-lease --follow-tags
printf "\033[1;32m\n\nPackage succesfully updated and pushed to the remote.\033[0m\n\n"
