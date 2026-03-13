---
name: team:cleanup
description: Archive completed phase directories from finished milestones
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - AskUserQuestion
---

<objective>
Archive accumulated phase directories from completed milestones into `.planning/milestones/v{X.Y}-phases/`. Shows a dry-run summary and moves directories on confirmation.
</objective>

<process>

## Step 1: Identify Completed Milestones

```bash
cat .planning/MILESTONES.md 2>/dev/null
ls -d .planning/milestones/v*-phases 2>/dev/null
```

Extract milestone versions. Filter to milestones that do NOT already have a `-phases` archive directory.

If all milestones already archived:
```
All completed milestones already have phase directories archived. Nothing to clean up.
```
Stop.

## Step 2: Determine Phase Membership

For each milestone without a phase archive, read the archived ROADMAP:

```bash
cat .planning/milestones/v{X.Y}-ROADMAP.md 2>/dev/null
```

Extract phase numbers. Check which still exist in `.planning/phases/`.

## Step 3: Show Dry Run

```
## Cleanup Summary

### v{X.Y} — {Milestone Name}
Phase directories to archive:
- 01-foundation/
- 02-auth/

Destination: .planning/milestones/v{X.Y}-phases/
```

AskUserQuestion: "Proceed with archiving?" — Yes / Cancel

If Cancel: stop.

## Step 4: Archive

```bash
mkdir -p .planning/milestones/v{X.Y}-phases
mv .planning/phases/{dir} .planning/milestones/v{X.Y}-phases/
```

## Step 5: Commit

```bash
git add .planning/milestones/ .planning/phases/
git commit -m "chore: archive phase directories from completed milestones"
```

## Step 6: Report

```
Archived:
- v{X.Y}: {N} phase directories -> .planning/milestones/v{X.Y}-phases/

.planning/phases/ cleaned up.
```

</process>
