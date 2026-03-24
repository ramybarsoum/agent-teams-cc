---
name: team:thread
description: Manage persistent context threads for cross-session work
argument-hint: "[name | description]"
allowed-tools:
  - Read
  - Write
  - Bash
---

<objective>
Create, list, or resume persistent context threads. Threads are lightweight
cross-session knowledge stores for work that spans multiple sessions but
doesn't belong to any specific phase.
</objective>

<process>

**Parse $ARGUMENTS to determine mode:**

### If no arguments or $ARGUMENTS is "list":

List all threads:
```bash
ls .planning/threads/*.md 2>/dev/null
```

For each thread, read first few lines to show title and status:
```
## Active Threads

| Thread | Status | Last Updated |
|--------|--------|-------------|
| fix-deploy-key-auth | OPEN | 2026-03-15 |
| pasta-tcp-timeout | RESOLVED | 2026-03-12 |
```

If no threads: `No threads found. Create one with: /team:thread <description>`

### If $ARGUMENTS matches an existing thread name:

Resume the thread:
```bash
cat ".planning/threads/${THREAD_NAME}.md"
```

Display content and ask what to work on next.
Update status to `IN PROGRESS` if it was `OPEN`.

### If $ARGUMENTS is a new description:

Create a new thread:

1. Generate slug:
   ```bash
   SLUG=$(node "$HOME/.claude/bin/team-tools.cjs" generate-slug "$ARGUMENTS" 2>/dev/null || \
   echo "$ARGUMENTS" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr -dc 'a-z0-9-' | cut -c1-50)
   ```

2. Create directory:
   ```bash
   mkdir -p .planning/threads
   ```

3. Write thread file to `.planning/threads/${SLUG}.md`:
   ```markdown
   # Thread: {description}

   ## Status: OPEN

   ## Goal

   {description}

   ## Context

   *Created from conversation on {today's date}.*

   ## References

   - *(add links, file paths, or issue numbers)*

   ## Next Steps

   - *(what the next session should do first)*
   ```

4. Extract relevant context from current conversation (errors, snippets, findings).

5. Commit:
   ```bash
   node "$HOME/.claude/bin/team-tools.cjs" commit "docs: create thread — ${ARGUMENTS}" \
     --files ".planning/threads/${SLUG}.md" 2>/dev/null || \
   git add ".planning/threads/${SLUG}.md" && git commit -m "docs: create thread — ${ARGUMENTS}"
   ```

6. Report:
   ```
   Thread Created: {slug}
   File: .planning/threads/{slug}.md

   Resume anytime with: /team:thread {slug}
   ```

</process>

<notes>
- Threads are NOT phase-scoped — independent of the roadmap
- Lighter weight than /team:pause-work — no phase state, no plan context
- Promote mature threads: /team:add-phase or /team:add-backlog
</notes>
