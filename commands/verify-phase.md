---
name: team:verify-phase
description: Verify phase goal achievement using Agent Teams verifier
argument-hint: "<phase-number>"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - Task
  - TeamCreate
  - TeamDelete
  - SendMessage
  - TodoWrite
---

<objective>

Standalone phase verification using an Agent Teams verifier teammate. Use this for manual re-verification outside of `/team:execute-phase`.

The verifier auto-loads CLAUDE.md and checks coding standards compliance in addition to goal-backward verification.

</objective>

<process>

## Step 1: Validate Phase

```bash
PHASE=$1
PADDED_PHASE=$(printf "%02d" $PHASE 2>/dev/null || echo "$PHASE")
PHASE_DIR=$(ls -d .planning/phases/$PADDED_PHASE-* .planning/phases/$PHASE-* 2>/dev/null | head -1)

[ -z "$PHASE_DIR" ] && echo "ERROR: Phase $PHASE not found" && exit 1
```

Read phase goal from ROADMAP.md.

## Step 2: Create Team and Spawn Verifier

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 TEAM ► VERIFYING PHASE {X}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

```
TeamCreate(team_name="verify-{X}", description="Verify phase {X}")
```

```
Task(team_name="verify-{X}", name="verifier",
     subagent_type="team-verifier",
     prompt="Verify Phase {X}: {name}

**Phase directory:** {phase_dir}
**Phase goal:** {goal}

Read your full role instructions from agents/team-verifier.md

Perform goal-backward verification:
1. Establish must-haves
2. Three-level artifact verification
3. Key link verification
4. CLAUDE.md standards compliance
5. Requirements coverage
6. Anti-pattern scan
7. Create VERIFICATION.md

Message lead with results.",
     description="Verify phase {X}")
```

## Step 3: Handle Result

When verifier messages back:

**If passed:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 TEAM ► PHASE {X} VERIFIED ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Score: {N}/{M} must-haves verified
All checks passed.
```

**If gaps_found:**
Present gaps and offer:
- `/team:plan-phase {X} --gaps` to create gap closure plans

**If human_needed:**
Present verification items for user to test.

## Step 4: Cleanup

```
SendMessage(type="shutdown_request", recipient="verifier")
TeamDelete()
```

Commit VERIFICATION.md:
```bash
git add "$PHASE_DIR"/*-VERIFICATION.md
git commit -m "docs({phase}): verify phase {X}

Status: {status}
Score: {N}/{M}
"
```

</process>
