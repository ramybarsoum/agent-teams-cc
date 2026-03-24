---
name: team:workstreams
description: Manage parallel workstreams — list, create, switch, status, progress, complete, and resume
argument-hint: "[subcommand] [args]"
allowed-tools:
  - Read
  - Write
  - Bash
---

# /team:workstreams

Manage parallel workstreams for concurrent milestone work.

## Usage

`/team:workstreams [subcommand] [args]`

### Subcommands

| Command | Description |
|---------|-------------|
| `list` | List all workstreams with status |
| `create <name>` | Create a new workstream |
| `status <name>` | Detailed status for one workstream |
| `switch <name>` | Set active workstream |
| `progress` | Progress summary across all workstreams |
| `complete <name>` | Archive a completed workstream |
| `resume <name>` | Resume work in a workstream |

## Step 1: Parse Subcommand

Parse the user's input to determine which workstream operation to perform.
If no subcommand given, default to `list`.

## Step 2: Execute Operation

### list
```bash
node "$HOME/.claude/bin/team-tools.cjs" workstream list --raw 2>/dev/null || \
ls -d .planning/workstreams/*/ 2>/dev/null || echo "No workstreams found"
```
Display workstreams in a table showing name, status, current phase, and progress.

### create
```bash
mkdir -p ".planning/workstreams/$NAME"
cat > ".planning/workstreams/$NAME/STATE.md" << 'EOF'
# Workstream: {name}
Status: active
Created: {date}
EOF
```
After creation, display path and suggest:
- `/team:new-milestone` to set up the milestone in this workstream

### status
```bash
cat ".planning/workstreams/$NAME/STATE.md" 2>/dev/null
node "$HOME/.claude/bin/team-tools.cjs" progress json --raw --cwd ".planning/workstreams/$NAME" 2>/dev/null
```

### switch
Set active workstream by writing to STATE.md root:
```bash
echo "active_workstream: $NAME" >> .planning/STATE.md
```

### progress
Show progress across all workstreams:
```bash
for ws in .planning/workstreams/*/; do
  echo "=== $(basename $ws) ==="
  cat "$ws/STATE.md" 2>/dev/null | head -5
done
```

### complete
Archive the workstream:
```bash
mkdir -p .planning/workstreams/.archive
mv ".planning/workstreams/$NAME" ".planning/workstreams/.archive/$NAME-$(date +%Y%m%d)"
```

### resume
Set workstream as active and suggest `/team:resume-work --ws <name>`.

## Step 3: Display Results

Format output into human-readable display.
