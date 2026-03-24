---
name: team:forensics
description: Post-mortem investigation for failed Agent Teams workflows — analyzes git history, artifacts, and state to diagnose what went wrong
argument-hint: "[problem description]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Grep
  - Glob
---

<objective>
Investigate what went wrong during a workflow execution. Analyzes git history, `.planning/` artifacts, and file system state to detect anomalies and generate a structured diagnostic report.

Purpose: Diagnose failed or stuck workflows so the user can understand root cause and take corrective action.
Output: Forensic report saved to `.planning/forensics/`, presented inline.
</objective>

<context>
**Data sources:**
- `git log` (recent commits, patterns, time gaps)
- `git status` / `git diff` (uncommitted work, conflicts)
- `.planning/STATE.md` (current position, session history)
- `.planning/ROADMAP.md` (phase scope and progress)
- `.planning/phases/*/` (PLAN.md, SUMMARY.md, VERIFICATION.md, CONTEXT.md)

**User input:**
- Problem description: $ARGUMENTS (optional — will ask if not provided)
</context>

<process>

## Step 1: Gather Evidence

```bash
# Recent git history
git log --oneline -30

# Uncommitted changes
git status
git diff --stat

# Planning state
cat .planning/STATE.md 2>/dev/null

# Phase artifacts
find .planning/phases -name "*.md" | sort
```

## Step 2: Detect Anomalies

Check for each anomaly type:

**Stuck loop:** Same commit pattern repeated, no progress on STATE.md
**Missing artifacts:** Phase marked started but no SUMMARY.md / VERIFICATION.md
**Abandoned work:** Uncommitted changes, partially executed plans
**Crash/interruption:** Last commit doesn't match STATE.md current_position
**Verification failure:** VERIFICATION.md shows FAILED but phase marked complete
**Broken wiring:** PLAN.md tasks reference files that don't exist

## Step 3: Build Timeline

Reconstruct what happened:
```bash
git log --oneline --since="7 days ago" --format="%h %ai %s"
```

Map commits to phase/plan execution. Identify where things diverged.

## Step 4: Write Forensic Report

```bash
mkdir -p .planning/forensics
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
```

Write to `.planning/forensics/report-${TIMESTAMP}.md`:

```markdown
# Forensic Report — {timestamp}

## Problem
{user description or auto-detected}

## Timeline
{reconstructed from git log}

## Anomalies Found
{list with evidence}

## Root Cause
{most likely cause based on evidence}

## Recommendations
1. {action to resolve}
2. {alternative}
```

## Step 5: Present and Offer Next Steps

Show report inline. Offer:
1. Run `/team:health` to check .planning/ integrity
2. Run `/team:resume-work` to restore state
3. Manual fix steps if needed

</process>

<critical_rules>
- **Read-only investigation:** Do not modify project source files during forensics. Only write the forensic report.
- **Ground findings in evidence:** Every anomaly must cite specific commits, files, or state data.
- **No speculation without evidence:** If data is insufficient, say so.
</critical_rules>
