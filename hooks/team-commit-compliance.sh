#!/usr/bin/env bash
# Agent Teams commit compliance checker
# PostToolUse hook: fires after Bash to check git commits align with plan conventions
# Verifies commit message format, detects unplanned file changes in commits

set -euo pipefail

HOOK_INPUT=$(cat)

# Only run in allcare project directories
case "$PWD" in
  */allcare-platform*|*/allcare-repos*|*/AllCare-repos*) ;;
  *) exit 0 ;;
esac

[ -d ".planning" ] || exit 0

# Extract command
COMMAND=$(echo "$HOOK_INPUT" | jq -r '.tool_input.command // ""')
EXIT_CODE=$(echo "$HOOK_INPUT" | jq -r '.tool_response.exitCode // "0"')

# Only check successful git commits
echo "$COMMAND" | grep -q "git commit" || exit 0
[ "$EXIT_CODE" = "0" ] || exit 0

# Don't check planning doc commits
echo "$COMMAND" | grep -q "docs(" && exit 0

# Get the last commit info
LAST_COMMIT_MSG=$(git log -1 --pretty=%s 2>/dev/null || echo "")
LAST_COMMIT_FILES=$(git diff-tree --no-commit-id --name-only -r HEAD 2>/dev/null || echo "")

[ -z "$LAST_COMMIT_MSG" ] && exit 0

WARNINGS=""

# Check commit message format: should be type(phase-plan): description
if ! echo "$LAST_COMMIT_MSG" | grep -qE '^(feat|fix|test|refactor|chore|docs)\('; then
  WARNINGS="${WARNINGS}Commit message does not follow format: type(phase-plan): description. "
fi

# Check for phase-plan reference in commit
if ! echo "$LAST_COMMIT_MSG" | grep -qE '\([0-9]+-[0-9]+\)'; then
  # Not a phase-plan commit — might be OK for non-pipeline work
  # Only warn if we're in active execution (STATE.md shows executing)
  STATUS=$(grep -oE 'Status: .*' .planning/STATE.md 2>/dev/null | head -1 || echo "")
  if echo "$STATUS" | grep -qiE 'execut|in.progress'; then
    WARNINGS="${WARNINGS}Commit during active execution missing phase-plan reference. "
  fi
fi

# Check if committed files include any that shouldn't be committed
for file in $LAST_COMMIT_FILES; do
  case "$file" in
    .env|.env.local|*.key|*.pem|*credentials*|*secret*)
      WARNINGS="${WARNINGS}SECURITY: Committed potentially sensitive file '$file'. "
      ;;
  esac
done

# Check for large commits (>15 files might indicate accidental 'git add .')
FILE_COUNT=$(echo "$LAST_COMMIT_FILES" | wc -l | tr -d ' ')
if [ "$FILE_COUNT" -gt 15 ]; then
  WARNINGS="${WARNINGS}Large commit ($FILE_COUNT files) — verify no unintended files were staged. Expected atomic per-task commits. "
fi

# Check for missing test commits in TDD flow
# If last commit was feat() but no preceding test() commit in last 3 commits, TDD may be skipped
if echo "$LAST_COMMIT_MSG" | grep -q '^feat('; then
  RECENT_TESTS=$(git log -3 --pretty=%s 2>/dev/null | grep -c '^test(' || echo "0")
  if [ "$RECENT_TESTS" = "0" ]; then
    WARNINGS="${WARNINGS}feat() commit without a preceding test() commit in recent history — TDD RED phase may have been skipped. "
  fi
fi

if [ -n "$WARNINGS" ]; then
  escape_for_json() {
    local s="$1"
    s="${s//\\/\\\\}"
    s="${s//\"/\\\"}"
    s="${s//$'\n'/\\n}"
    s="${s//$'\r'/\\r}"
    s="${s//$'\t'/\\t}"
    printf '%s' "$s"
  }

  WARNING_MSG="COMMIT COMPLIANCE: ${WARNINGS}"
  ESCAPED=$(escape_for_json "$WARNING_MSG")
  printf '{"hookSpecificOutput":{"hookEventName":"PostToolUse","additionalContext":"%s"}}\n' "$ESCAPED"
  exit 0
fi

exit 0
