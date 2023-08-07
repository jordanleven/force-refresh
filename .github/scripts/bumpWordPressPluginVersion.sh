#!/bin/sh
MAIN_FILE="filter-force-refresh.php"

getCurrentPackageVersion() {
 node -e "process.stdout.write(require('./package.json').version)"
}

bumpVersionPlugin() {
  package_version=$(getCurrentPackageVersion)
  perl -pi -e "s/(?<=Version: ).*/${package_version}/g" ${MAIN_FILE}
  git add $MAIN_FILE
}

bumpVersionPlugin
