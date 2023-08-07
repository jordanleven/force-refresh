#!/bin/sh

production_branch="master"

getCurrentBranchName() {
  git branch | sed -n -e 's/^\* \(.*\)/\1/p'
}

getPrereleaseName() {
  current_branch_name=$(getCurrentBranchName)
  commit_sha=$(git log master.."$current_branch_name" --oneline --format=format:%H | tail -1)
  prerelease_name=$(echo "$commit_sha" | cut -c1-6 | awk '{ print toupper($0) }')
  echo "$prerelease_name"
}

getCurrentPackageVersion() {
  node -e "process.stdout.write(require('./package.json').version)"
}

getExistingBuildNumber() {
  current_package_version=$(getCurrentPackageVersion)
  if echo "$current_package_version" | grep -q "-"
  then
      prerelease_name=$(getPrereleaseName)
      build_version=$(echo "$current_package_version" | sed 's/.*-'"$prerelease_name"'.//')
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
  current_version=$(getCurrentPackageVersion)
  prerelease_name=$(getPrereleaseName)

  case $current_version in
    *"-"*)
      beta_release_version="$(getNextBetaReleaseVersion "$current_version")"
      ;;
    *)
      beta_release_version="${current_version}-${prerelease_name}.0"
      ;;
  esac

  echo "$beta_release_version"
}

current_branch=$(getCurrentBranchName)
next_version=$(getBetaReleaseVersion)

if [ "$current_branch" = "$production_branch" ]
  then
  printf "\033[1;31mCannot release betas while on branch %s\n\033[0m" "$production_branch"
  exit 1
fi

printf "\033[37m=====================\033[0m\n"
printf "\033[37mPreparing to release beta version %s.\033[0m\n\n" "$next_version"
printf "\033[33mPress \"y\" to proceed with this beta release or press any other key to abort.\033[0m "

read -r
if echo "$REPLY" | grep -q "^[Yy]$"
then
  bumpVersionPackage "$next_version"
  git push --follow-tags
  printf "\033[1;32m\n\nPackage succesfully updated and pushed to the remote.\033[0m\n\n"
else
  printf "\033[1;31mRelease was aborted.\033[0m\n\n"
fi
