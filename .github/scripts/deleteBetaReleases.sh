#!/bin/sh
# Usage: deleteBetaReleases.sh <pr_number>
# Deletes every beta prerelease built for the pull request, along with its
# tag. Tags left without a release are deleted too.

set -eu

pr_number=${1:-}

if ! echo "$pr_number" | grep -qE '^[1-9][0-9]*$'; then
  echo "Usage: $0 <pr_number>" >&2
  exit 1
fi

beta_tag_pattern="^v[0-9]+\.[0-9]+\.[0-9]+-beta\.${pr_number}\.[0-9]+$"

beta_tags=$(
  gh api --paginate "repos/{owner}/{repo}/git/matching-refs/tags/v" --jq '.[].ref' \
    | sed 's!^refs/tags/!!' \
    | grep -E "$beta_tag_pattern" \
    || true
)

if [ -z "$beta_tags" ]; then
  echo "No beta releases found for PR #${pr_number}."
  exit 0
fi

for tag in $beta_tags; do
  if gh release view "$tag" >/dev/null 2>&1; then
    gh release delete "$tag" --cleanup-tag --yes
  else
    gh api --method DELETE "repos/{owner}/{repo}/git/refs/tags/${tag}" >/dev/null
  fi
  echo "Deleted ${tag}."
done
