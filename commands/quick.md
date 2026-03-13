---
name: team:quick
description: Ad-hoc task with framework guarantees (atomic commits, state tracking)
argument-hint: "[description] [--discuss] [--full]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - Task
  - TeamCreate
  - TeamDelete
  - SendMessage
  - AskUserQuestion
---

<objective>
Execute small, ad-hoc tasks with Agent Teams guarantees (atomic commits, STATE.md tracking). Quick mode spawns a planner teammate + executor teammate, tracks tasks in `.planning/quick/`, and updates STATE.md.

Flags:
- `--discuss`: Lightweight discussion phase before planning
- `--full`: Enables plan-checking and post-execution verification
- Composable: `--discuss --full` gives all three
</objective>

<process>

## Step 1: Parse Arguments

Parse for `--full`, `--discuss` flags. Remaining text is the task description.

If no description, ask user: "What do you want to do?"

Display banner:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 TEAM > QUICK TASK {flags}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Step 2: Validate

```bash
ls .planning/ROADMAP.md 2>/dev/null
```

Quick mode requires an active project with ROADMAP.md. If missing: "Run `/team:new-project` first."

## Step 3: Create Task Directory

```bash
# Find next number
NEXT_NUM=$(printf "%03d" $(($(ls -d .planning/quick/*/ 2>/dev/null | wc -l) + 1)))
SLUG=$(echo "$DESCRIPTION" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | head -c 40)
QUICK_DIR=".planning/quick/${NEXT_NUM}-${SLUG}"
mkdir -p "$QUICK_DIR"
```

## Step 4: Discussion (only with --discuss)

Skip if not `--discuss`.

Identify 2-4 gray areas. Use AskUserQuestion (multiSelect) to let user pick which to discuss.

For each selected area, ask 1-2 focused questions via AskUserQuestion.

Write `${QUICK_DIR}/${NEXT_NUM}-CONTEXT.md` with decisions captured.

## Step 5: Create Team and Plan

```
TeamCreate(team_name="quick-${NEXT_NUM}", description="Quick task: ${DESCRIPTION}")
```

Spawn planner teammate:

```
Task(team_name="quick-${NEXT_NUM}", name="planner",
     subagent_type="team-planner",
     prompt="Quick planning mode.

**Directory:** ${QUICK_DIR}
**Description:** ${DESCRIPTION}

Read your full role instructions from agents/team-planner.md

Create a SINGLE plan with 1-3 focused tasks.
Write to: ${QUICK_DIR}/${NEXT_NUM}-PLAN.md
Message lead when done.",
     description="Plan quick task")
```

Wait for planner to complete. Verify plan exists.

## Step 5.5: Plan Check (only with --full)

Skip if not `--full`.

Spawn checker teammate to verify plan. Max 2 revision iterations between planner and checker via messaging.

## Step 6: Execute

Spawn executor teammate:

```
Task(team_name="quick-${NEXT_NUM}", name="executor",
     subagent_type="team-executor",
     prompt="Execute quick task.

**Plan:** ${QUICK_DIR}/${NEXT_NUM}-PLAN.md
Read .planning/STATE.md for project context.
Read CLAUDE.md for project instructions.

Execute all tasks. Commit each atomically.
Create summary at: ${QUICK_DIR}/${NEXT_NUM}-SUMMARY.md
Message lead when done.",
     description="Execute: ${DESCRIPTION}")
```

Wait for executor to complete. Verify summary exists.

## Step 6.5: Verification (only with --full)

Spawn verifier teammate:

```
Task(team_name="quick-${NEXT_NUM}", name="verifier",
     subagent_type="team-verifier",
     prompt="Verify quick task goal achievement.
Task directory: ${QUICK_DIR}
Task goal: ${DESCRIPTION}
Create VERIFICATION.md at ${QUICK_DIR}/${NEXT_NUM}-VERIFICATION.md
Message lead with results.",
     description="Verify: ${DESCRIPTION}")
```

## Step 7: Update STATE.md

Add row to "Quick Tasks Completed" table in STATE.md. Update "Last activity" line.

## Step 8: Cleanup and Commit

Shutdown all teammates. TeamDelete.

```bash
git add "${QUICK_DIR}/" .planning/STATE.md
git commit -m "docs(quick-${NEXT_NUM}): ${DESCRIPTION}"
```

Display completion:
```
TEAM > QUICK TASK COMPLETE

Quick Task ${NEXT_NUM}: ${DESCRIPTION}
Summary: ${QUICK_DIR}/${NEXT_NUM}-SUMMARY.md
Commit: $(git rev-parse --short HEAD)

Ready for next task: /team:quick
```

</process>
