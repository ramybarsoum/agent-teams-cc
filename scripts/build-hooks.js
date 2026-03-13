#!/usr/bin/env node
// Copies Agent Teams hooks to ~/.claude/hooks/ during install.
// Run manually or as part of postinstall.

const fs = require('fs');
const path = require('path');
const os = require('os');

const hooksSource = path.join(__dirname, '..', 'hooks');
const hooksDest = path.join(os.homedir(), '.claude', 'hooks');

// Ensure destination exists
if (!fs.existsSync(hooksDest)) {
  fs.mkdirSync(hooksDest, { recursive: true });
}

// Copy all .js files from hooks/ to ~/.claude/hooks/
const files = fs.readdirSync(hooksSource).filter(f => f.endsWith('.js'));
let copied = 0;

for (const file of files) {
  const src = path.join(hooksSource, file);
  const dest = path.join(hooksDest, file);
  fs.copyFileSync(src, dest);
  fs.chmodSync(dest, '755');
  copied++;
  console.log(`  Copied ${file}`);
}

console.log(`\n  ${copied} hooks installed to ${hooksDest}`);
