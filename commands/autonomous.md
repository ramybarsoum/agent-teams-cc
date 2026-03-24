---
name: team:autonomous
description: Run all remaining phases autonomously — discuss→plan→execute per phase
argument-hint: "[--from N]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
  - Task
---

<objective>
Execute all remaining milestone phases autonomously. For each phase: discuss → plan → execute.
Pauses only for user decisions (grey area acceptance, blockers, validation requests).

Uses ROADMAP.md phase discovery and Skill() invocations for each phase command.
After all phases complete: milestone audit → complete → cleanup.

**Creates/Updates:**
- `.planning/STATE.md` — updated after each phase
- `.planning/ROADMAP.md` — progress updated after each phase
- Phase artifacts — CONTEXT.md, PLANs, SUMMARYs per phase

**After:** Milestone is complete and cleaned up.
</objective>

<context>
Optional flag: `--from N` — start from phase N instead of the first incomplete phase.

Project context, phase list, and state are resolved via team-tools.cjs.
</context>

<process>

## Step 1: Initialize

```bash
INIT=$(node "$HOME/.claude/bin/team-tools.cjs" init milestone-op 2>/dev/null || echo '{}')
```

Read ROADMAP.md and STATE.md to determine current position.

Parse `--from N` flag if present. Otherwise start from first incomplete phase.

## Step 2: Discover Remaining Phases

```bash
node "$HOME/.claude/bin/team-tools.cjs" roadmap analyze --raw
```

Filter to phases with status NOT `complete`. Sort by phase number.

Display phase list to user and ask for confirmation to proceed autonomously.

## Step 3: Phase Loop

For each remaining phase:

### 3a. Discuss Phase
Invoke `/team:discuss-phase {N} --auto` — auto mode skips interactive questions, Claude picks recommended defaults.

### 3b. Plan Phase
Invoke `/team:plan-phase {N}` — spawns team-planner + team-plan-checker.

### 3c. Execute Phase
Invoke `/team:execute-phase {N}` — runs all plans with wave-based parallelization.

### 3d. Verify Phase
Invoke `/team:verify-phase {N}` — team-verifier checks goal achievement.

### 3e. Update Progress
```bash
node "$HOME/.claude/bin/team-tools.cjs" state update phase_complete "{N}"
node "$HOME/.claude/bin/team-tools.cjs" roadmap update-plan-progress
```

### 3f. Check for Blockers
If any phase returns `BLOCKED` or `CHECKPOINT_REQUIRED`:
- Pause the loop
- Present the blocker to the user
- Resume only after user resolves it

## Step 4: Post-Completion

After all phases complete:
1. Run `/team:audit-milestone`
2. Run `/team:complete-milestone`
3. Run `/team:cleanup`

## Step 5: Final Report

Display summary:
- Phases completed
- Plans executed
- Requirements fulfilled
- Time elapsed

</process>

<notes>
- Pauses at checkpoints:human-action (requires user input)
- Auto-accepts checkpoints:human-verify and checkpoints:decision (autonomous mode)
- Any unrecoverable error stops the loop and presents to user
</notes>
