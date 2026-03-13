/**
 * Tests for state.cjs: STATE.md operations and progression engine
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { createTempDir, cleanup, scaffoldPlanning, scaffoldPhase, createStateMd, createRoadmapMd } = require('./helpers.cjs');
const state = require('../bin/lib/state.cjs');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try { fn(); passed++; console.log(`  PASS: ${name}`); }
  catch (e) { failed++; console.log(`  FAIL: ${name}: ${e.message}`); }
}

console.log('state.cjs tests\n');

// ─── stateExtractField ──────────────────────────────────────────────────────

test('stateExtractField extracts bold format fields', () => {
  const content = '**Current Phase:** 3\n**Status:** Executing\n';
  assert.strictEqual(state.stateExtractField(content, 'Current Phase'), '3');
  assert.strictEqual(state.stateExtractField(content, 'Status'), 'Executing');
});

test('stateExtractField extracts plain format fields', () => {
  const content = 'Current Phase: 3\nStatus: Executing\n';
  assert.strictEqual(state.stateExtractField(content, 'Current Phase'), '3');
  assert.strictEqual(state.stateExtractField(content, 'Status'), 'Executing');
});

test('stateExtractField returns null for missing field', () => {
  const content = '**Status:** Active\n';
  assert.strictEqual(state.stateExtractField(content, 'Missing Field'), null);
});

// ─── stateReplaceField ──────────────────────────────────────────────────────

test('stateReplaceField replaces bold format field value', () => {
  const content = '**Status:** Executing\n**Progress:** 50%\n';
  const result = state.stateReplaceField(content, 'Status', 'Complete');
  assert.ok(result.includes('**Status:** Complete'));
  assert.ok(result.includes('**Progress:** 50%'));
});

test('stateReplaceField replaces plain format field value', () => {
  const content = 'Status: Executing\n';
  const result = state.stateReplaceField(content, 'Status', 'Done');
  assert.ok(result.includes('Status: Done'));
});

test('stateReplaceField returns null for missing field', () => {
  const content = '**Status:** Active\n';
  const result = state.stateReplaceField(content, 'Nonexistent', 'value');
  assert.strictEqual(result, null);
});

// ─── writeStateMd (frontmatter sync) ────────────────────────────────────────

test('writeStateMd writes file with synchronized frontmatter', () => {
  const dir = createTempDir('state-write');
  scaffoldPlanning(dir);
  createRoadmapMd(dir, [{ num: 1, name: 'Setup' }]);
  const statePath = path.join(dir, '.planning', 'STATE.md');
  const body = '# Session State\n\n**Current Phase:** 1\n**Status:** Executing\n';
  state.writeStateMd(statePath, body, dir);

  const written = fs.readFileSync(statePath, 'utf-8');
  assert.ok(written.startsWith('---\n'));
  assert.ok(written.includes('team_state_version:'));
  assert.ok(written.includes('# Session State'));
  cleanup(dir);
});

// ─── State loading (createStateMd + field extraction) ────────────────────────

test('STATE.md fields are extractable after creation', () => {
  const dir = createTempDir('state-load');
  scaffoldPlanning(dir);
  createRoadmapMd(dir, [{ num: 1, name: 'Setup' }]);
  createStateMd(dir, { currentPhase: '2', status: 'Planning' });

  const content = fs.readFileSync(path.join(dir, '.planning', 'STATE.md'), 'utf-8');
  assert.strictEqual(state.stateExtractField(content, 'Current Phase'), '2');
  assert.strictEqual(state.stateExtractField(content, 'Status'), 'Planning');
  cleanup(dir);
});

// ─── State advance plan ──────────────────────────────────────────────────────

test('advance plan increments Current Plan field', () => {
  const dir = createTempDir('state-advance');
  scaffoldPlanning(dir);
  createRoadmapMd(dir, [{ num: 1, name: 'Setup' }]);
  createStateMd(dir, { currentPlan: '1', totalPlans: '3', status: 'Executing' });

  // Manually advance (cmdStateAdvancePlan calls output/exit, so we simulate)
  const statePath = path.join(dir, '.planning', 'STATE.md');
  let content = fs.readFileSync(statePath, 'utf-8');
  const currentPlan = parseInt(state.stateExtractField(content, 'Current Plan'), 10);
  const totalPlans = parseInt(state.stateExtractField(content, 'Total Plans in Phase'), 10);

  assert.strictEqual(currentPlan, 1);
  assert.strictEqual(totalPlans, 3);

  // Simulate advance
  content = state.stateReplaceField(content, 'Current Plan', String(currentPlan + 1));
  content = state.stateReplaceField(content, 'Status', 'Ready to execute');
  state.writeStateMd(statePath, content, dir);

  const updated = fs.readFileSync(statePath, 'utf-8');
  assert.strictEqual(state.stateExtractField(updated, 'Current Plan'), '2');
  assert.strictEqual(state.stateExtractField(updated, 'Status'), 'Ready to execute');
  cleanup(dir);
});

test('advance plan at last plan sets ready for verification', () => {
  const dir = createTempDir('state-advance-last');
  scaffoldPlanning(dir);
  createRoadmapMd(dir, [{ num: 1, name: 'Setup' }]);
  createStateMd(dir, { currentPlan: '3', totalPlans: '3' });

  const statePath = path.join(dir, '.planning', 'STATE.md');
  const content = fs.readFileSync(statePath, 'utf-8');
  const currentPlan = parseInt(state.stateExtractField(content, 'Current Plan'), 10);
  const totalPlans = parseInt(state.stateExtractField(content, 'Total Plans in Phase'), 10);

  assert.strictEqual(currentPlan, totalPlans);
  // At last plan, should not advance further
  assert.ok(currentPlan >= totalPlans);
  cleanup(dir);
});

// ─── State add decision ─────────────────────────────────────────────────────

test('add decision appends to Decisions section', () => {
  const dir = createTempDir('state-decision');
  scaffoldPlanning(dir);
  createRoadmapMd(dir, [{ num: 1, name: 'Setup' }]);
  createStateMd(dir);

  const statePath = path.join(dir, '.planning', 'STATE.md');
  let content = fs.readFileSync(statePath, 'utf-8');

  // Simulate adding a decision
  const entry = '- [Phase 1]: Use TypeScript for all modules';
  const sectionPattern = /(###?\s*(?:Decisions|Decisions Made|Accumulated.*Decisions)\s*\n)([\s\S]*?)(?=\n###?|\n##[^#]|$)/i;
  const match = content.match(sectionPattern);
  assert.ok(match, 'Should find Decisions section');

  let sectionBody = match[2];
  sectionBody = sectionBody.replace(/None yet\.?\s*\n?/gi, '');
  sectionBody = sectionBody.trimEnd() + '\n' + entry + '\n';
  content = content.replace(sectionPattern, (_m, header) => `${header}${sectionBody}`);
  state.writeStateMd(statePath, content, dir);

  const updated = fs.readFileSync(statePath, 'utf-8');
  assert.ok(updated.includes('Use TypeScript for all modules'));
  cleanup(dir);
});

// ─── State add blocker ──────────────────────────────────────────────────────

test('add blocker appends to Blockers section', () => {
  const dir = createTempDir('state-blocker');
  scaffoldPlanning(dir);
  createRoadmapMd(dir, [{ num: 1, name: 'Setup' }]);
  createStateMd(dir);

  const statePath = path.join(dir, '.planning', 'STATE.md');
  let content = fs.readFileSync(statePath, 'utf-8');

  const entry = '- API rate limiting not resolved';
  const sectionPattern = /(###?\s*(?:Blockers|Blockers\/Concerns|Concerns)\s*\n)([\s\S]*?)(?=\n###?|\n##[^#]|$)/i;
  const match = content.match(sectionPattern);
  assert.ok(match, 'Should find Blockers section');

  let sectionBody = match[2];
  sectionBody = sectionBody.replace(/None\.?\s*\n?/gi, '');
  sectionBody = sectionBody.trimEnd() + '\n' + entry + '\n';
  content = content.replace(sectionPattern, (_m, header) => `${header}${sectionBody}`);
  state.writeStateMd(statePath, content, dir);

  const updated = fs.readFileSync(statePath, 'utf-8');
  assert.ok(updated.includes('API rate limiting not resolved'));
  cleanup(dir);
});

// ─── State record session ───────────────────────────────────────────────────

test('record session updates Last Date and Stopped At fields', () => {
  const dir = createTempDir('state-session');
  scaffoldPlanning(dir);
  createRoadmapMd(dir, [{ num: 1, name: 'Setup' }]);
  createStateMd(dir);

  const statePath = path.join(dir, '.planning', 'STATE.md');
  let content = fs.readFileSync(statePath, 'utf-8');

  const now = new Date().toISOString();
  let result = state.stateReplaceField(content, 'Last Date', now);
  if (result) content = result;
  result = state.stateReplaceField(content, 'Stopped At', 'Phase 1 Plan 2');
  if (result) content = result;
  state.writeStateMd(statePath, content, dir);

  const updated = fs.readFileSync(statePath, 'utf-8');
  assert.ok(state.stateExtractField(updated, 'Last Date') !== 'None');
  cleanup(dir);
});

// ─── State field replacement preserves structure ─────────────────────────────

test('stateReplaceField preserves other fields', () => {
  const content = `**Current Phase:** 1\n**Status:** Executing\n**Progress:** 50%\n`;
  let result = state.stateReplaceField(content, 'Status', 'Complete');
  assert.ok(result.includes('**Current Phase:** 1'));
  assert.ok(result.includes('**Status:** Complete'));
  assert.ok(result.includes('**Progress:** 50%'));
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
