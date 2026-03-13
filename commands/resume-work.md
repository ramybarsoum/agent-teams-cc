---
name: team:resume-work
description: Resume from previous session with full context restoration
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
---

<objective>
Instantly restore full project context so "Where were we?" has an immediate, complete answer. Load state, detect incomplete work, present status, and route to next action.
</objective>

<process>

## Step 1: Initialize

```bash
ls .planning/STATE.md .planning/PROJECT.md .planning/ROADMAP.md 2>/dev/null
```

- If STATE.md exists: proceed to Step 2
- If STATE.md missing but ROADMAP.md/PROJECT.md exists: offer to reconstruct STATE.md
- If no `.planning/` directory: route to `/team:new-project`

## Step 2: Load State

```bash
cat .planning/STATE.md
cat .planning/PROJECT.md
```

From STATE.md extract: project reference, current position, progress, recent decisions, pending todos, blockers, session continuity.

From PROJECT.md extract: what this is, requirements, key decisions, constraints.

## Step 3: Check Incomplete Work

```bash
# Check for continue-here files (mid-plan resumption)
ls .planning/phases/*/.continue-here*.md 2>/dev/null

# Check for plans without summaries (incomplete execution)
for plan in .planning/phases/*/*-PLAN.md; do
  summary="${plan/PLAN/SUMMARY}"
  [ ! -f "$summary" ] && echo "Incomplete: $plan"
done 2>/dev/null
```

Flag findings:
- `.continue-here` file: mid-plan checkpoint
- PLAN without SUMMARY: incomplete execution

## Step 4: Present Status

```
PROJECT STATUS

Building: [one-liner from PROJECT.md]

Phase: [X] of [Y] - [Phase name]
Plan:  [A] of [B] - [Status]
Progress: [██████░░░░] XX%

Last activity: [date] - [what happened]

[If incomplete work found:]
Incomplete work detected:
  - [.continue-here file or incomplete plan]

[If pending todos exist:]
[N] pending todos — /team:check-todos to review

[If blockers exist:]
Carried concerns:
  - [blocker 1]
  - [blocker 2]
```

## Step 5: Determine Next Action

**If .continue-here file exists:**
Primary: Resume from checkpoint
Option: Start fresh on current plan

**If incomplete plan (PLAN without SUMMARY):**
Primary: Complete the incomplete plan
Option: Abandon and move on

**If phase complete, all plans done:**
Primary: Transition to next phase

**If phase ready to plan:**
Check CONTEXT.md. If missing, suggest `/team:discuss-phase`. If exists, suggest `/team:plan-phase`.

**If phase ready to execute:**
Primary: Execute next plan

## Step 6: Offer Options

```
What would you like to do?

1. [Primary action based on state]
2. Review current phase status
3. Check pending todos ([N] pending)
4. Something else
```

Wait for user selection.

## Step 7: Route

Based on selection, show the appropriate command:

- **Execute plan**: `/team:execute-phase {phase}`
- **Plan phase**: `/team:plan-phase {phase}`
- **Check todos**: Read `.planning/todos/pending/`, present summary

## Step 8: Update Session

Update STATE.md session continuity:

```markdown
## Session Continuity

Last session: [now]
Stopped at: Session resumed, proceeding to [action]
```

</process>

<reconstruction>
If STATE.md is missing but other artifacts exist:

1. Read PROJECT.md for "What This Is" and Core Value
2. Read ROADMAP.md for phases and current position
3. Scan *-SUMMARY.md files for decisions, concerns
4. Count pending todos
5. Check for .continue-here files

Reconstruct and write STATE.md, then proceed normally.
</reconstruction>
