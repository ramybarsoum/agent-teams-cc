---
name: team:audit-milestone
description: Audit milestone completion by aggregating phase verifications and checking integration
argument-hint: "[version]"
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
---

<objective>
Verify milestone achieved its definition of done. Aggregates phase VERIFICATION.md files, checks cross-phase integration, and assesses requirements coverage using a 3-source cross-reference. Spawns integration checker teammate for cross-phase wiring.
</objective>

<process>

## Step 1: Initialize

```bash
cat .planning/ROADMAP.md
cat .planning/REQUIREMENTS.md
cat .planning/STATE.md
cat .planning/config.json 2>/dev/null
```

Parse milestone version, name, phase count, completed phases.

## Step 2: Determine Scope

Identify all phase directories in this milestone. Extract milestone definition of done from ROADMAP.md and requirements from REQUIREMENTS.md.

## Step 3: Read Phase Verifications

For each phase, read VERIFICATION.md. Extract: status, critical gaps, non-critical gaps, anti-patterns, requirements coverage.

Flag missing VERIFICATION.md as "unverified phase" (blocker).

## Step 4: Spawn Integration Checker

```
TeamCreate(team_name="milestone-audit", description="Audit milestone ${VERSION}")

Task(team_name="milestone-audit", name="integration-checker",
     subagent_type="team-verifier",
     prompt="Integration check mode.

Phases: {phase_dirs}
Phase exports: {from SUMMARYs}
Milestone Requirements: {REQ-IDs with descriptions}

Verify cross-phase wiring and E2E user flows.
Map each finding to affected requirement IDs.
Message lead with integration report.",
     description="Check cross-phase integration")
```

## Step 5: Requirements Coverage (3-Source Cross-Reference)

Cross-reference three sources for each requirement:
1. VERIFICATION.md status per phase
2. SUMMARY.md `requirements-completed` frontmatter
3. REQUIREMENTS.md traceability table checkboxes

Determine final status using the matrix. Detect orphaned requirements (in traceability but absent from all verifications).

Any unsatisfied requirement forces `gaps_found` status.

## Step 6: Nyquist Compliance (if enabled)

Check each phase for VALIDATION.md. Classify: COMPLIANT / PARTIAL / MISSING.

## Step 7: Generate Audit Report

Create `.planning/v{version}-MILESTONE-AUDIT.md` with YAML frontmatter (status, scores, gaps, tech_debt) and full markdown report.

Cleanup teammates. TeamDelete.

```bash
git add ".planning/v${VERSION}-MILESTONE-AUDIT.md"
git commit -m "docs: milestone ${VERSION} audit"
```

## Step 8: Present Results

**If passed:**
```
Milestone {version} — Audit Passed
Score: {N}/{M} requirements satisfied

Next: /team:complete-milestone {version}
```

**If gaps_found:**
```
Milestone {version} — Gaps Found
Score: {N}/{M} requirements satisfied

Unsatisfied Requirements:
- {REQ-ID}: {description}

Next: /team:plan-phase --gaps (for affected phases)
Also: /team:complete-milestone {version} — proceed anyway
```

**If tech_debt:**
```
Milestone {version} — Tech Debt Review
All requirements met. {N} debt items across {M} phases.

A. /team:complete-milestone — accept debt
B. Plan cleanup phase first
```

</process>
