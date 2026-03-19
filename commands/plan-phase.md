---
name: team:plan-phase
description: Create detailed execution plans for a phase using Agent Teams
argument-hint: "[phase] [--research] [--skip-research] [--gaps] [--skip-verify]"
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
  - TodoWrite
  - AskUserQuestion
---

<objective>

Create detailed execution plans (PLAN.md files) for a phase using specialized teammates: researcher, planner, and checker. The planner-checker revision loop uses messaging instead of re-spawning.

This is the Agent Teams version of `/team:plan-phase`. Produces identical PLAN.md artifacts.

**Key advantage:** The planner persists between revision rounds, keeping full context. No need to re-inline everything for each iteration.

**After this command:** Run `/team:execute-phase {phase}` to execute.

</objective>

<process>

## Step 0: Resolve Model Profile

```bash
MODEL_PROFILE=$(cat .planning/config.json 2>/dev/null | grep -o '"model_profile"[[:space:]]*:[[:space:]]*"[^"]*"' | grep -o '"[^"]*"$' | tr -d '"' || echo "balanced")
```

**Model lookup table:**

| Agent | quality | balanced | budget |
|-------|---------|----------|--------|
| team-researcher | opus | sonnet | haiku |
| team-planner | opus | sonnet | sonnet |
| team-plan-checker | sonnet | sonnet | haiku |

Pass `model="{resolved_model}"` when spawning researcher, planner, and checker teammates.

## Step 1: Validate Phase

```bash
PHASE=$1
PADDED_PHASE=$(printf "%02d" $PHASE 2>/dev/null || echo "$PHASE")
PHASE_DIR=$(ls -d .planning/phases/$PADDED_PHASE-* .planning/phases/$PHASE-* 2>/dev/null | head -1)

[ -z "$PHASE_DIR" ] && echo "ERROR: Phase $PHASE not found" && exit 1

# Check for existing plans
ls "$PHASE_DIR"/*-PLAN.md 2>/dev/null

# Check for CONTEXT.md (from discuss before planning)
cat "$PHASE_DIR"/*-CONTEXT.md 2>/dev/null
```

Read project context:
```bash
cat .planning/ROADMAP.md 2>/dev/null
cat .planning/STATE.md 2>/dev/null
cat .planning/REQUIREMENTS.md 2>/dev/null
cat .planning/config.json 2>/dev/null
```

**Check for DESIGN.md (design-first gate):**
```bash
ls "$PHASE_DIR"/*-DESIGN.md 2>/dev/null
```

If NO DESIGN.md exists AND this is NOT `--gaps` mode:
- Display warning:
  ```
  ⚠ No DESIGN.md found for this phase.

  Design-first planning produces better outcomes. Consider running:
    /team:discuss-phase {X}

  This creates a design spec with approach analysis and spec review
  before planning begins.

  Proceed without design? [y/N]
  ```
- Use AskUserQuestion to confirm. If user says no, exit and suggest `/team:discuss-phase`.
- If user says yes, proceed (design is recommended, not hard-blocked, to avoid breaking existing workflows).

If DESIGN.md exists: Pass it to the planner as additional context. The planner MUST honor the selected approach and constraints from the design spec.

**Parse flags:**
- `--research` / `--skip-research`: Force research on/off
- `--gaps`: Gap closure mode (reads VERIFICATION.md for gaps)
- `--skip-verify`: Skip the checker step

**Determine research need:**
- If `--gaps` mode: skip research (gaps are already identified)
- If `--skip-research`: skip
- If `--research`: force research
- Default: research if no RESEARCH.md exists

## Step 2: Display Banner

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 TEAM ► PLANNING PHASE {X}: {NAME}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Mode: {standard | gap_closure}
Research: {yes | skip}
Checker: {yes | skip}
```

## Step 3: Create Team

```
TeamCreate(team_name="phase-{X}-plan", description="Plan phase {X}: {name}")
```

## Step 4: Create Task List

```
# If research enabled:
TaskCreate("Research phase {X} implementation", blocked_by=[])
TaskCreate("Create PLAN.md files for phase {X}", blocked_by=[research_task_id])
TaskCreate("Verify plans achieve phase goal", blocked_by=[planner_task_id])

