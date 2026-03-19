---
name: team:resume-work
description: Resume from previous session with full context restoration
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
---

<objective>
Instantly restore full project context so "Where were we?" has an immediate, complete answer. Load state, detect incomplete work, present status, and route to next action.
</objective>

<process>

## Step 1: Initialize

```bash
ls .planning/STATE.md .planning/PROJECT.md .planning/ROADMAP.md 2>/dev/null
```

- If STATE.md exists: proceed to Step 2
- If STATE.md missing but ROADMAP.md/PROJECT.md exists: offer to reconstruct STATE.md
- If no `.planning/` directory: route to `/team:new-project`

## Step 2: Load State

```bash
cat .planning/STATE.md
cat .planning/PROJECT.md
```

From STATE.md extract: project reference, current position, progress, recent decisions, pending todos, blockers, session continuity.

From PROJECT.md extract: what this is, requirements, key decisions, constraints.

## Step 3: Check Incomplete Work

```bash
# Check for continue-here files (mid-plan resumption)
ls .planning/phases/*/.continue-here*.md 2>/dev/null

# Check for plans without summaries (incomplete execution)
for plan in .planning/phases/*/*-PLAN.md; do
  summary="${plan/PLAN/SUMMARY}"
  [ ! -f "$summary" ] && echo "Incomplete: $plan"
done 2>/dev/null

# Check for verification reports with gaps
for verif in .planning/phases/*/*-VERIFICATION.md; do
  [ -f "$verif" ] && grep -q "status: gaps_found" "$verif" 2>/dev/null && echo "Gaps: $verif"
done 2>/dev/null

# Check for pending todos
ls .planning/todos/pending/*.md 2>/dev/null | wc -l | tr -d ' '

# Check for DESIGN.md without plans (design done, planning not started)
for phase_dir in .planning/phases/*/; do
  design=$(ls "$phase_dir"*-DESIGN.md 2>/dev/null | head -1)
  plans=$(ls "$phase_dir"*-PLAN.md 2>/dev/null | head -1)
  [ -n "$design" ] && [ -z "$plans" ] && echo "Design-only: $phase_dir"
done 2>/dev/null
```

Flag findings:
- `.continue-here` file: mid-plan checkpoint
- PLAN without SUMMARY: incomplete execution
- VERIFICATION with `gaps_found`: needs gap closure
- Design without plans: discuss completed, planning next
- Pending todos count

## Step 4: Present Status

```
╔══════════════════════════════════════════════════════════════╗
║  PROJECT STATUS                                              ║
╠══════════════════════════════════════════════════════════════╣
║  Building: [one-liner from PROJECT.md "What This Is"]        ║
║                                                              ║
║  Phase: [X] of [Y] - [Phase name]                           ║
║  Plan:  [A] of [B] - [Status]                               ║
║  Progress: [██████░░░░] XX%                                 ║
║                                                              ║
║  Last activity: [date] - [what happened]                    ║
╚══════════════════════════════════════════════════════════════╝

[If incomplete work found:]
Incomplete work detected:
  - [.continue-here file or incomplete plan details]

[If verification gaps found:]
Verification gaps pending:
  - Phase {X}: {N}/{M} must-haves verified — needs `/team:plan-phase {X} --gaps`

[If pending todos exist:]
[N] pending todos — /team:check-todos to review

[If blockers exist:]
Carried concerns:
  - [blocker 1]
  - [blocker 2]
```

## Step 5: Determine Next Action

**Priority order (first match wins):**

**1. If .continue-here file exists:**
→ Primary: Resume from checkpoint
→ Option: Start fresh on current plan

**2. If incomplete plan (PLAN without SUMMARY):**
→ Primary: Execute incomplete plans `/team:execute-phase {phase}`
→ Option: Abandon and move on

**3. If verification gaps found:**
→ Primary: Plan gap closure `/team:plan-phase {phase} --gaps`
→ Option: Re-verify first `/team:verify-phase {phase}`

**4. If phase complete, all plans done, no verification yet:**
→ Primary: Verify phase `/team:verify-phase {phase}`

**5. If phase complete, verified, passed:**
→ Primary: Plan next phase `/team:plan-phase {X+1}`
→ Check milestone status: if last phase, suggest `/team:complete-milestone`

**6. If DESIGN.md exists but no plans:**
→ Primary: Plan the phase `/team:plan-phase {phase}`

**7. If phase ready to plan (no design, no plans):**
→ Check CONTEXT.md:
  - If missing: suggest `/team:discuss-phase {phase}` (gather context + design first)
  - If exists: suggest `/team:plan-phase {phase}`

**8. If phase ready to execute (plans exist, not started):**
→ Primary: Execute `/team:execute-phase {phase}`

## Step 6: Offer Options

```
What would you like to do?

1. [Primary action based on state — with specific command]
2. [Secondary action if applicable]
3. Review current phase status
4. Check pending todos ([N] pending)
5. Something else
```

Wait for user selection.

## Step 7: Route

Based on selection, show the appropriate command with context:

```
---

## Next Up

**{Action description}**

`{/team:command args}`

<sub>`/clear` first for fresh context window</sub>

---

**Also available:**
- {alternative commands relevant to current state}

---
```

## Step 8: Update Session

Update STATE.md session continuity:

```markdown
## Session Continuity

Last session: [now]
Stopped at: Session resumed, proceeding to [action]
```

</process>

<quick_resume>
If user says "continue", "go", or "what's next":
- Load state silently
- Determine primary action from Step 5 priority order
- Execute immediately without presenting full status or options

"Continuing from [state]... [action]"
</quick_resume>

<reconstruction>
If STATE.md is missing but other artifacts exist:

"STATE.md missing. Reconstructing from artifacts..."

1. Read PROJECT.md for "What This Is" and Core Value
2. Read ROADMAP.md for phases and current position
3. Scan *-SUMMARY.md files for decisions, concerns
4. Scan *-VERIFICATION.md for gap status
5. Count pending todos in .planning/todos/pending/
6. Check for .continue-here files
7. Check for DESIGN.md files

Reconstruct and write STATE.md, then proceed normally.

This handles cases where:
- Project predates STATE.md
- File was accidentally deleted
- Cloning repo without full .planning/ state
</reconstruction>
