---
name: team:execute-phase
description: Execute all plans in a phase using Agent Teams with dependency-aware parallelization
argument-hint: "<phase-number> [--gaps-only]"
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
  - TodoWrite
  - AskUserQuestion
---

<objective>

Execute all plans in a phase using Agent Teams. One executor teammate per plan, dependency-aware task list for parallelization, automatic verification after execution.

This is the Agent Teams version of `/team:execute-phase`. Uses the same `.planning/` artifacts and PLAN.md format.

**Key advantage:** Dependencies are expressed per-plan (not wave batches), so plan 03 that only depends on plan 01 starts as soon as 01 finishes, without waiting for all wave-1 plans.

</objective>

<process>

## Step 0: Resolve Model Profile

```bash
MODEL_PROFILE=$(cat .planning/config.json 2>/dev/null | grep -o '"model_profile"[[:space:]]*:[[:space:]]*"[^"]*"' | grep -o '"[^"]*"$' | tr -d '"' || echo "balanced")
```

Default to "balanced" if not set.

**Model lookup table:**

| Agent | quality | balanced | budget |
|-------|---------|----------|--------|
| team-executor | opus | sonnet | sonnet |
| team-verifier | sonnet | sonnet | haiku |
| team-task-reviewer | sonnet | haiku | haiku |

Store resolved models for use in Task calls. Pass `model="{resolved_model}"` when spawning executor and verifier teammates.

**Usage:** When spawning an executor, add `model="{executor_model}"` to the Task call. When spawning the verifier, add `model="{verifier_model}"`.

## Step 1: Validate Phase

```bash
# Parse phase number from argument
PHASE=$1
PADDED_PHASE=$(printf "%02d" $PHASE 2>/dev/null || echo "$PHASE")
PHASE_DIR=$(ls -d .planning/phases/$PADDED_PHASE-* .planning/phases/$PHASE-* 2>/dev/null | head -1)

# Verify phase exists
[ -z "$PHASE_DIR" ] && echo "ERROR: Phase $PHASE not found" && exit 1

# Discover plans
ls "$PHASE_DIR"/*-PLAN.md 2>/dev/null
ls "$PHASE_DIR"/*-SUMMARY.md 2>/dev/null
```

Read ROADMAP.md for phase goal:
```bash
cat .planning/ROADMAP.md 2>/dev/null
cat .planning/STATE.md 2>/dev/null
```

Extract phase name and goal from ROADMAP.md.

## Step 2: Check Completions

For each PLAN.md, check if a matching SUMMARY.md exists. Plans with SUMMARYs are already complete.

If `--gaps-only` flag: Only execute plans that address gaps from VERIFICATION.md.

If all plans complete: Skip to verification (Step 8).

## Step 3: Parse Plan Dependencies

For each incomplete plan, read its frontmatter:

```bash
for plan in "$PHASE_DIR"/*-PLAN.md; do
  head -30 "$plan"
done
```

Extract from each plan:
- `plan` number
- `wave` number
- `depends_on` array
- `autonomous` flag
- `files_modified` list

Build dependency map: plan ID to list of plan IDs it depends on.

## Step 3b: Handle Git Branching

Read branching strategy from config:

```bash
BRANCHING_STRATEGY=$(cat .planning/config.json 2>/dev/null | grep -o '"branching_strategy"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/.*:.*"\([^"]*\)"/\1/' || echo "none")
PHASE_BRANCH_TEMPLATE=$(cat .planning/config.json 2>/dev/null | grep -o '"phase_branch_template"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/.*:.*"\([^"]*\)"/\1/' || echo "team/phase-{phase}-{slug}")
MILESTONE_BRANCH_TEMPLATE=$(cat .planning/config.json 2>/dev/null | grep -o '"milestone_branch_template"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/.*:.*"\([^"]*\)"/\1/' || echo "team/{milestone}-{slug}")
```

**If strategy is "none" (default):** Skip branching, continue on current branch.

**If strategy is "phase":** Create/switch to phase-specific branch:

```bash
PHASE_NAME=$(basename "$PHASE_DIR" | sed 's/^[0-9]*-//')
PHASE_SLUG=$(echo "$PHASE_NAME" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-//;s/-$//')
BRANCH_NAME=$(echo "$PHASE_BRANCH_TEMPLATE" | sed "s/{phase}/$PADDED_PHASE/g" | sed "s/{slug}/$PHASE_SLUG/g")
git checkout -b "$BRANCH_NAME" 2>/dev/null || git checkout "$BRANCH_NAME"
```

**If strategy is "milestone":** Create/switch to milestone-level branch:

