---
name: team:manager
description: Interactive command center for managing multiple phases from one terminal
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - Task
---

<objective>
Interactive command center providing a dashboard view of all phases, their status,
active agents, and quick-action routing. For users managing multiple phases or
wanting a high-level overview before deciding next actions.
</objective>

<process>

## Step 1: Load Project State

```bash
# Core state
cat .planning/STATE.md 2>/dev/null
cat .planning/ROADMAP.md 2>/dev/null

# Phase summary
node "$HOME/.claude/bin/team-tools.cjs" progress table --raw 2>/dev/null
```

## Step 2: Render Dashboard

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Agent Teams — Project Manager
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Project: {name}  Milestone: {version}
Progress: ████████░░░░ {N}% ({complete}/{total} phases)

PHASES
──────────────────────────────────────────
  ✓  01 — {phase name} (complete)
  ✓  02 — {phase name} (complete)
  ●  03 — {phase name} (in progress)
       Plans: 2/4 complete
  ○  04 — {phase name} (planned)
  ○  05 — {phase name} (not started)

REQUIREMENTS
──────────────────────────────────────────
  Fulfilled: {N}/{total} ({pct}%)

RECENT ACTIVITY
──────────────────────────────────────────
  {git log --oneline -5}

QUICK ACTIONS
──────────────────────────────────────────
  [1] Continue phase 03      → /team:execute-phase 3
  [2] Plan next phase        → /team:plan-phase 4
  [3] Check progress         → /team:progress
  [4] View full stats        → /team:stats
  [5] Ship current work      → /team:ship
  [6] Autonomous mode        → /team:autonomous
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Step 3: Wait for User Action

Ask: "Enter a number for quick action, or describe what you want to do."

Route to the selected command.

</process>
