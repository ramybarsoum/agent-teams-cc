---
name: team:map-codebase
description: Map codebase with parallel mappers. Auto-detects monorepo services, multi-repo workspaces, or single repos.
argument-hint: "[optional: specific area or repo to map]"
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

Analyze one or more codebases with parallel mapper teammates, producing structured documentation in `.planning/codebase/`. Automatically detects workspace topology:

1. **Multi-repo workspace** (Option C): Detects sibling repos via common parent patterns (`services/`, `apps/`, `packages/`, or sibling git repos). Maps each repo independently, then synthesizes cross-repo contracts.
2. **Explicit workspace** (Option B fallback): Reads `.planning/workspace.json` for declared repo list.
3. **Single repo**: Falls back to standard 4-mapper approach for a single codebase.

**Creates per repo:**
- `.planning/codebase/{repo-name}/STACK.md`
- `.planning/codebase/{repo-name}/INTEGRATIONS.md`
- `.planning/codebase/{repo-name}/ARCHITECTURE.md`
- `.planning/codebase/{repo-name}/STRUCTURE.md`
- `.planning/codebase/{repo-name}/CONVENTIONS.md`
- `.planning/codebase/{repo-name}/TESTING.md`
- `.planning/codebase/{repo-name}/CONCERNS.md`

**Creates for multi-repo (2+ repos):**
- `.planning/codebase/CROSS-REPO-SYNTHESIS.md`

**For single repo**, documents go directly in `.planning/codebase/` (no subdirectory).

**After this command:** Run `/team:new-project` or `/team:plan-phase`.

</objective>

<process>

## Step 1: Detect Workspace Topology

```bash
# Check for explicit workspace config first (Option B)
cat .planning/workspace.json 2>/dev/null

# Auto-detect: monorepo with services/apps/packages directories
ls -d services/*/  apps/*/  packages/*/ 2>/dev/null | head -30

# Auto-detect: sibling git repos (parent directory has multiple .git children)
PARENT_DIR=$(dirname "$(pwd)")
for dir in "$PARENT_DIR"/*/; do
  if [ -d "$dir/.git" ]; then
    echo "repo: $(basename "$dir") at $dir"
  fi
done

# Check if current directory is itself a single repo
ls .git/HEAD 2>/dev/null
```

**Decision logic:**

1. If `.planning/workspace.json` exists and has repos -> use that list (Option B)
2. Else if `services/`, `apps/`, or `packages/` dirs exist with code -> monorepo mode, each service/app is a "repo"
3. Else if parent directory has 2+ sibling git repos -> multi-repo mode, each sibling is a repo
4. Else -> single repo mode

**For auto-detected multi-repo (option 2 or 3):**
- Show the detected repos to the user
- Ask: "I detected these repos. Map all of them, or select specific ones?"
- Save the detected topology to `.planning/workspace.json` for future runs

## Step 2: Pre-checks

```bash
# Check for existing codebase map
ls .planning/codebase/*.md .planning/codebase/*/*.md 2>/dev/null | head -20
```

**If codebase map exists:**
Use AskUserQuestion:
- header: "Existing Map"
- question: "Codebase map already exists. What would you like to do?"
- options:
  - "Refresh all" -- Re-map everything (overwrites existing)
  - "Skip mapping" -- Use existing map as-is

## Step 3: Setup

```bash
mkdir -p .planning/codebase
```

**For multi-repo, create per-repo directories:**
```bash
# For each detected repo
mkdir -p .planning/codebase/{repo-name}
```

Display banner:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 TEAM ► MAPPING CODEBASE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

◆ Topology: {single-repo | monorepo (N services) | multi-repo (N repos)}
◆ Repos to map: {list}
◆ Creating mapper team...
```

## Step 4: Create Team

```
TeamCreate(team_name="codebase-map", description="Parallel codebase mapping")
```

## Step 5: Spawn Mappers

### Single Repo Mode (same as before)

Spawn 4 mappers in parallel, each writing to `.planning/codebase/`:
- mapper-tech -> STACK.md, INTEGRATIONS.md
- mapper-arch -> ARCHITECTURE.md, STRUCTURE.md
- mapper-quality -> CONVENTIONS.md, TESTING.md
- mapper-concerns -> CONCERNS.md

### Multi-Repo Mode

For each repo, spawn 4 mapper teammates (all in parallel across all repos):

```
Task(team_name="codebase-map", name="mapper-{repo-name}-tech",
     subagent_type="team-mapper",
     prompt="Your focus area is: tech
Your target repo is: {repo-name}
Your target path is: {repo-absolute-path}
Write documents to: .planning/codebase/{repo-name}/

IMPORTANT: cd to {repo-absolute-path} before exploring. Only map code within that directory.

Explore the repo at the target path and write:
- .planning/codebase/{repo-name}/STACK.md (technology stack, frameworks, key dependencies)
- .planning/codebase/{repo-name}/INTEGRATIONS.md (external services, APIs, databases)

Use templates from team-mapper.md
Read your full role instructions from agents/team-mapper.md

When done, message the lead with confirmation.",
     description="{repo-name} tech mapper")
