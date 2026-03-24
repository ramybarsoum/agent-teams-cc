---
name: team:milestone-summary
description: Generate a comprehensive project summary from milestone artifacts for team onboarding and review
argument-hint: "[version]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Grep
  - Glob
---

<objective>
Generate a structured milestone summary for team onboarding and project review.
Reads completed milestone artifacts and produces a human-friendly overview of
what was built, how, and why.

Output: MILESTONE_SUMMARY written to `.planning/reports/`
</objective>

<context>
**Project files:**
- `.planning/ROADMAP.md`
- `.planning/PROJECT.md`
- `.planning/STATE.md`
- `.planning/REQUIREMENTS.md`
- `.planning/phases/*-*/` (SUMMARY.md, VERIFICATION.md, CONTEXT.md, RESEARCH.md)

**User input:**
- Version: $ARGUMENTS (optional — defaults to current/latest milestone)
</context>

<process>

## Step 1: Resolve Milestone Version

```bash
VERSION="${ARGUMENTS:-$(grep -m1 'version:' .planning/STATE.md 2>/dev/null | awk '{print $2}')}"
VERSION="${VERSION:-v1.0}"
```

## Step 2: Gather All Artifacts

Read all phase artifacts:
```bash
find .planning/phases -name "*-SUMMARY.md" | sort
find .planning/phases -name "*-CONTEXT.md" | sort
find .planning/phases -name "*-VERIFICATION.md" | sort
```

## Step 3: Generate Summary Document

Build 7-section document:

1. **Overview** — What this milestone delivered (1 paragraph)
2. **Architecture** — Key technical decisions and patterns
3. **Phases** — Table of phases, goals, and completion status
4. **Key Decisions** — Top decisions from CONTEXT.md files
5. **Requirements Fulfilled** — Completed REQ-IDs with descriptions
6. **Tech Debt / Known Issues** — Items flagged in VERIFICATIONs
7. **Getting Started** — How to run/deploy this milestone's work

## Step 4: Write Report

```bash
mkdir -p .planning/reports
```

Write to `.planning/reports/MILESTONE_SUMMARY-${VERSION}.md`.

## Step 5: Present Inline + Offer Q&A

Show summary to user. Offer:
1. Interactive Q&A about specific aspects
2. Export as PDF or shareable format
3. Update STATE.md with summary link

## Step 6: Update STATE.md

```bash
node "$HOME/.claude/bin/team-tools.cjs" state update milestone_summary_path \
  ".planning/reports/MILESTONE_SUMMARY-${VERSION}.md" 2>/dev/null
```

</process>
