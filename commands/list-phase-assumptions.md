---
name: team:list-phase-assumptions
description: Surface Claude's assumptions about a phase before planning
argument-hint: "<phase-number>"
allowed-tools:
  - Read
  - Bash
  - Glob
  - Grep
---

<objective>
Surface assumptions about a phase before planning, enabling users to correct misconceptions early. This is analysis of what Claude thinks, not intake of what user knows. No file output, purely conversational.
</objective>

<process>

## Step 1: Validate Phase

```bash
PHASE=$1
cat .planning/ROADMAP.md 2>/dev/null
```

If no argument: "Usage: `/team:list-phase-assumptions <phase-number>`" Exit.
If phase not found in roadmap: list available phases. Exit.

Parse phase number, name, goal from ROADMAP.md.

## Step 2: Analyze Phase

Read project context:
```bash
cat .planning/PROJECT.md 2>/dev/null
cat .planning/STATE.md 2>/dev/null
```

Based on roadmap description and project context, identify assumptions across five areas:

**1. Technical Approach:**
What libraries, frameworks, patterns would be used? Why?

**2. Implementation Order:**
What gets built first, second, third? Why?

**3. Scope Boundaries:**
What's included vs excluded? What's ambiguous?

**4. Risk Areas:**
Where is complexity or challenge expected?

**5. Dependencies:**
What from prior phases is assumed? External dependencies? What future phases need from this?

Mark confidence levels:
- "Fairly confident:" (clear from roadmap)
- "Assuming:" (reasonable inference)
- "Unclear:" (could go multiple ways)

## Step 3: Present Assumptions

```
## My Assumptions for Phase ${PHASE}: ${NAME}

### Technical Approach
[List assumptions]

### Implementation Order
[List assumptions]

### Scope Boundaries
**In scope:** [included]
**Out of scope:** [excluded]
**Ambiguous:** [could go either way]

### Risk Areas
[Anticipated challenges]

### Dependencies
**From prior phases:** [needed]
**External:** [third-party]
**Feeds into:** [future phases]

---

**What do you think?**

Are these assumptions accurate? Let me know:
- What I got right
- What I got wrong
- What I'm missing
```

Wait for user response.

## Step 4: Handle Feedback

If corrections: acknowledge, summarize new understanding.
If confirmed: "Assumptions validated."

## Step 5: Offer Next Steps

```
What's next?
1. Discuss context (/team:discuss-phase ${PHASE})
2. Plan this phase (/team:plan-phase ${PHASE})
3. Re-examine assumptions
4. Done for now
```

</process>
