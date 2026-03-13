---
name: team:add-todo
description: Capture a task or idea from conversation as a structured todo
argument-hint: "[description]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
---

<objective>
Capture an idea, task, or issue that surfaces during a session as a structured todo. Enables "thought -> capture -> continue" flow without losing context.
</objective>

<process>

## Step 1: Initialize

```bash
mkdir -p .planning/todos/pending .planning/todos/done
ls .planning/todos/pending/*.md 2>/dev/null | wc -l
```

## Step 2: Extract Content

**With arguments:** Use as the title.
**Without arguments:** Analyze recent conversation to extract the task, relevant file paths, and technical details.

Formulate:
- `title`: 3-10 word descriptive title (action verb preferred)
- `problem`: What's wrong or why this is needed
- `solution`: Approach hints or "TBD"
- `files`: Relevant paths from conversation

## Step 3: Infer Area

| Path pattern | Area |
|---|---|
| `src/api/*` | api |
| `src/components/*` | ui |
| `src/auth/*` | auth |
| `tests/*` | testing |
| `.planning/*` | planning |
| No files | general |

## Step 4: Check Duplicates

```bash
grep -l -i "[key words]" .planning/todos/pending/*.md 2>/dev/null
```

If potential duplicate found, ask: Skip / Replace / Add anyway.

## Step 5: Create File

Generate slug and date:
```bash
DATE=$(date +%Y-%m-%d)
SLUG=$(echo "$TITLE" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | head -c 40)
```

Write to `.planning/todos/pending/${DATE}-${SLUG}.md`:

```markdown
---
created: [timestamp]
title: [title]
area: [area]
files:
  - [file:lines]
---

## Problem

[problem description]

## Solution

[approach hints or "TBD"]
```

## Step 6: Update STATE.md

Update "Pending Todos" section with new count.

## Step 7: Commit

```bash
git add ".planning/todos/pending/${DATE}-${SLUG}.md" .planning/STATE.md
git commit -m "docs: capture todo - ${TITLE}"
```

```
Todo saved: .planning/todos/pending/${DATE}-${SLUG}.md

  ${TITLE}
  Area: ${AREA}
  Files: ${COUNT} referenced

Continue with current work, or /team:check-todos to review all.
```

</process>
