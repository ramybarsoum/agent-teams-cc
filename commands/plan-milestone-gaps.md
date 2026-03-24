---
name: team:plan-milestone-gaps
description: Create phases to close all gaps identified by milestone audit
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
---

<objective>
Create all phases necessary to close gaps identified by `/team:audit-milestone`.

Reads MILESTONE-AUDIT.md, groups gaps into logical phases, creates phase entries
in ROADMAP.md, and offers to plan each phase.

One command creates all fix phases — no manual `/team:add-phase` per gap.
</objective>

<context>
**Audit results:**
```bash
ls .planning/*-MILESTONE-AUDIT.md 2>/dev/null | sort -r | head -1
```
Use most recent audit file.
</context>

<process>

## Step 1: Load Audit Results

```bash
AUDIT_FILE=$(ls .planning/*-MILESTONE-AUDIT.md 2>/dev/null | sort -r | head -1)
cat "$AUDIT_FILE"
```

If no audit file: error — run `/team:audit-milestone` first.

## Step 2: Extract Gaps

Parse audit for gaps:
- FAILED verification items
- Missing requirements (not covered by any phase)
- Integration gaps (cross-phase wiring issues)
- UAT items blocked/pending

## Step 3: Group Into Logical Phases

Group related gaps that can be fixed together:
- Auth/security gaps → one fix phase
- UI gaps → one fix phase
- Data model gaps → one fix phase
- Integration gaps → one fix phase

## Step 4: Present Groupings to User

Show proposed fix phases:
```
Proposed gap-closure phases:

Phase X.1: Fix auth verification gaps (3 items)
Phase X.2: Resolve missing UI states (5 items)
Phase X.3: Close integration wiring (2 items)

Proceed with all? Or adjust groupings?
```

## Step 5: Create Phase Entries

For each approved gap phase:
```bash
node "$HOME/.claude/bin/team-tools.cjs" phase add "{gap_phase_name}" --raw 2>/dev/null
```

Add to ROADMAP.md under a `## Gap Closure` section.

## Step 6: Commit

```bash
node "$HOME/.claude/bin/team-tools.cjs" commit "docs: gap closure phases from milestone audit" \
  --files .planning/ROADMAP.md 2>/dev/null
```

## Step 7: Report and Route

Show created phases. Offer:
1. Plan the first gap phase now (`/team:plan-phase X.1`)
2. Run autonomously (`/team:autonomous --from X.1`)
3. Review manually first

</process>
