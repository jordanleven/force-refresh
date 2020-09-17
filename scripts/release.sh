PRODUCTION_BRANCH="master"
MAIN_FILE="filter-force-refresh.php"
CURRENT_BRANCH=$(git branch | sed -n -e 's/^\* \(.*\)/\1/p')
CURRENT_PACKAGE_VERSION=$(node -e "process.stdout.write(require('./package.json').version)")
NEXT_VERSION=$(npx next-standard-version)

if [[ $CURRENT_BRANCH != $PRODUCTION_BRANCH ]]
  then
  echo "\033[1;31mCannot release while on branch $CURRENT_BRANCH\033[0m"
  exit 1
fi

echo "\033[33mBump plugin from ${CURRENT_PACKAGE_VERSION} to ${NEXT_VERSION}?\033[0m\n"
echo "\033[33mPress \"y\" to proceed with this release or press any other key to abort.\033[0m\n"
read -p "" -n 1 -s
if [[ $REPLY =~ ^[Yy]$ ]]
then
  perl -pi -e "s/(?<=Version: ).*/${NEXT_VERSION}/g" $MAIN_FILE
  git add $MAIN_FILE
  npx standard-version -a
  git push --follow-tags
  echo "\033[1;32mPackage succesfully updated to ${NEXT_VERSION} and pushed to the remote.\033[0m\n"
else
  echo "\033[1;31mRelease was aborted.\033[0m\n"
fi
