/**
 * Tests for init.cjs: context loading for different workflow types
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

console.log('init.cjs tests\n');

// Note: init.cjs functions call output() which calls process.exit(0).
// We test the underlying logic (config loading, file detection, phase finding)
// that feeds into the init commands.

// ─── Execute phase init context ──────────────────────────────────────────────

test('execute-phase context loads config and phase info', () => {
  const dir = createTempDir('init-exec');
  scaffoldPlanning(dir);
  createRoadmapMd(dir, [
    { num: 1, name: 'Setup', goal: 'Init' },
    { num: 2, name: 'Build', goal: 'Code' },
  ]);
  scaffoldPhase(dir, 1, 'setup', {
    plans: [{ id: '01' }, { id: '02' }],
    summaries: [{ id: '01' }],
  });

  const config = core.loadConfig(dir);
  const phaseInfo = core.findPhaseInternal(dir, '1');
  const milestone = core.getMilestoneInfo(dir);

  assert.ok(config.commit_docs === true);
  assert.ok(phaseInfo);
  assert.strictEqual(phaseInfo.plans.length, 2);
  assert.strictEqual(phaseInfo.incomplete_plans.length, 1);
  assert.strictEqual(milestone.version, 'v1.0');
  cleanup(dir);
});

test('execute-phase context handles missing phase gracefully', () => {
  const dir = createTempDir('init-exec2');
  scaffoldPlanning(dir);
  createRoadmapMd(dir, [{ num: 1, name: 'Setup' }]);
  fs.mkdirSync(path.join(dir, '.planning', 'phases'), { recursive: true });

  const phaseInfo = core.findPhaseInternal(dir, '99');
  assert.strictEqual(phaseInfo, null);
  cleanup(dir);
});

// ─── Plan phase init context ─────────────────────────────────────────────────

test('plan-phase context detects existing research and context', () => {
  const dir = createTempDir('init-plan');
  scaffoldPlanning(dir);
  createRoadmapMd(dir, [{ num: 1, name: 'Setup' }]);
  scaffoldPhase(dir, 1, 'setup', { research: true, context: true });

  const phaseInfo = core.findPhaseInternal(dir, '1');
  assert.ok(phaseInfo);
  assert.strictEqual(phaseInfo.has_research, true);
  assert.strictEqual(phaseInfo.has_context, true);
  cleanup(dir);
});

test('plan-phase context reports no research/context when absent', () => {
  const dir = createTempDir('init-plan2');
  scaffoldPlanning(dir);
  createRoadmapMd(dir, [{ num: 1, name: 'Setup' }]);
  scaffoldPhase(dir, 1, 'setup');

  const phaseInfo = core.findPhaseInternal(dir, '1');
  assert.ok(phaseInfo);
  assert.strictEqual(phaseInfo.has_research, false);
  assert.strictEqual(phaseInfo.has_context, false);
  cleanup(dir);
});

test('plan-phase context loads config workflow flags', () => {
  const dir = createTempDir('init-plan3');
  scaffoldPlanning(dir, {
    config: {
      workflow: { research: false, plan_check: false, nyquist_validation: true },
      commit_docs: false,
    }
  });

  const config = core.loadConfig(dir);
  assert.strictEqual(config.research, false);
  assert.strictEqual(config.plan_checker, false);
  assert.strictEqual(config.nyquist_validation, true);
  assert.strictEqual(config.commit_docs, false);
  cleanup(dir);
});

// ─── New project init context ────────────────────────────────────────────────

test('new-project context detects brownfield by code files', () => {
  const dir = createTempDir('init-new');
  fs.writeFileSync(path.join(dir, 'app.ts'), 'const x = 1;');

  // Simulate detectExistingCode from init.cjs
  const codeExtensions = new Set(['.ts', '.js', '.py', '.go', '.rs', '.swift', '.java']);
  let found = false;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isFile() && codeExtensions.has(path.extname(entry.name))) {
      found = true;
      break;
    }
  }
  assert.strictEqual(found, true);
  cleanup(dir);
});

test('new-project context detects greenfield (no code)', () => {
  const dir = createTempDir('init-new2');
  fs.writeFileSync(path.join(dir, 'README.md'), '# Hello');

  const codeExtensions = new Set(['.ts', '.js', '.py', '.go', '.rs', '.swift', '.java']);
  let found = false;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isFile() && codeExtensions.has(path.extname(entry.name))) {
      found = true;
      break;
    }
  }
  assert.strictEqual(found, false);
  cleanup(dir);
});

test('new-project context detects package.json', () => {
  const dir = createTempDir('init-new3');
  fs.writeFileSync(path.join(dir, 'package.json'), '{}');
  assert.ok(core.pathExistsInternal(dir, 'package.json'));
  cleanup(dir);
});

test('new-project context checks for existing .planning', () => {
  const dir = createTempDir('init-new4');
  assert.strictEqual(core.pathExistsInternal(dir, '.planning'), false);
  scaffoldPlanning(dir);
  assert.strictEqual(core.pathExistsInternal(dir, '.planning'), true);
  cleanup(dir);
});

// ─── Resume init context ────────────────────────────────────────────────────

test('resume context detects STATE.md existence', () => {
  const dir = createTempDir('init-resume');
  scaffoldPlanning(dir);
  assert.strictEqual(core.pathExistsInternal(dir, '.planning/STATE.md'), false);

  createStateMd(dir);
  // writeStateMd wraps with frontmatter, so the file will exist at .planning/STATE.md
  assert.strictEqual(core.pathExistsInternal(dir, '.planning/STATE.md'), true);
  cleanup(dir);
});

test('resume context detects interrupted agent file', () => {
  const dir = createTempDir('init-resume2');
  scaffoldPlanning(dir);
  const agentFile = path.join(dir, '.planning', 'current-agent-id.txt');
  fs.writeFileSync(agentFile, 'agent-123', 'utf-8');

  const agentId = fs.readFileSync(agentFile, 'utf-8').trim();
  assert.strictEqual(agentId, 'agent-123');
  cleanup(dir);
});

test('resume context works without interrupted agent', () => {
  const dir = createTempDir('init-resume3');
  scaffoldPlanning(dir);
  const agentFile = path.join(dir, '.planning', 'current-agent-id.txt');
  let interruptedId = null;
  try {
    interruptedId = fs.readFileSync(agentFile, 'utf-8').trim();
  } catch {}
  assert.strictEqual(interruptedId, null);
  cleanup(dir);
});

// ─── Quick init context ─────────────────────────────────────────────────────

test('quick init generates slug from description', () => {
  const slug = core.generateSlugInternal('Fix login bug')?.substring(0, 40);
  assert.strictEqual(slug, 'fix-login-bug');
});

test('quick init finds next task number', () => {
  const dir = createTempDir('init-quick');
  const quickDir = path.join(dir, '.planning', 'quick');
  fs.mkdirSync(quickDir, { recursive: true });
  fs.mkdirSync(path.join(quickDir, '1-first-task'));
  fs.mkdirSync(path.join(quickDir, '2-second-task'));

  const existing = fs.readdirSync(quickDir)
    .filter(f => /^\d+-/.test(f))
    .map(f => parseInt(f.split('-')[0], 10))
    .filter(n => !isNaN(n));
  const nextNum = existing.length > 0 ? Math.max(...existing) + 1 : 1;
  assert.strictEqual(nextNum, 3);
  cleanup(dir);
});

test('quick init starts at 1 with empty quick dir', () => {
  const dir = createTempDir('init-quick2');
  const quickDir = path.join(dir, '.planning', 'quick');
  fs.mkdirSync(quickDir, { recursive: true });

  const existing = fs.readdirSync(quickDir)
    .filter(f => /^\d+-/.test(f))
    .map(f => parseInt(f.split('-')[0], 10))
    .filter(n => !isNaN(n));
  const nextNum = existing.length > 0 ? Math.max(...existing) + 1 : 1;
  assert.strictEqual(nextNum, 1);
  cleanup(dir);
});

// ─── Verify-work init context ────────────────────────────────────────────────

test('verify-work context detects verification file', () => {
  const dir = createTempDir('init-verify');
  scaffoldPlanning(dir);
  createRoadmapMd(dir, [{ num: 1, name: 'Setup' }]);
  scaffoldPhase(dir, 1, 'setup');

  // Add verification file
  const phaseDir = path.join(dir, '.planning', 'phases', '01-setup');
  fs.writeFileSync(path.join(phaseDir, '01-VERIFICATION.md'), '# Verification\n', 'utf-8');

  const phaseInfo = core.findPhaseInternal(dir, '1');
  assert.ok(phaseInfo);
  assert.strictEqual(phaseInfo.has_verification, true);
  cleanup(dir);
});

test('verify-work context reports no verification when absent', () => {
  const dir = createTempDir('init-verify2');
  scaffoldPlanning(dir);
  createRoadmapMd(dir, [{ num: 1, name: 'Setup' }]);
  scaffoldPhase(dir, 1, 'setup');

  const phaseInfo = core.findPhaseInternal(dir, '1');
  assert.ok(phaseInfo);
  assert.strictEqual(phaseInfo.has_verification, false);
  cleanup(dir);
});

// ─── Map codebase init context ───────────────────────────────────────────────

test('map-codebase context detects existing maps', () => {
  const dir = createTempDir('init-map');
  scaffoldPlanning(dir);
  const codebaseDir = path.join(dir, '.planning', 'codebase');
  fs.mkdirSync(codebaseDir, { recursive: true });
  fs.writeFileSync(path.join(codebaseDir, 'architecture.md'), '# Architecture\n');
  fs.writeFileSync(path.join(codebaseDir, 'patterns.md'), '# Patterns\n');

  const maps = fs.readdirSync(codebaseDir).filter(f => f.endsWith('.md'));
  assert.strictEqual(maps.length, 2);
  cleanup(dir);
});

test('map-codebase context reports no maps when dir missing', () => {
  const dir = createTempDir('init-map2');
  scaffoldPlanning(dir);
  const codebaseDir = path.join(dir, '.planning', 'codebase');
  assert.ok(!fs.existsSync(codebaseDir));
  cleanup(dir);
});

// ─── New milestone init context ──────────────────────────────────────────────

test('new-milestone context loads current milestone info', () => {
  const dir = createTempDir('init-milestone');
  scaffoldPlanning(dir);
  createRoadmapMd(dir, [{ num: 1, name: 'Setup' }]);

  const milestone = core.getMilestoneInfo(dir);
  const config = core.loadConfig(dir);

  assert.strictEqual(milestone.version, 'v1.0');
  assert.ok(config.research === true || config.research === false);
  cleanup(dir);
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
