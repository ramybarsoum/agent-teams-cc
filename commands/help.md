---
name: team:help
description: Show available Agent Teams commands and usage guide
allowed-tools: []
---

<objective>
Display help for all `/team:*` commands.
</objective>

<process>

Display the following:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 AGENT TEAMS ► HELP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Agent Teams commands use Claude Code Agent Teams for
parallel execution. Each teammate auto-loads CLAUDE.md,
MCP servers, and skills.

⚠️  Agent Teams is EXPERIMENTAL (Feb 2026).
    

## Commands

/team:new-project       Initialize project with team research
/team:map-codebase      Map codebase with 4 parallel mappers
/team:plan-phase <N>    Plan phase with researcher + planner + checker
/team:execute-phase <N> Execute phase with parallel executor teammates
/team:verify-phase <N>  Verify phase goal with team verifier
/team:help              This help screen

## vs subagent Commands

| Feature             | /subagent          | /team:*              |
|---------------------|-----------------|----------------------|
| CLAUDE.md           | Manual inline   | Auto-loaded          |
| Parallelism         | Wave batches    | Dependency graph     |
| MCP/Skills          | Not available   | Full access          |
| Checkpoints         | Re-spawn agent  | Message + continue   |
| Plan revisions      | Re-spawn loop   | Persistent messaging |
| Stability           | Stable          | Experimental         |

## Cross-Compatibility

Both systems use identical .planning/ artifacts:
- PLAN.md format is the same
- STATE.md, ROADMAP.md, REQUIREMENTS.md shared
- You can mix: /team:plan-phase then /team:execute-phase

## Requirements

- Claude Code 1.0.34+
- CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 in settings.json
- tmux or iTerm2 for split-pane display (optional)

## Display Modes

Default: in-process (Shift+Up/Down to navigate teammates)
Split:   --teammate-mode tmux (each teammate in own pane)

## Tips

- Start with /team:map-codebase to test the setup
- Use delegate mode (Shift+Tab) to keep lead coordination-only
- Shift+Up/Down to talk to teammates directly
- Ctrl+T to toggle the shared task list
```

</process>
