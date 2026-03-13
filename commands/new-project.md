---
name: team:new-project
description: Initialize a new project with Agent Teams for research and roadmap creation
allowed-tools:
  - Read
  - Write
  - Bash
  - Task
  - TeamCreate
  - TeamDelete
  - SendMessage
  - TodoWrite
  - AskUserQuestion
---

<objective>

Initialize a new project using Agent Teams for the research and roadmap phases. The lead handles questioning and requirements interactively. Teammates handle parallel research and roadmap creation.

**Creates:** `.planning/` artifacts:
- `.planning/PROJECT.md`
- `.planning/config.json`
- `.planning/research/` (optional)
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
- `.planning/STATE.md`

**After this command:** Run `/team:plan-phase 1` to start execution.

</objective>

<execution_context>

Templates are self-contained in the agent files. No external template references needed.

</execution_context>

<process>

## Phases 1-4: Setup and Questioning (Lead handles directly)

These phases are identical to `standard initialization`. The lead handles them interactively without spawning teammates. They are conversational and require user input.

**Phase 1: Setup**
- Abort if project exists
- Initialize git repo
- Detect existing code (brownfield)

**Phase 2: Brownfield Offer**
- If code detected: offer `/team:map-codebase` first

**Phase 3: Deep Questioning**
- Use questioning.md reference for interview structure
- Gather: what they're building, who it's for, core value, constraints, tech preferences

**Phase 4: Create PROJECT.md**
- Write `.planning/PROJECT.md` from questioning answers
- Commit

## Phase 5: Workflow Preferences (Lead handles directly)

Create `.planning/config.json` with user preferences:
- Mode (yolo/standard/careful)
- Research toggle
- Plan checking toggle
- Model profile

Add `"engine": "teams"` to config to indicate Agent Teams is the active engine.

## Phase 6: Research (Agent Teams)

If research enabled:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 TEAM ► RESEARCHING DOMAIN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Create team for the entire remaining flow:
```
TeamCreate(team_name="new-project", description="Project initialization")
```

Create research tasks:
```
TaskCreate("Research stack for {domain}")
TaskCreate("Research features for {domain}")
TaskCreate("Research architecture for {domain}")
TaskCreate("Research pitfalls for {domain}")
TaskCreate("Synthesize research", blocked_by=[1, 2, 3, 4])
```

Spawn 4 researcher teammates in parallel:

```
Task(team_name="new-project", name="researcher-stack",
     subagent_type="team-researcher",
     prompt="Project research mode. Dimension: stack

Research the standard stack for building {domain}.
Read .planning/PROJECT.md for project context.
Write to .planning/research/STACK.md
Use template from the research output format in team-researcher.md

Claim 'Research stack' task, complete it, message lead.",
     description="Stack research")

Task(team_name="new-project", name="researcher-features",
     subagent_type="team-researcher",
     prompt="Project research mode. Dimension: features

Research table stakes vs differentiating features for {domain}.
Read .planning/PROJECT.md for project context.
Write to .planning/research/FEATURES.md
Use template from the research output format in team-researcher.md

Claim 'Research features' task, complete it, message lead.",
     description="Features research")

Task(team_name="new-project", name="researcher-arch",
     subagent_type="team-researcher",
     prompt="Project research mode. Dimension: architecture

Research system architecture for {domain}.
Read .planning/PROJECT.md for project context.
Write to .planning/research/ARCHITECTURE.md
Use template from the research output format in team-researcher.md

Claim 'Research architecture' task, complete it, message lead.",
     description="Architecture research")

Task(team_name="new-project", name="researcher-pitfalls",
     subagent_type="team-researcher",
     prompt="Project research mode. Dimension: pitfalls

Research common pitfalls for {domain} projects.
Read .planning/PROJECT.md for project context.
Write to .planning/research/PITFALLS.md
Use template from the research output format in team-researcher.md

Claim 'Research pitfalls' task, complete it, message lead.",
     description="Pitfalls research")
```

Wait for all 4 researchers. Then spawn synthesizer:

```
Task(team_name="new-project", name="synthesizer",
     subagent_type="team-researcher",
     prompt="Synthesis mode.

Read all research files in .planning/research/:
- STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md

Create .planning/research/SUMMARY.md using template from
the synthesis format in team-researcher.md

Commit all research files.
Claim 'Synthesize research' task, complete it, message lead.",
     description="Synthesize research")
```

Shutdown research teammates (progressive):
```
SendMessage(type="shutdown_request", recipient="researcher-stack")
SendMessage(type="shutdown_request", recipient="researcher-features")
SendMessage(type="shutdown_request", recipient="researcher-arch")
SendMessage(type="shutdown_request", recipient="researcher-pitfalls")
SendMessage(type="shutdown_request", recipient="synthesizer")
```

Display research summary.

## Phase 7: Requirements (Lead handles directly)

Same as `standard initialization` Phase 7:
- Present features by category (from research if available)
- Scope each category with user via AskUserQuestion
- Generate REQUIREMENTS.md
- Commit

## Phase 8: Roadmap (Agent Teams)

Spawn roadmapper teammate (reusing existing team):

```
Task(team_name="new-project", name="roadmapper",
     subagent_type="team-planner",
     prompt="Roadmap creation mode.

Read:
- .planning/PROJECT.md
- .planning/REQUIREMENTS.md
- .planning/research/SUMMARY.md (if exists)
- .planning/config.json

Create roadmap:
1. Derive phases from requirements
2. Map every v1 requirement to exactly one phase
3. Derive 2-5 success criteria per phase
4. Validate 100% coverage
5. Write ROADMAP.md, STATE.md, update REQUIREMENTS.md traceability

Message lead with roadmap summary when done.",
     description="Create roadmap")
```

Present roadmap to user. If revision needed: message roadmapper with feedback.

When approved:
```
SendMessage(type="shutdown_request", recipient="roadmapper")
```

## Phase 9: Cleanup

```
TeamDelete()
```

## Phase 10: Completion

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 TEAM ► PROJECT INITIALIZED ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[roadmap summary]

## Next Steps

- `/team:plan-phase 1` — Plan first phase
- `/team:help` — View available commands
```

</process>
