#!/bin/sh
# Dispatches the Release Beta Build workflow for the current branch's pull
# request. The workflow builds the PR's head commit on GitHub, so the local
# branch must match it.

production_branch="master"
workflow="release-beta.yml"

fail() {
  printf "\033[1;31m%s\n\033[0m" "$1"
  exit 1
}

getCurrentBranchName() {
  git rev-parse --abbrev-ref HEAD
}

findRunUrl() {
  pr_number=$1
  dispatched_at=$2
  attempt=0

  while [ "$attempt" -lt 10 ]; do
    run_url=$(gh run list \
      --workflow "$workflow" \
      --event workflow_dispatch \
      --limit 10 \
      --json url,displayTitle,createdAt \
      --jq "map(select(.displayTitle == \"Beta release for PR #${pr_number}\" and .createdAt >= \"${dispatched_at}\")) | .[0].url // empty")
    if [ -n "$run_url" ]; then
      echo "$run_url"
      return
    fi
    attempt=$((attempt+1))
    sleep 2
  done
}

current_branch=$(getCurrentBranchName)

if [ "$current_branch" = "$production_branch" ]; then
  fail "Cannot release betas while on branch ${production_branch}."
fi

pr_info=$(gh pr view --json number,headRefOid,state --jq '[.number, .headRefOid, .state] | @tsv' 2>/dev/null) ||
  fail "No pull request found for branch ${current_branch}. Open one before releasing a beta."

pr_number=$(echo "$pr_info" | cut -f1)
pr_head_sha=$(echo "$pr_info" | cut -f2)
pr_state=$(echo "$pr_info" | cut -f3)

if [ "$pr_state" != "OPEN" ]; then
  fail "PR #${pr_number} is ${pr_state}. Betas can only be released from open pull requests."
fi

local_head_sha=$(git rev-parse HEAD)

if [ "$local_head_sha" != "$pr_head_sha" ]; then
  fail "Local HEAD ($(echo "$local_head_sha" | cut -c1-7)) does not match the head of PR #${pr_number} ($(echo "$pr_head_sha" | cut -c1-7)). Push or pull so they match, since the beta is built from the PR on GitHub."
fi

if [ -n "$(git status --porcelain)" ]; then
  printf "\033[1;33mUncommitted changes will not be included in the beta.\n\033[0m"
fi

printf "\033[37m=====================\033[0m\n"
printf "\033[37mRequesting a beta release of PR #%s at %s.\033[0m\n\n" "$pr_number" "$(echo "$pr_head_sha" | cut -c1-7)"

dispatched_at=$(date -u +%Y-%m-%dT%H:%M:%SZ)
dispatch_output=$(gh workflow run "$workflow" -f pr="$pr_number" 2>&1) || fail "$dispatch_output"

run_url=$(echo "$dispatch_output" | grep -Eo 'https://github\.com/[^ ]+/actions/runs/[0-9]+' | head -1)
if [ -z "$run_url" ]; then
  run_url=$(findRunUrl "$pr_number" "$dispatched_at")
fi

if [ -n "$run_url" ]; then
  printf "\033[1;32mBeta release started: %s\033[0m\n\n" "$run_url"
else
  printf "\033[1;32mBeta release started. Follow it with 'gh run list --workflow %s'.\033[0m\n\n" "$workflow"
fi
