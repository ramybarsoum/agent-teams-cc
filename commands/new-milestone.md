---
name: team:new-milestone
description: Start a new milestone cycle with requirements and roadmap
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - Task
  - TeamCreate
  - TeamDelete
  - SendMessage
  - AskUserQuestion
---

<objective>
Start a new milestone cycle for an existing project. Loads project context, gathers goals, optionally runs parallel research teammates, defines requirements with REQ-IDs, spawns roadmapper teammate, and commits all artifacts.
</objective>

<process>

## Step 1: Load Context

```bash
cat .planning/PROJECT.md
cat .planning/MILESTONES.md 2>/dev/null
cat .planning/STATE.md
```

Check for MILESTONE-CONTEXT.md (from discuss-milestone).

## Step 2: Gather Goals

**If MILESTONE-CONTEXT.md exists:** Use features and scope, present for confirmation.
**If not:** Present what shipped last milestone, ask "What do you want to build next?" via freeform text, then probe specifics with AskUserQuestion.

## Step 3: Determine Version

Parse last version from MILESTONES.md. Suggest next (v1.0 -> v1.1, or v2.0 for major). Confirm with user.

## Step 4: Update PROJECT.md and STATE.md

Add Current Milestone section to PROJECT.md. Reset STATE.md position.

```bash
git add .planning/PROJECT.md .planning/STATE.md
git commit -m "docs: start milestone v{X.Y} {Name}"
```

## Step 5: Research Decision

AskUserQuestion: Research first (Recommended) / Skip research.

**If research:** Create team with 4 parallel researcher teammates:

```
TeamCreate(team_name="milestone-research", description="Research for v{X.Y}")
```

Spawn 4 researchers (Stack, Features, Architecture, Pitfalls), each writing to `.planning/research/`.

After all complete, spawn synthesizer teammate to create SUMMARY.md.

```bash
git add .planning/research/
git commit -m "docs: milestone v{X.Y} research complete"
```

Shutdown researchers. TeamDelete.

## Step 6: Define Requirements

Present features by category (from research or conversation). Scope each category via AskUserQuestion (multiSelect).

Generate REQUIREMENTS.md with REQ-IDs, grouped by category.

Present full list for confirmation. If "adjust": return to scoping.

```bash
git add .planning/REQUIREMENTS.md
git commit -m "docs: define milestone v{X.Y} requirements"
```

## Step 7: Create Roadmap

```
TeamCreate(team_name="milestone-roadmap", description="Roadmap for v{X.Y}")

Task(team_name="milestone-roadmap", name="roadmapper",
     subagent_type="team-planner",
     prompt="Roadmap creation mode.

Read: .planning/PROJECT.md, .planning/REQUIREMENTS.md, .planning/research/SUMMARY.md, .planning/MILESTONES.md

Create roadmap for milestone v{X.Y}:
1. Start phase numbering from {N} (continuing from previous)
2. Derive phases from requirements
3. Map every requirement to exactly one phase
4. Write ROADMAP.md and update STATE.md
5. Message lead with summary.",
     description="Create roadmap")
```

Present roadmap for approval. If "Adjust": get notes, have planner revise.

TeamDelete.

```bash
git add .planning/ROADMAP.md .planning/STATE.md .planning/REQUIREMENTS.md
git commit -m "docs: create milestone v{X.Y} roadmap ({N} phases)"
```

## Step 8: Done

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 TEAM > MILESTONE INITIALIZED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Milestone v{X.Y}: {Name}

| Artifact     | Location |
|--------------|----------|
| Project      | .planning/PROJECT.md |
| Research     | .planning/research/ |
| Requirements | .planning/REQUIREMENTS.md |
| Roadmap      | .planning/ROADMAP.md |

{N} phases | {X} requirements | Ready to build

## Next Up

**Phase {N}: {Name}** — {Goal}

`/team:discuss-phase {N}` — gather context
`/team:plan-phase {N}` — plan directly
```

</process>
