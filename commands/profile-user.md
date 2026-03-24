---
name: team:profile-user
description: Generate developer behavioral profile and create Claude-discoverable artifacts
argument-hint: "[--questionnaire] [--refresh]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
  - Task
---

<objective>
Generate a developer behavioral profile from session analysis (or questionnaire) and produce
artifacts (USER-PROFILE.md) that personalize Claude's responses.

Routes to a profiling flow: consent gate, session analysis or questionnaire fallback,
profile generation, result display, and artifact selection.
</objective>

<context>
Flags from $ARGUMENTS:
- `--questionnaire` -- Skip session analysis entirely, use questionnaire-only path
- `--refresh` -- Rebuild profile even when one exists, backup old profile
</context>

<process>

## Step 1: Check Existing Profile

```bash
ls .planning/USER-PROFILE.md 2>/dev/null || echo "none"
```

If profile exists and `--refresh` not set:
- Show profile summary
- Offer: 1) Refresh, 2) View full, 3) Exit

## Step 2: Consent Gate

Ask user:
```
I'll analyze your session messages to understand your development style.
This helps me tailor responses to how you prefer to work.

No code or secrets are included — only your text messages.
Proceed? [Y/n]
```

If N → Route to questionnaire path.

## Step 3a: Session Analysis Path (default)

```bash
# Find recent session files
find "$HOME/.claude/projects" -name "*.jsonl" 2>/dev/null | head -20
```

Spawn `team-user-profiler` agent with extracted messages.

## Step 3b: Questionnaire Path (--questionnaire or consent denied)

Ask 8 targeted questions covering:
1. Communication style preference (verbose vs terse)
2. Code style (defensive vs minimal)
3. Error handling approach
4. Testing preference
5. Documentation style
6. Review feedback preference
7. Decision-making style
8. Tech stack preferences

## Step 4: Write Profile

Write `.planning/USER-PROFILE.md` with behavioral profile and Claude instructions.

## Step 5: Present Report Card

Show profile summary with dimension scores and confidence levels.
Ask if user wants to adjust any dimensions.

</process>
