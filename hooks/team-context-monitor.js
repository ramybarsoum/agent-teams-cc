#!/usr/bin/env node
// [EXPERIMENTAL] Agent Teams context window monitor
// Logs a warning when context usage approaches the limit.
// Placeholder implementation. Will be expanded with auto-checkpoint logic.

const fs = require('fs');
const path = require('path');
const os = require('os');

// Read JSON from stdin (Claude Code hook convention)
let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const remaining = data.context_window?.remaining_percentage;

    if (remaining == null) return;

    // Warn at 25% remaining (75% used)
    if (remaining <= 25 && remaining > 10) {
      process.stderr.write('[agent-teams] Context window 75%+ used. Consider wrapping up current phase.\n');
    }

    // Critical at 10% remaining (90% used)
    if (remaining <= 10) {
      process.stderr.write('[agent-teams] Context window nearly full. Save progress and start a new session.\n');
    }
  } catch (e) {
    // Silent fail. Never break the session over monitoring.
  }
});
