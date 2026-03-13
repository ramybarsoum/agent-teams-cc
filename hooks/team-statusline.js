#!/usr/bin/env node
// Agent Teams statusline hook
// Shows: model | current phase/plan | directory | context usage
// Reads state from .planning/STATE.md in the current working directory.

const fs = require('fs');
const path = require('path');
const os = require('os');

// Read JSON from stdin (Claude Code statusline convention)
let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const model = data.model?.display_name || 'Claude';
    const dir = data.workspace?.current_dir || process.cwd();
    const remaining = data.context_window?.remaining_percentage;
    const homeDir = os.homedir();

    // Parse .planning/STATE.md for current phase and plan
    let phase = '';
    const stateFile = path.join(dir, '.planning', 'STATE.md');
    if (fs.existsSync(stateFile)) {
      try {
        const content = fs.readFileSync(stateFile, 'utf8');
        // Look for phase info (e.g., "Phase: 3" or "Current Phase: 3")
        const phaseMatch = content.match(/(?:Current\s+)?Phase[:\s]+(\d+)/i);
        // Look for plan info (e.g., "Plan: 3.2" or "Active Plan: 3.2")
        const planMatch = content.match(/(?:Active\s+)?Plan[:\s]+([\d.]+)/i);
        if (phaseMatch) phase = `P${phaseMatch[1]}`;
        if (planMatch) phase += `.${planMatch[1]}`;
        if (phase) phase = `\x1b[36m${phase}\x1b[0m`;
      } catch (e) {}
    }

    // Context window display (scaled to 80% effective limit)
    let ctx = '';
    if (remaining != null) {
      const rem = Math.round(remaining);
      const rawUsed = Math.max(0, Math.min(100, 100 - rem));
      const used = Math.min(100, Math.round((rawUsed / 80) * 100));
      const filled = Math.floor(used / 10);
      const bar = '\u2588'.repeat(filled) + '\u2591'.repeat(10 - filled);

      if (used < 63) {
        ctx = ` \x1b[32m${bar} ${used}%\x1b[0m`;
      } else if (used < 81) {
        ctx = ` \x1b[33m${bar} ${used}%\x1b[0m`;
      } else if (used < 95) {
        ctx = ` \x1b[38;5;208m${bar} ${used}%\x1b[0m`;
      } else {
        ctx = ` \x1b[5;31m${bar} ${used}%\x1b[0m`;
      }
    }

    // Update available notice
    let updateNotice = '';
    const cacheFile = path.join(homeDir, '.claude', 'cache', 'team-update-check.json');
    if (fs.existsSync(cacheFile)) {
      try {
        const cache = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
        if (cache.update_available) {
          updateNotice = '\x1b[33m\u2B06 update\x1b[0m \u2502 ';
        }
      } catch (e) {}
    }

    // Build output
    const dirname = path.basename(dir);
    const parts = [updateNotice, `\x1b[2m${model}\x1b[0m`];
    if (phase) parts.push(phase);
    parts.push(`\x1b[2m${dirname}\x1b[0m`);

    process.stdout.write(parts.join(' \u2502 ') + ctx);
  } catch (e) {
    // Silent fail. Never break the statusline.
  }
});
