/**
 * Tests for config.cjs: config CRUD operations
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { createTempDir, cleanup, scaffoldPlanning } = require('./helpers.cjs');

// config.cjs functions call output() which does process.exit(0).
// We need to test the file operations directly rather than calling the cmd* functions.
// We'll test the logic by inspecting file state.

let passed = 0;
let failed = 0;

function test(name, fn) {
  try { fn(); passed++; console.log(`  PASS: ${name}`); }
  catch (e) { failed++; console.log(`  FAIL: ${name}: ${e.message}`); }
}

console.log('config.cjs tests\n');

// ─── Config file creation ────────────────────────────────────────────────────

test('config.json created with defaults by scaffoldPlanning', () => {
  const dir = createTempDir('config-create');
  scaffoldPlanning(dir);
  const configPath = path.join(dir, '.planning', 'config.json');
  assert.ok(fs.existsSync(configPath));
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  assert.strictEqual(config.commit_docs, true);
  assert.strictEqual(config.branching_strategy, 'none');
  cleanup(dir);
});

// ─── loadConfig from core.cjs (config loading logic) ─────────────────────────

const { loadConfig } = require('../bin/lib/core.cjs');

test('loadConfig returns defaults with no .planning dir', () => {
  const dir = createTempDir('config-nodir');
  const config = loadConfig(dir);
  assert.strictEqual(config.commit_docs, true);
  assert.strictEqual(config.search_gitignored, false);
  assert.strictEqual(config.branching_strategy, 'none');
  assert.strictEqual(config.research, true);
  assert.strictEqual(config.plan_checker, true);
  assert.strictEqual(config.verifier, true);
  assert.strictEqual(config.parallelization, true);
  assert.strictEqual(config.brave_search, false);
  cleanup(dir);
});

test('loadConfig returns defaults with empty config.json', () => {
  const dir = createTempDir('config-empty');
  const planDir = path.join(dir, '.planning');
  fs.mkdirSync(planDir, { recursive: true });
  fs.writeFileSync(path.join(planDir, 'config.json'), '{}', 'utf-8');
  const config = loadConfig(dir);
  assert.strictEqual(config.commit_docs, true);
  assert.strictEqual(config.branching_strategy, 'none');
  cleanup(dir);
});

test('loadConfig returns defaults with invalid JSON', () => {
  const dir = createTempDir('config-invalid');
  const planDir = path.join(dir, '.planning');
  fs.mkdirSync(planDir, { recursive: true });
  fs.writeFileSync(path.join(planDir, 'config.json'), 'not json', 'utf-8');
  const config = loadConfig(dir);
  assert.strictEqual(config.commit_docs, true);
  cleanup(dir);
});

test('loadConfig overrides specific values from config.json', () => {
  const dir = createTempDir('config-override');
  scaffoldPlanning(dir, {
    config: {
      commit_docs: false,
      branching_strategy: 'milestone',
      parallelization: false,
    }
  });
  const config = loadConfig(dir);
  assert.strictEqual(config.commit_docs, false);
  assert.strictEqual(config.branching_strategy, 'milestone');
  assert.strictEqual(config.parallelization, false);
  // Defaults still apply for unspecified keys
  assert.strictEqual(config.research, true);
  cleanup(dir);
});

test('loadConfig reads nested workflow config', () => {
  const dir = createTempDir('config-nested');
  scaffoldPlanning(dir, {
    config: {
      workflow: {
        research: false,
        plan_check: false,
        verifier: false,
        nyquist_validation: false,
      }
    }
  });
  const config = loadConfig(dir);
  assert.strictEqual(config.research, false);
  assert.strictEqual(config.plan_checker, false);
  assert.strictEqual(config.verifier, false);
  assert.strictEqual(config.nyquist_validation, false);
  cleanup(dir);
});

test('loadConfig handles parallelization as object with enabled field', () => {
  const dir = createTempDir('config-par-obj');
  scaffoldPlanning(dir, {
    config: { parallelization: { enabled: false, max_agents: 3 } }
  });
  const config = loadConfig(dir);
  assert.strictEqual(config.parallelization, false);
  cleanup(dir);
});

test('loadConfig migrates deprecated depth key to granularity', () => {
  const dir = createTempDir('config-migrate');
  scaffoldPlanning(dir, {
    config: { depth: 'quick' }
  });
  const config = loadConfig(dir);
  // After migration, the file should have granularity instead of depth
  const raw = JSON.parse(fs.readFileSync(path.join(dir, '.planning', 'config.json'), 'utf-8'));
  assert.strictEqual(raw.granularity, 'coarse');
  assert.strictEqual(raw.depth, undefined);
  cleanup(dir);
});

test('loadConfig reads nested git config keys', () => {
  const dir = createTempDir('config-git');
  scaffoldPlanning(dir, {
    config: {
      git: {
        branching_strategy: 'phase',
        phase_branch_template: 'custom/{phase}',
      }
    }
  });
  const config = loadConfig(dir);
  assert.strictEqual(config.branching_strategy, 'phase');
  assert.strictEqual(config.phase_branch_template, 'custom/{phase}');
  cleanup(dir);
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
