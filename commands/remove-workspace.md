---
name: team:remove-workspace
description: Remove a workspace directory with confirmation
argument-hint: "<workspace-name>"
allowed-tools:
  - Read
  - Bash
  - AskUserQuestion
---

<objective>
Remove a workspace directory and clean up associated git worktrees.
Refuses if there are uncommitted changes. Requires explicit confirmation before deletion.
</objective>

<process>

## Step 1: Resolve Workspace

```bash
WS_ROOT="$HOME/team-workspaces"
WS_PATH="$WS_ROOT/$ARGUMENTS"

# Verify workspace exists
ls "$WS_PATH" 2>/dev/null || echo "Workspace not found: $ARGUMENTS"
```

If not found: list available workspaces and exit.

## Step 2: Check for Uncommitted Changes

```bash
for repo_dir in "$WS_PATH"/*/; do
  cd "$repo_dir" 2>/dev/null || continue
  STATUS=$(git status --short 2>/dev/null)
  if [ -n "$STATUS" ]; then
    echo "UNCOMMITTED: $repo_dir"
    echo "$STATUS"
  fi
done
```

If uncommitted changes found: **REFUSE** and show what's pending.
Tell user to commit or stash before removing.

## Step 3: Show Workspace Summary

Display what will be deleted:
```
About to remove workspace: {name}
Location: {path}
Repos: {list}
.planning/ artifacts: {count} files

This CANNOT be undone.
```

Ask for explicit confirmation: "Type the workspace name to confirm deletion: "
Verify input matches workspace name exactly.

## Step 4: Clean Up Worktrees

```bash
# For worktree strategy: remove worktrees first
for repo_dir in "$WS_PATH"/*/; do
  # Check if it's a worktree
  MAIN_REPO=$(git -C "$repo_dir" rev-parse --git-common-dir 2>/dev/null)
  if [ -n "$MAIN_REPO" ]; then
    WORKTREE_PATH=$(git -C "$repo_dir" rev-parse --show-toplevel 2>/dev/null)
    git -C "$MAIN_REPO/.." worktree remove "$WORKTREE_PATH" --force 2>/dev/null
  fi
done
```

## Step 5: Delete Directory

```bash
rm -rf "$WS_PATH"
```

## Step 6: Report

```
Workspace removed: {name}
Worktrees cleaned: {N}
```

</process>