```bash
MILESTONE_VERSION=$(grep -oE 'v[0-9]+\.[0-9]+' .planning/ROADMAP.md | head -1 || echo "v1.0")
MILESTONE_SLUG=$(grep -A1 "## .*$MILESTONE_VERSION" .planning/ROADMAP.md | tail -1 | sed 's/.*- //' | cut -d'(' -f1 | tr -d ' ' | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' || echo "milestone")
BRANCH_NAME=$(echo "$MILESTONE_BRANCH_TEMPLATE" | sed "s/{milestone}/$MILESTONE_VERSION/g" | sed "s/{slug}/$MILESTONE_SLUG/g")
git checkout -b "$BRANCH_NAME" 2>/dev/null || git checkout "$BRANCH_NAME"
```

Display branching status:
```
Branching: {strategy} → {branch_name}
```

**Note:** All subsequent commits go to this branch. User handles merging based on their workflow.

## Step 4: Create Team

Display banner:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 TEAM ► EXECUTING PHASE {X}: {NAME}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

◆ Creating execution team...
```

```
TeamCreate(team_name="phase-{X}-exec", description="Execute phase {X}: {name}")
```

## Step 5: Create Shared Task List

For each incomplete plan, create a task. Map `depends_on` to `blocked_by`:

```
# Wave 1 plans (no dependencies)
TaskCreate("Execute {phase}-01: {plan_name}", blocked_by=[])
TaskCreate("Execute {phase}-02: {plan_name}", blocked_by=[])

# Wave 2+ plans (depends on specific plans)
TaskCreate("Execute {phase}-03: {plan_name}", blocked_by=[task_id_of_01, task_id_of_02])

# Verification task (depends on ALL execution tasks)
TaskCreate("Verify phase goal achievement", blocked_by=[all_execution_task_ids])
```

Display task list:
```
## Execution Plan

| Task | Plan | Wave | Depends On | Status |
|------|------|------|------------|--------|
| 1 | {phase}-01: [name] | 1 | - | pending |
| 2 | {phase}-02: [name] | 1 | - | pending |
| 3 | {phase}-03: [name] | 2 | 1, 2 | blocked |
| 4 | Verify phase | - | 1, 2, 3 | blocked |
```

## Step 6: Spawn Executor Teammates

For each incomplete plan, spawn an executor:

```
Task(team_name="phase-{X}-exec", name="exec-{plan_num}",
     subagent_type="team-executor",
     prompt="You are an executor teammate.

**Your assigned plan:** {plan_path}
**Phase:** {phase_number} - {phase_name}
**Phase goal:** {phase_goal}
**Summary path:** {phase_dir}/{phase}-{plan}-SUMMARY.md

Read your full role instructions from agents/team-executor.md

Instructions:
1. Read your plan file at the path above
2. Read .planning/STATE.md for project context
3. Claim your task from the team task list
4. Execute each task with atomic commits
5. Create SUMMARY.md when done
6. Message lead with completion status and STATE.md updates
7. Mark your team task as completed

Follow ALL coding standards from CLAUDE.md (auto-loaded).
If you hit a checkpoint: message the lead and wait for response.",
     description="Execute plan {phase}-{plan_num}")
```

Display:
```
◆ Spawned {N} executor teammates:
  → exec-01 ({phase}-01: [name]) [Wave 1]
  → exec-02 ({phase}-02: [name]) [Wave 1]
  → exec-03 ({phase}-03: [name]) [Wave 2, depends on 01, 02]
```

## Step 7: Monitor and Coordinate

**Lead responsibilities during execution:**

1. **Receive completion messages:** As each executor finishes, acknowledge and track progress
2. **Handle checkpoints:** When an executor sends a checkpoint message:
   - Present checkpoint details to the user
   - Get user response
   - Send response back to the executor: `SendMessage(recipient="exec-{N}", content="[user response]")`
3. **Handle architectural decisions:** When an executor reports a Rule 4 deviation:
   - Present to user with options
   - Send decision back
4. **Aggregate STATE.md updates:** Collect state updates from all executors, apply them to STATE.md
5. **Track progress:** Update display as tasks complete

**Do NOT implement anything yourself.** Pure coordination.

## Step 8: Post-Execution Verification

When all execution tasks complete, the verification task unblocks.

Spawn a verifier teammate:

```
Task(team_name="phase-{X}-exec", name="verifier",
     subagent_type="team-verifier",
     prompt="Verify Phase {X}: {name}

**Phase directory:** {phase_dir}
**Phase goal:** {phase_goal}

Read your full role instructions from agents/team-verifier.md

Instructions:
1. Verify phase goal achievement using goal-backward analysis
2. Check all must-haves (truths, artifacts, key links)
3. Verify CLAUDE.md coding standards compliance
4. Create VERIFICATION.md
5. Message lead with results
6. Mark your team task as completed",
     description="Verify phase {X}")
