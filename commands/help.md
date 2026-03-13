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
    

## Core Workflow

/team:new-project           Initialize project with team research
/team:map-codebase          Map codebase with 4 parallel mappers
/team:discuss-phase <N>     Gather context before planning
/team:plan-phase <N>        Plan phase with researcher + planner + checker
/team:execute-phase <N>     Execute phase with parallel executor teammates
/team:verify-phase <N>      Verify phase goal with team verifier
/team:verify-work <N>       Conversational UAT testing

## Session Management

/team:progress              Show progress and route to next action
/team:pause-work            Create context handoff when pausing
/team:resume-work           Resume from previous session
/team:quick [desc]          Ad-hoc task with framework guarantees

## Debugging & Testing

/team:debug <N>             Parallel debug agents for UAT gaps
/team:add-tests <N>         Generate tests for completed phase
/team:validate-phase <N>    Audit validation gaps

## Roadmap Management

/team:add-phase <desc>      Add phase to end of milestone
/team:insert-phase <N> <d>  Insert urgent phase between existing
/team:remove-phase <N>      Remove future phase

## Task Management

/team:add-todo [desc]       Capture task from conversation
/team:check-todos           List pending todos

## Milestone Management

/team:audit-milestone       Audit milestone completion
/team:complete-milestone    Archive completed milestone
/team:new-milestone         Start new milestone cycle

## Configuration & Maintenance

/team:settings              Configure workflow toggles
/team:health [--repair]     Diagnose planning directory issues
/team:cleanup               Archive completed phase directories
/team:list-phase-assumptions <N>  Surface assumptions before planning

## Reference

/team:help                  This help screen

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
