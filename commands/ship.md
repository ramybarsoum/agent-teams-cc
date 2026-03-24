---
name: team:ship
description: Create PR, run review, and prepare for merge after verification passes
argument-hint: "[phase number or milestone, e.g., '4' or 'v1.0']"
allowed-tools:
  - Read
  - Bash
  - Grep
  - Glob
  - Write
  - AskUserQuestion
---

<objective>
Bridge local completion → merged PR. After /team:verify-work passes, ship the work:
push branch, create PR with auto-generated body, optionally trigger review, and track the merge.

Closes the plan → execute → verify → ship loop.
</objective>

<process>

## Step 1: Pre-Flight Checks

```bash
# Verify we're on a feature branch (not main/develop)
git branch --show-current

# Check verification passed
ls .planning/phases/*/VERIFICATION.md 2>/dev/null | tail -1 | xargs grep -l "VERIFIED\|PASSED" 2>/dev/null

# Check for uncommitted changes
git status --short
```

If uncommitted changes exist — warn and ask to commit first.
If no verification found — warn and suggest running `/team:verify-phase N` first.

## Step 2: Push Branch

```bash
BRANCH=$(git branch --show-current)
git push -u origin "$BRANCH"
```

## Step 3: Generate PR Body

Read artifacts to auto-generate PR description:
- `.planning/ROADMAP.md` — phase goals
- Latest `SUMMARY.md` — what was implemented
- Latest `VERIFICATION.md` — what was verified
- `REQUIREMENTS.md` — requirements fulfilled

Build PR body:
```markdown
## Summary
{1-3 bullet points from SUMMARY.md}

## Requirements Fulfilled
{list from REQUIREMENTS.md with REQ-IDs}

## Test Plan
{verification steps from VERIFICATION.md}

## Notes
{deviations or important decisions from SUMMARY.md}
```

## Step 4: Create PR

```bash
gh pr create \
  --title "{phase goal or milestone summary}" \
  --body "{generated_body}" \
  --base develop 2>/dev/null || \
gh pr create \
  --title "{phase goal or milestone summary}" \
  --body "{generated_body}" \
  --base main
```

## Step 5: Offer Review

Ask if user wants to:
1. Request AI review (`/team:review --phase N`)
2. Tag reviewers (`gh pr edit --reviewer {user}`)
3. Done — just show PR URL

## Step 6: Track

Show PR URL. Update STATE.md with PR link.

</process>
