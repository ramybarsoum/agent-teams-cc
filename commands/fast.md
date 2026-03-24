---
name: team:fast
description: Execute a trivial task inline — no subagents, no planning overhead
argument-hint: "[task description]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
---

<objective>
Execute a trivial task directly in the current context without spawning subagents
or generating PLAN.md files. For tasks too small to justify planning overhead:
typo fixes, config changes, small refactors, forgotten commits, simple additions.

This is NOT a replacement for /team:quick — use /team:quick for anything that
needs research, multi-step planning, or verification. /team:fast is for tasks
you could describe in one sentence and execute in under 2 minutes.
</objective>

<process>

## Step 1: Confirm Scope

If the task seems larger than "one sentence, under 2 minutes", warn:
```
This looks like it might need /team:quick instead.
fast = typo/config/single-file. quick = multi-step/verification needed.
Proceed with fast anyway? [Y/n]
```

## Step 2: Execute Inline

Perform the task directly using Read/Edit/Write/Bash tools.
No PLAN.md. No SUMMARY.md. No subagents.

## Step 3: Commit

```bash
git add -p  # stage only relevant changes
git commit -m "fix: {task description}"
```

Or if no git needed, just confirm completion.

## Step 4: Report

One-line confirmation:
```
Done: {what was changed} in {file}
```

</process>

<notes>
- No planning artifacts created
- No STATE.md update
- For HIPAA projects: verify no PHI in changed files before commit
</notes>
