/**
 * Tests for core.cjs: utility functions, phase helpers, path helpers
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

console.log('core.cjs tests\n');

// ─── toPosixPath ─────────────────────────────────────────────────────────────

test('toPosixPath converts backslashes to forward slashes', () => {
  assert.strictEqual(core.toPosixPath('a/b/c'), 'a/b/c');
  // On any platform, splitting by sep and joining with / should produce posix
  const result = core.toPosixPath(path.join('foo', 'bar', 'baz'));
  assert.ok(result === 'foo/bar/baz');
});

// ─── safeReadFile ────────────────────────────────────────────────────────────

test('safeReadFile returns file content when file exists', () => {
  const dir = createTempDir('core-safe');
  const fp = path.join(dir, 'test.txt');
  fs.writeFileSync(fp, 'hello', 'utf-8');
  assert.strictEqual(core.safeReadFile(fp), 'hello');
  cleanup(dir);
});

test('safeReadFile returns null for missing file', () => {
  assert.strictEqual(core.safeReadFile('/tmp/nonexistent-file-abc123.txt'), null);
});

// ─── generateSlugInternal ────────────────────────────────────────────────────

test('generateSlugInternal converts text to slug', () => {
  assert.strictEqual(core.generateSlugInternal('Hello World'), 'hello-world');
  assert.strictEqual(core.generateSlugInternal('API v2.0 (Beta)'), 'api-v2-0-beta');
  assert.strictEqual(core.generateSlugInternal('  Leading & Trailing  '), 'leading-trailing');
});

test('generateSlugInternal returns null for empty input', () => {
  assert.strictEqual(core.generateSlugInternal(''), null);
  assert.strictEqual(core.generateSlugInternal(null), null);
  assert.strictEqual(core.generateSlugInternal(undefined), null);
});

// ─── normalizePhaseName ──────────────────────────────────────────────────────

test('normalizePhaseName pads single digit to two digits', () => {
  assert.strictEqual(core.normalizePhaseName('1'), '01');
  assert.strictEqual(core.normalizePhaseName('9'), '09');
  assert.strictEqual(core.normalizePhaseName('12'), '12');
});

test('normalizePhaseName handles letter suffix', () => {
  assert.strictEqual(core.normalizePhaseName('3A'), '03A');
  assert.strictEqual(core.normalizePhaseName('12b'), '12B');
});

test('normalizePhaseName handles decimal phases', () => {
  assert.strictEqual(core.normalizePhaseName('3.1'), '03.1');
  assert.strictEqual(core.normalizePhaseName('12.2'), '12.2');
});

// ─── comparePhaseNum ─────────────────────────────────────────────────────────

test('comparePhaseNum orders integer phases correctly', () => {
  assert.ok(core.comparePhaseNum('1', '2') < 0);
  assert.ok(core.comparePhaseNum('10', '2') > 0);
  assert.strictEqual(core.comparePhaseNum('5', '5'), 0);
});

test('comparePhaseNum orders letter suffixes after base', () => {
  assert.ok(core.comparePhaseNum('12', '12A') < 0);
  assert.ok(core.comparePhaseNum('12A', '12B') < 0);
});

test('comparePhaseNum orders decimal phases', () => {
  assert.ok(core.comparePhaseNum('3', '3.1') < 0);
  assert.ok(core.comparePhaseNum('3.1', '3.2') < 0);
  assert.ok(core.comparePhaseNum('3.1', '4') < 0);
});

// ─── escapeRegex ─────────────────────────────────────────────────────────────

test('escapeRegex escapes special regex characters', () => {
  const escaped = core.escapeRegex('test.file (v1)');
  assert.ok(!new RegExp(escaped).test('testXfile (v1)'));
  assert.ok(new RegExp(escaped).test('test.file (v1)'));
});

// ─── loadConfig ──────────────────────────────────────────────────────────────

test('loadConfig returns defaults when no config file exists', () => {
  const dir = createTempDir('core-config');
  const config = core.loadConfig(dir);
  assert.strictEqual(config.commit_docs, true);
  assert.strictEqual(config.branching_strategy, 'none');
  assert.strictEqual(config.parallelization, true);
  assert.strictEqual(config.research, true);
  cleanup(dir);
});

test('loadConfig reads from config.json when present', () => {
  const dir = createTempDir('core-config2');
  scaffoldPlanning(dir, { config: { commit_docs: false, branching_strategy: 'phase' } });
  const config = core.loadConfig(dir);
  assert.strictEqual(config.commit_docs, false);
  assert.strictEqual(config.branching_strategy, 'phase');
  cleanup(dir);
});

test('loadConfig handles nested config values', () => {
  const dir = createTempDir('core-config3');
  scaffoldPlanning(dir, {
    config: { workflow: { research: false, plan_check: false } }
  });
  const config = core.loadConfig(dir);
  assert.strictEqual(config.research, false);
  assert.strictEqual(config.plan_checker, false);
  cleanup(dir);
});

// ─── pathExistsInternal ──────────────────────────────────────────────────────

test('pathExistsInternal returns true for existing path', () => {
  const dir = createTempDir('core-exists');
  fs.writeFileSync(path.join(dir, 'file.txt'), 'x');
  assert.strictEqual(core.pathExistsInternal(dir, 'file.txt'), true);
  cleanup(dir);
});

test('pathExistsInternal returns false for missing path', () => {
  const dir = createTempDir('core-exists2');
  assert.strictEqual(core.pathExistsInternal(dir, 'nope.txt'), false);
  cleanup(dir);
});

// ─── findPhaseInternal ───────────────────────────────────────────────────────

test('findPhaseInternal finds existing phase directory', () => {
  const dir = createTempDir('core-find');
  scaffoldPlanning(dir);
  scaffoldPhase(dir, 1, 'setup', { plans: [{ id: '01' }] });
  const result = core.findPhaseInternal(dir, '1');
  assert.ok(result);
  assert.strictEqual(result.found, true);
  assert.strictEqual(result.phase_number, '01');
  assert.ok(result.plans.length >= 1);
  cleanup(dir);
});

test('findPhaseInternal returns null for missing phase', () => {
  const dir = createTempDir('core-find2');
  scaffoldPlanning(dir);
  fs.mkdirSync(path.join(dir, '.planning', 'phases'), { recursive: true });
  const result = core.findPhaseInternal(dir, '99');
  assert.strictEqual(result, null);
  cleanup(dir);
});

test('findPhaseInternal returns null for empty input', () => {
  assert.strictEqual(core.findPhaseInternal('/tmp', null), null);
  assert.strictEqual(core.findPhaseInternal('/tmp', ''), null);
});

// ─── searchPhaseInDir ────────────────────────────────────────────────────────

test('searchPhaseInDir finds phase and reports files', () => {
  const dir = createTempDir('core-search');
  scaffoldPlanning(dir);
  const { dirName } = scaffoldPhase(dir, 2, 'build', {
    plans: [{ id: '01' }],
    summaries: [{ id: '01' }],
    research: true,
  });
  const phasesDir = path.join(dir, '.planning', 'phases');
  const result = core.searchPhaseInDir(phasesDir, '.planning/phases', '02');
  assert.ok(result);
  assert.strictEqual(result.found, true);
  assert.strictEqual(result.has_research, true);
  assert.strictEqual(result.incomplete_plans.length, 0);
  cleanup(dir);
});

// ─── getRoadmapPhaseInternal ─────────────────────────────────────────────────

test('getRoadmapPhaseInternal extracts phase from ROADMAP.md', () => {
  const dir = createTempDir('core-roadmap');
  scaffoldPlanning(dir);
  createRoadmapMd(dir, [
    { num: 1, name: 'Foundation', goal: 'Set up the base' },
    { num: 2, name: 'Features', goal: 'Build features' },
  ]);
  const result = core.getRoadmapPhaseInternal(dir, '1');
  assert.ok(result);
  assert.strictEqual(result.found, true);
  assert.strictEqual(result.phase_name, 'Foundation');
  assert.strictEqual(result.goal, 'Set up the base');
  cleanup(dir);
});

test('getRoadmapPhaseInternal returns null for missing phase', () => {
  const dir = createTempDir('core-roadmap2');
  scaffoldPlanning(dir);
  createRoadmapMd(dir, [{ num: 1, name: 'Setup' }]);
  const result = core.getRoadmapPhaseInternal(dir, '99');
  assert.strictEqual(result, null);
  cleanup(dir);
});

test('getRoadmapPhaseInternal returns null when no ROADMAP', () => {
  const dir = createTempDir('core-roadmap3');
  const result = core.getRoadmapPhaseInternal(dir, '1');
  assert.strictEqual(result, null);
  cleanup(dir);
});

// ─── getMilestoneInfo ────────────────────────────────────────────────────────

test('getMilestoneInfo extracts version from heading-format roadmap', () => {
  const dir = createTempDir('core-milestone');
  scaffoldPlanning(dir);
  createRoadmapMd(dir, [{ num: 1, name: 'Setup' }]);
  const info = core.getMilestoneInfo(dir);
  assert.strictEqual(info.version, 'v1.0');
  assert.ok(info.name);
  cleanup(dir);
});

test('getMilestoneInfo returns default when no ROADMAP', () => {
  const dir = createTempDir('core-milestone2');
  const info = core.getMilestoneInfo(dir);
  assert.strictEqual(info.version, 'v1.0');
  assert.strictEqual(info.name, 'milestone');
  cleanup(dir);
});

// ─── getMilestonePhaseFilter ─────────────────────────────────────────────────

test('getMilestonePhaseFilter returns pass-all when no phases in roadmap', () => {
  const dir = createTempDir('core-filter');
  scaffoldPlanning(dir);
  fs.writeFileSync(path.join(dir, '.planning', 'ROADMAP.md'), '# Roadmap\n\nNo phases yet.\n', 'utf-8');
  const filter = core.getMilestonePhaseFilter(dir);
  assert.strictEqual(filter('anything'), true);
  assert.strictEqual(filter.phaseCount, 0);
  cleanup(dir);
});

test('getMilestonePhaseFilter filters to roadmap phases', () => {
  const dir = createTempDir('core-filter2');
  scaffoldPlanning(dir);
  createRoadmapMd(dir, [
    { num: 1, name: 'Setup' },
    { num: 2, name: 'Build' },
  ]);
  const filter = core.getMilestonePhaseFilter(dir);
  assert.strictEqual(filter('01-setup'), true);
  assert.strictEqual(filter('02-build'), true);
  assert.strictEqual(filter('03-deploy'), false);
  assert.strictEqual(filter.phaseCount, 2);
  cleanup(dir);
});

// ─── getArchivedPhaseDirs ────────────────────────────────────────────────────

test('getArchivedPhaseDirs returns empty when no milestones dir', () => {
  const dir = createTempDir('core-archived');
  const result = core.getArchivedPhaseDirs(dir);
  assert.deepStrictEqual(result, []);
  cleanup(dir);
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
