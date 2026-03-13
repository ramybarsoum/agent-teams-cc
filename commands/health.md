---
name: team:health
description: Diagnose planning directory integrity and report issues
argument-hint: "[--repair]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
---

<objective>
Validate `.planning/` directory integrity and report actionable issues. Checks for missing files, invalid configurations, inconsistent state, and orphaned plans. Optionally repairs auto-fixable issues with `--repair`.
</objective>

<process>

## Step 1: Parse Arguments

Check if `--repair` flag is present.

## Step 2: Run Checks

```bash
# Core files
ls .planning/PROJECT.md .planning/ROADMAP.md .planning/STATE.md .planning/config.json 2>/dev/null

# Validate config.json is valid JSON
cat .planning/config.json 2>/dev/null | python3 -c "import sys,json; json.load(sys.stdin)" 2>&1

# Check phase directory naming
ls -d .planning/phases/*/ 2>/dev/null

# Check for orphaned phases (on disk but not in ROADMAP)
cat .planning/ROADMAP.md 2>/dev/null

# Check for plans without summaries
for plan in .planning/phases/*/*-PLAN.md; do
  summary="${plan/PLAN/SUMMARY}"
  [ ! -f "$summary" ] && echo "INFO: $plan has no SUMMARY"
done 2>/dev/null

# Check STATE.md references valid phase
cat .planning/STATE.md 2>/dev/null
```

Classify each finding:
- **Error**: Critical (missing PROJECT.md, broken config.json)
- **Warning**: Non-critical (naming mismatch, orphaned phases)
- **Info**: Informational (plan without summary, may be in progress)

Track repairable issues.

## Step 3: Display Results

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Agent Teams Health Check
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Status: HEALTHY | DEGRADED | BROKEN
Errors: N | Warnings: N | Info: N

[If errors:]
## Errors
- config.json: JSON parse error
  Fix: Run /team:health --repair to reset to defaults

[If warnings:]
## Warnings
- STATE.md references phase 5, but only phases 1-3 exist
  Fix: Run /team:health --repair to regenerate

[If info:]
## Info
- 02-implementation/02-01-PLAN.md has no SUMMARY.md
  Note: May be in progress
```

## Step 4: Repair (if --repair)

Auto-fixable repairs:
- Create missing config.json with defaults
- Reset broken config.json
- Regenerate STATE.md from ROADMAP structure

NOT repairable (too risky):
- PROJECT.md, ROADMAP.md content
- Phase directory renaming
- Orphaned plan cleanup

## Step 5: Verify Repairs

If repairs performed, re-run checks to confirm resolution.

```
## Repairs Performed
- config.json: Created with defaults
- STATE.md: Regenerated from roadmap

[If repairable issues remain and --repair NOT used:]
---
N issues can be auto-repaired. Run: /team:health --repair
```

</process>