```

## Step 9: Handle Verification Result

When verifier messages back:

**If passed:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 TEAM ► PHASE {X} COMPLETE ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Score: {N}/{M} must-haves verified
```

Update ROADMAP.md (mark phase complete, add completion date), STATE.md (update position), REQUIREMENTS.md (check off requirements).

Evolve PROJECT.md if it exists:
- Move validated requirements from Active to Validated
- Add emerged requirements to Active
- Log key decisions from phase SUMMARY files
- Update "Last updated" footer

**If gaps_found:**
Present gaps to user. Offer:
```
## Gaps Found

**Score:** {N}/{M} must-haves verified
**Report:** {phase_dir}/{phase}-VERIFICATION.md

### What's Missing

{Extract gap summaries from VERIFICATION.md gaps section}

---

## Next Up

**Plan gap closure** — create additional plans to complete the phase

`/team:plan-phase {X} --gaps`

<sub>`/clear` first for fresh context window</sub>

---

**Also available:**
- `cat {phase_dir}/{phase}-VERIFICATION.md` — see full report
- `/team:verify-work {X}` — manual testing before planning
```

**If human_needed:**
Present human verification items. Ask user to test and confirm.

## Step 10: Cleanup

Shutdown all teammates:
```
SendMessage(type="shutdown_request", recipient="exec-01")
SendMessage(type="shutdown_request", recipient="exec-02")
... (all executors)
SendMessage(type="shutdown_request", recipient="verifier")
```

Wait for shutdowns, then:
```
TeamDelete()
```

Commit all planning artifacts:
```bash
git add .planning/STATE.md .planning/ROADMAP.md
git add "$PHASE_DIR"/*-VERIFICATION.md
git add .planning/REQUIREMENTS.md 2>/dev/null
git commit -m "docs({phase}): phase {X} execution complete

Status: {passed/gaps_found/human_needed}
Score: {N}/{M}
Plans executed: {count}
"
```

## Step 11: Smart Next-Step Routing

**MANDATORY: Check milestone status before presenting next steps.**

**Step 11a: Determine milestone position**

```bash
# Count total phases in current milestone
grep -c "Phase [0-9]" .planning/ROADMAP.md 2>/dev/null
# Get highest phase number
grep -oE "Phase ([0-9]+)" .planning/ROADMAP.md | tail -1
# Check which phases are complete
grep -E "\[x\].*Phase" .planning/ROADMAP.md 2>/dev/null
```

State: "Current phase is {X}. Milestone has {N} phases (highest: {Y})."

**Step 11b: Route based on milestone status**

| Condition | Meaning | Action |
|-----------|---------|--------|
| current phase < highest phase | More phases remain | Route A |
| current phase = highest phase | Milestone complete | Route B |

---

**Route A: More phases remain in milestone**

Read ROADMAP.md to get the next phase's name and goal.

```
## Phase {X} Complete

---

## Next Up

**Phase {X+1}: {Name}** — {Goal from ROADMAP.md}

`/team:plan-phase {X+1}`

<sub>`/clear` first for fresh context window</sub>

---

**Also available:**
- `/team:discuss-phase {X+1}` — gather context and create design spec first
- `/team:verify-work {X}` — manual testing before moving on
- `/team:progress` — review overall project status

---
```

---

**Route B: Milestone complete (all phases done)**

```
## Phase {X}: {Phase Name} Complete

MILESTONE COMPLETE — all {N} phases finished!

---

## Next Up

**Complete Milestone** — archive and prepare for next

`/team:complete-milestone`

<sub>`/clear` first for fresh context window</sub>

---

**Also available:**
- `/team:audit-milestone` — audit completion before archiving
- Review accomplishments before archiving

---
```

---

**Route C: Gaps found (no next-step routing — already handled in Step 9)**

If verification status was `gaps_found`, Step 9 already presented gap closure instructions. Do NOT present Route A or B.

</process>

<file_ownership>
**CRITICAL: Only the lead writes to STATE.md.**

Executors send their STATE.md updates via message. The lead aggregates and applies them after all executors complete. This prevents concurrent write conflicts.

**Executors own:** Their plan's `files_modified` + their SUMMARY.md
**Verifier owns:** VERIFICATION.md
**Lead owns:** STATE.md, ROADMAP.md, REQUIREMENTS.md
</file_ownership>
