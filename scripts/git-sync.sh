#!/usr/bin/env bash
set -euo pipefail

fail() {
  echo "ERROR: $1" >&2
  echo "Sync stopped without overwriting local work. Resolve the reported problem manually and rerun the script." >&2
  exit 1
}

branch="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || true)"
if [[ -z "$branch" || "$branch" == "HEAD" ]]; then
  fail "Current checkout is detached. Switch to a branch before syncing."
fi

upstream="$(git for-each-ref --format='%(upstream:short)' "refs/heads/$branch")"
if [[ -z "$upstream" ]]; then
  fail "Branch '$branch' has no upstream. Set it with: git branch --set-upstream-to origin/$branch"
fi

echo "Current branch: $branch"
echo "Tracking branch: $upstream"

status="$(git status --porcelain)"
if [[ -z "${status//[[:space:]]/}" ]]; then
  echo "No local changes detected. Nothing to sync."
  exit 0
fi

git add -A

cached="$(git diff --cached --name-only)"
if [[ -z "${cached//[[:space:]]/}" ]]; then
  echo "No staged changes after git add -A. Nothing to commit."
  exit 0
fi

timestamp="$(date '+%Y-%m-%d_%H-%M-%S')"
git commit -m "auto-sync: $timestamp"
git pull --rebase
git push

echo "Sync complete."
