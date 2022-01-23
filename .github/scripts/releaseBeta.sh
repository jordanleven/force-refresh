PRODUCTION_BRANCH="master"

function getCurrentBranchName {
  echo $(git branch | sed -n -e 's/^\* \(.*\)/\1/p')
}

function getPrereleaseName {
  CURRENT_BRANCH_NAME=$(getCurrentBranchName)
  COMMIT_SHA=$(git log master..${CURRENT_BRANCH_NAME} --oneline --format=format:%H | tail -1)
  PRERELEASE_NAME=$(echo ${COMMIT_SHA} | cut -c1-6 | awk '{ print toupper($0) }')
  echo $PRERELEASE_NAME
}

function getCurrentPackageVersion {
  echo $(node -e "process.stdout.write(require('./package.json').version)")
}

function getExistingBuildNumber {
  CURRENT_PACKAGE_VERSION=$(getCurrentPackageVersion)
  if [[ "${CURRENT_PACKAGE_VERSION}" == *"-"* ]]; then
      PRERELEASE_NAME=$(getPrereleaseName)
      BUILD_VERSION=$(echo ${CURRENT_PACKAGE_VERSION} | sed 's/.*-'${PRERELEASE_NAME}'.//')
      echo $BUILD_VERSION
  fi
}

function getNextBuildNumber {
  EXISTING_BUILD_NUMBER=$(getExistingBuildNumber)
  if [ -z "${EXISTING_BUILD_NUMBER}" ]
    then
      echo 0
    else
      echo "$((${EXISTING_BUILD_NUMBER} + 1))"
  fi
}

function getNextVersion {
  EXISTING_BUILD_NUMBER=$(getExistingBuildNumber)
  if [ -z "$EXISTING_BUILD_NUMBER" ]
    then
      echo "$(npx next-standard-version $1 $2)"
    else
      CURRENT_PACKAGE_VERSION=$(getCurrentPackageVersion)
      PACKAGE_VERSION=(`echo ${CURRENT_PACKAGE_VERSION} | tr '-' ' '`)
      EXISTING_PACKAGE_VERSION=${PACKAGE_VERSION[0]}
      echo "${EXISTING_PACKAGE_VERSION}"
  fi
}

function bumpVersionPackage {
  PRERELEASE_NAME=$1
  SPECIFIED_RELEASE_TYPE_ARG=$([ ${RELEASE_TYPE} ] && echo "--releaseAs ${RELEASE_TYPE}")
  npx standard-version -a --prerelease ${PRERELEASE_NAME} --skip.changelog ${SPECIFIED_RELEASE_TYPE_ARG}
}

CURRENT_BRANCH=$(getCurrentBranchName)
# If we've specified a type of release, we need to include the `releaseAs` argument
SPECIFIED_RELEASE_TYPE_ARG=$([ ${RELEASE_TYPE} ] && echo "--releaseAs ${RELEASE_TYPE}")
PRERELEASE_NAME=$(getPrereleaseName)
NEXT_VERSION=$(npx standard-version --prerelease ${PRERELEASE_NAME} --dry-run --skip.changelog --skip.commit --skip.tag ${SPECIFIED_RELEASE_TYPE_ARG})

if [[ $CURRENT_BRANCH == $PRODUCTION_BRANCH ]]
  then
  echo "\033[1;31mCannot release betas while on branch ${PRODUCTION_BRANCH}\033[0m"
  exit 1
fi

echo "\033[37m=====================\033[0m\n"
echo "\033[37m${NEXT_VERSION}\033[0m\n"
echo "\033[33mPress \"y\" to proceed with this beta release or press any other key to abort.\033[0m\n"

read -p "" -n 1 -s
if [[ $REPLY =~ ^[Yy]$ ]]
then
  bumpVersionPackage $PRERELEASE_NAME
  git push --follow-tags
  echo "\033[1;32mPackage succesfully updated and pushed to the remote.\033[0m\n"
else
  echo "\033[1;31mRelease was aborted.\033[0m\n"
fi
