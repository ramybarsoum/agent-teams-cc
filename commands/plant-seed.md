---
name: team:plant-seed
description: Capture a forward-looking idea with trigger conditions — surfaces automatically at the right milestone
argument-hint: "[idea summary]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - AskUserQuestion
---

<objective>
Capture an idea that's too big for now but should surface automatically when the right
milestone arrives. Seeds solve context rot: instead of a one-liner in Deferred that nobody
reads, a seed preserves the full WHY, WHEN to surface, and breadcrumbs to details.

Creates: .planning/seeds/SEED-NNN-slug.md
Consumed by: /team:new-milestone (scans seeds and presents matches)
</objective>

<process>

## Step 1: Parse Input

If $ARGUMENTS provided: use as idea summary.
If empty: ask "What's the idea you want to plant for a future milestone?"

## Step 2: Get Trigger Conditions

Ask: "When should this idea surface? (e.g., 'after auth is stable', 'when we start mobile', 'in v2')"

## Step 3: Find Next Seed Number

```bash
LAST=$(ls .planning/seeds/SEED-*.md 2>/dev/null | sort | tail -1 | grep -oP 'SEED-\K\d+')
NEXT=$(printf "%03d" $((${LAST:-0} + 1)))
```

## Step 4: Generate Slug

```bash
SLUG=$(node "$HOME/.claude/bin/team-tools.cjs" generate-slug "$ARGUMENTS" 2>/dev/null || \
echo "$ARGUMENTS" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr -dc 'a-z0-9-' | cut -c1-40)
```

## Step 5: Write Seed File

```bash
mkdir -p .planning/seeds
```

Write to `.planning/seeds/SEED-${NEXT}-${SLUG}.md`:

```markdown
# Seed: {idea summary}

**Created:** {date}
**Status:** DORMANT

## Trigger Condition
{when to surface this idea}

## The Idea
{full description from conversation context}

## Why It Matters
{motivation / problem it solves}

## Breadcrumbs
- *(links, file paths, related issues, prior discussion)*

## When Surfaced
*(filled in when /team:new-milestone picks this up)*
```

## Step 6: Commit

```bash
node "$HOME/.claude/bin/team-tools.cjs" commit "docs: plant seed — ${ARGUMENTS}" \
  --files ".planning/seeds/SEED-${NEXT}-${SLUG}.md" 2>/dev/null || \
git add ".planning/seeds/SEED-${NEXT}-${SLUG}.md" && \
git commit -m "docs: plant seed — ${ARGUMENTS}"
```

## Step 7: Report

```
Seed Planted: SEED-{N}-{slug}
Surfaces when: {trigger condition}

Seeds are reviewed automatically by /team:new-milestone.
```

</process>
