---
name: team:insert-phase
description: Insert urgent phase between existing phases using decimal numbering
argument-hint: "<after-phase> <description>"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
---

<objective>
Insert a decimal phase for urgent work between existing integer phases. Uses decimal numbering (72.1, 72.2) to preserve the logical sequence without renumbering.
</objective>

<process>

## Step 1: Parse Arguments

First argument: integer phase number to insert after.
Remaining: phase description.

If missing:
```
ERROR: Both phase number and description required
Usage: /team:insert-phase <after> <description>
Example: /team:insert-phase 72 Fix critical auth bug
```
Exit.

## Step 2: Validate

```bash
cat .planning/ROADMAP.md 2>/dev/null
```

Verify target phase exists in ROADMAP.md. If not found, exit.

## Step 3: Calculate Decimal Phase

Check for existing decimal phases after the target:

```bash
ls -d .planning/phases/${AFTER}.* 2>/dev/null
```

Next decimal = `{AFTER}.1` (or `{AFTER}.2` if `.1` exists, etc.)

Generate slug from description.

## Step 4: Create Phase

```bash
PHASE_DIR=".planning/phases/${DECIMAL}-${SLUG}"
mkdir -p "$PHASE_DIR"
```

## Step 5: Update ROADMAP.md

Insert phase entry after the target phase with `(INSERTED)` marker.

## Step 6: Update STATE.md

Add to Roadmap Evolution:
```
- Phase {decimal} inserted after Phase {after}: {description} (URGENT)
```

## Step 7: Report

```
Phase {decimal} inserted after Phase {after}:
- Description: {description}
- Directory: .planning/phases/${DECIMAL}-${SLUG}/
- Marker: (INSERTED)

## Next Up

**Phase {decimal}: {description}** — urgent insertion

`/team:plan-phase {decimal}`

Also: Check if Phase {next_integer} dependencies still make sense
```

</process>
