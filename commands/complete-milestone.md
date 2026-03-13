---
name: team:complete-milestone
description: Archive completed milestone with historical record and git tag
argument-hint: "[version]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
---

<objective>
Mark a shipped version as complete. Creates historical record in MILESTONES.md, performs full PROJECT.md evolution review, archives ROADMAP.md and REQUIREMENTS.md, reorganizes roadmap, and tags the release in git.
</objective>

<process>

## Step 1: Verify Readiness

```bash
cat .planning/ROADMAP.md
cat .planning/REQUIREMENTS.md
cat .planning/STATE.md
```

Verify all phases complete (every plan has a summary). Check requirements completion against traceability table.

If requirements incomplete, present options:
1. Proceed anyway (note gaps in MILESTONES.md)
2. Run audit first (`/team:audit-milestone`)
3. Abort

## Step 2: Gather Stats

```bash
git log --oneline --grep="feat(" | head -20
```

Calculate: phases, plans, tasks, files modified, timeline.

## Step 3: Extract Accomplishments

Read SUMMARY.md files, extract one-liners. Build 4-6 key accomplishments.

## Step 4: Archive Milestone

```bash
mkdir -p .planning/milestones
```

- Archive ROADMAP.md to `milestones/v{X.Y}-ROADMAP.md`
- Archive REQUIREMENTS.md to `milestones/v{X.Y}-REQUIREMENTS.md`
- Move audit file to milestones if exists
- Create/append MILESTONES.md entry

AskUserQuestion: "Archive phase directories to milestones/?"
- Yes: move phase dirs to `milestones/v{X.Y}-phases/`
- Skip: keep in place, use `/team:cleanup` later

## Step 5: Evolve PROJECT.md

Full review:
1. "What This Is" accuracy
2. Core Value check
3. Requirements audit (move shipped to Validated, add new to Active)
4. Context update (LOC, tech stack, user feedback)
5. Key Decisions audit (add outcomes)
6. Constraints check

Update "Last updated" footer.

## Step 6: Reorganize ROADMAP.md

Group completed milestone phases. Delete original ROADMAP.md and REQUIREMENTS.md (archives exist).

## Step 7: Write Retrospective

Append to `.planning/RETROSPECTIVE.md`: what was built, what worked, what was inefficient, patterns established, key lessons.

## Step 8: Update STATE.md

Reset for next milestone. Keep accumulated context.

## Step 9: Handle Git Branches

Check branching strategy from config. If branches exist, offer: Squash merge / Merge with history / Delete / Keep.

## Step 10: Git Tag

```bash
git tag -a v{X.Y} -m "v{X.Y} {Name}

Delivered: {One sentence}

Key accomplishments:
- {Item 1}
- {Item 2}"
```

Ask: "Push tag to remote? (y/n)"

## Step 11: Final Commit

```bash
git add .planning/
git commit -m "chore: complete v{X.Y} milestone"
```

```
Milestone v{X.Y} {Name} complete

Shipped:
- {N} phases ({M} plans, {P} tasks)
- {One sentence}

Archived:
- milestones/v{X.Y}-ROADMAP.md
- milestones/v{X.Y}-REQUIREMENTS.md

Tag: v{X.Y}

## Next Up

/team:new-milestone
```

</process>
