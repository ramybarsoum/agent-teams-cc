---
name: team:list-workspaces
description: List active team workspaces and their status
allowed-tools:
  - Read
  - Bash
---

<objective>
List all active workspaces with their status, active phase, and repo count.
Workspaces live in `.planning/workstreams/` or `~/team-workspaces/`.
</objective>

<process>

## Step 1: Find Workspaces

```bash
# Local workstreams in current project
ls -d .planning/workstreams/*/ 2>/dev/null

# Global team workspaces
ls -d "$HOME/team-workspaces"/*/ 2>/dev/null

# Also check for GSD-style workspaces (shared config)
ls -d "$HOME/gsd-workspaces"/*/ 2>/dev/null
```

## Step 2: Read Each Workspace State

For each workspace found:
```bash
cat "{workspace}/STATE.md" 2>/dev/null | head -10
```

## Step 3: Display Table

```
## Active Workspaces

| Workspace | Location | Status | Current Phase | Progress |
|-----------|----------|--------|---------------|---------|
| {name} | {path} | active | Phase 3 | 60% |
| {name} | {path} | paused | Phase 1 | 20% |

Total: {N} workspaces
```

If no workspaces:
```
No workspaces found.

Create one with: /team:new-workspace <name>
Or use workstreams: /team:workstreams create <name>
```

## Step 4: Offer Actions

Show quick actions:
- Switch to workspace: `/team:workstreams switch <name>`
- Create new: `/team:new-workspace`
- Remove: `/team:remove-workspace <name>`

</process>
