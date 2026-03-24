---
name: team:ui-review
description: Retroactive 6-pillar visual audit of implemented frontend code
argument-hint: "[phase]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - Task
  - AskUserQuestion
---

<objective>
Conduct a retroactive 6-pillar visual audit. Produces UI-REVIEW.md with
graded assessment (1-4 per pillar). Works on any project.
Output: {phase_num}-UI-REVIEW.md
</objective>

<context>
Phase: $ARGUMENTS — optional, defaults to last completed phase.
</context>

<process>

## Step 1: Resolve Phase

```bash
INIT=$(node "$HOME/.claude/bin/team-tools.cjs" init phase-op "$ARGUMENTS" 2>/dev/null)
```

If no argument: find last complete phase from ROADMAP.md.

## Step 2: Gather Context Files

Build list of files for auditor:
- Phase SUMMARY.md
- Phase PLAN.md
- Phase CONTEXT.md
- UI-SPEC.md (if exists)

## Step 3: Spawn team-ui-auditor

```
Task(
  prompt=ui_auditor_prompt,
  subagent_type="team-ui-auditor",
  description="UI Audit Phase {phase}"
)
```

Include:
- `<files_to_read>` block with all context files
- Phase directory path
- Whether dev server might be running

## Step 4: Present Results

Show the 6-pillar scorecard and top 3 fixes.

Offer next steps:
1. Create fix tasks (`/team:quick fix {specific issue}`)
2. Update UI-SPEC.md for next phase
3. Done

</process>
