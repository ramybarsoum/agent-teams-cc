---
name: team:pr-branch
description: Create a clean PR branch by filtering out .planning/ commits — ready for code review
argument-hint: "[target branch, default: main]"
allowed-tools:
  - Bash
  - Read
  - AskUserQuestion
---

<objective>
Create a clean branch suitable for pull requests by filtering out .planning/ commits
from the current branch. Reviewers see only code changes, not planning artifacts.

This solves the problem of PR diffs being cluttered with PLAN.md, SUMMARY.md, STATE.md
changes that are irrelevant to code review.
</objective>

<process>

## Step 1: Identify Base Branch

Parse $ARGUMENTS for target branch. Default to `main`, fallback to `develop` if main doesn't exist.

```bash
TARGET="${ARGUMENTS:-main}"
git show-ref --verify --quiet "refs/remotes/origin/$TARGET" 2>/dev/null || TARGET="develop"
```

## Step 2: Find Planning-Only Commits

```bash
CURRENT=$(git branch --show-current)

# Find commits that only touch .planning/
git log --oneline "origin/$TARGET..$CURRENT" \
  --diff-filter=M -- '.planning/*' \
  | head -20
```

## Step 3: Check Mixed Commits

Detect commits that touch BOTH .planning/ AND source code:
```bash
git log --oneline "origin/$TARGET..$CURRENT" | while read hash msg; do
  has_planning=$(git diff-tree --no-commit-id -r "$hash" --name-only | grep -c "^\.planning/" 2>/dev/null)
  has_code=$(git diff-tree --no-commit-id -r "$hash" --name-only | grep -vc "^\.planning/" 2>/dev/null)
  if [ "$has_planning" -gt 0 ] && [ "$has_code" -gt 0 ]; then
    echo "MIXED: $hash $msg"
  fi
done
```

Warn user about mixed commits — they can't be cleanly filtered.

## Step 4: Create Clean Branch

Strategy: cherry-pick only commits that touch non-.planning/ files.

```bash
PR_BRANCH="${CURRENT}-pr-$(date +%Y%m%d)"
git checkout "origin/$TARGET" -b "$PR_BRANCH"

# Cherry-pick commits that have code changes
git log --oneline "origin/$TARGET..$CURRENT" --reverse | while read hash msg; do
  code_changes=$(git diff-tree --no-commit-id -r "$hash" --name-only | grep -vc "^\.planning/" 2>/dev/null)
  if [ "$code_changes" -gt 0 ]; then
    git cherry-pick "$hash" --no-commit 2>/dev/null
  fi
done

git commit -m "$(git log --oneline origin/$TARGET..$CURRENT | wc -l) commits — filtered from $CURRENT"
```

## Step 5: Report

Show:
- PR branch: `{PR_BRANCH}`
- Commits included: N
- Planning commits excluded: N
- Suggest: `gh pr create --head $PR_BRANCH`

</process>
