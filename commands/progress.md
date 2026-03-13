---
name: team:progress
description: Show project progress and route to next action
allowed-tools:
  - Read
  - Bash
  - Glob
  - Grep
---

<objective>
Check project progress, summarize recent work and what's ahead, then intelligently route to the next action. Provides situational awareness before continuing work.
</objective>

<process>

## Step 1: Validate Project

```bash
ls .planning/ROADMAP.md .planning/STATE.md .planning/PROJECT.md 2>/dev/null
```

If no `.planning/` directory:
```
No planning structure found.

Run /team:new-project to start a new project.
```
Exit.

If ROADMAP.md missing but PROJECT.md exists: go to Route F (between milestones).

## Step 2: Load Context

```bash
cat .planning/ROADMAP.md
cat .planning/STATE.md
cat .planning/config.json 2>/dev/null
```

## Step 3: Analyze Roadmap

Parse ROADMAP.md to determine:
- All phases with their status (complete/partial/planned)
- Plan and summary counts per phase
- Current and next phase identification
- Overall progress percentage

```bash
# Count plans and summaries per phase
for dir in .planning/phases/*/; do
  plans=$(ls "$dir"*-PLAN.md 2>/dev/null | wc -l)
  summaries=$(ls "$dir"*-SUMMARY.md 2>/dev/null | wc -l)
  echo "$(basename $dir): $plans plans, $summaries summaries"
done
```

## Step 4: Recent Work

Find the 2-3 most recent SUMMARY.md files:

```bash
ls -t .planning/phases/*/*-SUMMARY.md 2>/dev/null | head -3
```

Read their one-liner descriptions for "what we've been working on."

## Step 5: Current Position

- Identify current phase and plan from STATE.md
- Check for paused work (`.continue-here.md`)
- Count pending todos: `ls .planning/todos/pending/*.md 2>/dev/null | wc -l`
- Check for active debug sessions: `ls .planning/debug/*.md 2>/dev/null | wc -l`

## Step 6: Present Report

```
# [Project Name]

**Progress:** [██████░░░░] XX%

## Recent Work
- [Phase X, Plan Y]: [one-liner from summary]
- [Phase X, Plan Z]: [one-liner from summary]

## Current Position
Phase [N] of [total]: [phase-name]
Plan [M] of [phase-total]: [status]

## Key Decisions Made
- [from STATE.md decisions]

## Blockers/Concerns
- [from STATE.md blockers]

## Pending Todos
- [count] pending — /team:check-todos to review

## Active Debug Sessions
- [count] active — /team:debug to continue
(Only show if count > 0)

## What's Next
[Next phase/plan objective from roadmap]
```

## Step 7: Route to Next Action

Count plans, summaries, and UAT files in current phase:

```bash
PHASE_DIR=".planning/phases/[current-phase-dir]"
ls -1 "$PHASE_DIR"/*-PLAN.md 2>/dev/null | wc -l
ls -1 "$PHASE_DIR"/*-SUMMARY.md 2>/dev/null | wc -l
ls -1 "$PHASE_DIR"/*-UAT.md 2>/dev/null | wc -l
```

**Route A: Unexecuted plan exists** (summaries < plans)
```
## Next Up

**{phase}-{plan}: [Plan Name]** — [objective from PLAN.md]

`/team:execute-phase {phase}`
```

**Route B: Phase needs planning** (plans = 0)

Check for CONTEXT.md. If exists, suggest `/team:plan-phase`. If not, suggest `/team:discuss-phase`.

**Route C: Phase complete, more phases remain**
```
## Phase {Z} Complete

## Next Up

**Phase {Z+1}: {Name}** — {Goal}

`/team:discuss-phase {Z+1}` — gather context
`/team:plan-phase {Z+1}` — plan directly
```

**Route D: Milestone complete**
```
## Milestone Complete

All {N} phases finished!

`/team:complete-milestone`
```

**Route E: UAT gaps need fixes**
```
## UAT Gaps Found

**{phase}-UAT.md** has {N} gaps requiring fixes.

`/team:plan-phase {phase} --gaps`
```

**Route F: Between milestones** (ROADMAP.md missing, PROJECT.md exists)
```
## Milestone Complete

Ready to plan the next milestone.

`/team:new-milestone`
```

</process>
