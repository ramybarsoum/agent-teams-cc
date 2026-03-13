---
name: team:validate-phase
description: Audit validation gaps and generate missing tests for a completed phase
argument-hint: "<phase-number>"
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
  - AskUserQuestion
---

<objective>
Audit Nyquist validation gaps for a completed phase. Cross-reference requirements against existing tests, identify gaps, optionally spawn auditor teammate to fill them, and generate/update VALIDATION.md.
</objective>

<process>

## Step 0: Initialize

```bash
PHASE=$1
PADDED=$(printf "%02d" $PHASE 2>/dev/null || echo "$PHASE")
PHASE_DIR=$(ls -d .planning/phases/$PADDED-* 2>/dev/null | head -1)
cat .planning/config.json 2>/dev/null
```

Check `workflow.nyquist_validation`. If false: "Nyquist validation is disabled. Enable via `/team:settings`." Exit.

If no SUMMARY.md files: "Phase not executed. Run `/team:execute-phase` first." Exit.

## Step 1: Detect Input State

- **State A**: VALIDATION.md exists — audit existing
- **State B**: No VALIDATION.md, SUMMARYs exist — reconstruct from artifacts
- **State C**: No SUMMARYs — exit

## Step 2: Discovery

Read PLAN and SUMMARY files. Build requirement-to-task map.

Detect test infrastructure:
```bash
find . -name "pytest.ini" -o -name "jest.config.*" -o -name "vitest.config.*" 2>/dev/null | head -10
find . \( -name "*.test.*" -o -name "*.spec.*" \) -not -path "*/node_modules/*" 2>/dev/null | head -40
```

Cross-reference requirements to existing tests.

## Step 3: Gap Analysis

Classify each requirement: COVERED / PARTIAL / MISSING.

No gaps: skip to Step 5, set `nyquist_compliant: true`.

## Step 4: Present and Fix Gaps

AskUserQuestion: Show gap table, options: Fix all / Skip (mark manual-only) / Cancel.

If "Fix all": spawn auditor teammate:

```
TeamCreate(team_name="validate-${PHASE}", description="Validate phase ${PHASE}")

Task(team_name="validate-${PHASE}", name="auditor",
     subagent_type="team-researcher",
     prompt="Nyquist auditor mode.

Read all PLAN and SUMMARY files in ${PHASE_DIR}.
Fill validation gaps by writing tests.
Never modify implementation files. Max 3 debug iterations.

Gaps: {gap list}
Test infrastructure: {framework, config, commands}

Message lead with results.",
     description="Fill validation gaps for Phase ${PHASE}")
```

Handle return: GAPS FILLED / PARTIAL / ESCALATE.

## Step 5: Generate/Update VALIDATION.md

Write `${PHASE_DIR}/${PADDED}-VALIDATION.md` with frontmatter, test infrastructure table, per-task map, manual-only items, sign-off section.

## Step 6: Commit

```bash
git add [test files]
git commit -m "test(phase-${PHASE}): add Nyquist validation tests"
git add "${PHASE_DIR}/${PADDED}-VALIDATION.md"
git commit -m "docs(phase-${PHASE}): add/update validation strategy"
```

Cleanup teammates if spawned.

## Step 7: Report

```
{if compliant:}
TEAM > PHASE {N} IS NYQUIST-COMPLIANT
All requirements have automated verification.
Next: /team:audit-milestone

{if partial:}
TEAM > PHASE {N} VALIDATED (PARTIAL)
{M} automated, {K} manual-only.
Retry: /team:validate-phase {N}
```

</process>
