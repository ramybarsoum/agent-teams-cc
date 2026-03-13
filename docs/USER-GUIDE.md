# Agent Teams for Claude Code - User Guide

## Quick Start

Install via npx (recommended):

```bash
npx agent-teams-cc@latest
```

Or install globally:

```bash
npm install -g agent-teams-cc
```

Enable Agent Teams in your Claude Code settings by adding this environment variable:

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

Restart Claude Code. Verify the install by running:

```
/team:help
```

You should see the full list of 27 available commands.

## Your First Project

Start a new project with:

```
/team:new-project
```

This does three things:

1. Creates the `.planning/` directory in your repo root
2. Gathers context about your project (tech stack, goals, constraints)
3. Writes a `PROJECT.md` file that all teammates reference

The orchestrator asks you questions to understand scope. Answer with as much detail as you have. You can always refine later.

After initialization, your `.planning/` directory looks like:

```
.planning/
  PROJECT.md          # Project context and goals
  STATE.md            # Tracks current phase states
  config.json         # Workflow preferences
  phases/             # Created as you add phases
```

## Planning a Phase

Break your project into numbered phases. Plan one at a time:

```
/team:plan-phase 1
```

This spawns three teammates in sequence:

1. **Researcher** reads the codebase and writes `01-RESEARCH.md` with findings relevant to the phase
2. **Planner** uses the research to create `01-01-PLAN.md` (phase-plan format) with atomic, testable tasks
3. **Plan Checker** validates the plan (no gaps, no conflicts, tasks are actually atomic)

If the checker finds issues, the planner revises automatically. You get the final plan for approval.

Review the plan before moving on. Edit `01-01-PLAN.md` directly if you want to adjust scope, reorder tasks, or remove items.

### Adding more phases

```
/team:add-phase          # Add a new phase at the end
/team:insert-phase 2     # Insert between existing phases
/team:remove-phase 3     # Remove a phase
```

## Executing a Phase

Once you approve a plan, execute it:

```
/team:execute-phase 1
```

This spawns one executor teammate per plan. Executors run in parallel when their dependencies allow it. Each executor:

- Reads its `PLAN.md` for the task list
- Makes atomic commits (one commit per task)
- Messages the orchestrator at checkpoints
- Stops and asks if it hits something unexpected

Monitor progress with:

```
/team:progress
```

This shows which plans are in progress, completed, or blocked.

### Execution rules

Executors follow strict guardrails:

- One logical change per commit
- Tests must pass before moving to next task
- If a task requires changes outside the plan scope, the executor pauses and asks
- No force pushes, no skipping hooks

## Verifying a Phase

After execution finishes, verify the work:

```
/team:verify-phase 1
```

The verifier teammate checks three levels:

1. **Task level.** Did each task in the plan actually get done?
2. **Phase level.** Does the phase work end-to-end as intended?
3. **Project level.** Does this phase integrate correctly with the rest of the project?

The verifier writes a `01-VERIFICATION.md` report. If it finds issues, you decide whether to fix them manually or re-execute.

## Session Management

### Check progress

```
/team:progress
```

Shows current state of all phases, plans, and execution status.

### Pause work

```
/team:pause-work
```

Saves current state to `.planning/STATE.md`. Safe to close Claude Code.

### Resume work

```
/team:resume-work
```

Reads state from disk and picks up where you left off. Teammates re-read all `.planning/` artifacts to rebuild context.

### Health check

```
/team:health
```

Validates that `.planning/` files are consistent, STATE.md matches reality, and no plans reference deleted files.

## Configuration

```
/team:settings
```

Lets you adjust:

- Default branch name patterns
- Commit message format preferences
- Whether to auto-run tests after each task
- Verification strictness level

Settings are stored in `.planning/config.json`.

## Other Useful Commands

```
/team:discuss-phase 1     # Capture design decisions before planning
/team:validate-phase 1    # Re-validate an existing plan without re-creating it
/team:map-codebase        # Analyze codebase with 4 parallel mapper teammates
/team:debug               # Diagnose a failing test or runtime error
/team:quick               # Ad-hoc task with Agent Teams guardrails
/team:cleanup             # Remove stale .planning/ artifacts
/team:check-todos         # Find TODO/FIXME comments across the codebase
/team:add-tests           # Generate tests for untested code
```

## Milestones

For larger projects, group phases into milestones:

```
/team:new-milestone       # Create a milestone grouping phases
/team:complete-milestone  # Mark a milestone done, generate summary
/team:audit-milestone     # Review milestone quality and completeness
```

## Troubleshooting

**"Agent Teams not enabled"**
Make sure the environment variable is set in your Claude Code config:
```json
"env": { "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1" }
```
Restart Claude Code after changing settings.

**"team-tools command not found"**
Re-run the installer: `npx agent-teams-cc@latest`. Check that `node_modules/.bin/team-tools` exists or that the global bin is in your PATH.

**Teammates seem to lose context**
Each teammate is a full Claude Code instance that reads `CLAUDE.md` and `.planning/` files. If context seems stale, run `/team:health` to check file consistency.

**Plan keeps failing validation**
Run `/team:list-phase-assumptions 1` to see what the planner assumed. Assumptions that don't match your codebase cause validation failures. Update the plan or project context.

**Execution stops unexpectedly**
Run `/team:progress` to see which executor paused and why. Check the executor's message log in the orchestrator output. Usually it hit a deviation from the plan and needs guidance.

**State file corrupted**
Delete `.planning/STATE.md` and run `/team:progress`. The system rebuilds state from the plan and verification files on disk.
