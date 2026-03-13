---
name: team:settings
description: Configure Agent Teams workflow toggles and model profiles
allowed-tools:
  - Read
  - Write
  - Bash
  - AskUserQuestion
---

<objective>
Interactive configuration of Agent Teams workflow agents (research, plan_check, verifier) and model profile selection. Updates `.planning/config.json` with user preferences.
</objective>

<process>

## Step 1: Load Current Config

```bash
cat .planning/config.json 2>/dev/null || echo "{}"
```

If config.json doesn't exist, create with defaults.

Parse current values (default to true if not present):
- `workflow.research` — spawn researcher during plan-phase
- `workflow.plan_check` — spawn plan checker during plan-phase
- `workflow.verifier` — spawn verifier during execute-phase
- `workflow.auto_advance` — auto-chain stages
- `model_profile` — quality/balanced/budget
- `git.branching_strategy` — none/phase/milestone

## Step 2: Present Settings

Use AskUserQuestion for each setting:

1. **Model Profile**: Quality (Opus everywhere) / Balanced (Opus plan, Sonnet execute) / Budget (Sonnet write, Haiku verify)
2. **Plan Researcher**: Yes/No
3. **Plan Checker**: Yes/No
4. **Execution Verifier**: Yes/No
5. **Auto-Advance**: No (Recommended) / Yes
6. **Git Branching**: None (Recommended) / Per Phase / Per Milestone

## Step 3: Update Config

Write updated config to `.planning/config.json`:

```json
{
  "model_profile": "balanced",
  "workflow": {
    "research": true,
    "plan_check": true,
    "verifier": true,
    "auto_advance": false
  },
  "git": {
    "branching_strategy": "none"
  }
}
```

## Step 4: Confirm

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 TEAM > SETTINGS UPDATED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

| Setting            | Value |
|--------------------|-------|
| Model Profile      | {value} |
| Plan Researcher    | {On/Off} |
| Plan Checker       | {On/Off} |
| Execution Verifier | {On/Off} |
| Auto-Advance       | {On/Off} |
| Git Branching      | {value} |

These settings apply to future /team:plan-phase and /team:execute-phase runs.

Quick overrides:
- /team:plan-phase --research — force research
- /team:plan-phase --skip-research — skip research
- /team:plan-phase --skip-verify — skip plan check
```

</process>
