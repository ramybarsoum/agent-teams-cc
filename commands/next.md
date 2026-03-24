---
name: team:next
description: Automatically advance to the next logical step in the Agent Teams workflow
allowed-tools:
  - Read
  - Bash
  - Grep
  - Glob
---

<objective>
Detect the current project state and automatically invoke the next logical Agent Teams workflow step.
No arguments needed — reads STATE.md, ROADMAP.md, and phase directories to determine what comes next.

Designed for rapid workflows where remembering which phase/step you're on is overhead.
</objective>

<process>

## Step 1: Read Project State

```bash
cat .planning/STATE.md 2>/dev/null
cat .planning/ROADMAP.md 2>/dev/null | head -60
```

```bash
node "$HOME/.claude/bin/team-tools.cjs" state load --raw 2>/dev/null
```

## Step 2: Determine Current Position

Parse state to identify:
- `current_phase` — which phase is in progress
- `current_plan` — which plan within the phase
- `phase_status` — `not_started`, `in_discussion`, `planned`, `in_execution`, `verifying`, `complete`

## Step 3: Route to Next Step

| Current State | Next Action |
|---------------|-------------|
| No project initialized | `/team:new-project` |
| Project exists, no roadmap | `/team:new-milestone` |
| Phase not discussed | `/team:discuss-phase N` |
| Discussed, no plan | `/team:plan-phase N` |
| Planned, not executed | `/team:execute-phase N` |
| Executed, not verified | `/team:verify-phase N` |
| Phase complete, more phases | Next phase → `/team:discuss-phase N+1` |
| All phases complete | `/team:audit-milestone` |
| Audit done | `/team:complete-milestone` |

## Step 4: Confirm and Execute

Show:
```
Current state: {state}
Next step: /team:{command} {args}

Proceeding...
```

Invoke the command.

</process>
