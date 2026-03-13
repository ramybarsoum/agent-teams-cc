/**
 * Tests for verify.cjs: plan structure validation, artifact verification, consistency
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { createTempDir, cleanup, scaffoldPlanning, scaffoldPhase, createRoadmapMd } = require('./helpers.cjs');
const fm = require('../bin/lib/frontmatter.cjs');
const core = require('../bin/lib/core.cjs');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try { fn(); passed++; console.log(`  PASS: ${name}`); }
  catch (e) { failed++; console.log(`  FAIL: ${name}: ${e.message}`); }
}

console.log('verify.cjs tests\n');

// ─── Plan structure validation (logic from cmdVerifyPlanStructure) ────────────

test('valid plan has all required frontmatter fields', () => {
  const content = `---
phase: "01"
plan: "01"
type: implement
wave: 1
depends_on: []
files_modified: [src/app.ts]
autonomous: true
must_haves:
  truths: []
  artifacts: []
  key_links: []
---

# Plan 01

<task>
<name>Create app entry</name>
<action>Write src/app.ts</action>
<verify>File exists and compiles</verify>
<done>App boots</done>
</task>
`;
  const fmObj = fm.extractFrontmatter(content);
  const required = ['phase', 'plan', 'type', 'wave', 'depends_on', 'files_modified', 'autonomous', 'must_haves'];
  const missing = required.filter(f => fmObj[f] === undefined);
  assert.strictEqual(missing.length, 0, `Missing fields: ${missing.join(', ')}`);
});

test('plan missing required fields is detected', () => {
  const content = `---
phase: "01"
plan: "01"
---

# Plan
`;
  const fmObj = fm.extractFrontmatter(content);
  const required = ['phase', 'plan', 'type', 'wave', 'depends_on', 'files_modified', 'autonomous', 'must_haves'];
  const missing = required.filter(f => fmObj[f] === undefined);
  assert.ok(missing.includes('type'));
  assert.ok(missing.includes('wave'));
  assert.ok(missing.includes('autonomous'));
  assert.ok(missing.includes('must_haves'));
});

test('task elements are parsed from plan content', () => {
  const content = `---
phase: "01"
plan: "01"
type: implement
wave: 1
depends_on: []
files_modified: []
autonomous: true
must_haves:
  truths: []
---

<task>
<name>Task One</name>
<action>Do thing 1</action>
<verify>Check 1</verify>
<done>Done 1</done>
</task>

<task>
<name>Task Two</name>
<action>Do thing 2</action>
<verify>Check 2</verify>
<done>Done 2</done>
</task>
`;
  const taskPattern = /<task[^>]*>([\s\S]*?)<\/task>/g;
  const tasks = [];
  let m;
  while ((m = taskPattern.exec(content)) !== null) {
    const tc = m[1];
    const nameMatch = tc.match(/<name>([\s\S]*?)<\/name>/);
    tasks.push({
      name: nameMatch ? nameMatch[1].trim() : 'unnamed',
      hasAction: /<action>/.test(tc),
      hasVerify: /<verify>/.test(tc),
      hasDone: /<done>/.test(tc),
    });
  }
  assert.strictEqual(tasks.length, 2);
  assert.strictEqual(tasks[0].name, 'Task One');
  assert.ok(tasks[0].hasAction);
  assert.ok(tasks[1].hasVerify);
});

test('task missing action element generates error', () => {
  const content = `<task>
<name>Bad Task</name>
<verify>Check</verify>
</task>`;
  const hasAction = /<action>/.test(content);
  assert.strictEqual(hasAction, false);
});

test('checkpoint task with autonomous true is an error', () => {
  const content = `---
autonomous: true
---
<task type="checkpoint">
<name>Review</name>
<action>Human reviews</action>
</task>`;
  const fmObj = fm.extractFrontmatter(content);
  const hasCheckpoints = /<task\s+type=["']?checkpoint/.test(content);
  assert.ok(hasCheckpoints);
  assert.strictEqual(fmObj.autonomous, 'true');
  assert.ok(hasCheckpoints && fmObj.autonomous !== 'false' && fmObj.autonomous !== false);
});

// ─── Artifact verification (logic from cmdVerifyArtifacts) ───────────────────

test('artifact verification checks file existence', () => {
  const dir = createTempDir('verify-artifacts');
  fs.writeFileSync(path.join(dir, 'src-app.ts'), 'export const app = true;\n'.repeat(15), 'utf-8');

  const artifacts = [
    { path: 'src-app.ts', min_lines: 10 },
    { path: 'missing-file.ts' },
  ];

  const results = artifacts.map(a => {
    const fp = path.join(dir, a.path);
    const exists = fs.existsSync(fp);
    const issues = [];
    if (!exists) {
      issues.push('File not found');
    } else if (a.min_lines) {
      const lines = fs.readFileSync(fp, 'utf-8').split('\n').length;
      if (lines < a.min_lines) issues.push(`Only ${lines} lines`);
    }
    return { path: a.path, exists, issues, passed: issues.length === 0 };
  });

  assert.strictEqual(results[0].passed, true);
  assert.strictEqual(results[1].passed, false);
  assert.ok(results[1].issues[0].includes('not found'));
  cleanup(dir);
});

test('artifact verification checks min_lines constraint', () => {
  const dir = createTempDir('verify-minlines');
  fs.writeFileSync(path.join(dir, 'small.ts'), 'line1\nline2\n', 'utf-8');

  const content = fs.readFileSync(path.join(dir, 'small.ts'), 'utf-8');
  const lineCount = content.split('\n').length;
  assert.ok(lineCount < 10, 'File should be small');
  cleanup(dir);
});

// ─── Phase completeness (logic from cmdVerifyPhaseCompleteness) ──────────────

test('phase is complete when all plans have summaries', () => {
  const dir = createTempDir('verify-complete');
  scaffoldPlanning(dir);
  scaffoldPhase(dir, 1, 'setup', {
    plans: [{ id: '01' }, { id: '02' }],
    summaries: [{ id: '01' }, { id: '02' }],
  });
  const result = core.findPhaseInternal(dir, '1');
  assert.strictEqual(result.incomplete_plans.length, 0);
  cleanup(dir);
});

test('phase is incomplete when some plans lack summaries', () => {
  const dir = createTempDir('verify-incomplete');
  scaffoldPlanning(dir);
  scaffoldPhase(dir, 1, 'setup', {
    plans: [{ id: '01' }, { id: '02' }, { id: '03' }],
    summaries: [{ id: '01' }],
  });
  const result = core.findPhaseInternal(dir, '1');
  assert.strictEqual(result.incomplete_plans.length, 2);
  cleanup(dir);
});

// ─── Consistency validation (logic from cmdValidateConsistency) ──────────────

test('consistency check detects phase in roadmap but not on disk', () => {
  const dir = createTempDir('verify-consistency');
  scaffoldPlanning(dir);
  createRoadmapMd(dir, [
    { num: 1, name: 'Setup' },
    { num: 2, name: 'Build' },
    { num: 3, name: 'Deploy' },
  ]);
  scaffoldPhase(dir, 1, 'setup');

  const roadmapContent = fs.readFileSync(path.join(dir, '.planning', 'ROADMAP.md'), 'utf-8');
  const roadmapPhases = new Set();
  const phasePattern = /#{2,4}\s*Phase\s+(\d+[A-Z]?(?:\.\d+)*)\s*:/gi;
  let m;
  while ((m = phasePattern.exec(roadmapContent)) !== null) {
    roadmapPhases.add(m[1]);
  }

  const diskPhases = new Set();
  const phasesDir = path.join(dir, '.planning', 'phases');
  const entries = fs.readdirSync(phasesDir, { withFileTypes: true });
  for (const e of entries) {
    if (e.isDirectory()) {
      const dm = e.name.match(/^(\d+[A-Z]?(?:\.\d+)*)/i);
      if (dm) diskPhases.add(dm[1]);
    }
  }

  assert.strictEqual(roadmapPhases.size, 3);
  assert.strictEqual(diskPhases.size, 1);

  const missingOnDisk = [...roadmapPhases].filter(p => !diskPhases.has(p) && !diskPhases.has(core.normalizePhaseName(p)));
  assert.strictEqual(missingOnDisk.length, 2);
  cleanup(dir);
});

test('consistency check detects phase on disk but not in roadmap', () => {
  const dir = createTempDir('verify-consistency2');
  scaffoldPlanning(dir);
  createRoadmapMd(dir, [{ num: 1, name: 'Setup' }]);
  scaffoldPhase(dir, 1, 'setup');
  scaffoldPhase(dir, 2, 'extra');

  const roadmapContent = fs.readFileSync(path.join(dir, '.planning', 'ROADMAP.md'), 'utf-8');
  const roadmapPhases = new Set();
  const phasePattern = /#{2,4}\s*Phase\s+(\d+[A-Z]?(?:\.\d+)*)\s*:/gi;
  let m;
  while ((m = phasePattern.exec(roadmapContent)) !== null) {
    roadmapPhases.add(m[1]);
  }

  const diskPhases = new Set();
  const phasesDir = path.join(dir, '.planning', 'phases');
  const entries = fs.readdirSync(phasesDir, { withFileTypes: true });
  for (const e of entries) {
    if (e.isDirectory()) {
      const dm = e.name.match(/^(\d+[A-Z]?(?:\.\d+)*)/i);
      if (dm) diskPhases.add(dm[1]);
    }
  }

  const extraOnDisk = [...diskPhases].filter(p => {
    const unpadded = String(parseInt(p, 10));
    return !roadmapPhases.has(p) && !roadmapPhases.has(unpadded);
  });
  assert.strictEqual(extraOnDisk.length, 1);
  assert.ok(extraOnDisk[0].startsWith('02'));
  cleanup(dir);
});

// ─── Reference verification ─────────────────────────────────────────────────

test('backtick file references are detected as found or missing', () => {
  const dir = createTempDir('verify-refs');
  fs.mkdirSync(path.join(dir, 'src'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'src', 'app.ts'), 'code', 'utf-8');

  const content = 'See `src/app.ts` and `src/missing.ts` for details.';
  const backtickRefs = content.match(/`([^`]+\/[^`]+\.[a-zA-Z]{1,10})`/g) || [];

  const found = [];
  const missing = [];
  for (const ref of backtickRefs) {
    const cleanRef = ref.slice(1, -1);
    if (fs.existsSync(path.join(dir, cleanRef))) {
      found.push(cleanRef);
    } else {
      missing.push(cleanRef);
    }
  }

  assert.strictEqual(found.length, 1);
  assert.strictEqual(missing.length, 1);
  assert.strictEqual(found[0], 'src/app.ts');
  assert.strictEqual(missing[0], 'src/missing.ts');
  cleanup(dir);
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
