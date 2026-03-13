---
name: team:remove-phase
description: Remove an unstarted future phase and renumber subsequent phases
argument-hint: "<phase-number>"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - AskUserQuestion
---

<objective>
Remove an unstarted future phase from the roadmap, delete its directory, renumber subsequent phases, and commit. Git commit serves as the historical record.
</objective>

<process>

## Step 1: Parse Arguments

Phase number to remove (integer or decimal).

If missing: "Usage: `/team:remove-phase <phase-number>`" Exit.

## Step 2: Validate

```bash
cat .planning/ROADMAP.md 2>/dev/null
cat .planning/STATE.md 2>/dev/null
```

Verify phase exists. Determine current phase from STATE.md.

## Step 3: Validate Future Phase

Target must be > current phase number.

If target <= current:
```
ERROR: Cannot remove Phase {target}
Only future phases can be removed.
Current phase: {current}

Use /team:pause-work to abandon current work.
```
Exit.

## Step 4: Confirm Removal

```
Removing Phase {target}: {Name}

This will:
- Delete: .planning/phases/{target}-{slug}/
- Renumber all subsequent phases
- Update: ROADMAP.md, STATE.md

Proceed? (y/n)
```

## Step 5: Execute Removal

1. Delete the phase directory
2. Renumber subsequent directories (reverse order to avoid conflicts):

```bash
# For each phase after target, rename directory and internal files
# Work in reverse to avoid naming conflicts
```

3. Update ROADMAP.md: remove section, renumber phase references, update dependencies
4. Update STATE.md: decrement phase count

## Step 6: Commit

```bash
git add .planning/
git commit -m "chore: remove phase {target} ({original-name})"
```

## Step 7: Report

```
Phase {target} ({original-name}) removed.

Changes:
- Deleted directory
- Renumbered: {N} directories
- Updated: ROADMAP.md, STATE.md

## What's Next

- `/team:progress` — see updated roadmap
- Continue with current phase
```

</process>
