#!/usr/bin/env bash
# Agent Teams spec compliance checker
# PostToolUse hook: fires after Edit/Write to verify changes align with active plan
# Reads current plan's files_modified and must_haves, warns on drift

set -euo pipefail

# Read hook input from stdin
HOOK_INPUT=$(cat)

# Only run in allcare project directories with active planning
case "$PWD" in
  */allcare-platform*|*/allcare-repos*|*/AllCare-repos*) ;;
  *) exit 0 ;;
esac

# Check if .planning exists
[ -d ".planning" ] || exit 0

# Extract tool info
TOOL_NAME=$(echo "$HOOK_INPUT" | jq -r '.tool_name // ""')
FILE_PATH=$(echo "$HOOK_INPUT" | jq -r '.tool_input.file_path // ""')

# Only check Edit and Write on source files (not planning docs, not config)
case "$FILE_PATH" in
  "") exit 0 ;;
  *.planning*) exit 0 ;;
  *.claude*) exit 0 ;;
  *node_modules*) exit 0 ;;
  *package-lock*) exit 0 ;;
  *.git/*) exit 0 ;;
esac

# Find active phase directory from STATE.md
STATE_FILE=".planning/STATE.md"
[ -f "$STATE_FILE" ] || exit 0

# Extract current phase number
PHASE_NUM=$(grep -oE 'Phase[: ]+([0-9]+)' "$STATE_FILE" 2>/dev/null | head -1 | grep -oE '[0-9]+' || echo "")
[ -z "$PHASE_NUM" ] && exit 0

PADDED=$(printf "%02d" "$PHASE_NUM" 2>/dev/null || echo "$PHASE_NUM")
PHASE_DIR=$(ls -d .planning/phases/${PADDED}-* 2>/dev/null | head -1)
[ -z "$PHASE_DIR" ] && exit 0

# Collect all files_modified from active plans
PLAN_FILES=""
for plan in "$PHASE_DIR"/*-PLAN.md; do
  [ -f "$plan" ] || continue
  # Check if plan has a SUMMARY (completed) — skip completed plans
  summary="${plan/PLAN/SUMMARY}"
  [ -f "$summary" ] && continue
  # Extract files_modified from frontmatter
  FILES=$(sed -n '/^files_modified:/,/^[a-z]/{ /^  - /p; }' "$plan" 2>/dev/null | sed 's/^  - //' | tr -d '"' | tr -d "'")
  PLAN_FILES="$PLAN_FILES $FILES"
done

# If no active plans, skip check
[ -z "$(echo "$PLAN_FILES" | tr -d ' ')" ] && exit 0

# Get just the filename from the modified file for flexible matching
MODIFIED_BASENAME=$(basename "$FILE_PATH")
MODIFIED_RELATIVE=$(echo "$FILE_PATH" | sed "s|^$PWD/||")

# Check if the modified file is in any active plan's files_modified
FOUND=false
for planned_file in $PLAN_FILES; do
  planned_basename=$(basename "$planned_file")
  # Match on basename or relative path
  if [ "$planned_basename" = "$MODIFIED_BASENAME" ] || \
     echo "$MODIFIED_RELATIVE" | grep -q "$planned_file" 2>/dev/null || \
     echo "$planned_file" | grep -q "$MODIFIED_BASENAME" 2>/dev/null; then
    FOUND=true
    break
  fi
done

if [ "$FOUND" = "false" ]; then
  # File not in any active plan — this might be scope drift
  # Check if it's a test file (tests are always OK)
  case "$MODIFIED_BASENAME" in
    *.test.*|*.spec.*|*_test.*|test_*|*Test.*) exit 0 ;;
  esac

  # Check if it's a deviation rule fix (config, package.json, etc)
  case "$MODIFIED_BASENAME" in
    package.json|tsconfig.json|*.config.*|*.env*) exit 0 ;;
  esac

  # Emit warning context
  WARNING="SPEC DRIFT WARNING: File '$MODIFIED_RELATIVE' is not in any active plan's files_modified list. This may indicate scope drift. If this change is necessary (bug fix, missing dependency), document it as a deviation in SUMMARY.md. If not, consider whether this change belongs in the current task."

  # Escape for JSON
  escape_for_json() {
    local s="$1"
    s="${s//\\/\\\\}"
    s="${s//\"/\\\"}"
    s="${s//$'\n'/\\n}"
    s="${s//$'\r'/\\r}"
    s="${s//$'\t'/\\t}"
    printf '%s' "$s"
  }

  ESCAPED=$(escape_for_json "$WARNING")

  printf '{"hookSpecificOutput":{"hookEventName":"PostToolUse","additionalContext":"%s"}}\n' "$ESCAPED"
  exit 0
fi

# File IS in plan — now check for stub patterns in the new content
if [ "$TOOL_NAME" = "Write" ]; then
  CONTENT=$(echo "$HOOK_INPUT" | jq -r '.tool_input.content // ""')
elif [ "$TOOL_NAME" = "Edit" ]; then
  CONTENT=$(echo "$HOOK_INPUT" | jq -r '.tool_input.new_string // ""')
else
  exit 0
fi

# Quick stub detection on the written/edited content
STUB_WARNINGS=""

# Check for TODO/FIXME/placeholder in new content
if echo "$CONTENT" | grep -qiE 'TODO|FIXME|placeholder|not implemented|coming soon'; then
  STUB_WARNINGS="${STUB_WARNINGS}Contains TODO/FIXME/placeholder markers. "
fi

# Check for empty returns in new content
if echo "$CONTENT" | grep -qE 'return null|return \{\}|return \[\]|=> \{\}'; then
  STUB_WARNINGS="${STUB_WARNINGS}Contains empty/stub return values. "
fi

# Check for console.log-only implementations
if echo "$CONTENT" | grep -q 'console.log' && ! echo "$CONTENT" | grep -qE 'fetch|axios|prisma|db\.|query|mutation'; then
  # Has console.log but no real logic — might be stub
  LINES=$(echo "$CONTENT" | wc -l | tr -d ' ')
  if [ "$LINES" -lt 10 ]; then
    STUB_WARNINGS="${STUB_WARNINGS}Short implementation with only console.log — possible stub. "
  fi
fi

if [ -n "$STUB_WARNINGS" ]; then
  WARNING="STUB DETECTION WARNING in '$MODIFIED_RELATIVE': ${STUB_WARNINGS}The verifier will flag these. Ensure this is intentional (e.g., TDD RED phase) or replace with real implementation before marking task complete."

  escape_for_json() {
    local s="$1"
    s="${s//\\/\\\\}"
    s="${s//\"/\\\"}"
    s="${s//$'\n'/\\n}"
    s="${s//$'\r'/\\r}"
    s="${s//$'\t'/\\t}"
    printf '%s' "$s"
  }

  ESCAPED=$(escape_for_json "$WARNING")
  printf '{"hookSpecificOutput":{"hookEventName":"PostToolUse","additionalContext":"%s"}}\n' "$ESCAPED"
  exit 0
fi

# All good — file is in plan and content looks substantive
exit 0
