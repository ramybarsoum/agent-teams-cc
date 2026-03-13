---
name: team:map-codebase
description: Map existing codebase using parallel Agent Teams mappers
argument-hint: "[optional: specific area to map]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - Task
  - TeamCreate
  - TeamDelete
  - SendMessage
  - TodoWrite
---

<objective>

Analyze an existing codebase with 4 parallel mapper teammates, producing structured documentation in `.planning/codebase/`. Maps the codebase with parallel mapper teammates.

**Creates:**
- `.planning/codebase/STACK.md` -- Technology stack
- `.planning/codebase/INTEGRATIONS.md` -- External integrations
- `.planning/codebase/ARCHITECTURE.md` -- System architecture
- `.planning/codebase/STRUCTURE.md` -- Directory/file structure
- `.planning/codebase/CONVENTIONS.md` -- Coding conventions
- `.planning/codebase/TESTING.md` -- Testing patterns
- `.planning/codebase/CONCERNS.md` -- Technical debt and issues

**After this command:** Run `/team:new-project` or `/team:plan-phase`.

</objective>

<process>

## Step 1: Pre-checks

```bash
# Check for existing codebase map
ls .planning/codebase/*.md 2>/dev/null | wc -l

# Verify this is a code repository
CODE_FILES=$(find . -name "*.ts" -o -name "*.js" -o -name "*.py" -o -name "*.go" -o -name "*.rs" -o -name "*.cs" -o -name "*.java" 2>/dev/null | grep -v node_modules | grep -v .git | head -5)
```

**If codebase map exists:**
Use AskUserQuestion:
- header: "Existing Map"
- question: "Codebase map already exists. What would you like to do?"
- options:
  - "Refresh all" -- Re-map everything (overwrites existing)
  - "Skip mapping" -- Use existing map as-is

**If no code files found:** Error - no codebase to map.

## Step 2: Setup

```bash
mkdir -p .planning/codebase
```

Display banner:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 TEAM ► MAPPING CODEBASE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

◆ Creating mapper team...
```

## Step 3: Create Team

```
TeamCreate(team_name="codebase-map", description="Parallel codebase mapping")
```

## Step 4: Create Shared Task List

Create 4 tasks (no dependencies, all can run in parallel):

```
TaskCreate("Map tech stack and integrations", status="pending")
TaskCreate("Map architecture and structure", status="pending")
TaskCreate("Map conventions and testing", status="pending")
TaskCreate("Map concerns and tech debt", status="pending")
```

## Step 5: Spawn 4 Mapper Teammates

Spawn all 4 in parallel:

```
Task(team_name="codebase-map", name="mapper-tech",
     subagent_type="team-mapper",
     prompt="Your focus area is: tech

Explore the codebase and write:
- .planning/codebase/STACK.md (technology stack, frameworks, key dependencies)
- .planning/codebase/INTEGRATIONS.md (external services, APIs, databases)

Use templates from the templates defined in team-mapper.md
Read your full role instructions from agents/team-mapper.md

Claim the 'Map tech stack and integrations' task from the team task list.
When done, mark your task completed and message the lead.",
     description="Tech stack mapper")

Task(team_name="codebase-map", name="mapper-arch",
     subagent_type="team-mapper",
     prompt="Your focus area is: arch

Explore the codebase and write:
- .planning/codebase/ARCHITECTURE.md (system architecture, layers, data flow)
- .planning/codebase/STRUCTURE.md (directory layout, file locations, where to add new code)

Use templates from the templates defined in team-mapper.md
Read your full role instructions from agents/team-mapper.md

Claim the 'Map architecture and structure' task from the team task list.
When done, mark your task completed and message the lead.",
     description="Architecture mapper")

Task(team_name="codebase-map", name="mapper-quality",
     subagent_type="team-mapper",
     prompt="Your focus area is: quality

Explore the codebase and write:
- .planning/codebase/CONVENTIONS.md (naming, code style, patterns, imports)
- .planning/codebase/TESTING.md (test framework, patterns, coverage, fixtures)

Use templates from the templates defined in team-mapper.md
Read your full role instructions from agents/team-mapper.md

Claim the 'Map conventions and testing' task from the team task list.
When done, mark your task completed and message the lead.",
     description="Quality mapper")

Task(team_name="codebase-map", name="mapper-concerns",
     subagent_type="team-mapper",
     prompt="Your focus area is: concerns

Explore the codebase and write:
- .planning/codebase/CONCERNS.md (tech debt, known bugs, security issues, performance, fragile areas)

Use templates from the templates defined in team-mapper.md
Read your full role instructions from agents/team-mapper.md

Claim the 'Map concerns and tech debt' task from the team task list.
When done, mark your task completed and message the lead.",
     description="Concerns mapper")
```

Display:
```
◆ Spawned 4 mapper teammates:
  → mapper-tech (STACK.md, INTEGRATIONS.md)
  → mapper-arch (ARCHITECTURE.md, STRUCTURE.md)
  → mapper-quality (CONVENTIONS.md, TESTING.md)
  → mapper-concerns (CONCERNS.md)
```

## Step 6: Monitor Progress

Wait for all 4 teammates to complete. As each messages back:
- Acknowledge receipt
- Track which are done

When all 4 complete, continue to Step 7.

## Step 7: Verify and Commit

```bash
# Verify all 7 documents exist
for doc in STACK INTEGRATIONS ARCHITECTURE STRUCTURE CONVENTIONS TESTING CONCERNS; do
  if [ -f ".planning/codebase/$doc.md" ]; then
    echo "✓ $doc.md ($(wc -l < .planning/codebase/$doc.md) lines)"
  else
    echo "✗ $doc.md MISSING"
  fi
done
```

If any missing: investigate with the responsible mapper.

If all present:
```bash
git add .planning/codebase/
git commit -m "docs: map codebase structure and conventions

Documents created:
- STACK.md, INTEGRATIONS.md (tech)
- ARCHITECTURE.md, STRUCTURE.md (architecture)
- CONVENTIONS.md, TESTING.md (quality)
- CONCERNS.md (issues)
"
```

## Step 8: Cleanup and Next Steps

Shutdown all mapper teammates:
```
SendMessage(type="shutdown_request", recipient="mapper-tech")
SendMessage(type="shutdown_request", recipient="mapper-arch")
SendMessage(type="shutdown_request", recipient="mapper-quality")
SendMessage(type="shutdown_request", recipient="mapper-concerns")
```

Wait for shutdown confirmations, then:
```
TeamDelete()
```

Display completion:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 TEAM ► CODEBASE MAPPED ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Documents Created

[list each with line count]

## Next Steps

- `/team:new-project` — Initialize project with this codebase context
- `/team:plan-phase 1` — Plan first phase (if project already initialized)
```

</process>
