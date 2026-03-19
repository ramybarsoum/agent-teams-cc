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

After all areas: offer to explore more or proceed to design.

## Step 6b: Design Spec (Design-First Gate)

**Do NOT skip this step.** Even for phases that seem simple, unexamined assumptions cause the most wasted work.

After all gray areas are discussed, create a design spec:

**1. Propose 2-3 approaches with tradeoffs:**

For each approach, present:
- **Name:** Short descriptive name
- **Description:** How it works (2-3 sentences)
- **Pros:** What's good about this approach
- **Cons:** What's risky or limiting
- **Complexity:** Low / Medium / High
- **Recommendation:** Star the recommended approach

Use AskUserQuestion to let the user select an approach (or "Other" to describe their own).

**2. Write the design spec:**

After approach is selected, write `${PHASE_DIR}/${PADDED}-DESIGN.md`:

```markdown
# Phase [X]: [Name] - Design Spec

**Created:** [date]
**Status:** Approved
**Approach:** [Selected approach name]

## Problem Statement
[What this phase needs to deliver, from ROADMAP.md goal]

## Selected Approach
[Detailed description of the selected approach]

### Why This Approach
[Rationale — why this over the alternatives]

### Rejected Alternatives
[Brief description of each rejected approach and why]

## High-Level Architecture
[How the pieces fit together — components, data flow, key interactions]

### Key Files
[Expected files to create/modify with their responsibilities]

### Data Flow
[How data moves through the system for the primary use case]

## Constraints & Decisions
[Locked decisions from the discussion that constrain implementation]

## Risks & Mitigations
[Known risks and how the design addresses them]

## Success Criteria
[Observable outcomes that prove this design works — feeds into must_haves]
```

**3. Spec review (automated):**

After writing DESIGN.md, spawn a spec reviewer subagent:

```
Agent(subagent_type="Explore",
      prompt="Review this design spec for Phase {X}.

Read: ${PHASE_DIR}/${PADDED}-DESIGN.md
Also read: .planning/ROADMAP.md, .planning/REQUIREMENTS.md

Check:
1. Does the design address ALL requirements mapped to this phase?
2. Are there gaps — requirements that the design doesn't cover?
3. Are there contradictions — parts of the design that conflict?
4. Are the success criteria specific and testable?
5. Does the architecture account for integration with adjacent phases?
6. Are risks identified but mitigations vague or missing?

Return a structured review with PASS or ISSUES FOUND.",
      description="Review design spec")
```

If spec reviewer finds issues:
- Present issues to user
- Fix issues in DESIGN.md (max 2 revision rounds)
- Re-run spec review after fixes

**4. User approval gate:**

Present the final DESIGN.md summary and ask: "Approve this design and proceed to planning?"

Only proceed to CONTEXT.md creation after user approves.

## Step 7: Write CONTEXT.md

Create `${PHASE_DIR}/${PADDED}-CONTEXT.md`:

```markdown
# Phase [X]: [Name] - Context

**Gathered:** [date]
**Status:** Ready for planning
**Design:** ${PADDED}-DESIGN.md (approved)

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
git add "${PHASE_DIR}/${PADDED}-DESIGN.md" 2>/dev/null
git commit -m "docs(${PADDED}): capture phase context and design spec"
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
