---
name: team:verify-work
description: Conversational UAT with persistent state and automatic gap diagnosis
argument-hint: "[phase-number]"
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
Validate built features through conversational testing. Creates UAT.md that tracks test progress, survives /clear, and feeds gaps into `/team:plan-phase --gaps`.

User tests, Claude records. One test at a time. Plain text responses.
Show expected, ask if reality matches.
</objective>

<process>

## Step 1: Initialize

```bash
PHASE=$1
PADDED=$(printf "%02d" $PHASE 2>/dev/null || echo "$PHASE")
PHASE_DIR=$(ls -d .planning/phases/$PADDED-* 2>/dev/null | head -1)
```

## Step 2: Check Active Sessions

```bash
find .planning/phases -name "*-UAT.md" -type f 2>/dev/null
```

If active sessions exist and no argument: list them, let user pick to resume.
If argument matches existing session: offer resume or restart.

## Step 3: Extract Tests from SUMMARYs

```bash
ls "$PHASE_DIR"/*-SUMMARY.md 2>/dev/null
```

Parse for user-observable outcomes. Create test list with name and expected behavior.

**Cold-start smoke test:** If SUMMARY modified server/startup files, prepend a cold start test.

## Step 4: Create UAT File

Write to `${PHASE_DIR}/${PADDED}-UAT.md` with frontmatter (status: testing), Current Test section, Tests section (all pending), Summary counts, empty Gaps section.

## Step 5: Present Tests One at a Time

```
CHECKPOINT: Verification Required

**Test {N}: {name}**

{expected behavior}

──────────────────────────────────────────────────────
Type "pass" or describe what's wrong
──────────────────────────────────────────────────────
```

Wait for plain text response.

## Step 6: Process Response

- **Pass indicators:** empty, "yes", "y", "ok", "pass", "next" -> mark passed
- **Skip indicators:** "skip", "can't test", "n/a" -> mark skipped
- **Anything else:** treat as issue description

Infer severity from language:
- crash/error/exception/fails -> blocker
- doesn't work/wrong/missing -> major
- slow/weird/minor -> minor
- color/spacing/alignment -> cosmetic
Default: major

Update Tests section, Summary counts. Append issues to Gaps (YAML format).

Batched writes: on issue, every 5 passes, or completion.

If more tests: update Current Test, present next.
If done: proceed to completion.

## Step 7: Complete Session

Update status to complete. Commit UAT file.

```bash
git add "${PHASE_DIR}/${PADDED}-UAT.md"
git commit -m "test(${PADDED}): complete UAT - {passed} passed, {issues} issues"
```

## Step 8: Handle Issues

**If issues > 0:** Automatically spawn debug teammates (per `/team:debug` pattern) to diagnose root causes. After diagnosis, spawn planner teammate in `--gaps` mode to create fix plans.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 TEAM > FIXES READY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{N} gaps diagnosed, {M} fix plans created.

Next: /team:execute-phase {phase} --gaps-only
```

**If issues == 0:**
```
All tests passed.

- /team:plan-phase {next} — Plan next phase
- /team:execute-phase {next} — Execute next phase
```

</process>

<severity_inference>
Infer severity from natural language. Never ask "how severe is this?" Just infer and move on.
</severity_inference>
