---
name: team:do
description: Route freeform text to the right team command automatically
argument-hint: "<description of what you want to do>"
allowed-tools:
  - Read
  - Bash
  - AskUserQuestion
---

<objective>
Analyze freeform natural language input and dispatch to the most appropriate Agent Teams command.

Acts as a smart dispatcher — never does the work itself. Matches intent to the best `/team:*` command using routing rules, confirms the match, then hands off.

Use when you know what you want but don't know which `/team:*` command to run.
</objective>

<routing_table>

| Intent Keywords | Route To |
|-----------------|---------|
| "start project", "new project", "initialize" | `/team:new-project` |
| "start milestone", "new milestone" | `/team:new-milestone` |
| "plan phase N", "plan the next phase" | `/team:plan-phase N` |
| "discuss phase N", "think about phase" | `/team:discuss-phase N` |
| "execute phase N", "run phase", "implement" | `/team:execute-phase N` |
| "verify phase N", "check phase" | `/team:verify-phase N` |
| "quick task", "small change", "fix this" | `/team:quick` |
| "trivial", "typo", "one-liner" | `/team:fast` |
| "autonomous", "run everything", "run all phases" | `/team:autonomous` |
| "check progress", "how far", "status" | `/team:progress` |
| "add phase", "new phase" | `/team:add-phase` |
| "insert phase", "urgent fix" | `/team:insert-phase` |
| "remove phase", "delete phase" | `/team:remove-phase` |
| "debug", "broken", "failing", "investigate" | `/team:debug` |
| "forensics", "post-mortem", "what went wrong" | `/team:forensics` |
| "resume", "continue", "pick up" | `/team:resume-work` |
| "pause", "save state", "stopping" | `/team:pause-work` |
| "backlog", "parking lot", "save idea" | `/team:add-backlog` |
| "review backlog", "promote backlog" | `/team:review-backlog` |
| "note", "capture idea", "remember this" | `/team:note` |
| "research phase N" | `/team:research-phase N` |
| "ship", "create PR", "pull request" | `/team:ship` |
| "UI", "design contract", "UI spec" | `/team:ui-phase` |
| "UI review", "visual audit" | `/team:ui-review` |
| "audit milestone", "check milestone" | `/team:audit-milestone` |
| "complete milestone", "archive milestone" | `/team:complete-milestone` |
| "stats", "statistics", "metrics" | `/team:stats` |
| "session report", "what did we do" | `/team:session-report` |
| "settings", "configure", "toggle" | `/team:settings` |
| "map codebase", "analyze codebase" | `/team:map-codebase` |

</routing_table>

<process>

## Step 1: Read Context

```bash
cat .planning/STATE.md 2>/dev/null | head -30
```

Use current project state to disambiguate (e.g., "run next phase" maps to the actual next phase number).

## Step 2: Analyze Intent

Parse `$ARGUMENTS` for intent keywords. Match against routing table.

If ambiguous (2+ possible routes), pick the most likely and show alternatives.

## Step 3: Confirm and Route

Show the user:
```
Intent: {what you understood}
Routing to: /team:{command} {args}

[Confirm] or tell me what you actually want
```

Wait for confirmation (or proceed if intent is unambiguous).

## Step 4: Hand Off

Invoke the matched command directly.

</process>
