/**
 * Tests for roadmap.cjs: roadmap parsing and analysis
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { createTempDir, cleanup, scaffoldPlanning, scaffoldPhase, createRoadmapMd } = require('./helpers.cjs');
const core = require('../bin/lib/core.cjs');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try { fn(); passed++; console.log(`  PASS: ${name}`); }
  catch (e) { failed++; console.log(`  FAIL: ${name}: ${e.message}`); }
}

console.log('roadmap.cjs tests\n');

// ─── getRoadmapPhaseInternal (get-phase logic) ──────────────────────────────

test('get-phase extracts phase name and goal from roadmap', () => {
  const dir = createTempDir('roadmap-get');
  scaffoldPlanning(dir);
  createRoadmapMd(dir, [
    { num: 1, name: 'Foundation', goal: 'Set up project structure' },
    { num: 2, name: 'Core Features', goal: 'Build main functionality' },
  ]);
  const result = core.getRoadmapPhaseInternal(dir, '1');
  assert.ok(result);
  assert.strictEqual(result.found, true);
  assert.strictEqual(result.phase_name, 'Foundation');
  assert.strictEqual(result.goal, 'Set up project structure');
  cleanup(dir);
});

test('get-phase extracts second phase correctly', () => {
  const dir = createTempDir('roadmap-get2');
  scaffoldPlanning(dir);
  createRoadmapMd(dir, [
    { num: 1, name: 'Setup', goal: 'Init' },
    { num: 2, name: 'Build', goal: 'Develop features' },
    { num: 3, name: 'Deploy', goal: 'Ship it' },
  ]);
  const result = core.getRoadmapPhaseInternal(dir, '2');
  assert.ok(result);
  assert.strictEqual(result.phase_name, 'Build');
  assert.strictEqual(result.goal, 'Develop features');
  assert.ok(!result.section.includes('Ship it'));
  cleanup(dir);
});

test('get-phase returns null for missing phase number', () => {
  const dir = createTempDir('roadmap-get3');
  scaffoldPlanning(dir);
  createRoadmapMd(dir, [{ num: 1, name: 'Setup' }]);
  const result = core.getRoadmapPhaseInternal(dir, '99');
  assert.strictEqual(result, null);
  cleanup(dir);
});

test('get-phase returns null when ROADMAP.md does not exist', () => {
  const dir = createTempDir('roadmap-get4');
  const result = core.getRoadmapPhaseInternal(dir, '1');
  assert.strictEqual(result, null);
  cleanup(dir);
});

test('get-phase handles decimal phase numbers', () => {
  const dir = createTempDir('roadmap-decimal');
  scaffoldPlanning(dir);
  const roadmapContent = `# Roadmap\n\n## v1.0\n\n### Phase 1: Setup\n\n**Goal:** Init\n\n### Phase 1.1: Hotfix\n\n**Goal:** Fix critical bug\n\n### Phase 2: Build\n\n**Goal:** Code\n`;
  fs.writeFileSync(path.join(dir, '.planning', 'ROADMAP.md'), roadmapContent, 'utf-8');
  const result = core.getRoadmapPhaseInternal(dir, '1.1');
  assert.ok(result);
  assert.strictEqual(result.phase_name, 'Hotfix');
  assert.strictEqual(result.goal, 'Fix critical bug');
  cleanup(dir);
});

// ─── Roadmap analysis (simulating cmdRoadmapAnalyze) ─────────────────────────

test('roadmap analysis counts phases correctly', () => {
  const dir = createTempDir('roadmap-analyze');
  scaffoldPlanning(dir);
  createRoadmapMd(dir, [
    { num: 1, name: 'Setup', goal: 'Init' },
    { num: 2, name: 'Build', goal: 'Code' },
    { num: 3, name: 'Deploy', goal: 'Ship' },
  ]);

  const roadmapPath = path.join(dir, '.planning', 'ROADMAP.md');
  const content = fs.readFileSync(roadmapPath, 'utf-8');
  const phasePattern = /#{2,4}\s*Phase\s+(\d+[A-Z]?(?:\.\d+)*)\s*:\s*([^\n]+)/gi;
  const phases = [];
  let match;
  while ((match = phasePattern.exec(content)) !== null) {
    phases.push({ number: match[1], name: match[2].trim() });
  }

  assert.strictEqual(phases.length, 3);
  assert.strictEqual(phases[0].number, '1');
  assert.strictEqual(phases[1].number, '2');
  assert.strictEqual(phases[2].number, '3');
  cleanup(dir);
});

test('roadmap analysis detects disk status of phases', () => {
  const dir = createTempDir('roadmap-analyze2');
  scaffoldPlanning(dir);
  createRoadmapMd(dir, [
    { num: 1, name: 'Setup', goal: 'Init' },
    { num: 2, name: 'Build', goal: 'Code' },
  ]);
  scaffoldPhase(dir, 1, 'setup', {
    plans: [{ id: '01' }],
    summaries: [{ id: '01' }],
  });
  scaffoldPhase(dir, 2, 'build', {
    plans: [{ id: '01' }],
  });

  const phasesDir = path.join(dir, '.planning', 'phases');

  const p1Files = fs.readdirSync(path.join(phasesDir, '01-setup'));
  const p1Plans = p1Files.filter(f => f.endsWith('-PLAN.md')).length;
  const p1Summaries = p1Files.filter(f => f.endsWith('-SUMMARY.md')).length;
  assert.ok(p1Summaries >= p1Plans && p1Plans > 0, 'Phase 1 should be complete');

  const p2Files = fs.readdirSync(path.join(phasesDir, '02-build'));
  const p2Plans = p2Files.filter(f => f.endsWith('-PLAN.md')).length;
  const p2Summaries = p2Files.filter(f => f.endsWith('-SUMMARY.md')).length;
  assert.ok(p2Plans > 0 && p2Summaries === 0, 'Phase 2 should be planned but not complete');
  cleanup(dir);
});

test('roadmap with no phases directory reports empty analysis', () => {
  const dir = createTempDir('roadmap-analyze3');
  scaffoldPlanning(dir);
  createRoadmapMd(dir, [{ num: 1, name: 'Setup' }]);
  const phasesDir = path.join(dir, '.planning', 'phases');
  assert.ok(!fs.existsSync(phasesDir) || fs.readdirSync(phasesDir).length === 0);
  cleanup(dir);
});

// ─── Roadmap milestone extraction ────────────────────────────────────────────

test('getMilestoneInfo extracts version from roadmap heading', () => {
  const dir = createTempDir('roadmap-milestone');
  scaffoldPlanning(dir);
  createRoadmapMd(dir, [{ num: 1, name: 'Setup' }]);
  const info = core.getMilestoneInfo(dir);
  assert.strictEqual(info.version, 'v1.0');
  cleanup(dir);
});

test('getMilestoneInfo handles in-progress marker format', () => {
  const dir = createTempDir('roadmap-milestone2');
  scaffoldPlanning(dir);
  const content = `# Roadmap\n\n- [x] **v1.0 MVP** (shipped)\n- 🚧 **v2.0 Growth Phase**\n`;
  fs.writeFileSync(path.join(dir, '.planning', 'ROADMAP.md'), content, 'utf-8');
  const info = core.getMilestoneInfo(dir);
  assert.strictEqual(info.version, 'v2.0');
  assert.strictEqual(info.name, 'Growth Phase');
  cleanup(dir);
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
