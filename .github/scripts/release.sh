PRODUCTION_BRANCH="master"

function getCurrentBranchName {
  echo $(git branch | sed -n -e 's/^\* \(.*\)/\1/p')
}

function getReleaseType {
  RELEASE_OPTION=$1
  case $RELEASE_OPTION in
    --major)
      RELEASE_TYPE='major'
      ;;
    --minor)
      RELEASE_TYPE='minor'
      ;;
    --patch)
      RELEASE_TYPE='patch'
      ;;
  esac
  echo $RELEASE_TYPE
}

function bumpVersionPackage {
  RELEASE_TYPE=$1
  SPECIFIED_RELEASE_TYPE_ARG=$([ ${RELEASE_TYPE} ] && echo "--releaseAs ${RELEASE_TYPE}")
  npx standard-version -a ${SPECIFIED_RELEASE_TYPE_ARG}
}

CURRENT_BRANCH=$(getCurrentBranchName)
RELEASE_TYPE=$(getReleaseType $1)
# If we've specified a type of release, we need to include the `releaseAs` argument
SPECIFIED_RELEASE_TYPE_ARG=$([ $RELEASE_TYPE ] && echo "--releaseAs ${RELEASE_TYPE}")
NEXT_VERSION=$(npx standard-version --dry-run --skip.changelog --skip.commit --skip.tag ${SPECIFIED_RELEASE_TYPE_ARG})

if [[ $CURRENT_BRANCH != $PRODUCTION_BRANCH ]]
  then
  echo "\033[1;31mCannot release while on branch ${CURRENT_BRANCH}\033[0m"
  exit 1
fi

echo "\033[37m=====================\033[0m\n"
echo "\033[37m${NEXT_VERSION}\033[0m\n"
echo "\033[33mPress \"y\" to proceed with this release or press any other key to abort.\033[0m\n"

read -p "" -n 1 -s
if [[ $REPLY =~ ^[Yy]$ ]]
then
  bumpVersionPackage $RELEASE_TYPE
  git push --follow-tags
  echo "\033[1;32mPackage succesfully updated and pushed to the remote.\033[0m\n"
else
  echo "\033[1;31mRelease was aborted.\033[0m\n"
fi
