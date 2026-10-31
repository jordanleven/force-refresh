#!/bin/sh
# Usage: setBuildVersion.sh <version>
# Writes the version into package.json, package-lock.json and the plugin
# header in the working tree without committing, so a build can carry a
# version that never reaches the branch.

set -eu

version=${1:-}

if [ -z "$version" ]; then
  echo "Usage: $0 <version>" >&2
  exit 1
fi

npm version "$version" --no-git-tag-version --allow-same-version >/dev/null
"$(dirname "$0")/bumpWordPressPluginVersion.sh"
