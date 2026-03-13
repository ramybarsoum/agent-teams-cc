---
name: team:add-phase
description: Add a new phase to the end of the current milestone
argument-hint: "<description>"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
---

<objective>
Add a new integer phase to the end of the current milestone in the roadmap. Calculates next phase number, creates phase directory, and updates roadmap structure.
</objective>

<process>

## Step 1: Parse Arguments

All arguments become the phase description.

If no arguments:
```
ERROR: Phase description required
Usage: /team:add-phase <description>
Example: /team:add-phase Add authentication system
```
Exit.

## Step 2: Validate Roadmap

```bash
cat .planning/ROADMAP.md 2>/dev/null
```

If no ROADMAP.md: "Run `/team:new-project` to initialize." Exit.

## Step 3: Calculate Next Phase Number

```bash
# Find highest phase number from directories
ls -d .planning/phases/*/ 2>/dev/null | sort -t/ -k3 -n | tail -1
```

Next phase = max existing + 1.

Generate slug from description (lowercase, hyphens, max 40 chars).

## Step 4: Create Phase Directory

```bash
PADDED=$(printf "%02d" $NEXT_PHASE)
PHASE_DIR=".planning/phases/${PADDED}-${SLUG}"
mkdir -p "$PHASE_DIR"
```

## Step 5: Update ROADMAP.md

Insert new phase entry at the end of the current milestone section with Goal, Depends on, and Plans subsections.

## Step 6: Update STATE.md

Under "Accumulated Context" > "Roadmap Evolution" add:
```
- Phase {N} added: {description}
```

## Step 7: Commit and Report

```bash
git add .planning/ROADMAP.md .planning/STATE.md "$PHASE_DIR"
git commit -m "docs: add phase ${NEXT_PHASE} - ${DESCRIPTION}"
```

```
Phase {N} added to current milestone:
- Description: {description}
- Directory: .planning/phases/${PADDED}-${SLUG}/
- Status: Not planned yet

## Next Up

**Phase {N}: {description}**

`/team:plan-phase {N}`
```

</process>
