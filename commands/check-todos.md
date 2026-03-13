---
name: team:check-todos
description: List pending todos with details and action routing
argument-hint: "[area-filter]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
---

<objective>
List all pending todos, allow selection, load full context, and route to appropriate action.
</objective>

<process>

## Step 1: Load Todos

```bash
ls .planning/todos/pending/*.md 2>/dev/null
```

If no todos:
```
No pending todos.

Todos are captured during work sessions with /team:add-todo.

- `/team:progress` — continue with current phase
- `/team:add-todo` — add a todo now
```
Exit.

## Step 2: Apply Filter

If area argument provided (e.g., `/team:check-todos api`), filter by area field in frontmatter.

## Step 3: List Todos

Parse each file's frontmatter for title, area, and created date.

```
Pending Todos:

1. Add auth token refresh (api, 2d ago)
2. Fix modal z-index issue (ui, 1d ago)
3. Refactor database connection pool (database, 5h ago)

---

Reply with a number to view details, or:
- /team:check-todos [area] to filter
- q to exit
```

## Step 4: Handle Selection

Read full todo file for selected number. Display:

```
## [title]

**Area:** [area]
**Created:** [date]
**Files:** [list]

### Problem
[problem content]

### Solution
[solution content]
```

## Step 5: Check Roadmap Match

```bash
cat .planning/ROADMAP.md 2>/dev/null
```

Check if todo's area or files match an upcoming phase.

## Step 6: Offer Actions

AskUserQuestion:
- "Work on it now" — move to done, start working
- "Add to phase plan" / "Create a phase" — depending on roadmap match
- "Brainstorm approach" — think through before deciding
- "Put it back" — return to list

## Step 7: Execute Action

**Work on it now:**
```bash
mv ".planning/todos/pending/[filename]" ".planning/todos/done/"
git add .planning/todos/ .planning/STATE.md
git commit -m "docs: start work on todo - [title]"
```

**Create a phase:** Suggest `/team:add-phase [description]`
**Brainstorm:** Start discussion about approaches.
**Put it back:** Return to list.

</process>
