#!/usr/bin/env node

/**
 * Agent Teams for Claude Code - postinstall script
 *
 * Copies agents, commands, templates, and references to ~/.claude/
 * Runs automatically after `npm install` or `npx agent-teams-cc`.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const CLAUDE_DIR = path.join(os.homedir(), '.claude');
const PKG_DIR = __dirname;

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function copyFiles(srcDir, destDir, pattern = '.md') {
  if (!fs.existsSync(srcDir)) return 0;
  const files = fs.readdirSync(srcDir).filter(f => f.endsWith(pattern));
  files.forEach(f => {
    fs.copyFileSync(path.join(srcDir, f), path.join(destDir, f));
  });
  return files.length;
}

function main() {
  console.log('');
  console.log('  Agent Teams for Claude Code');
  console.log(`  Installing to ${CLAUDE_DIR}`);
  console.log('');

  // Agents
  const agentDest = path.join(CLAUDE_DIR, 'agents');
  ensureDir(agentDest);
  const agentCount = copyFiles(path.join(PKG_DIR, 'agents'), agentDest);
  console.log(`  ${agentCount} agents installed`);

  // Commands
  const cmdDest = path.join(CLAUDE_DIR, 'commands', 'team');
  ensureDir(cmdDest);
  const cmdCount = copyFiles(path.join(PKG_DIR, 'commands'), cmdDest);
  console.log(`  ${cmdCount} commands installed`);

  // Templates
  const tplDest = path.join(CLAUDE_DIR, 'templates', 'agent-teams');
  ensureDir(tplDest);
  const tplCount = copyFiles(path.join(PKG_DIR, 'templates'), tplDest);
  const rpDest = path.join(tplDest, 'research-project');
  ensureDir(rpDest);
  const rpCount = copyFiles(path.join(PKG_DIR, 'templates', 'research-project'), rpDest);
  console.log(`  ${tplCount + rpCount} templates installed`);

  // References
  const refDest = path.join(CLAUDE_DIR, 'references', 'agent-teams');
  ensureDir(refDest);
  const refCount = copyFiles(path.join(PKG_DIR, 'references'), refDest);
  console.log(`  ${refCount} references installed`);

  // CLI tool
  const binDest = path.join(CLAUDE_DIR, 'bin');
  const libDest = path.join(binDest, 'lib');
  ensureDir(binDest);
  ensureDir(libDest);
  const toolSrc = path.join(PKG_DIR, 'bin', 'team-tools.cjs');
  const toolDest = path.join(binDest, 'team-tools.cjs');
  if (fs.existsSync(toolSrc)) {
    fs.copyFileSync(toolSrc, toolDest);
    fs.chmodSync(toolDest, '755');
    const libCount = copyFiles(path.join(PKG_DIR, 'bin', 'lib'), libDest, '.cjs');
    console.log(`  CLI installed (team-tools + ${libCount} modules)`);
  }

  // Check env var
  const settingsFile = path.join(CLAUDE_DIR, 'settings.json');
  if (fs.existsSync(settingsFile)) {
    const content = fs.readFileSync(settingsFile, 'utf8');
    if (content.includes('CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS')) {
      console.log('');
      console.log('  Agent Teams env var already configured.');
    } else {
      console.log('');
      console.log('  NOTE: Add to ' + settingsFile + ':');
      console.log('');
      console.log('    "env": {');
      console.log('      "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"');
      console.log('    }');
    }
  } else {
    console.log('');
    console.log('  NOTE: Create ' + settingsFile + ' with:');
    console.log('');
    console.log('  {');
    console.log('    "env": {');
    console.log('      "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"');
    console.log('    }');
    console.log('  }');
  }

  console.log('');
  console.log('  Done. Run /team:help in Claude Code to get started.');
  console.log('');
}

main();
