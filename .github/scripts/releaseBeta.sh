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
      "$($existing_build_number + 1)"
  fi
}

bumpVersionPackage() {
  prerelease_name=$1
  npx standard-version -a --prerelease "$prerelease_name" --skip.changelog
}

current_branch=$(getCurrentBranchName)
prerelease_name=$(getPrereleaseName)
next_version=$(npx standard-version --prerelease "$prerelease_name" --dry-run --skip.changelog --skip.commit --skip.tag)
if [ "$current_branch" = "$production_branch" ]
  then
  echo "\033[1;31mCannot release betas while on branch ${production_branch}\033[0m"
  exit 1
fi

printf "\033[37m=====================\033[0m\n"
printf "\033[37m%s\033[0m\n\n" "$next_version"
printf "\033[33mPress \"y\" to proceed with this beta release or press any other key to abort.\033[0m "

read -r
if echo "$REPLY" | grep -q "^[Yy]$"
then
  bumpVersionPackage "$prerelease_name"
  git push --follow-tags
  printf "\033[1;32m\n\nPackage succesfully updated and pushed to the remote.\033[0m\n\n"
else
  printf "\033[1;31mRelease was aborted.\033[0m\n\n"
fi
