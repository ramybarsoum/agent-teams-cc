# Contributing to Agent Teams

## How to Contribute

1. **Fork** the repository
2. **Create a branch** from `main` (`git checkout -b feature/your-feature`)
3. **Make your changes** following the guidelines below
4. **Test** by running commands in Claude Code (see Testing section)
5. **Submit a Pull Request** with a clear description of what changed and why

## File Formats

### Agent Files (`agents/*.md`)

Agent files define teammate behavior. Each file uses YAML frontmatter followed by XML-structured sections.

**Frontmatter:**

```yaml
---
name: team-your-agent
description: One-line description of what this agent does. Mention what spawns it.
tools: Read, Write, Edit, Bash, Grep, Glob
color: yellow
---
```

- `name`: Must start with `team-` prefix
- `description`: Keep it under 120 characters. State the purpose and the spawning command.
- `tools`: List only the tools this agent needs. Fewer tools = smaller context footprint.
- `color`: Pick from yellow, green, purple, orange, blue, red. Helps distinguish agents in logs.

**Body structure (XML sections):**

```xml
<role>
What this agent does, when it's spawned, core responsibilities.
Include "Agent Teams capabilities" note listing: CLAUDE.md auto-loaded,
direct disk access, SendMessage for status updates.
</role>

<project_context>
How to discover and use project-specific instructions.
Read CLAUDE.md, check for skills directories, load relevant rules.
</project_context>

<process>
Step-by-step workflow using <step name="step_name"> elements.
Each step should be self-contained and clearly sequenced.
</process>

<structured_returns>
Define the exact output format this agent produces.
Use markdown code blocks to show the template.
</structured_returns>

<success_criteria>
Checklist of conditions that must be true when the agent completes.
Use markdown checkboxes.
</success_criteria>
```

**Key patterns to follow:**

- Use `SendMessage` to report status to the lead session. Example: "Use SendMessage to notify the lead that verification is complete."
- Reference CLAUDE.md auto-loading. Teammates get project context automatically.
- Read files directly from disk. No special tooling needed.
- Persist state in `.planning/` directory files, not in conversation context.
- Be prescriptive. Write "Create the file at X" not "You might want to create a file."
- Include concrete examples. Show exact file paths, command syntax, output formats.

**What NOT to include:**

- References to external CLI tools or custom binaries
- Personal file paths (`/Users/someone/...`)
- `files_to_read` handling blocks (teammates read files directly)
- Assumptions about specific project structures unless documenting them as discovery steps

### Command Files (`commands/*.md`)

Command files define slash commands (`/team:command-name`). They use YAML frontmatter followed by an objective and process.

**Frontmatter:**

```yaml
---
name: command-name
description: One-line description shown in command help
---
```

**Body structure:**

```markdown
# /team:command-name

## Objective

What this command accomplishes in 2-3 sentences.

## Arguments

- `$ARGUMENTS` - What the user passes (e.g., phase number)

## Process

### Step 1: [Name]

What to do first. Include exact commands and tool calls.

### Step 2: [Name]

What to do next. Specify teammate spawning with role files.

### Step 3: [Name]

How to collect results and report back.
```

**Key patterns:**

- Commands orchestrate teammates. They spawn agents, coordinate parallel work, collect results.
- Use `Bash(CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1)` environment references when documenting teammate spawning.
- Define clear handoff points between teammates.
- Specify what each teammate receives as input and what it produces as output.

## Style Guide

**Be prescriptive, not descriptive.** Write instructions that tell agents what to do, not descriptions of what they could do.

```
Good: "Write SUMMARY.md to .planning/research/SUMMARY.md"
Bad:  "You may want to write a summary file somewhere in the planning directory"
```

**Include file paths.** Always use backtick-formatted paths.

```
Good: "Read `.planning/ROADMAP.md` to extract phase goals"
Bad:  "Read the roadmap file"
```

**Show exact output formats.** Use markdown code blocks with complete examples.

```
Good:
  ## VERIFICATION PASSED
  **Phase:** 2 - Authentication
  **Plans verified:** 3
  **Status:** All checks passed

Bad:
  Return a summary of the verification results.
```

**Use step-based process flows.** Break complex workflows into named steps.

```xml
<step name="load_context">
Read the planning files and extract current state.
</step>

<step name="analyze">
Run analysis based on loaded context.
</step>
```

**Keep agents focused.** Each agent should do one thing well. If an agent definition exceeds 800 lines, consider splitting responsibilities.

**No filler language.** Cut "please," "you might want to," "consider," and hedging phrases. Direct instructions only.

## Testing

There is no automated test suite. Test your changes by running them in Claude Code with Agent Teams enabled.

**Setup:**

1. Install Agent Teams: `bash install.sh`
2. Ensure the env var is set in `~/.claude/settings.json`:
   ```json
   {
     "env": {
       "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
     }
   }
   ```

**Testing an agent change:**

1. Modify the agent file in `agents/`
2. Run `bash install.sh` to copy it to `~/.claude/agents/`
3. Open Claude Code in a test project
4. Run the command that spawns your agent (e.g., `/team:map-codebase` for mapper changes)
5. Verify the agent produces correct output format and follows its process steps

**Testing a command change:**

1. Modify the command file in `commands/`
2. Run `bash install.sh` to copy it to `~/.claude/commands/team/`
3. Open Claude Code in a test project
4. Run the command (e.g., `/team:plan-phase 1`)
5. Verify teammate orchestration works as documented

**What to check:**

- Agent produces output matching its `<structured_returns>` section
- Files are written to correct locations in `.planning/`
- SendMessage calls report meaningful status to the lead
- No references to missing tools, external binaries, or hardcoded paths
- CLAUDE.md project context is used when available

## Pull Request Guidelines

- One agent or command per PR when possible. Bundled changes are harder to review.
- Include a brief test report: what command you ran, what project you tested against, what the output looked like.
- If adding a new agent, also add a command that spawns it (or update an existing command).
- If changing structured return formats, check that consuming commands still parse the output correctly.
