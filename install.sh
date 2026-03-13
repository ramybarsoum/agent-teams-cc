#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CLAUDE_DIR="$HOME/.claude"

echo ""
echo "  Agent Teams for Claude Code"
echo "  Installing to $CLAUDE_DIR"
echo ""

# Create directories
mkdir -p "$CLAUDE_DIR/agents"
mkdir -p "$CLAUDE_DIR/commands/team"

# Copy agent definitions
echo "  Copying agent definitions..."
cp "$SCRIPT_DIR/agents/"*.md "$CLAUDE_DIR/agents/"
echo "    10 agents installed"

# Copy slash commands
echo "  Copying slash commands..."
cp "$SCRIPT_DIR/commands/"*.md "$CLAUDE_DIR/commands/team/"
echo "    6 commands installed"

# Copy templates
echo "  Copying templates..."
mkdir -p "$CLAUDE_DIR/templates/agent-teams"
mkdir -p "$CLAUDE_DIR/templates/agent-teams/research-project"
cp "$SCRIPT_DIR/templates/"*.md "$CLAUDE_DIR/templates/agent-teams/" 2>/dev/null || true
cp "$SCRIPT_DIR/templates/research-project/"*.md "$CLAUDE_DIR/templates/agent-teams/research-project/" 2>/dev/null || true

# Copy references
echo "  Copying references..."
mkdir -p "$CLAUDE_DIR/references/agent-teams"
cp "$SCRIPT_DIR/references/"*.md "$CLAUDE_DIR/references/agent-teams/" 2>/dev/null || true

# Check for Agent Teams env var
SETTINGS_FILE="$CLAUDE_DIR/settings.json"
if [ -f "$SETTINGS_FILE" ]; then
  if grep -q "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS" "$SETTINGS_FILE" 2>/dev/null; then
    echo ""
    echo "  Agent Teams env var already configured."
  else
    echo ""
    echo "  NOTE: Add this to $SETTINGS_FILE to enable Agent Teams:"
    echo ""
    echo '    "env": {'
    echo '      "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"'
    echo '    }'
  fi
else
  echo ""
  echo "  NOTE: Create $SETTINGS_FILE with:"
  echo ""
  echo '  {'
  echo '    "env": {'
  echo '      "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"'
  echo '    }'
  echo '  }'
fi

echo ""
echo "  Done. Run /team:help in Claude Code to get started."
echo ""
