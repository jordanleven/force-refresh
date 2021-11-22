PRODUCTION_BRANCH="master"
MAIN_FILE="filter-force-refresh.php"

function getCurrentBranchName {
  echo $(git branch | sed -n -e 's/^\* \(.*\)/\1/p')
}

function getPrereleaseName {
  CURRENT_BRANCH_NAME=$(getCurrentBranchName)
  echo $CURRENT_BRANCH_NAME
}

function getCurrentPackageVersion {
  echo $(node -e "process.stdout.write(require('./package.json').version)")
}

function getExistingBuildNumber {
  CURRENT_PACKAGE_VERSION=$(getCurrentPackageVersion)
  if [[ "$CURRENT_PACKAGE_VERSION" == *"-"* ]]; then
      PRERELEASE_NAME=$(getPrereleaseName)
      BUILD_VERSION=$(echo $CURRENT_PACKAGE_VERSION | sed 's/.*-'${PRERELEASE_NAME}'.//')
      echo $BUILD_VERSION
  fi
}

function getNextBuildNumber {
  EXISTING_BUILD_NUMBER=$(getExistingBuildNumber)
  if [ -z "$EXISTING_BUILD_NUMBER" ]
    then
      echo 0
    else
      echo "$(($EXISTING_BUILD_NUMBER + 1))"
  fi
}

function getNextVersion {
  EXISTING_BUILD_NUMBER=$(getExistingBuildNumber)
  if [ -z "$EXISTING_BUILD_NUMBER" ]
    then
      echo "$(npx next-standard-version)"
    else
      CURRENT_PACKAGE_VERSION=$(getCurrentPackageVersion)
      PACKAGE_VERSION=(`echo $CURRENT_PACKAGE_VERSION | tr '-' ' '`)
      EXISTING_PACKAGE_VERSION=${PACKAGE_VERSION[0]}
      echo "${EXISTING_PACKAGE_VERSION}"
  fi
}

CURRENT_BRANCH=$(getCurrentBranchName)
CURRENT_PACKAGE_VERSION=$(getCurrentPackageVersion)
NEXT_VERSION=$(getNextVersion)
PRERELEASE_NAME=$(getPrereleaseName)
NEXT_BUILD=$(getNextBuildNumber)
NEXT_VERSION_AND_BUILD="${NEXT_VERSION}-${PRERELEASE_NAME}.${NEXT_BUILD}"

if [[ $CURRENT_BRANCH == $PRODUCTION_BRANCH ]]
  then
  echo "\033[1;31mCannot release betas while on branch $PRODUCTION_BRANCH\033[0m"
  exit 1
fi

echo "\033[33mBump plugin from ${CURRENT_PACKAGE_VERSION} to ${NEXT_VERSION_AND_BUILD}?\033[0m\n"
echo "\033[33mPress \"y\" to proceed with this release or press any other key to abort.\033[0m\n"
read -p "" -n 1 -s
if [[ $REPLY =~ ^[Yy]$ ]]
then
  perl -pi -e "s/(?<=Version: ).*/${NEXT_VERSION_AND_BUILD}/g" $MAIN_FILE
  git add $MAIN_FILE
  npx standard-version -a --prerelease $PRERELEASE_NAME --skip.changelog
  git push --follow-tags
  echo "\033[1;32mPackage succesfully updated to ${NEXT_VERSION_AND_BUILD} and pushed to the remote.\033[0m\n"
else
  echo "\033[1;31mRelease was aborted.\033[0m\n"
fi
