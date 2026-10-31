#!/bin/sh
# Usage: getBetaVersion.sh <pr_number> <build_number>
# Prints the beta version for a pull request build, e.g. 3.3.0-beta.123.4.
# The "beta" label keeps it below the final release in both PHP's
# version_compare and semver, and the numeric identifiers carry no leading
# zeros so npm leaves them intact. Without unreleased changie fragments the
# next patch version is used, so every PR can get a beta.

set -eu

pr_number=${1:-}
build_number=${2:-}

isPositiveInteger() {
  echo "$1" | grep -qE '^[1-9][0-9]*$'
}

if ! isPositiveInteger "$pr_number" || ! isPositiveInteger "$build_number"; then
  echo "Usage: $0 <pr_number> <build_number>" >&2
  exit 1
fi

hasUnreleasedFragments() {
  [ -n "$(ls .changes/unreleased/*.yaml 2>/dev/null)" ]
}

if hasUnreleasedFragments; then
  bump="auto"
else
  bump="patch"
fi

next_version=$(npx changie next "$bump") || {
  echo "Unable to compute the next ${bump} version with changie." >&2
  exit 1
}

echo "${next_version}-beta.${pr_number}.${build_number}"
