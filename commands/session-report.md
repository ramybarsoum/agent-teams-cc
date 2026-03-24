---
name: team:session-report
description: Generate a session report with token usage estimates, work summary, and outcomes
allowed-tools:
  - Read
  - Bash
  - Write
---

<objective>
Generate a structured SESSION_REPORT.md document capturing session outcomes, work performed, and estimated resource usage. Provides a shareable artifact for post-session review.
</objective>

<process>

## Step 1: Gather Session Data

```bash
# Recent git commits from this session (last few hours)
git log --oneline --since="8 hours ago" --format="%h %ai %s"

# Current state
cat .planning/STATE.md 2>/dev/null

# Phase progress
node "$HOME/.claude/bin/team-tools.cjs" progress json --raw 2>/dev/null
```

## Step 2: Analyze Work Done

From the data, identify:
- Phases started/completed
- Plans executed
- Requirements marked complete
- Files changed (git diff --stat since first commit today)
- Decisions made (from CONTEXT.md files)
- Blockers encountered

## Step 3: Estimate Token Usage

Rough estimate based on work volume:
- Per plan execution: ~50-150k tokens
- Per discuss-phase: ~20-40k tokens
- Per verify-phase: ~30-60k tokens
- Research phases: ~60-120k tokens

Total = sum of operations × average

## Step 4: Write Report

```bash
mkdir -p .planning/reports
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
```

Write to `.planning/reports/SESSION_REPORT-${TIMESTAMP}.md`:

```markdown
# Session Report — {date}

## Summary
{1-2 sentence overview of what was accomplished}

## Work Completed
### Phases
{list with status}

### Plans Executed
{list}

### Requirements Fulfilled
{list with REQ-IDs}

## Key Decisions
{decisions from CONTEXT.md files}

## Estimated Token Usage
{breakdown by operation type}
Total: ~{N}k tokens

## Next Steps
{what comes next per STATE.md}

## Commits
{git log output}
```

## Step 5: Present and Offer

Show report inline. Offer to push to remote or share.

</process>
