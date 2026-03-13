/**
 * Tests for frontmatter.cjs: YAML frontmatter parsing, serialization, CRUD, validation
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { createTempDir, cleanup } = require('./helpers.cjs');
const fm = require('../bin/lib/frontmatter.cjs');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try { fn(); passed++; console.log(`  PASS: ${name}`); }
  catch (e) { failed++; console.log(`  FAIL: ${name}: ${e.message}`); }
}

console.log('frontmatter.cjs tests\n');

// ─── extractFrontmatter ─────────────────────────────────────────────────────

test('extractFrontmatter parses simple key-value pairs', () => {
  const content = `---\nphase: "01"\nplan: "01"\ntype: implement\n---\n\n# Plan\n`;
  const result = fm.extractFrontmatter(content);
  assert.strictEqual(result.phase, '01');
  assert.strictEqual(result.plan, '01');
  assert.strictEqual(result.type, 'implement');
});

test('extractFrontmatter parses inline arrays', () => {
  const content = `---\ntags: [alpha, beta, gamma]\n---\n`;
  const result = fm.extractFrontmatter(content);
  assert.deepStrictEqual(result.tags, ['alpha', 'beta', 'gamma']);
});

test('extractFrontmatter parses multiline arrays', () => {
  const content = `---\nfiles_modified:\n  - src/app.ts\n  - src/util.ts\n---\n`;
  const result = fm.extractFrontmatter(content);
  assert.ok(Array.isArray(result.files_modified));
  assert.strictEqual(result.files_modified.length, 2);
  assert.strictEqual(result.files_modified[0], 'src/app.ts');
});

test('extractFrontmatter parses nested objects', () => {
  const content = `---\ntech-stack:\n  added:\n    - vitest\n    - zod\n---\n`;
  const result = fm.extractFrontmatter(content);
  assert.ok(result['tech-stack']);
  assert.ok(Array.isArray(result['tech-stack'].added));
  assert.strictEqual(result['tech-stack'].added.length, 2);
});

test('extractFrontmatter returns empty object for no frontmatter', () => {
  const content = `# Just a heading\n\nSome body text.\n`;
  const result = fm.extractFrontmatter(content);
  assert.deepStrictEqual(result, {});
});

test('extractFrontmatter handles boolean-like and numeric strings', () => {
  const content = `---\nautonomous: true\nwave: 2\n---\n`;
  const result = fm.extractFrontmatter(content);
  assert.strictEqual(result.autonomous, 'true');
  assert.strictEqual(result.wave, '2');
});

test('extractFrontmatter handles quoted values with colons', () => {
  const content = `---\none-liner: "Fixed the bug: it was null"\n---\n`;
  const result = fm.extractFrontmatter(content);
  assert.strictEqual(result['one-liner'], 'Fixed the bug: it was null');
});

// ─── reconstructFrontmatter ──────────────────────────────────────────────────

test('reconstructFrontmatter serializes simple values', () => {
  const obj = { phase: '01', type: 'implement' };
  const yaml = fm.reconstructFrontmatter(obj);
  assert.ok(yaml.includes('phase: 01'));
  assert.ok(yaml.includes('type: implement'));
});

test('reconstructFrontmatter serializes arrays inline when short', () => {
  const obj = { tags: ['a', 'b'] };
  const yaml = fm.reconstructFrontmatter(obj);
  assert.ok(yaml.includes('tags: [a, b]'));
});

test('reconstructFrontmatter serializes empty arrays', () => {
  const obj = { depends_on: [] };
  const yaml = fm.reconstructFrontmatter(obj);
  assert.ok(yaml.includes('depends_on: []'));
});

test('reconstructFrontmatter skips null/undefined values', () => {
  const obj = { phase: '01', empty: null, also_empty: undefined };
  const yaml = fm.reconstructFrontmatter(obj);
  assert.ok(yaml.includes('phase: 01'));
  assert.ok(!yaml.includes('empty'));
  assert.ok(!yaml.includes('also_empty'));
});

test('reconstructFrontmatter quotes values with colons', () => {
  const obj = { note: 'key: value' };
  const yaml = fm.reconstructFrontmatter(obj);
  assert.ok(yaml.includes('"key: value"'));
});

// ─── spliceFrontmatter ──────────────────────────────────────────────────────

test('spliceFrontmatter replaces existing frontmatter', () => {
  const content = `---\nold: value\n---\n\n# Body\n`;
  const result = fm.spliceFrontmatter(content, { new_key: 'new_value' });
  assert.ok(result.includes('new_key: new_value'));
  assert.ok(!result.includes('old: value'));
  assert.ok(result.includes('# Body'));
});

test('spliceFrontmatter adds frontmatter to content without it', () => {
  const content = `# Just body\n`;
  const result = fm.spliceFrontmatter(content, { key: 'val' });
  assert.ok(result.startsWith('---\n'));
  assert.ok(result.includes('key: val'));
  assert.ok(result.includes('# Just body'));
});

// ─── cmdFrontmatterGet (file-based) ──────────────────────────────────────────

test('cmdFrontmatterGet reads frontmatter from file (via extractFrontmatter)', () => {
  const dir = createTempDir('fm-get');
  const fp = path.join(dir, 'test.md');
  fs.writeFileSync(fp, `---\nphase: "03"\nwave: 1\n---\n\n# Plan\n`, 'utf-8');
  const content = fs.readFileSync(fp, 'utf-8');
  const result = fm.extractFrontmatter(content);
  assert.strictEqual(result.phase, '03');
  assert.strictEqual(result.wave, '1');
  cleanup(dir);
});

// ─── cmdFrontmatterSet (file-based) ──────────────────────────────────────────

test('setting frontmatter field updates file correctly', () => {
  const dir = createTempDir('fm-set');
  const fp = path.join(dir, 'test.md');
  fs.writeFileSync(fp, `---\nphase: "01"\nstatus: pending\n---\n\n# Plan\n`, 'utf-8');
  const content = fs.readFileSync(fp, 'utf-8');
  const fmObj = fm.extractFrontmatter(content);
  fmObj.status = 'complete';
  const newContent = fm.spliceFrontmatter(content, fmObj);
  fs.writeFileSync(fp, newContent, 'utf-8');
  const verify = fm.extractFrontmatter(fs.readFileSync(fp, 'utf-8'));
  assert.strictEqual(verify.status, 'complete');
  assert.strictEqual(verify.phase, '01');
  cleanup(dir);
});

// ─── cmdFrontmatterMerge (logic) ─────────────────────────────────────────────

test('merging frontmatter adds new fields and preserves existing', () => {
  const dir = createTempDir('fm-merge');
  const fp = path.join(dir, 'test.md');
  fs.writeFileSync(fp, `---\nphase: "01"\n---\n\n# Plan\n`, 'utf-8');
  const content = fs.readFileSync(fp, 'utf-8');
  const fmObj = fm.extractFrontmatter(content);
  Object.assign(fmObj, { wave: 2, type: 'implement' });
  const newContent = fm.spliceFrontmatter(content, fmObj);
  const verify = fm.extractFrontmatter(newContent);
  assert.strictEqual(verify.phase, '01');
  assert.strictEqual(verify.wave, '2');
  assert.strictEqual(verify.type, 'implement');
  cleanup(dir);
});

// ─── FRONTMATTER_SCHEMAS ────────────────────────────────────────────────────

test('FRONTMATTER_SCHEMAS has plan schema with required fields', () => {
  const schema = fm.FRONTMATTER_SCHEMAS.plan;
  assert.ok(schema);
  assert.ok(schema.required.includes('phase'));
  assert.ok(schema.required.includes('plan'));
  assert.ok(schema.required.includes('wave'));
  assert.ok(schema.required.includes('must_haves'));
});

test('FRONTMATTER_SCHEMAS has summary schema', () => {
  const schema = fm.FRONTMATTER_SCHEMAS.summary;
  assert.ok(schema);
  assert.ok(schema.required.includes('phase'));
  assert.ok(schema.required.includes('completed'));
});

test('FRONTMATTER_SCHEMAS has verification schema', () => {
  const schema = fm.FRONTMATTER_SCHEMAS.verification;
  assert.ok(schema);
  assert.ok(schema.required.includes('status'));
  assert.ok(schema.required.includes('score'));
});

// ─── Validation logic ────────────────────────────────────────────────────────

test('plan validation detects missing required fields', () => {
  const content = `---\nphase: "01"\nplan: "01"\n---\n\n# Plan\n`;
  const fmObj = fm.extractFrontmatter(content);
  const schema = fm.FRONTMATTER_SCHEMAS.plan;
  const missing = schema.required.filter(f => fmObj[f] === undefined);
  assert.ok(missing.includes('type'));
  assert.ok(missing.includes('wave'));
  assert.ok(missing.includes('must_haves'));
  assert.ok(!missing.includes('phase'));
  assert.ok(!missing.includes('plan'));
});

test('plan validation passes when all fields present', () => {
  const content = `---\nphase: "01"\nplan: "01"\ntype: implement\nwave: 1\ndepends_on: []\nfiles_modified: []\nautonomous: true\nmust_haves:\n  truths: []\n  artifacts: []\n---\n`;
  const fmObj = fm.extractFrontmatter(content);
  const schema = fm.FRONTMATTER_SCHEMAS.plan;
  const missing = schema.required.filter(f => fmObj[f] === undefined);
  assert.strictEqual(missing.length, 0);
});

// ─── parseMustHavesBlock ─────────────────────────────────────────────────────

test('parseMustHavesBlock extracts artifacts from frontmatter', () => {
  const content = `---
must_haves:
    artifacts:
      - path: src/index.ts
        min_lines: 10
      - path: src/util.ts
        contains: export
---

# Plan
`;
  const artifacts = fm.parseMustHavesBlock(content, 'artifacts');
  assert.strictEqual(artifacts.length, 2);
  assert.strictEqual(artifacts[0].path, 'src/index.ts');
  assert.strictEqual(artifacts[0].min_lines, 10);
  assert.strictEqual(artifacts[1].contains, 'export');
});

test('parseMustHavesBlock returns empty for missing block', () => {
  const content = `---\nphase: "01"\n---\n`;
  const result = fm.parseMustHavesBlock(content, 'artifacts');
  assert.deepStrictEqual(result, []);
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
