---
name: team:add-tests
description: Generate unit and E2E tests for a completed phase
argument-hint: "<phase-number> [additional instructions]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
---

<objective>
Generate tests for a completed phase based on its SUMMARY.md and implementation. Classifies changed files into TDD (unit), E2E (browser), or Skip categories, presents a test plan for approval, then generates tests.
</objective>

<process>

## Step 1: Parse Arguments

Phase number required. Optional additional instructions after phase number.

If missing: "Usage: `/team:add-tests <phase> [instructions]`" Exit.

## Step 2: Load Phase Artifacts

```bash
PHASE=$1
PADDED=$(printf "%02d" $PHASE 2>/dev/null || echo "$PHASE")
PHASE_DIR=$(ls -d .planning/phases/$PADDED-* 2>/dev/null | head -1)
ls "$PHASE_DIR"/*-SUMMARY.md 2>/dev/null
ls "$PHASE_DIR"/*-CONTEXT.md 2>/dev/null
ls "$PHASE_DIR"/*-VERIFICATION.md 2>/dev/null
```

If no SUMMARY.md: "Run `/team:execute-phase` first." Exit.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 TEAM > ADD TESTS — Phase ${PHASE}: ${NAME}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Step 3: Classify Files

Extract files from SUMMARY.md. Read each file to classify:

| Category | Criteria | Test Type |
|---|---|---|
| **TDD** | Pure functions, business logic, validators, parsers | Unit tests |
| **E2E** | UI behavior, forms, navigation, keyboard shortcuts | Browser tests |
| **Skip** | CSS, config, migrations, type definitions, glue code | None |

## Step 4: Present Classification

AskUserQuestion: Show classification table, options: Approve / Adjust / Cancel.

## Step 5: Discover Test Structure

```bash
find . -type d -name "*test*" -o -name "*spec*" 2>/dev/null | head -20
find . -type f \( -name "*.test.*" -o -name "*.spec.*" \) 2>/dev/null | head -20
ls package.json *.sln 2>/dev/null
```

Identify test directories, naming conventions, test runners.

## Step 6: Generate and Run Tests

**TDD tests**: Create with arrange/act/assert. Run. Flag assertion failures as potential bugs (do NOT fix implementation).

**E2E tests**: Create targeting user scenarios. Run. Flag failures.

**No-skip rule:** Never mark success without running the test.

## Step 7: Commit and Report

```bash
git add [test files]
git commit -m "test(phase-${PHASE}): add unit and E2E tests"
```

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 TEAM > TEST GENERATION COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

| Category | Generated | Passing | Failing | Blocked |
|----------|-----------|---------|---------|---------|
| Unit     | {N}       | {n1}    | {n2}    | {n3}    |
| E2E      | {M}       | {m1}    | {m2}    | {m3}    |

## Next Up
{if bugs: `/team:quick fix the {N} test failures`}
{if all pass: Phase ${PHASE} fully tested.}

- `/team:add-tests {next}` — test another phase
- `/team:verify-work {PHASE}` — run UAT verification
```

</process>
