---
name: team:discuss-phase
description: Gather context and implementation decisions before planning a phase
argument-hint: "<phase-number>"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
---

<objective>
Extract implementation decisions that downstream agents need. Analyze the phase to identify gray areas, let the user choose what to discuss, then deep-dive each selected area. Captures decisions in CONTEXT.md for planner and researcher teammates to consume.

You are a thinking partner, not an interviewer. The user is the visionary. You are the builder. Capture decisions so downstream teammates can act without re-asking.
</objective>

<philosophy>
User knows: how they imagine it working, what it should look/feel like, what's essential vs nice-to-have.
User doesn't know (don't ask): codebase patterns, technical risks, implementation approach. Researcher and planner handle those.
</philosophy>

<scope_guardrail>
Phase boundary comes from ROADMAP.md and is FIXED. Discussion clarifies HOW to implement what's scoped, never WHETHER to add new capabilities. Capture scope creep as "Deferred Ideas."
</scope_guardrail>

<process>

## Step 1: Validate Phase

```bash
PHASE=$1
PADDED=$(printf "%02d" $PHASE 2>/dev/null || echo "$PHASE")
PHASE_DIR=$(ls -d .planning/phases/$PADDED-* 2>/dev/null | head -1)
[ -z "$PHASE_DIR" ] && echo "Phase $PHASE not found" && exit 1
ls "$PHASE_DIR"/*-CONTEXT.md 2>/dev/null
ls "$PHASE_DIR"/*-PLAN.md 2>/dev/null
```

If CONTEXT.md exists: offer Update/View/Skip.
If plans exist without context: warn that context won't affect existing plans unless replanned.

## Step 2: Load Prior Context

```bash
cat .planning/PROJECT.md 2>/dev/null
cat .planning/REQUIREMENTS.md 2>/dev/null
cat .planning/STATE.md 2>/dev/null
```

Read all prior CONTEXT.md files from earlier phases for carry-forward decisions.

## Step 3: Scout Codebase

```bash
ls .planning/codebase/*.md 2>/dev/null
```

If codebase maps exist, read relevant ones. Otherwise, do targeted grep for terms from the phase goal to find reusable components, patterns, and integration points.

## Step 4: Analyze Phase

Read ROADMAP.md for phase goal. Identify gray areas using domain-aware heuristic:
- Something users SEE: layout, density, interactions, states
- Something users CALL: responses, errors, auth, versioning
- Something users RUN: output format, flags, modes
- Something users READ: structure, tone, depth, flow
- Something being ORGANIZED: criteria, grouping, naming

Generate 3-4 phase-specific gray areas (not generic categories).

## Step 5: Present Gray Areas

State boundary, prior decisions that apply, then use AskUserQuestion (multiSelect: true):

```
Phase [X]: [Name]
Domain: [What this phase delivers]

We'll clarify HOW to implement this.

[If prior decisions apply:]
Carrying forward from earlier phases:
- [Decision from Phase N]
```

Options: 3-4 specific gray areas with code context annotations where relevant.

## Step 6: Discuss Selected Areas

For each selected area, conduct focused discussion. Ask 4 questions per area using AskUserQuestion, then check if user wants more or next area.

Options should be concrete choices with recommended choice highlighted. Include "You decide" when reasonable.

If user provides freeform input via "Other", ask follow-up as plain text.

Handle scope creep: note as deferred idea, return to current area.

After all areas: offer to explore more or proceed to context.

## Step 7: Write CONTEXT.md

Create `${PHASE_DIR}/${PADDED}-CONTEXT.md`:

```markdown
# Phase [X]: [Name] - Context

**Gathered:** [date]
**Status:** Ready for planning

<domain>
## Phase Boundary
[What this phase delivers]
</domain>

<decisions>
## Implementation Decisions
### [Category]
- [Decision]

### Claude's Discretion
[Areas where user said "you decide"]
</decisions>

<code_context>
## Existing Code Insights
### Reusable Assets
- [Component]: [How it could be used]
### Established Patterns
- [Pattern]: [How it constrains/enables]
### Integration Points
- [Where new code connects]
</code_context>

<specifics>
## Specific Ideas
[References or "I want it like X" moments]
</specifics>

<deferred>
## Deferred Ideas
[Ideas outside phase scope]
</deferred>
```

## Step 8: Commit and Confirm

```bash
git add "${PHASE_DIR}/${PADDED}-CONTEXT.md"
git commit -m "docs(${PADDED}): capture phase context"
```

Update STATE.md with session info.

```
Created: ${PHASE_DIR}/${PADDED}-CONTEXT.md

## Decisions Captured
### [Category]
- [Key decision]

## Next Up

**Phase ${PHASE}: [Name]**

`/team:plan-phase ${PHASE}`
```

</process>
