/**
 * Tests for phase.cjs: phase CRUD, find, directory creation
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

console.log('phase.cjs tests\n');

// ─── findPhaseInternal (used by cmdFindPhase) ───────────────────────────────

test('findPhaseInternal finds phase by number', () => {
  const dir = createTempDir('phase-find');
  scaffoldPlanning(dir);
  scaffoldPhase(dir, 1, 'setup');
  const result = core.findPhaseInternal(dir, '1');
  assert.ok(result);
  assert.strictEqual(result.found, true);
  assert.strictEqual(result.phase_number, '01');
  assert.ok(result.directory.includes('01-setup'));
  cleanup(dir);
});

test('findPhaseInternal finds phase with plans and summaries', () => {
  const dir = createTempDir('phase-find2');
  scaffoldPlanning(dir);
  scaffoldPhase(dir, 3, 'deploy', {
    plans: [{ id: '01' }, { id: '02' }],
    summaries: [{ id: '01' }],
  });
  const result = core.findPhaseInternal(dir, '3');
  assert.ok(result);
  assert.strictEqual(result.plans.length, 2);
  assert.strictEqual(result.summaries.length, 1);
  assert.strictEqual(result.incomplete_plans.length, 1);
  cleanup(dir);
});

test('findPhaseInternal returns null for nonexistent phase', () => {
  const dir = createTempDir('phase-find3');
  scaffoldPlanning(dir);
  fs.mkdirSync(path.join(dir, '.planning', 'phases'), { recursive: true });
  const result = core.findPhaseInternal(dir, '42');
  assert.strictEqual(result, null);
  cleanup(dir);
});

test('findPhaseInternal detects research and context files', () => {
  const dir = createTempDir('phase-find4');
  scaffoldPlanning(dir);
  scaffoldPhase(dir, 5, 'testing', { research: true, context: true });
  const result = core.findPhaseInternal(dir, '5');
  assert.ok(result);
  assert.strictEqual(result.has_research, true);
  assert.strictEqual(result.has_context, true);
  cleanup(dir);
});

// ─── Phase directory creation (simulating cmdPhaseAdd) ───────────────────────

test('phase directory is created with correct naming', () => {
  const dir = createTempDir('phase-add');
  scaffoldPlanning(dir);
  createRoadmapMd(dir, [
    { num: 1, name: 'Setup', goal: 'Initial setup' },
    { num: 2, name: 'Build', goal: 'Build features' },
  ]);

  // Simulate adding phase 3
  const slug = core.generateSlugInternal('Deploy to Production');
  const dirName = '03-deploy-to-production';
  const dirPath = path.join(dir, '.planning', 'phases', dirName);
  fs.mkdirSync(dirPath, { recursive: true });
  fs.writeFileSync(path.join(dirPath, '.gitkeep'), '');

  assert.ok(fs.existsSync(dirPath));
  assert.ok(fs.existsSync(path.join(dirPath, '.gitkeep')));
  assert.strictEqual(slug, 'deploy-to-production');
  cleanup(dir);
});

test('phase directory created for decimal phase', () => {
  const dir = createTempDir('phase-decimal');
  scaffoldPlanning(dir);
  const dirName = '02.1-hotfix';
  const dirPath = path.join(dir, '.planning', 'phases', dirName);
  fs.mkdirSync(dirPath, { recursive: true });

  assert.ok(fs.existsSync(dirPath));
  const result = core.findPhaseInternal(dir, '2.1');
  assert.ok(result);
  assert.strictEqual(result.phase_number, '02.1');
  cleanup(dir);
});

// ─── Phase listing (simulating cmdPhasesList) ────────────────────────────────

test('phases directory lists all phase dirs sorted', () => {
  const dir = createTempDir('phase-list');
  scaffoldPlanning(dir);
  scaffoldPhase(dir, 3, 'deploy');
  scaffoldPhase(dir, 1, 'setup');
  scaffoldPhase(dir, 2, 'build');

  const phasesDir = path.join(dir, '.planning', 'phases');
  const entries = fs.readdirSync(phasesDir, { withFileTypes: true });
  let dirs = entries.filter(e => e.isDirectory()).map(e => e.name);
  dirs.sort((a, b) => core.comparePhaseNum(a, b));

  assert.strictEqual(dirs.length, 3);
  assert.ok(dirs[0].startsWith('01'));
  assert.ok(dirs[1].startsWith('02'));
  assert.ok(dirs[2].startsWith('03'));
  cleanup(dir);
});

test('listing plans in a phase returns correct files', () => {
  const dir = createTempDir('phase-plans');
  scaffoldPlanning(dir);
  scaffoldPhase(dir, 1, 'setup', {
    plans: [{ id: '01' }, { id: '02' }, { id: '03' }],
    summaries: [{ id: '01' }],
  });

  const result = core.findPhaseInternal(dir, '1');
  assert.strictEqual(result.plans.length, 3);
  assert.strictEqual(result.summaries.length, 1);
  assert.strictEqual(result.incomplete_plans.length, 2);
  cleanup(dir);
});

// ─── Next decimal phase calculation ──────────────────────────────────────────

test('next decimal is .1 when no decimals exist', () => {
  const dir = createTempDir('phase-next-dec');
  scaffoldPlanning(dir);
  scaffoldPhase(dir, 3, 'deploy');

  const phasesDir = path.join(dir, '.planning', 'phases');
  const entries = fs.readdirSync(phasesDir, { withFileTypes: true });
  const dirs = entries.filter(e => e.isDirectory()).map(e => e.name);
  const normalized = core.normalizePhaseName('3');
  const decimalPattern = new RegExp(`^${normalized}\\.(\\d+)`);
  const existing = dirs.filter(d => decimalPattern.test(d));

  assert.strictEqual(existing.length, 0);
  // Next should be 03.1
  const next = `${normalized}.1`;
  assert.strictEqual(next, '03.1');
  cleanup(dir);
});

test('next decimal increments from highest existing', () => {
  const dir = createTempDir('phase-next-dec2');
  scaffoldPlanning(dir);
  scaffoldPhase(dir, 3, 'deploy');
  // Create 03.1 and 03.2
  fs.mkdirSync(path.join(dir, '.planning', 'phases', '03.1-hotfix'), { recursive: true });
  fs.mkdirSync(path.join(dir, '.planning', 'phases', '03.2-patch'), { recursive: true });

  const phasesDir = path.join(dir, '.planning', 'phases');
  const entries = fs.readdirSync(phasesDir, { withFileTypes: true });
  const dirs = entries.filter(e => e.isDirectory()).map(e => e.name);
  const decimalPattern = /^03\.(\d+)/;
  const existingNums = dirs.map(d => {
    const m = d.match(decimalPattern);
    return m ? parseInt(m[1], 10) : null;
  }).filter(n => n !== null);

  const next = Math.max(...existingNums) + 1;
  assert.strictEqual(next, 3);
  cleanup(dir);
});

// ─── Phase complete affects STATE.md ─────────────────────────────────────────

test('completing a phase updates state file', () => {
  const dir = createTempDir('phase-complete');
  scaffoldPlanning(dir);
  createRoadmapMd(dir, [
    { num: 1, name: 'Setup', goal: 'Init' },
    { num: 2, name: 'Build', goal: 'Code' },
  ]);
  scaffoldPhase(dir, 1, 'setup', {
    plans: [{ id: '01' }],
    summaries: [{ id: '01' }],
  });
  scaffoldPhase(dir, 2, 'build');
  createStateMd(dir, { currentPhase: '1', status: 'Executing' });

  const statePath = path.join(dir, '.planning', 'STATE.md');
  let content = fs.readFileSync(statePath, 'utf-8');

  // Simulate phase complete state update
  const { stateReplaceField, writeStateMd } = require('../bin/lib/state.cjs');
  content = stateReplaceField(content, 'Current Phase', '2') || content;
  content = stateReplaceField(content, 'Status', 'Ready to plan') || content;
  writeStateMd(statePath, content, dir);

  const updated = fs.readFileSync(statePath, 'utf-8');
  const { stateExtractField } = require('../bin/lib/state.cjs');
  assert.strictEqual(stateExtractField(updated, 'Current Phase'), '2');
  assert.strictEqual(stateExtractField(updated, 'Status'), 'Ready to plan');
  cleanup(dir);
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
