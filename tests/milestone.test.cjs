/**
 * Tests for milestone.cjs: milestone operations and requirements marking
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { createTempDir, cleanup, scaffoldPlanning, scaffoldPhase, createStateMd, createRoadmapMd } = require('./helpers.cjs');
const core = require('../bin/lib/core.cjs');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try { fn(); passed++; console.log(`  PASS: ${name}`); }
  catch (e) { failed++; console.log(`  FAIL: ${name}: ${e.message}`); }
}

console.log('milestone.cjs tests\n');

// ─── getMilestoneInfo ────────────────────────────────────────────────────────

test('getMilestoneInfo extracts version from heading-format roadmap', () => {
  const dir = createTempDir('ms-info');
  scaffoldPlanning(dir);
  createRoadmapMd(dir, [{ num: 1, name: 'Setup' }]);
  const info = core.getMilestoneInfo(dir);
  assert.strictEqual(info.version, 'v1.0');
  assert.ok(info.name.length > 0);
  cleanup(dir);
});

test('getMilestoneInfo returns default when no roadmap exists', () => {
  const dir = createTempDir('ms-info2');
  const info = core.getMilestoneInfo(dir);
  assert.strictEqual(info.version, 'v1.0');
  assert.strictEqual(info.name, 'milestone');
  cleanup(dir);
});

test('getMilestoneInfo detects in-progress emoji marker', () => {
  const dir = createTempDir('ms-emoji');
  scaffoldPlanning(dir);
  const content = `# Roadmap\n\n- [x] **v1.0 MVP** (shipped)\n- 🚧 **v2.0 Growth Phase**\n`;
  fs.writeFileSync(path.join(dir, '.planning', 'ROADMAP.md'), content, 'utf-8');
  const info = core.getMilestoneInfo(dir);
  assert.strictEqual(info.version, 'v2.0');
  assert.strictEqual(info.name, 'Growth Phase');
  cleanup(dir);
});

// ─── Requirements marking (logic from cmdRequirementsMarkComplete) ───────────

test('requirements checkbox is checked when marked complete', () => {
  const dir = createTempDir('ms-req');
  scaffoldPlanning(dir, {
    requirements: `# Requirements\n\n- [ ] **REQ-01** User login\n- [ ] **REQ-02** User logout\n- [ ] **REQ-03** Dashboard\n`,
  });

  const reqPath = path.join(dir, '.planning', 'REQUIREMENTS.md');
  let content = fs.readFileSync(reqPath, 'utf-8');

  // Mark REQ-01 complete
  const reqId = 'REQ-01';
  const escaped = reqId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const checkboxPattern = new RegExp(`(-\\s*\\[)[ ](\\]\\s*\\*\\*${escaped}\\*\\*)`, 'gi');
  content = content.replace(checkboxPattern, '$1x$2');
  fs.writeFileSync(reqPath, content, 'utf-8');

  const updated = fs.readFileSync(reqPath, 'utf-8');
  assert.ok(updated.includes('[x] **REQ-01**'));
  assert.ok(updated.includes('[ ] **REQ-02**'));
  cleanup(dir);
});

test('multiple requirements can be marked at once', () => {
  const dir = createTempDir('ms-req2');
  scaffoldPlanning(dir, {
    requirements: `# Requirements\n\n- [ ] **REQ-01** Login\n- [ ] **REQ-02** Logout\n- [ ] **REQ-03** Dashboard\n`,
  });

  const reqPath = path.join(dir, '.planning', 'REQUIREMENTS.md');
  let content = fs.readFileSync(reqPath, 'utf-8');

  for (const reqId of ['REQ-01', 'REQ-03']) {
    const escaped = reqId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`(-\\s*\\[)[ ](\\]\\s*\\*\\*${escaped}\\*\\*)`, 'gi');
    content = content.replace(pattern, '$1x$2');
  }
  fs.writeFileSync(reqPath, content, 'utf-8');

  const updated = fs.readFileSync(reqPath, 'utf-8');
  assert.ok(updated.includes('[x] **REQ-01**'));
  assert.ok(updated.includes('[ ] **REQ-02**'));
  assert.ok(updated.includes('[x] **REQ-03**'));
  cleanup(dir);
});

test('marking nonexistent requirement ID has no effect', () => {
  const dir = createTempDir('ms-req3');
  scaffoldPlanning(dir, {
    requirements: `# Requirements\n\n- [ ] **REQ-01** Login\n`,
  });

  const reqPath = path.join(dir, '.planning', 'REQUIREMENTS.md');
  let content = fs.readFileSync(reqPath, 'utf-8');

  const reqId = 'REQ-99';
  const escaped = reqId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`(-\\s*\\[)[ ](\\]\\s*\\*\\*${escaped}\\*\\*)`, 'gi');
  const matched = pattern.test(content);
  assert.strictEqual(matched, false);
  cleanup(dir);
});

// ─── Milestone complete (archive logic) ──────────────────────────────────────

test('milestone complete archives ROADMAP.md', () => {
  const dir = createTempDir('ms-complete');
  scaffoldPlanning(dir);
  createRoadmapMd(dir, [{ num: 1, name: 'Setup' }]);
  createStateMd(dir);
  scaffoldPhase(dir, 1, 'setup', {
    plans: [{ id: '01' }],
    summaries: [{ id: '01' }],
  });

  const archiveDir = path.join(dir, '.planning', 'milestones');
  fs.mkdirSync(archiveDir, { recursive: true });

  // Archive roadmap
  const roadmapPath = path.join(dir, '.planning', 'ROADMAP.md');
  const roadmapContent = fs.readFileSync(roadmapPath, 'utf-8');
  fs.writeFileSync(path.join(archiveDir, 'v1.0-ROADMAP.md'), roadmapContent, 'utf-8');

  assert.ok(fs.existsSync(path.join(archiveDir, 'v1.0-ROADMAP.md')));
  cleanup(dir);
});

test('milestone complete creates MILESTONES.md entry', () => {
  const dir = createTempDir('ms-complete2');
  scaffoldPlanning(dir);
  createRoadmapMd(dir, [{ num: 1, name: 'Setup' }]);

  const milestonesPath = path.join(dir, '.planning', 'MILESTONES.md');
  const today = new Date().toISOString().split('T')[0];
  const entry = `## v1.0 Initial Release (Shipped: ${today})\n\n**Phases completed:** 1 phases, 1 plans, 2 tasks\n\n**Key accomplishments:**\n- Set up project\n\n---\n\n`;
  fs.writeFileSync(milestonesPath, `# Milestones\n\n${entry}`, 'utf-8');

  const content = fs.readFileSync(milestonesPath, 'utf-8');
  assert.ok(content.includes('v1.0'));
  assert.ok(content.includes('Shipped'));
  cleanup(dir);
});

test('milestone complete archives phases when requested', () => {
  const dir = createTempDir('ms-archive-phases');
  scaffoldPlanning(dir);
  createRoadmapMd(dir, [{ num: 1, name: 'Setup' }]);
  scaffoldPhase(dir, 1, 'setup');

  const archiveDir = path.join(dir, '.planning', 'milestones', 'v1.0-phases');
  fs.mkdirSync(archiveDir, { recursive: true });

  const phasesDir = path.join(dir, '.planning', 'phases');
  const phaseDirs = fs.readdirSync(phasesDir, { withFileTypes: true })
    .filter(e => e.isDirectory()).map(e => e.name);

  for (const d of phaseDirs) {
    fs.renameSync(path.join(phasesDir, d), path.join(archiveDir, d));
  }

  assert.ok(fs.existsSync(path.join(archiveDir, '01-setup')));
  assert.strictEqual(fs.readdirSync(phasesDir).filter(f => !f.startsWith('.')).length, 0);
  cleanup(dir);
});

// ─── getMilestonePhaseFilter ─────────────────────────────────────────────────

test('milestone phase filter scopes to roadmap phases', () => {
  const dir = createTempDir('ms-filter');
  scaffoldPlanning(dir);
  createRoadmapMd(dir, [
    { num: 1, name: 'Setup' },
    { num: 2, name: 'Build' },
  ]);
  scaffoldPhase(dir, 1, 'setup');
  scaffoldPhase(dir, 2, 'build');
  scaffoldPhase(dir, 3, 'extra');

  const filter = core.getMilestonePhaseFilter(dir);
  assert.strictEqual(filter('01-setup'), true);
  assert.strictEqual(filter('02-build'), true);
  assert.strictEqual(filter('03-extra'), false);
  cleanup(dir);
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
