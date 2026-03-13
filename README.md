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
| **Mapper** | `agents/team-mapper.md` | 7 document templates per repo + cross-repo synthesis. Multi-repo and monorepo auto-detection. Forbidden files security. Prescriptive output for planners and executors. |
| **Orchestrator** | `agents/team-orchestrator.md` | Hybrid model: workflow agents + domain-specific role agents. Dev-QA loops per task. Level 2 (human checkpoints) and Level 3 (fully autonomous) execution. |
| **Debugger** | `agents/team-debugger.md` | Scientific method debugging: observe, hypothesize, test, conclude. Persistent debug session state across context resets. |
| **Plan Checker** | `agents/team-plan-checker.md` | Validates plans achieve phase goal before execution. Goal-backward analysis of plan quality. |
| **Roadmapper** | `agents/team-roadmapper.md` | Creates project roadmaps from requirements. Phase breakdown, requirement mapping, success criteria derivation. |
| **Research Synthesizer** | `agents/team-research-synthesizer.md` | Combines outputs from parallel researcher agents into a unified SUMMARY.md. |

## Commands (27 total)

### Core Workflow

| Command | What It Does |
|---------|-------------|
| `/team:new-project` | Initialize project with parallel research teammates |
| `/team:map-codebase` | Map codebase(s) with parallel mappers. Auto-detects monorepo services, multi-repo workspaces, or single repos. |
| `/team:discuss-phase <N>` | Gather context and decisions before planning |
| `/team:plan-phase <N>` | Plan phase with researcher + planner + checker |
| `/team:execute-phase <N>` | Execute phase with parallel executor teammates |
| `/team:verify-phase <N>` | Verify phase goal with team verifier |
| `/team:verify-work <N>` | Conversational UAT with the user |

### Session Management

| Command | What It Does |
|---------|-------------|
| `/team:progress` | Show project status, route to next action |
| `/team:pause-work` | Create context handoff for session break |
| `/team:resume-work` | Restore context from previous session |
| `/team:quick` | Ad-hoc task with framework guarantees |

### Roadmap Management

| Command | What It Does |
|---------|-------------|
| `/team:add-phase` | Add phase to end of roadmap |
| `/team:insert-phase` | Insert urgent phase between existing ones |
| `/team:remove-phase` | Remove a future phase |
| `/team:new-milestone` | Start new milestone cycle |
| `/team:complete-milestone` | Archive completed milestone |
| `/team:audit-milestone` | Audit milestone before archiving |

### Task & Test Management

| Command | What It Does |
|---------|-------------|
| `/team:add-todo` | Capture task from conversation context |
| `/team:check-todos` | List pending todos |
| `/team:add-tests` | Generate tests for completed phase |
| `/team:validate-phase` | Audit validation gaps |
| `/team:list-phase-assumptions` | Surface assumptions before planning |

### Configuration & Maintenance

| Command | What It Does |
|---------|-------------|
| `/team:settings` | Configure workflow toggles |
| `/team:health` | Diagnose .planning/ directory issues |
| `/team:cleanup` | Archive completed phase directories |
| `/team:debug` | Systematic debugging with hypothesis tracking |
| `/team:help` | Show all commands |

## Install

```bash
npx agent-teams-cc
```

That's it. Copies 10 agents, 27 commands, 26 templates, 9 references, 3 hooks, and the CLI tool to `~/.claude/`.

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

## Multi-Repo Mapping

`/team:map-codebase` auto-detects your workspace topology and maps accordingly:

**Auto-detection (Option C):**
- Monorepo with `services/`, `apps/`, or `packages/` directories: each subdirectory is mapped as its own unit
- Sibling git repos in a parent directory: each repo is mapped independently
- Single repo: standard 4-mapper approach

**Explicit config (Option B fallback):**
If auto-detection doesn't match your layout, create `.planning/workspace.json`:

```json
{
  "repos": [
    { "name": "api-service", "path": "../api-service", "tags": ["backend"] },
    { "name": "web-app", "path": "../web-app", "tags": ["frontend"] },
    { "name": "shared-lib", "path": "../shared-lib", "tags": ["shared"] }
  ]
}
```

**What you get:**
- 7 documents per repo (STACK, INTEGRATIONS, ARCHITECTURE, STRUCTURE, CONVENTIONS, TESTING, CONCERNS) in `.planning/codebase/{repo-name}/`
- A `CROSS-REPO-SYNTHESIS.md` that maps API contracts, shared packages, message bus topics, shared data stores, deployment boundaries, and integration risk areas across all repos

The synthesizer runs after all per-repo mappers complete. It reads their outputs and identifies the connective tissue between your services.

## Artifacts

Agent Teams uses a `.planning/` directory structure:

```
.planning/
  PROJECT.md          # What you're building
  ROADMAP.md          # Phases and goals
  STATE.md            # Current position
  REQUIREMENTS.md     # Tracked requirements
  config.json         # Workflow preferences
  workspace.json      # Multi-repo config (auto-generated or manual)
  codebase/           # Mapper documents
    CROSS-REPO-SYNTHESIS.md  # Cross-repo contracts (multi-repo only)
    api-service/      # Per-repo documents (multi-repo)
      STACK.md
      INTEGRATIONS.md
      ARCHITECTURE.md
      ...
    web-app/
      ...
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

## CLI Tool (team-tools)

`team-tools` is a Node.js CLI that handles state management, plan validation, and progress tracking. Agents use it instead of fragile sed-based YAML edits.

```bash
# State management
team-tools state advance-plan              # Increment plan counter
team-tools state update-progress           # Recalculate progress bar
team-tools state add-decision --summary "Use JWT for auth"

# Phase operations
team-tools phase add "API endpoints"       # Add phase to roadmap
team-tools phase insert 3 "Hotfix"         # Insert between phases
team-tools find-phase 5                    # Find phase directory

# Verification
team-tools verify plan-structure plan.md   # Validate plan format
team-tools verify artifacts plan.md        # Check must_haves.artifacts exist
team-tools verify key-links plan.md        # Check wiring

# Frontmatter
team-tools frontmatter get plan.md         # Parse YAML frontmatter as JSON
team-tools frontmatter validate plan.md --schema plan

# Progress
team-tools progress                        # Render progress bar
```

Requires Node.js 18+. No npm dependencies. Installed automatically by `install.sh`.

## Hooks

Agent Teams installs 3 optional hooks to `~/.claude/hooks/`:

- **team-check-update.js** - Checks npm registry once per day for new versions. Makes one HTTPS GET to `registry.npmjs.org`. No telemetry or user data sent. Opt-out: `AGENT_TEAMS_NO_UPDATE_CHECK=1`
- **team-statusline.js** - Shows current phase, progress bar, and update notices in the Claude Code status line
- **team-context-monitor.js** - Warns when context window is running low (75%+ used)

Disable all hooks during install: `AGENT_TEAMS_NO_HOOKS=1 npx agent-teams-cc`

## What's Included

```
agent-teams-cc/
  agents/          10 agent definitions
  commands/        27 slash commands
  templates/       26 templates
  references/       9 reference docs
  hooks/            3 optional hooks
  bin/             CLI tool (team-tools.cjs + 11 lib modules)
  install.sh       One-command setup
  SECURITY.md      Security considerations
  CONTRIBUTING.md  How to contribute
```

## License

MIT

## Credits

Methodology ported from the planning and verification patterns in [get-shit-done](https://github.com/glittercowboy/get-shit-done). Rebuilt for Claude Code's native Agent Teams with persistent messaging, auto-loaded context, and dependency-aware parallelism.
