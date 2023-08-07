#!/bin/sh

production_branch="master"

getCurrentBranchName() {
  git branch | sed -n -e 's/^\* \(.*\)/\1/p'
}

getReleaseType() {
  release_option=$1
  case $release_option in
    --major)
      release_type='major'
      ;;
    --minor)
      release_type='minor'
      ;;
    --patch)
      release_type='patch'
      ;;
  esac
  echo "$release_type"
}

bumpVersionPackage() {
  release_type=$1
  specified_release_type_arg=$([ "$release_type" ] && echo "--releaseAs $release_type")
  npx standard-version -a "$specified_release_type_arg"
}

current_branch=$(getCurrentBranchName)
release_type=$(getReleaseType "$1")
# If we've specified a type of release, we need to include the `releaseAs` argument
specified_release_type_arg=$([ "$release_type" ] && echo "--releaseAs $release_type")
next_version=$(npx standard-version --dry-run --skip.changelog --skip.commit --skip.tag "$specified_release_type_arg")

if [ "$current_branch" != "$production_branch" ]
  then
  printf "\033[1;31mCannot release while on branch %s\n\033[0m" $current_branch
  exit 1
fi

printf "\033[37m=====================\033[0m\n"
printf "\033[37m%s\033[0m\n""$next_version"
printf "\033[33m\n\nPress \"y\" to proceed with this release or press any other key to abort.\033[0m\n"

read -r
if echo "$REPLY" | grep -q "^[Yy]$"
then
  bumpVersionPackage "$release_type"
  git push --follow-tags
  printf "\033[1;32mPackage succesfully updated and pushed to the remote.\033[0m\n"
else
  printf "\033[1;31mRelease was aborted.\033[0m\n"
fi
