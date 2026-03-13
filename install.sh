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
AGENT_COUNT=$(ls "$SCRIPT_DIR/agents/"*.md | wc -l | tr -d ' ')
echo "    $AGENT_COUNT agents installed"

# Copy slash commands
echo "  Copying slash commands..."
cp "$SCRIPT_DIR/commands/"*.md "$CLAUDE_DIR/commands/team/"
CMD_COUNT=$(ls "$SCRIPT_DIR/commands/"*.md | wc -l | tr -d ' ')
echo "    $CMD_COUNT commands installed"

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

# Copy hooks (opt-out with AGENT_TEAMS_NO_HOOKS=1)
if [ "${AGENT_TEAMS_NO_HOOKS:-0}" != "1" ]; then
  echo "  Copying hooks..."
  mkdir -p "$CLAUDE_DIR/hooks"
  if [ -d "$SCRIPT_DIR/hooks" ]; then
    cp "$SCRIPT_DIR/hooks/"*.js "$CLAUDE_DIR/hooks/" 2>/dev/null || true
    chmod +x "$CLAUDE_DIR/hooks/team-"*.js 2>/dev/null || true
    HOOK_COUNT=$(ls "$SCRIPT_DIR/hooks/"*.js 2>/dev/null | wc -l | tr -d ' ')
    echo "    $HOOK_COUNT hooks installed (disable: AGENT_TEAMS_NO_HOOKS=1)"
  fi
else
  echo "  Hooks skipped (AGENT_TEAMS_NO_HOOKS=1)"
fi

# Install CLI tool
echo "  Installing team-tools CLI..."
mkdir -p "$CLAUDE_DIR/bin/lib"
cp "$SCRIPT_DIR/bin/team-tools.cjs" "$CLAUDE_DIR/bin/"
cp "$SCRIPT_DIR/bin/lib/"*.cjs "$CLAUDE_DIR/bin/lib/"
chmod +x "$CLAUDE_DIR/bin/team-tools.cjs"

# Add to PATH hint
if ! command -v team-tools &> /dev/null; then
  if ! echo "$PATH" | grep -q "$CLAUDE_DIR/bin"; then
    echo ""
    echo "  NOTE: Add team-tools to your PATH:"
    echo "    export PATH=\"$CLAUDE_DIR/bin:\$PATH\""
    echo "  Or create a symlink:"
    echo "    ln -sf $CLAUDE_DIR/bin/team-tools.cjs /usr/local/bin/team-tools"
  fi
fi
echo "    CLI installed (team-tools.cjs)"

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
