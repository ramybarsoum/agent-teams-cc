# Context Monitor (Planned)

## Status

Not yet implemented. This document describes the planned design.

## Problem

Claude Code teammates share a finite context window. Long-running executions (large codebases, many-task plans) can fill the window, causing the agent to lose earlier context. This leads to repeated mistakes, forgotten constraints, and drift from the plan.

## Planned Approach

A lightweight hook that runs after each tool call within a teammate session. It tracks:

1. **Estimated token usage.** Rough count of tokens consumed so far based on messages exchanged.
2. **Critical context markers.** Which project files (PLAN, RESEARCH, PROJECT) are still "in view" vs likely evicted.
3. **Drift signals.** Repeated questions, contradictory actions, or references to stale information.

## Trigger Behavior

When the monitor detects the context window is approaching capacity (estimated 80% full), it:

1. Sends a structured message to the orchestrator: `CONTEXT_PRESSURE: teammate-id, usage estimate, recommended action`
2. Suggests the teammate pause, checkpoint its progress, and hand off to a fresh instance
3. The orchestrator can then spawn a continuation teammate that reads the checkpoint file

## Checkpoint Format

The pausing teammate writes a `CHECKPOINT-{phase}-{task}.md` file containing:

- Completed tasks (with commit SHAs)
- Current task in progress (partial state)
- Key decisions made during execution
- Files modified but not yet committed

The continuation teammate reads this file plus the original PLAN to resume.

## Why Not Implement Now

Token counting from inside a Claude Code session is imprecise. The teammate doesn't have direct access to its own context window metrics. The current approach (executors checkpoint at natural boundaries, orchestrator monitors message volume) works well enough for most projects.

This becomes more important when:

- Plans exceed 20+ tasks in a single phase
- Codebases are very large (100k+ lines touched per phase)
- Teammates need to reference many external files simultaneously

## Integration Point

When implemented, this will be a hook registered in the teammate's session configuration. No changes to existing commands or templates needed. The orchestrator already handles teammate messaging, so the CONTEXT_PRESSURE signal fits naturally into the existing communication protocol.
