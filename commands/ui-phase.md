---
name: team:ui-phase
description: Generate UI design contract (UI-SPEC.md) for frontend phases
argument-hint: "[phase]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - Task
  - WebFetch
  - AskUserQuestion
  - mcp__context7__*
---

<objective>
Create a UI design contract (UI-SPEC.md) for a frontend phase.
Orchestrates team-ui-researcher and team-ui-checker.
Flow: Validate → Research UI → Verify UI-SPEC → Done
</objective>

<context>
Phase number: $ARGUMENTS — optional, auto-detects next unplanned phase if omitted.
</context>

<process>

## Step 1: Resolve Phase

```bash
INIT=$(node "$HOME/.claude/bin/team-tools.cjs" init phase-op "$ARGUMENTS" 2>/dev/null || echo '{}')
```

Extract phase_dir, phase_number, phase_name.

## Step 2: Check Existing UI-SPEC

```bash
ls ".planning/phases/${PHASE}-*/${PHASE}-UI-SPEC.md" 2>/dev/null
```

If exists and status is `approved`: offer to re-generate.

## Step 3: Spawn team-ui-researcher

Spawn with full context:
- REQUIREMENTS.md
- CONTEXT.md (if exists)
- RESEARCH.md (if exists)
- Current design system state

```
Task(
  prompt=ui_researcher_prompt,
  subagent_type="team-ui-researcher",
  description="UI Research Phase {phase}"
)
```

## Step 4: Spawn team-ui-checker

After researcher writes UI-SPEC.md, validate it:

```
Task(
  prompt=ui_checker_prompt,
  subagent_type="team-ui-checker",
  description="UI Check Phase {phase}"
)
```

## Step 5: Handle Results

**APPROVED:**
- Report approval
- Suggest running `/team:plan-phase {N}` next

**BLOCKED:**
- Show blocking issues
- Ask researcher to revise
- Re-run checker (max 3 rounds)

## Step 6: Commit

```bash
node "$HOME/.claude/bin/team-tools.cjs" commit "docs(phase-{N}): UI design contract" \
  --files ".planning/phases/${PHASE}-*/${PHASE}-UI-SPEC.md"
```

</process>
