# Agent Teams for Claude Code

Multi-agent coordination framework for [Claude Code](https://docs.anthropic.com/en/docs/claude-code). Plan, execute, verify, and research with parallel teammates that auto-load your project context.

Built on Claude Code's native Agent Teams feature. Each teammate is a full Claude Code instance with access to your CLAUDE.md, MCP servers, and skills.

## What This Does

You write a spec. Agent Teams breaks it into plans, executes them with parallel teammates, and verifies the result matches your intent. Not your tasks. Your intent.

```
You write spec
  -> /team:plan-phase    (planner creates PLAN.md files)
  -> /team:execute-phase  (parallel executors implement with atomic commits)
  -> /team:verify-phase   (verifier checks goal achievement, not task completion)
```

Each step is handled by a specialized agent with deep methodology baked in. The planner knows how to decompose work into vertical slices. The executor knows deviation rules, TDD protocols, and checkpoint handling. The verifier knows stub detection patterns and 3-level artifact verification.

## Why Not Just Prompt Claude Directly?

Two problems compound as projects grow:

1. **Context rot.** Claude's context fills up. Instructions from 50 messages ago get diluted. Agent Teams teammates start fresh with your full project context auto-loaded, every time.

2. **Verification theater.** Claude says "I implemented the chat feature" but created a placeholder component. The verifier doesn't trust SUMMARY.md claims. It greps the actual code, checks wiring, detects stubs.

## The Agents

| Agent | File | What It Does |
|-------|------|-------------|
| **Planner** | `agents/team-planner.md` | Decomposes phases into 2-3 task plans. Goal-backward must-haves. Vertical slices over horizontal layers. Discovery levels L0-L3. TDD detection. Gap closure mode. |
| **Executor** | `agents/team-executor.md` | Atomic commits per task. 4 deviation rules (auto-fix bugs, add missing security, unblock, ask about architecture). Analysis paralysis guard. Auth gate handling. Self-check before completion. |
| **Verifier** | `agents/team-verifier.md` | 3-level artifact verification (exists, substantive, wired). 4 key-link patterns with grep commands. Stub detection for React, API routes, and wiring. Structured gap output for re-planning. |
| **Researcher** | `agents/team-researcher.md` | Context7-first tool strategy. Source hierarchy (HIGH/MEDIUM/LOW). Verification protocol for 4 known pitfalls. Full RESEARCH.md template with validation architecture. |
| **Mapper** | `agents/team-mapper.md` | 7 document templates (STACK, INTEGRATIONS, ARCHITECTURE, STRUCTURE, CONVENTIONS, TESTING, CONCERNS). Forbidden files security. Prescriptive output for planners and executors. |
| **Orchestrator** | `agents/team-orchestrator.md` | Hybrid model: workflow agents + domain-specific role agents. Dev-QA loops per task. Level 2 (human checkpoints) and Level 3 (fully autonomous) execution. |

## Commands

| Command | What It Does |
|---------|-------------|
| `/team:new-project` | Initialize project with parallel research teammates |
| `/team:map-codebase` | Map codebase with 4 parallel mappers |
| `/team:plan-phase <N>` | Plan phase with researcher + planner + checker |
| `/team:execute-phase <N>` | Execute phase with parallel executor teammates |
| `/team:verify-phase <N>` | Verify phase goal with team verifier |
| `/team:help` | Show all commands |

## Install

```bash
# Clone the repo
git clone https://github.com/ramybarsoum/agent-teams-cc.git

# Run the install script (copies agents and commands to ~/.claude/)
cd agent-teams-cc
chmod +x install.sh
./install.sh
```

Or install manually:

```bash
# Copy agent definitions
cp agents/*.md ~/.claude/agents/

# Copy slash commands
mkdir -p ~/.claude/commands/team
cp commands/*.md ~/.claude/commands/team/
```

Then enable Agent Teams in your Claude Code settings:

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

## Requirements

- Claude Code 1.0.34+
- `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` in settings
- tmux or iTerm2 for split-pane display (optional)

## How It Works

### The Planning Methodology

Plans are prompts, not documents. Each PLAN.md is specific enough that an executor knows exactly what to build, open enough that it can make local implementation decisions.

The planner enforces:
- **Vertical slices** over horizontal layers (each plan delivers a testable feature, not "all models" then "all routes")
- **2-3 tasks per plan** (right-sized for executor context)
- **Goal-backward must-haves** (what must be TRUE, what must EXIST, what must be WIRED)
- **Specificity standards** ("Create Prisma schema with User model: id, email (unique), name, createdAt" not "Set up the database")

### The Verification Model

The verifier doesn't check if tasks were completed. It checks if the goal was achieved.

Three levels per artifact:
1. **Exists** - is the file there?
2. **Substantive** - is it real code or a stub?
3. **Wired** - is it imported and used by the system?

80% of stubs hide at level 3. The component exists, it has real code, but nothing imports it.

### The Execution Guards

Executors have built-in safety:
- **Deviation rules**: Auto-fix bugs (Rule 1), add missing security (Rule 2), unblock (Rule 3), ask about architecture (Rule 4)
- **Scope boundary**: Only fix issues caused by current task. Pre-existing problems go to `deferred-items.md`.
- **Fix attempt limit**: 3 tries per task, then move on. No infinite loops.
- **Analysis paralysis guard**: 5+ reads without a write = you're stuck. Write code or report blocked.
- **Auth gates**: Auth errors are gates, not failures. Pause, tell the user what's needed, continue when resolved.

### The Hybrid Model (Orchestrator)

For complex projects, the orchestrator composes workflow agents with domain-specific role agents:

```
team-executor reads PLAN.md
  -> Checks role_agent field on each task
  -> Spawns domain expert (AI Engineer, Backend Architect, etc.)
  -> Domain expert implements with specialized knowledge
  -> team-executor commits atomically
  -> QA agent validates (Dev-QA loop, max 3 retries)
```

Two execution levels:
- **Level 2**: Human reviews checkpoints
- **Level 3**: Orchestrator auto-approves, only escalates on 3x failures or compliance flags

## Artifacts

Agent Teams uses a `.planning/` directory structure:

```
.planning/
  PROJECT.md          # What you're building
  ROADMAP.md          # Phases and goals
  STATE.md            # Current position
  REQUIREMENTS.md     # Tracked requirements
  config.json         # Workflow preferences
  codebase/           # 7 mapper documents
  research/           # Project research (4 dimensions)
  phases/
    01-auth/
      01-01-PLAN.md
      01-01-SUMMARY.md
      01-RESEARCH.md
      01-VERIFICATION.md
```

## Display Modes

- **Default**: In-process (Shift+Up/Down to navigate teammates)
- **Split**: `--teammate-mode tmux` (each teammate in own pane)
- **Delegate**: Shift+Tab to keep lead coordination-only
- **Task list**: Ctrl+T to toggle shared task list

## License

MIT

## Credits

Methodology ported from the planning and verification patterns in [get-shit-done](https://github.com/glittercowboy/get-shit-done). Rebuilt for Claude Code's native Agent Teams with persistent messaging, auto-loaded context, and dependency-aware parallelism.
