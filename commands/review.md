---
name: team:review
description: Request cross-AI peer review of phase plans from external AI CLIs
argument-hint: "--phase N [--gemini] [--claude] [--codex] [--all]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
---

<objective>
Invoke external AI CLIs (Gemini, Claude, Codex) to independently review phase plans.
Produces a structured REVIEWS.md with per-reviewer feedback that can be fed back into
planning via /team:plan-phase --reviews.

**Flow:** Detect CLIs → Build review prompt → Invoke each CLI → Collect responses → Write REVIEWS.md
</objective>

<context>
Phase number: extracted from $ARGUMENTS (required)

**Flags:**
- `--gemini` — Include Gemini CLI review
- `--claude` — Include Claude CLI review (uses separate session)
- `--codex` — Include Codex CLI review
- `--all` — Include all available CLIs
</context>

<process>

## Step 1: Detect Available CLIs

```bash
which gemini 2>/dev/null && echo "gemini: available" || echo "gemini: not found"
which claude 2>/dev/null && echo "claude: available" || echo "claude: not found"
which codex 2>/dev/null && echo "codex: available" || echo "codex: not found"
```

## Step 2: Read Phase Plan

```bash
cat ".planning/phases/${PHASE}-*/PLAN.md" 2>/dev/null
cat ".planning/phases/${PHASE}-*/CONTEXT.md" 2>/dev/null
```

## Step 3: Build Review Prompt

Create focused review prompt:
```
Review this implementation plan for Phase {N}: {name}

Goal: {phase_goal}

Plan:
{plan content}

Provide:
1. Risk assessment (what could go wrong)
2. Missing considerations (what's not covered)
3. Recommended changes (specific, actionable)
4. Overall assessment (APPROVED / NEEDS_WORK / BLOCKED)
```

## Step 4: Invoke Each CLI

For each available CLI that was requested:
```bash
echo "$REVIEW_PROMPT" | gemini --model gemini-2.0-flash 2>/dev/null
echo "$REVIEW_PROMPT" | claude --model claude-3-5-sonnet 2>/dev/null
echo "$REVIEW_PROMPT" | codex 2>/dev/null
```

## Step 5: Write REVIEWS.md

Write to `.planning/phases/${PHASE}-{slug}/REVIEWS.md`:
```markdown
# Phase {N} — Plan Reviews

## Reviewer: Gemini
{response}

## Reviewer: Claude
{response}

## Reviewer: Codex
{response}

## Consensus
{summary of common findings}
```

</process>
