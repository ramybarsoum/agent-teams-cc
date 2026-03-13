---
name: team:debug
description: Systematic debugging with parallel debug agents investigating UAT gaps
argument-hint: "<phase-number>"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - Task
  - TeamCreate
  - TeamDelete
  - SendMessage
---

<objective>
Orchestrate parallel debug teammates to investigate UAT gaps and find root causes. After UAT finds gaps, spawn one debug teammate per gap. Each investigates autonomously with symptoms pre-filled. Collect root causes, update UAT.md, then hand off to `/team:plan-phase --gaps`.

Principle: Diagnose before planning fixes.
</objective>

<process>

## Step 1: Parse Gaps from UAT.md

```bash
PHASE=$1
PADDED=$(printf "%02d" $PHASE 2>/dev/null || echo "$PHASE")
PHASE_DIR=$(ls -d .planning/phases/$PADDED-* 2>/dev/null | head -1)
cat "$PHASE_DIR"/*-UAT.md 2>/dev/null
```

Extract gaps from the "Gaps" YAML section. Build gap list with truth, severity, test number, and reason.

## Step 2: Report Plan

```
## Diagnosing {N} Gaps

Spawning parallel debug teammates:

| Gap (Truth) | Severity |
|-------------|----------|
| [truth 1]   | major    |
| [truth 2]   | minor    |
```

## Step 3: Create Team and Spawn Agents

```
TeamCreate(team_name="phase-${PHASE}-debug", description="Debug phase ${PHASE} UAT gaps")
```

For each gap, spawn a debug teammate:

```
Task(team_name="phase-${PHASE}-debug", name="debug-${slug}",
     subagent_type="team-researcher",
     prompt="Debug mode. Investigate root cause only.

**Symptom:** ${truth}
**Expected:** ${expected}
**Actual:** ${actual}
**Errors:** ${errors}
**Goal:** find_root_cause_only (do NOT fix, just diagnose)

Read the UAT file at ${PHASE_DIR}/*-UAT.md for full context.
Read .planning/STATE.md for project context.

Investigate autonomously: read code, form hypotheses, test.

Write findings to .planning/debug/${slug}.md
Message lead with root cause, evidence, and files involved.",
     description="Debug: ${truth_short}")
```

All agents spawn in a single batch (parallel execution).

## Step 4: Collect Results

Each agent messages back with:
- Root cause with evidence
- Files involved
- Suggested fix direction

If agent returns inconclusive: mark as "needs manual review."

## Step 5: Update UAT.md

For each gap, update with diagnosis:
- Add `root_cause` field
- Add `artifacts` with file paths and issues
- Add `missing` with required fixes
- Add `debug_session` path

Update UAT.md frontmatter status to "diagnosed."

```bash
git add "$PHASE_DIR"/*-UAT.md .planning/debug/
git commit -m "docs(${PADDED}): add root causes from diagnosis"
```

## Step 6: Cleanup and Report

Shutdown all teammates. TeamDelete.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 TEAM > DIAGNOSIS COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

| Gap (Truth) | Root Cause | Files |
|-------------|------------|-------|
| [truth 1]   | [cause]    | [files] |

Debug sessions: .planning/debug/

Next: /team:plan-phase {phase} --gaps
```

</process>
