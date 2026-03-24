---
name: team:research-phase
description: Research how to implement a phase (standalone - usually use /team:plan-phase instead)
argument-hint: "[phase]"
allowed-tools:
  - Read
  - Bash
  - Task
---

<objective>
Research how to implement a phase. Spawns team-researcher agent with phase context.

**Note:** This is a standalone research command. For most workflows, use `/team:plan-phase` which integrates research automatically.

**Use this command when:**
- You want to research without planning yet
- You want to re-research after planning is complete
- You need to investigate before deciding if a phase is feasible

**Why subagent:** Research burns context fast (WebSearch, Context7 queries, source verification). Fresh context for investigation. Main context stays lean for user interaction.
</objective>

<context>
Phase number: $ARGUMENTS (required)
</context>

<process>

## Step 0: Initialize Context

```bash
INIT=$(node "$HOME/.claude/bin/team-tools.cjs" init phase-op "$ARGUMENTS" 2>/dev/null || echo '{}')
```

Extract: `phase_dir`, `phase_number`, `phase_name`, `phase_found`, `has_research`, `state_path`, `requirements_path`, `context_path`, `research_path`.

## Step 1: Validate Phase

```bash
PHASE_INFO=$(node "$HOME/.claude/bin/team-tools.cjs" roadmap get-phase "${phase_number}" 2>/dev/null)
```

If phase not found: error and exit.

## Step 2: Check Existing Research

```bash
ls .planning/phases/${PHASE}-*/RESEARCH.md 2>/dev/null
```

If exists: offer 1) Update research, 2) View existing, 3) Skip.

## Step 3: Spawn team-researcher Agent

```markdown
<research_type>
Phase Research — investigating HOW to implement a specific phase well.
</research_type>

<key_insight>
The question is NOT "which library should I use?"
The question is: "What do I not know that I don't know?"

For this phase, discover:
- What's the established architecture pattern?
- What libraries form the standard stack?
- What problems do people commonly hit?
- What should NOT be hand-rolled?
</key_insight>

<objective>
Research implementation approach for Phase {phase_number}: {phase_name}
Mode: ecosystem
</objective>

<files_to_read>
- {requirements_path}
- {context_path} (if exists)
- {state_path}
</files_to_read>

<downstream_consumer>
Your RESEARCH.md will be loaded by `/team:plan-phase` which uses:
- `## Standard Stack` → Plans use these libraries
- `## Architecture Patterns` → Task structure follows these
- `## Don't Hand-Roll` → Tasks NEVER build custom solutions for listed problems
- `## Common Pitfalls` → Verification steps check for these

Be prescriptive, not exploratory. "Use X" not "Consider X or Y."
</downstream_consumer>

<output>
Write to: .planning/phases/${PHASE}-{slug}/${PHASE}-RESEARCH.md
</output>
```

```
Task(
  prompt=filled_prompt,
  subagent_type="team-researcher",
  description="Research Phase {phase}"
)
```

## Step 4: Handle Return

**RESEARCH COMPLETE:** Show summary, offer: Plan phase, Dig deeper, Review full, Done.
**RESEARCH INCONCLUSIVE:** Show what was attempted, offer: Add context, Try again, Manual.

</process>