# If research skipped:
TaskCreate("Create PLAN.md files for phase {X}", blocked_by=[])
TaskCreate("Verify plans achieve phase goal", blocked_by=[planner_task_id])
```

## Step 5: Research (if enabled)

Spawn researcher teammate:

```
Task(team_name="phase-{X}-plan", name="researcher",
     subagent_type="team-researcher",
     prompt="Phase research mode.

**Phase:** {X} - {name}
**Phase goal:** {goal}
**Phase directory:** {phase_dir}

Read your full role instructions from agents/team-researcher.md

Research how to implement this phase well. Write RESEARCH.md to {phase_dir}/.
If CONTEXT.md exists, constrain research to locked decisions.
Claim your task, complete it, and message me with findings.",
     description="Research phase {X}")
```

Wait for researcher to complete. Display key findings.

Then shutdown researcher (no longer needed):
```
SendMessage(type="shutdown_request", recipient="researcher")
```

## Step 6: Planning

Spawn planner teammate:

```
Task(team_name="phase-{X}-plan", name="planner",
     subagent_type="team-planner",
     prompt="Standard planning mode.

**Phase:** {X} - {name}
**Phase directory:** {phase_dir}
**Phase goal:** {goal}

{If DESIGN.md exists:}
**Design spec:** Read {phase_dir}/*-DESIGN.md FIRST. You MUST honor:
- The selected approach (do not deviate to a rejected alternative)
- Constraints and decisions locked in the design
- Success criteria (map these to must_haves)
- Key files and data flow (use as starting point for task file lists)

{If gap closure mode:}
**Mode:** Gap closure. Read {phase_dir}/*-VERIFICATION.md for gaps to address.
Only create plans for unresolved gaps.

Read your full role instructions from agents/team-planner.md

Create PLAN.md files following standard format. Plans must be compatible with both
/team:execute-phase and /team:execute-phase.

Claim your task, complete it, and message me with plan summary.",
     description="Plan phase {X}")
```

Wait for planner to complete. Display plan overview.

## Step 7: Verification (if enabled)

Spawn checker teammate:

```
Task(team_name="phase-{X}-plan", name="checker",
     subagent_type="team-planner",
     prompt="Checker mode.

**Phase:** {X} - {name}
**Phase directory:** {phase_dir}
**Phase goal:** {goal}

Read your full role instructions from agents/team-planner.md
Follow the <checker_mode> section.

Verify all PLAN.md files in {phase_dir}/:
- Requirements coverage
- User decision compliance (CONTEXT.md)
- Wave dependency correctness
- files_modified conflict check
- must_haves derivation quality
- Task specificity

If issues found: message the planner directly with issues.
If all good: message me.

Claim your task and complete it.",
     description="Check phase {X} plans")
```

## Step 8: Handle Revision Loop

If checker finds issues, the planner-checker loop happens via messaging:

1. Checker messages planner with issues
2. Planner revises PLAN.md files on disk
3. Planner messages checker when done
4. Checker re-verifies
5. Repeat up to 3x

The lead monitors this via idle notifications. If loop exceeds 3 rounds, intervene.

When checker passes: continue to Step 9.

## Step 9: Present Results

Read all created PLAN.md files and present:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 TEAM ► PHASE {X} PLANNED ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Plans Created

| Plan | Name | Wave | Tasks | Depends On |
|------|------|------|-------|------------|
| ... | ... | ... | ... | ... |

Total: {N} plans, {T} tasks, {W} waves
```

## Step 10: Cleanup

Shutdown all teammates:
```
SendMessage(type="shutdown_request", recipient="planner")
SendMessage(type="shutdown_request", recipient="checker")
```

Wait for shutdowns, then:
```
TeamDelete()
```

Update STATE.md with planning completion.

Offer next steps:
```
## Next Steps

- `/team:execute-phase {X}` — Execute these plans with Agent Teams

- `discuss before planning {X}` — Discuss before executing (if not done yet)
```

</process>
