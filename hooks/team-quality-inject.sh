#!/usr/bin/env bash
# Agent Teams quality framework injection hook
# Injects verification honesty, TDD awareness, and anti-rationalization
# into every session (startup, clear, compact) so the lead session
# and ad-hoc work get the same quality protections as spawned agents.

set -euo pipefail

# Only inject in allcare project directories
case "$PWD" in
  */allcare-platform*|*/allcare-repos*|*/AllCare-repos*) ;;
  *) exit 0 ;;
esac

QUALITY_CONTEXT='<agent-teams-quality-framework>

## Verification Honesty (Always Active)

**NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE.**

Before claiming ANY work is done, fixed, passing, or complete:
1. Identify the verification command
2. Run it NOW (not from a previous run)
3. Read the COMPLETE output
4. Confirm the output supports your claim
5. Only THEN make the claim

Red flags — STOP if you catch yourself:
- "Should pass" / "Looks correct" / "I believe this works" → Run the command.
- "Done!" before running verify → Premature. Run it first.
- "Too simple to test" → Simple code has bugs. Verify anyway.
- Expressing satisfaction before evidence → Evidence first, always.

## TDD Awareness (For All Code Changes)

When writing behavioral code (functions, endpoints, components, handlers):
- Write a failing test FIRST, then implement
- If you wrote code before its test, delete it and start with RED
- No exceptions for "simple" changes

## Anti-Rationalization

If you feel the urge to skip verification, testing, or a quality step — that impulse is a signal the step is ESPECIALLY needed. The urge to skip is inversely correlated with safety.

## Structured Work Available

For non-trivial tasks, use Agent Teams commands:
- `/team:discuss-phase N` — Design-first brainstorming with spec review
- `/team:plan-phase N` — Create verified execution plans (9-dimension check)
- `/team:execute-phase N` — Execute with per-task review + TDD + verification
- `/team:quick` — Ad-hoc task with framework guarantees

These commands activate the full quality pipeline: design gate, plan checking, per-task adversarial review, TDD Iron Law, anti-rationalization enforcement, and 3-level verification.

</agent-teams-quality-framework>'

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

ESCAPED=$(escape_for_json "$QUALITY_CONTEXT")

printf '{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"%s"}}\n' "$ESCAPED"

exit 0
