---
name: team:new-workspace
description: Create an isolated workspace with repo copies and independent .planning/ directory
argument-hint: "[--name <name>] [--repos <paths>] [--strategy worktree|clone] [--branch <branch>]"
allowed-tools:
  - Read
  - Write
  - Bash
  - AskUserQuestion
---

<objective>
Create an isolated workspace for parallel work streams. Each workspace gets its
own copy of repositories (via git worktree or clone) and an independent `.planning/`
directory, preventing conflicts between parallel workstreams.
</objective>

<context>
Flags from $ARGUMENTS:
- `--name <name>` — Workspace name (required, ask if not provided)
- `--repos <paths>` — Comma-separated repo paths to include (defaults to current repo)
- `--strategy worktree|clone` — Isolation strategy (default: worktree)
- `--branch <branch>` — Branch to base workspace on (default: current branch)
- `--auto` — Skip confirmation prompts
</context>

<process>

## Step 1: Parse Arguments

Extract `--name`, `--repos`, `--strategy`, `--branch` from $ARGUMENTS.
If `--name` not provided: ask "What should this workspace be called?"

## Step 2: Choose Location

```bash
WS_ROOT="$HOME/team-workspaces"
mkdir -p "$WS_ROOT"
WS_PATH="$WS_ROOT/$NAME"
```

Verify path doesn't already exist.

## Step 3: Set Up Repo Isolation

### Strategy: worktree (default)

```bash
# For each repo
cd {repo_path}
git worktree add "$WS_PATH/{repo_name}" "${BRANCH:-HEAD}"
```

### Strategy: clone

```bash
# For each repo
git clone --local {repo_path} "$WS_PATH/{repo_name}"
cd "$WS_PATH/{repo_name}" && git checkout "${BRANCH:-$(git branch --show-current)}"
```

## Step 4: Initialize .planning/

```bash
mkdir -p "$WS_PATH/.planning"
```

Copy current .planning/ structure (without phase artifacts):
```bash
cp .planning/PROJECT.md "$WS_PATH/.planning/" 2>/dev/null
cp .planning/REQUIREMENTS.md "$WS_PATH/.planning/" 2>/dev/null
# Create fresh STATE.md and ROADMAP.md for this workspace
```

## Step 5: Create Workspace Manifest

Write `$WS_PATH/WORKSPACE.md`:
```markdown
# Workspace: {name}

Created: {date}
Branch: {branch}
Strategy: {strategy}

## Repos
{list of repo paths}

## Purpose
{ask user or leave blank}
```

## Step 6: Report

```
Workspace Created: {name}
Location: {path}
Repos: {N}
Strategy: {strategy}

Next: cd {path} and run /team:new-milestone or /team:progress
```

</process>
