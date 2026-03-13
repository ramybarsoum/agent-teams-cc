/**
 * Tests for commands.cjs: slug generation, timestamps, path verification, scaffolding
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { createTempDir, cleanup, scaffoldPlanning, scaffoldPhase, createRoadmapMd } = require('./helpers.cjs');
const core = require('../bin/lib/core.cjs');
const fmLib = require('../bin/lib/frontmatter.cjs');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try { fn(); passed++; console.log(`  PASS: ${name}`); }
  catch (e) { failed++; console.log(`  FAIL: ${name}: ${e.message}`); }
}

console.log('commands.cjs tests\n');

// ─── generateSlugInternal (used by cmdGenerateSlug) ──────────────────────────

test('slug generation converts text to kebab-case', () => {
  assert.strictEqual(core.generateSlugInternal('Hello World'), 'hello-world');
  assert.strictEqual(core.generateSlugInternal('Setup Auth & Config'), 'setup-auth-config');
  assert.strictEqual(core.generateSlugInternal('Build v2.0'), 'build-v2-0');
});

test('slug generation strips leading/trailing hyphens', () => {
  assert.strictEqual(core.generateSlugInternal('  --hello--  '), 'hello');
  assert.strictEqual(core.generateSlugInternal('!!!test!!!'), 'test');
});

test('slug generation returns null for empty/null input', () => {
  assert.strictEqual(core.generateSlugInternal(''), null);
  assert.strictEqual(core.generateSlugInternal(null), null);
});

// ─── Timestamp generation (logic from cmdCurrentTimestamp) ───────────────────

test('ISO timestamp matches expected format', () => {
  const ts = new Date().toISOString();
  assert.ok(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(ts));
});

test('date format is YYYY-MM-DD', () => {
  const date = new Date().toISOString().split('T')[0];
  assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(date));
});

test('filename format replaces colons with hyphens', () => {
  const ts = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
  assert.ok(!ts.includes(':'));
  assert.ok(!ts.includes('.'));
});

// ─── Path verification (logic from cmdVerifyPathExists) ──────────────────────

test('path exists for real file', () => {
  const dir = createTempDir('cmd-path');
  fs.writeFileSync(path.join(dir, 'test.txt'), 'content');
  assert.ok(core.pathExistsInternal(dir, 'test.txt'));
  cleanup(dir);
});

test('path exists for directory', () => {
  const dir = createTempDir('cmd-path2');
  fs.mkdirSync(path.join(dir, 'subdir'));
  assert.ok(core.pathExistsInternal(dir, 'subdir'));
  cleanup(dir);
});

test('path does not exist for missing file', () => {
  const dir = createTempDir('cmd-path3');
  assert.strictEqual(core.pathExistsInternal(dir, 'nope.txt'), false);
  cleanup(dir);
});

// ─── Requirements marking (logic from cmdRequirementsMarkComplete) ───────────

test('requirement checkbox pattern matches correctly', () => {
  const content = `- [ ] **REQ-01** User login\n- [ ] **REQ-02** Logout\n`;
  const reqId = 'REQ-01';
  const escaped = reqId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`(-\\s*\\[)[ ](\\]\\s*\\*\\*${escaped}\\*\\*)`, 'gi');
  const updated = content.replace(pattern, '$1x$2');
  assert.ok(updated.includes('[x] **REQ-01**'));
  assert.ok(updated.includes('[ ] **REQ-02**'));
});

test('requirement table pattern matches Pending status', () => {
  const content = `| REQ-01 | Phase 1 | Pending |\n| REQ-02 | Phase 2 | Complete |\n`;
  const reqId = 'REQ-01';
  const escaped = reqId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`(\\|\\s*${escaped}\\s*\\|[^|]+\\|)\\s*Pending\\s*(\\|)`, 'gi');
  const updated = content.replace(pattern, '$1 Complete $2');
  assert.ok(updated.includes('REQ-01') && updated.includes('Complete'));
  assert.ok(!updated.match(/REQ-01[^|]*Pending/));
});

// ─── Commit helper (logic testing, no actual git) ────────────────────────────

test('commit is skipped when commit_docs is false', () => {
  const dir = createTempDir('cmd-commit');
  scaffoldPlanning(dir, { config: { commit_docs: false } });
  const config = core.loadConfig(dir);
  assert.strictEqual(config.commit_docs, false);
  // cmdCommit would return skipped_commit_docs_false
  cleanup(dir);
});

test('commit config defaults to true', () => {
  const dir = createTempDir('cmd-commit2');
  scaffoldPlanning(dir);
  const config = core.loadConfig(dir);
  assert.strictEqual(config.commit_docs, true);
  cleanup(dir);
});

// ─── Summary extract (frontmatter parsing) ──────────────────────────────────

test('summary frontmatter extracts one-liner and key fields', () => {
  const content = `---
phase: "01"
plan: "01"
subsystem: auth
tags: [security, login]
duration: 15m
completed: true
one-liner: "Implemented JWT authentication"
key-files:
  - src/auth.ts
  - src/middleware.ts
patterns-established:
  - JWT token pattern
key-decisions:
  - "Used RS256: Better for microservices"
---

# Summary
`;
  const fmObj = fmLib.extractFrontmatter(content);
  assert.strictEqual(fmObj['one-liner'], 'Implemented JWT authentication');
  assert.ok(Array.isArray(fmObj['key-files']));
  assert.strictEqual(fmObj['key-files'].length, 2);
  assert.ok(Array.isArray(fmObj['patterns-established']));
  assert.ok(Array.isArray(fmObj['key-decisions']));
});

// ─── Scaffold (logic from cmdScaffold) ───────────────────────────────────────

test('phase-dir scaffold creates directory with correct name', () => {
  const dir = createTempDir('cmd-scaffold');
  scaffoldPlanning(dir);
  const slug = core.generateSlugInternal('My Feature');
  const padded = core.normalizePhaseName('5');
  const dirName = `${padded}-${slug}`;
  const dirPath = path.join(dir, '.planning', 'phases', dirName);
  fs.mkdirSync(dirPath, { recursive: true });

  assert.ok(fs.existsSync(dirPath));
  assert.strictEqual(dirName, '05-my-feature');
  cleanup(dir);
});

test('scaffold context file has correct frontmatter', () => {
  const dir = createTempDir('cmd-scaffold2');
  scaffoldPlanning(dir);
  scaffoldPhase(dir, 1, 'setup');
  const today = new Date().toISOString().split('T')[0];
  const content = `---\nphase: "01"\nname: "setup"\ncreated: ${today}\n---\n\n# Phase 1: setup -- Context\n`;

  const contextPath = path.join(dir, '.planning', 'phases', '01-setup', '01-CONTEXT.md');
  fs.writeFileSync(contextPath, content, 'utf-8');

  const fmObj = fmLib.extractFrontmatter(fs.readFileSync(contextPath, 'utf-8'));
  assert.strictEqual(fmObj.phase, '01');
  assert.strictEqual(fmObj.name, 'setup');
  cleanup(dir);
});

// ─── Todo listing (logic from cmdListTodos) ──────────────────────────────────

test('todo listing reads from pending directory', () => {
  const dir = createTempDir('cmd-todos');
  const pendingDir = path.join(dir, '.planning', 'todos', 'pending');
  fs.mkdirSync(pendingDir, { recursive: true });
  fs.writeFileSync(path.join(pendingDir, 'todo-1.md'), 'title: Fix bug\narea: engineering\ncreated: 2026-01-01\n');
  fs.writeFileSync(path.join(pendingDir, 'todo-2.md'), 'title: Write docs\narea: docs\ncreated: 2026-01-02\n');

  const files = fs.readdirSync(pendingDir).filter(f => f.endsWith('.md'));
  assert.strictEqual(files.length, 2);

  const todos = files.map(f => {
    const content = fs.readFileSync(path.join(pendingDir, f), 'utf-8');
    const titleMatch = content.match(/^title:\s*(.+)$/m);
    return { file: f, title: titleMatch ? titleMatch[1].trim() : 'Untitled' };
  });
  assert.strictEqual(todos[0].title, 'Fix bug');
  cleanup(dir);
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
