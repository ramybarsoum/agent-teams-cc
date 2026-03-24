---
name: team:set-profile
description: Switch model profile for Agent Teams (quality/balanced/budget/inherit)
argument-hint: <profile (quality|balanced|budget|inherit)>
model: haiku
allowed-tools:
  - Bash
  - Read
  - Write
---

<objective>
Switch the model profile used by Agent Teams agents. Writes to `.planning/config.json`.

Profiles:
- **quality** — Opus for all agents (best results, higher cost)
- **balanced** — Sonnet for most, Haiku for checkers (good balance)
- **budget** — Haiku/Sonnet mix (faster, lower cost)
- **inherit** — Use the current session's model for all agents
</objective>

<process>

## Step 1: Validate Input

Parse $ARGUMENTS. If not one of: `quality`, `balanced`, `budget`, `inherit` — show error and valid options.

## Step 2: Update Config

```bash
CONFIG_PATH=".planning/config.json"

if [ -f "$CONFIG_PATH" ]; then
  # Update existing config
  node "$HOME/.claude/bin/team-tools.cjs" config-set-model-profile "$ARGUMENTS" --raw 2>/dev/null || \
  # Fallback: manual update
  node -e "
    const fs = require('fs');
    const cfg = JSON.parse(fs.readFileSync('$CONFIG_PATH', 'utf8'));
    cfg.model_profile = '$ARGUMENTS';
    fs.writeFileSync('$CONFIG_PATH', JSON.stringify(cfg, null, 2));
    console.log('Updated model_profile to: $ARGUMENTS');
  "
else
  echo '{ "model_profile": "$ARGUMENTS" }' > "$CONFIG_PATH"
fi
```

## Step 3: Show Model Mapping

Display the model assignment for this profile:

| Agent | quality | balanced | budget |
|-------|---------|----------|--------|
| team-executor | opus | sonnet | sonnet |
| team-planner | opus | sonnet | sonnet |
| team-researcher | opus | sonnet | haiku |
| team-verifier | sonnet | sonnet | haiku |
| team-plan-checker | sonnet | haiku | haiku |

Report: `Model profile set to: {profile}`

</process>
