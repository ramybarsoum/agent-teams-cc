---
name: team:stats
description: Display project statistics — phases, plans, requirements, git metrics, and timeline
allowed-tools:
  - Read
  - Bash
---

<objective>
Display comprehensive project statistics including phase progress, plan execution metrics,
requirements completion, git history stats, and project timeline.
</objective>

<process>

## Step 1: Gather Data

```bash
# Phase stats
node "$HOME/.claude/bin/team-tools.cjs" progress json --raw 2>/dev/null

# Git stats
git log --oneline | wc -l
git log --oneline --since="30 days ago" | wc -l
git shortlog -sn --since="30 days ago"

# File counts
find .planning/phases -name "*.md" | wc -l
find .planning/phases -name "*-SUMMARY.md" | wc -l
find .planning/phases -name "*-VERIFICATION.md" | wc -l

# Requirements
grep -c "^\- \[x\]" .planning/REQUIREMENTS.md 2>/dev/null || echo 0
grep -c "^\- \[ \]" .planning/REQUIREMENTS.md 2>/dev/null || echo 0
```

## Step 2: Parse and Calculate

From the data, compute:
- **Phases:** total / complete / in-progress / not-started
- **Plans:** total executed / total planned
- **Requirements:** complete / total (% completion)
- **Git:** total commits / commits this week / avg commits per phase
- **Timeline:** project start date (first commit) / elapsed days

## Step 3: Display Stats

```
## Project Statistics

### Phases
Total: N | Complete: N | In Progress: N | Remaining: N
Progress: ████████░░░░ 66%

### Plans
Executed: N / N total plans

### Requirements
Complete: N / N (XX%)
████████████░░░░░░░ XX%

### Git Activity
Total commits: N
This week: N
Contributors: N

### Timeline
Project started: {date}
Days elapsed: N
Avg commits/phase: N

### Artifacts
PLAN.md files: N
SUMMARY.md files: N
VERIFICATION.md files: N
```

</process>
