---
name: team:note
description: Zero-friction idea capture. Append, list, or promote notes to todos.
argument-hint: "<text> | list | promote <N>"
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
---

<objective>
Zero-friction idea capture — one Write call, one confirmation line.

Three subcommands:
- **append** (default): Save a timestamped note file. No questions, no formatting.
- **list**: Show all notes from project scope.
- **promote**: Convert a note into a structured todo.

Runs inline — no Task, no AskUserQuestion, no Bash.
</objective>

<process>

**Parse $ARGUMENTS to determine mode:**

### If $ARGUMENTS is empty or "list":
```bash
find .planning/notes -name "*.md" 2>/dev/null | sort -r | head -20
```
Show a table of all notes with timestamps and first line of content.

### If $ARGUMENTS starts with "promote N":
Find note file N, read its content, create a structured todo entry:
- Write to `.planning/todos/pending/{slug}.md`
- Remove from notes

### Otherwise (default: append):
```bash
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
SLUG=$(echo "$ARGUMENTS" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr -dc 'a-z0-9-' | cut -c1-50)
mkdir -p .planning/notes
```

Write to `.planning/notes/${TIMESTAMP}-${SLUG}.md`:
```markdown
# Note: {first ~60 chars of ARGUMENTS}

**Captured:** {timestamp}

{full ARGUMENTS content}
```

Report: `Note saved: .planning/notes/{filename}`

</process>

<notes>
- Notes are NOT phase-scoped — they exist independently of the roadmap
- Lighter weight than /team:add-todo — no structure required
- Promote mature notes to `/team:add-todo` or `/team:add-backlog`
</notes>
