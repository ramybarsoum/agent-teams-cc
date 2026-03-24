---
name: team:audit-uat
description: Cross-phase audit of all outstanding UAT and verification items
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
---

<objective>
Scan all phases for pending, skipped, blocked, and human_needed UAT items.
Cross-reference against codebase to detect stale documentation.
Produce prioritized human test plan.
</objective>

<process>

## Step 1: Discover UAT Artifacts

```bash
# Find all UAT and verification files
find .planning/phases -name "*-UAT.md" 2>/dev/null
find .planning/phases -name "*-VERIFICATION.md" 2>/dev/null
```

## Step 2: Scan for Pending Items

For each UAT.md file found:
- Extract all items with status: `pending`, `skipped`, `blocked`, `human_needed`
- Note which phase each item belongs to
- Check if the related code still exists (stale detection)

For each VERIFICATION.md file found:
- Extract any `FAILED` or `PARTIAL` verification items
- Note unresolved gaps

## Step 3: Cross-Reference with Codebase

For each pending UAT item:
```bash
# Check if referenced files/functions still exist
grep -r "{feature_keyword}" src/ 2>/dev/null | head -5
```

Flag items where:
- The referenced code no longer exists (stale)
- The feature was modified since the UAT was written

## Step 4: Prioritize

Group findings by severity:
1. **Critical** — Phase marked complete but VERIFICATION.md shows FAILED
2. **High** — human_needed items blocking merge/deploy
3. **Medium** — blocked items with unknown resolution
4. **Low** — skipped items that may need follow-up

## Step 5: Generate Report

Output a structured report:

```markdown
## UAT Audit Report

**Date:** {today}
**Phases Scanned:** {N}

### Critical (requires immediate attention)
{list with phase, item, reason}

### High Priority
{list}

### Medium Priority
{list}

### Low Priority / Stale
{list}

### Recommended Actions
1. {action}
2. {action}
```

## Step 6: Offer Next Steps

Ask if user wants to:
1. Create a consolidated UAT task list
2. Plan fix phases for critical gaps (`/team:plan-milestone-gaps`)
3. Mark stale items as resolved

</process>
