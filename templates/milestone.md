# Milestone Entry Template

Add this entry to `.planning/MILESTONES.md` when completing a milestone:

```markdown
## v[X.Y] [Name] (Shipped: YYYY-MM-DD)

**Delivered:** [One sentence describing what shipped]

**Phases completed:** [X-Y] ([Z] plans total)

**Key accomplishments:**
- [Major achievement 1]
- [Major achievement 2]
- [Major achievement 3]
- [Major achievement 4]

**Stats:**
- [X] files created/modified
- [Y] lines of code (primary language)
- [Z] phases, [N] plans, [M] tasks
- [D] days from start to ship (or milestone to milestone)

**Git range:** `feat(XX-XX)` → `feat(YY-YY)`

**What's next:** [Brief description of next milestone goals, or "Project complete"]

---
```

<structure>
If MILESTONES.md doesn't exist, create it with header:

```markdown
# Project Milestones: [Project Name]

[Entries in reverse chronological order - newest first]
```
</structure>

<guidelines>
**When to create milestones:**
- Initial v1.0 MVP shipped
- Major version releases (v2.0, v3.0)
- Significant feature milestones (v1.1, v1.2)
- Before archiving planning (capture what was shipped)

**Don't create milestones for:**
- Individual phase completions (normal workflow)
- Work in progress (wait until shipped)
- Minor bug fixes that don't constitute a release

**Stats to include:**
- Count modified files: `git diff --stat feat(XX-XX)..feat(YY-YY) | tail -1`
- Count LOC: `find . -name "*.swift" -o -name "*.ts" | xargs wc -l` (or relevant extension)
- Phase/plan/task counts from ROADMAP
- Timeline from first phase commit to last phase commit

**Git range format:**
- First commit of milestone → last commit of milestone
- Example: `feat(01-01)` → `feat(04-01)` for phases 1-4
</guidelines>
