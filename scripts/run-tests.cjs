#!/usr/bin/env node
// Test runner for Agent Teams
// Discovers and runs all test files in tests/. Uses Node.js assert (no framework).
// Exit code 0 = all pass, 1 = any failure.

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const testsDir = path.join(__dirname, '..', 'tests');

// Discover test files
if (!fs.existsSync(testsDir)) {
  console.log('No tests/ directory found. Skipping.');
  process.exit(0);
}

const testFiles = fs.readdirSync(testsDir)
  .filter(f => f.endsWith('.test.js') || f.endsWith('.test.cjs'))
  .sort();

if (testFiles.length === 0) {
  console.log('No test files found in tests/.');
  process.exit(0);
}

console.log(`\nAgent Teams Test Runner`);
console.log(`Found ${testFiles.length} test file(s)\n`);

let passed = 0;
let failed = 0;
const failures = [];

for (const file of testFiles) {
  const filePath = path.join(testsDir, file);
  const label = file.replace(/\.test\.(js|cjs)$/, '');

  try {
    execFileSync(process.execPath, [filePath], {
      encoding: 'utf8',
      timeout: 30000,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, NODE_ENV: 'test' }
    });
    console.log(`  PASS  ${label}`);
    passed++;
  } catch (err) {
    console.log(`  FAIL  ${label}`);
    const output = (err.stderr || err.stdout || err.message || '').trim();
    if (output) {
      // Indent error output for readability
      const indented = output.split('\n').map(l => `        ${l}`).join('\n');
      console.log(indented);
    }
    failures.push(file);
    failed++;
  }
}

// Summary
console.log(`\n  Results: ${passed} passed, ${failed} failed, ${testFiles.length} total`);

if (failures.length > 0) {
  console.log(`  Failed: ${failures.join(', ')}`);
}

console.log('');
process.exit(failed > 0 ? 1 : 0);
