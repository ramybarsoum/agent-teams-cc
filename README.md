<div align="center">

# Agent Teams for Claude Code

**Multi-agent coordination that actually verifies its own work.**

[![npm version](https://img.shields.io/npm/v/agent-teams-cc?style=for-the-badge&logo=npm&logoColor=white&color=CB3837)](https://www.npmjs.com/package/agent-teams-cc)
[![npm downloads](https://img.shields.io/npm/dm/agent-teams-cc?style=for-the-badge&logo=npm&logoColor=white&color=CB3837)](https://www.npmjs.com/package/agent-teams-cc)
[![GitHub stars](https://img.shields.io/github/stars/ramybarsoum/agent-teams-cc?style=for-the-badge&logo=github&color=181717)](https://github.com/ramybarsoum/agent-teams-cc)
[![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](LICENSE)

Plan, execute, verify, and research with parallel teammates that auto-load your project context.
<br/>Built on Claude Code's native Agent Teams. Zero dependencies.

</div>

---

## Quick Start

```bash
npx agent-teams-cc
```

Then enable Agent Teams in your Claude Code settings:

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

Restart Claude Code. Verify with `/team:help`.

> [!TIP]
> That single command copies 10 agents, 27 commands, 26 templates, 9 references, 3 hooks, and a CLI tool to `~/.claude/`. Nothing else to configure.

## What This Does

You write a spec. Agent Teams breaks it into plans, executes them with parallel teammates, and verifies the result matches your **intent**. Not your tasks. Your intent.

```
You write spec
  -> /team:plan-phase    (planner creates PLAN.md files)
  -> /team:execute-phase  (parallel executors implement with atomic commits)
  -> /team:verify-phase   (verifier checks goal achievement, not task completion)
```

## Why This Exists

| Without Agent Teams | With Agent Teams |
|---|---|
| Context degrades after 50+ messages | Each teammate starts fresh with full project context |
| Claude says "done" but left stubs | Verifier greps actual code, checks wiring, detects stubs |
| One agent does everything (poorly) | Specialized agents for planning, execution, verification |
| Manual "did it actually work?" checking | 3-level artifact verification (exists, substantive, wired) |
| Single-repo tunnel vision | Auto-detects monorepos and multi-repo workspaces |

## The Agents

| Agent | What It Does |
|-------|-------------|
| **Planner** | Decomposes phases into 2-3 task plans. Vertical slices over horizontal layers. Goal-backward must-haves. |
| **Executor** | Atomic commits per task. 4 deviation rules. Analysis paralysis guard. Self-check before completion. |
| **Verifier** | 3-level artifact verification: exists, substantive, wired. Stub detection. Structured gap output. |
| **Researcher** | Context7-first tool strategy. Source hierarchy. Verification protocol for known pitfalls. |
| **Mapper** | 7 document templates per repo + cross-repo synthesis. Multi-repo auto-detection. |
| **Orchestrator** | Hybrid model: workflow agents + domain experts. Dev-QA loops. Level 2 and Level 3 execution. |
| **Debugger** | Scientific method: observe, hypothesize, test, conclude. Persistent state across resets. |
| **Plan Checker** | Goal-backward validation. Catches gaps before execution begins. |
| **Roadmapper** | Creates roadmaps from requirements. Phase breakdown, success criteria derivation. |
| **Research Synthesizer** | Combines parallel researcher outputs into unified SUMMARY.md. |

## Commands (27)

### Core Workflow

| Command | What It Does |
|---------|-------------|
| `/team:new-project` | Initialize project with parallel research teammates |
| `/team:map-codebase` | Map codebase(s) with parallel mappers (auto-detects mono/multi-repo) |
| `/team:discuss-phase <N>` | Gather context and decisions before planning |
| `/team:plan-phase <N>` | Plan with researcher + planner + checker |
| `/team:execute-phase <N>` | Execute with parallel executor teammates |
| `/team:verify-phase <N>` | Verify phase goal achievement |
| `/team:verify-work <N>` | Conversational UAT with the user |

<details>
<summary><strong>Session Management</strong></summary>

| Command | What It Does |
|---------|-------------|
| `/team:progress` | Show project status, route to next action |
| `/team:pause-work` | Create context handoff for session break |
| `/team:resume-work` | Restore context from previous session |
| `/team:quick` | Ad-hoc task with framework guarantees |

</details>

<details>
<summary><strong>Roadmap Management</strong></summary>

| Command | What It Does |
|---------|-------------|
| `/team:add-phase` | Add phase to end of roadmap |
| `/team:insert-phase` | Insert urgent phase between existing ones |
| `/team:remove-phase` | Remove a future phase |
| `/team:new-milestone` | Start new milestone cycle |
| `/team:complete-milestone` | Archive completed milestone |
| `/team:audit-milestone` | Audit milestone before archiving |

</details>

<details>
<summary><strong>Task, Test & Debug</strong></summary>

| Command | What It Does |
|---------|-------------|
| `/team:add-todo` | Capture task from conversation context |
| `/team:check-todos` | List pending todos |
| `/team:add-tests` | Generate tests for completed phase |
| `/team:validate-phase` | Audit validation gaps |
| `/team:list-phase-assumptions` | Surface assumptions before planning |
| `/team:debug` | Systematic debugging with hypothesis tracking |

</details>

<details>
<summary><strong>Configuration & Maintenance</strong></summary>

| Command | What It Does |
|---------|-------------|
| `/team:settings` | Configure workflow toggles |
| `/team:health` | Diagnose .planning/ directory issues |
| `/team:cleanup` | Archive completed phase directories |
| `/team:help` | Show all commands |

</details>

## How It Works

### Planning

Plans are prompts, not documents. Each PLAN.md is specific enough that an executor knows exactly what to build, open enough that it can make local decisions.

- **Vertical slices** over horizontal layers (each plan delivers a testable feature)
- **2-3 tasks per plan** (right-sized for executor context)
- **Goal-backward must-haves** (what must be TRUE, EXIST, and WIRED)
- **Specificity standards** ("Create Prisma schema with User model: id, email (unique), name, createdAt" not "Set up the database")

### Verification

The verifier doesn't check if tasks were completed. It checks if the **goal** was achieved.

Three levels per artifact:
1. **Exists** -- is the file there?
2. **Substantive** -- is it real code or a stub?
3. **Wired** -- is it imported and used by the system?

> [!IMPORTANT]
> 80% of stubs hide at level 3. The component exists, it has real code, but nothing imports it. The verifier catches this.

### Execution Guards

- **Deviation rules**: Auto-fix bugs (Rule 1), add missing security (Rule 2), unblock (Rule 3), ask about architecture (Rule 4)
- **Scope boundary**: Only fix issues caused by current task. Pre-existing problems go to `deferred-items.md`.
- **Fix attempt limit**: 3 tries per task, then move on. No infinite loops.
- **Analysis paralysis guard**: 5+ reads without a write = you're stuck. Write code or report blocked.

<details>
<summary><strong>The Hybrid Model (Orchestrator)</strong></summary>

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

</details>

## Multi-Repo Mapping

`/team:map-codebase` auto-detects your workspace topology:

| Topology | Detection | What Happens |
|----------|-----------|-------------|
| **Monorepo** | `services/`, `apps/`, or `packages/` dirs detected | Each subdirectory mapped as its own unit |
| **Multi-repo** | Sibling git repos in parent directory | Each repo mapped independently |
| **Explicit config** | `.planning/workspace.json` exists | Uses declared repo list |
| **Single repo** | None of the above | Standard 4-mapper approach |

**What you get per repo:** 7 documents (STACK, INTEGRATIONS, ARCHITECTURE, STRUCTURE, CONVENTIONS, TESTING, CONCERNS)

**What you get across repos:** `CROSS-REPO-SYNTHESIS.md` mapping API contracts, shared packages, message bus topics, data stores, deployment boundaries, and integration risks.

<details>
<summary><strong>Explicit workspace config (when auto-detect doesn't fit)</strong></summary>

Create `.planning/workspace.json`:

```json
{
  "repos": [
    { "name": "api-service", "path": "../api-service", "tags": ["backend"] },
    { "name": "web-app", "path": "../web-app", "tags": ["frontend"] },
    { "name": "shared-lib", "path": "../shared-lib", "tags": ["shared"] }
  ]
}
```

</details>

## Artifacts

```
.planning/
├── PROJECT.md              # What you're building
├── ROADMAP.md              # Phases and goals
├── STATE.md                # Current position
├── REQUIREMENTS.md         # Tracked requirements
├── config.json             # Workflow preferences
├── workspace.json          # Multi-repo config (auto-generated or manual)
├── codebase/               # Mapper documents
│   ├── CROSS-REPO-SYNTHESIS.md   # Cross-repo contracts
│   ├── api-service/              # Per-repo docs (multi-repo)
│   │   ├── STACK.md
│   │   ├── ARCHITECTURE.md
│   │   └── ...
│   └── web-app/
│       └── ...
├── research/               # Project research (4 dimensions)
└── phases/
    └── 01-auth/
        ├── 01-01-PLAN.md
        ├── 01-01-SUMMARY.md
        ├── 01-RESEARCH.md
        └── 01-VERIFICATION.md
```

<details>
<summary><strong>CLI Tool (team-tools)</strong></summary>

`team-tools` handles state management, plan validation, and progress tracking. Agents use it instead of fragile sed-based edits. Zero npm dependencies.

```bash
# State management
team-tools state advance-plan              # Increment plan counter
team-tools state update-progress           # Recalculate progress bar
team-tools state add-decision --summary "Use JWT for auth"

# Phase operations
team-tools phase add "API endpoints"       # Add phase to roadmap
team-tools phase insert 3 "Hotfix"         # Insert between phases

# Verification
team-tools verify plan-structure plan.md   # Validate plan format
team-tools verify artifacts plan.md        # Check must_haves.artifacts exist
team-tools verify key-links plan.md        # Check wiring

# Progress
team-tools progress                        # Render progress bar
```

</details>

<details>
<summary><strong>Display Modes</strong></summary>

- **Default**: In-process (Shift+Up/Down to navigate teammates)
- **Split**: `--teammate-mode tmux` (each teammate in own pane)
- **Delegate**: Shift+Tab to keep lead coordination-only
- **Task list**: Ctrl+T to toggle shared task list

</details>

## Hooks

Agent Teams installs 3 optional hooks to `~/.claude/hooks/`:

| Hook | What It Does | Opt-out |
|------|-------------|---------|
| `team-check-update.js` | Checks npm for new versions once/day. No telemetry. | `AGENT_TEAMS_NO_UPDATE_CHECK=1` |
| `team-statusline.js` | Shows phase, progress bar, update notices in status line | -- |
| `team-context-monitor.js` | Warns when context window is 75%+ used | -- |

Disable all hooks during install: `AGENT_TEAMS_NO_HOOKS=1 npx agent-teams-cc`

> [!NOTE]
> The update checker makes one HTTPS GET to `registry.npmjs.org` per day. No analytics, no user data. See [SECURITY.md](SECURITY.md) for full details.

## Requirements

- Claude Code 1.0.34+
- `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` in settings
- Node.js 18+ (for team-tools CLI)
- tmux or iTerm2 for split-pane display (optional)

<details>
<summary><strong>Non-interactive install (CI, Docker, scripts)</strong></summary>

```bash
# Install globally
npm install -g agent-teams-cc

# Or use the shell script directly
curl -fsSL https://raw.githubusercontent.com/ramybarsoum/agent-teams-cc/main/install.sh | bash
```

Disable hooks: `AGENT_TEAMS_NO_HOOKS=1 npm install -g agent-teams-cc`

</details>

<details>
<summary><strong>Staying updated</strong></summary>

```bash
npx agent-teams-cc@latest
```

The statusline hook shows an update indicator when a new version is available.

</details>

## What's Included

```
agent-teams-cc/
├── agents/          10 agent definitions
├── commands/        27 slash commands
├── templates/       26 templates
├── references/       9 reference docs
├── hooks/            3 optional hooks
├── bin/             CLI tool + 11 lib modules
├── install.sh       Shell-based setup
├── SECURITY.md      Security + privacy policy
└── CONTRIBUTING.md  How to contribute
```

## License

MIT

## Credits

Methodology ported from the planning and verification patterns in [get-shit-done](https://github.com/glittercowboy/get-shit-done). Rebuilt for Claude Code's native Agent Teams with persistent messaging, auto-loaded context, and dependency-aware parallelism.