```

Repeat for arch, quality, concerns per repo. Total mappers = 4 * number of repos.

**Parallelism limit:** If more than 5 repos, batch in waves of 5 repos (20 mappers) to avoid overwhelming the system.

Display:
```
◆ Spawned {N} mapper teammates across {R} repos:
  {repo-1}:
    → mapper-{repo-1}-tech (STACK.md, INTEGRATIONS.md)
    → mapper-{repo-1}-arch (ARCHITECTURE.md, STRUCTURE.md)
    → mapper-{repo-1}-quality (CONVENTIONS.md, TESTING.md)
    → mapper-{repo-1}-concerns (CONCERNS.md)
  {repo-2}:
    → mapper-{repo-2}-tech ...
    ...
```

## Step 6: Monitor Progress

Wait for all mappers to complete. Track per-repo:
- Which mappers have reported back
- Which repos are fully mapped

When all mappers for all repos complete, continue to Step 7.

## Step 7: Cross-Repo Synthesis (multi-repo only)

**Skip this step for single repo mode.**

After all repos are mapped, spawn a synthesis teammate:

```
Task(team_name="codebase-map", name="cross-repo-synthesizer",
     subagent_type="team-mapper",
     prompt="Your focus area is: synthesis

You are synthesizing cross-repo relationships. Read the per-repo mapping documents and produce a single synthesis document.

**Repos mapped:**
{list of repo names and their .planning/codebase/{name}/ paths}

**Your task:**
1. Read STACK.md and INTEGRATIONS.md from each repo
2. Read ARCHITECTURE.md from each repo
3. Identify:
   - API contracts between repos (who calls whom, endpoints, auth)
   - Shared packages and libraries (npm packages, NuGet, pip packages used across repos)
   - Message bus / event contracts (Kafka topics, RabbitMQ queues, etc.)
   - Shared data stores (databases accessed by multiple repos)
   - Deployment boundaries (what deploys independently)
   - Cross-repo dependencies (import chains, shared types)
   - Naming/convention mismatches between repos
   - Integration risk areas (unprotected contracts, missing tests)

4. Write: .planning/codebase/CROSS-REPO-SYNTHESIS.md

Use the cross-repo-synthesis template structure.
When done, message the lead with confirmation.",
     description="Cross-repo synthesizer")
```

Wait for synthesis to complete.

## Step 8: Save Workspace Config

**For auto-detected repos (not loaded from workspace.json):**

Save the detected topology for future runs:

```bash
# Write .planning/workspace.json
```

```json
{
  "detected": "YYYY-MM-DD",
  "topology": "monorepo|multi-repo",
  "repos": [
    {
      "name": "{repo-name}",
      "path": "{relative-or-absolute-path}",
      "description": "{auto-detected from package.json/README}",
      "tags": ["{auto-detected}"]
    }
  ]
}
```

## Step 9: Verify and Commit

```bash
# Verify documents exist
for repo in {repo-list}; do
  echo "== $repo =="
  for doc in STACK INTEGRATIONS ARCHITECTURE STRUCTURE CONVENTIONS TESTING CONCERNS; do
    if [ -f ".planning/codebase/$repo/$doc.md" ]; then
      echo "  ✓ $doc.md ($(wc -l < .planning/codebase/$repo/$doc.md) lines)"
    else
      echo "  ✗ $doc.md MISSING"
    fi
  done
done

# Check synthesis (multi-repo only)
if [ -f ".planning/codebase/CROSS-REPO-SYNTHESIS.md" ]; then
  echo "✓ CROSS-REPO-SYNTHESIS.md ($(wc -l < .planning/codebase/CROSS-REPO-SYNTHESIS.md) lines)"
fi
```

If any missing: investigate with the responsible mapper.

If all present:
```bash
git add .planning/codebase/ .planning/workspace.json
git commit -m "docs: map codebase structure and conventions

Repos mapped: {list}
Documents per repo: STACK, INTEGRATIONS, ARCHITECTURE, STRUCTURE, CONVENTIONS, TESTING, CONCERNS
Cross-repo synthesis: {yes/no}
"
```

## Step 10: Cleanup and Next Steps

Shutdown all mapper teammates and synthesizer:
```
# Send shutdown to all spawned teammates
```

```
TeamDelete()
```

Display completion:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 TEAM ► CODEBASE MAPPED ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Repos Mapped

[list each repo with document count and total lines]

## Cross-Repo Synthesis

[summary of key findings: N API contracts, N shared packages, N event channels]

## Next Steps

- `/team:new-project` — Initialize project with this codebase context
- `/team:plan-phase 1` — Plan first phase (if project already initialized)
- Review `.planning/codebase/CROSS-REPO-SYNTHESIS.md` for integration insights
```

</process>
