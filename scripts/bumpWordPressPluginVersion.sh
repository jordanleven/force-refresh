MAIN_FILE="filter-force-refresh.php"

function getCurrentPackageVersion {
  echo $(node -e "process.stdout.write(require('./package.json').version)")
}

function bumpVersionPlugin {
  PACKAGE_VERSION=$(getCurrentPackageVersion)
  perl -pi -e "s/(?<=Version: ).*/${PACKAGE_VERSION}/g" ${MAIN_FILE}
}


bumpVersionPlugin
