'use strict';
// M1-5/M1-6 tests: thin Core Skill rendering, deterministic build/check, path safety,
// no platform API, packaged-layout runtime, manifest schema compliance and budget guard.
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const DESIGN_ROOT = path.resolve(__dirname, '..', '..', '..');
const CLI = path.join(__dirname, '..', 'cli.js');
const DEFAULT_PKG = path.join(DESIGN_ROOT, 'ai', 'skill', 'core', 'dist', 'wisdom-page-core');
const MANIFEST_SCHEMA = path.join(DESIGN_ROOT, 'ai', 'skill', 'manifest', 'manifest.schema.json');
const { validateDocument } = require('../lib/schema-lite.js');

function run(command, args = [], options = {}) { return spawnSync('node', [CLI, command, ...args], { encoding: 'utf8', ...options }); }
function treeDigest(root) {
  const result = {};
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const target = path.join(dir, entry.name);
      const relative = path.relative(root, target).split(path.sep).join('/');
      if (entry.isDirectory()) walk(target);
      else result[relative] = crypto.createHash('sha256').update(fs.readFileSync(target)).digest('hex');
    }
  };
  walk(root);
  return result;
}
function readManifest(root = DEFAULT_PKG) { return JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8')); }
function readBuildInfo(root = DEFAULT_PKG) { return JSON.parse(fs.readFileSync(path.join(root, 'build-info.json'), 'utf8')); }

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

test('build produces thin SKILL.md with three modes, forbidden reads, stop conditions and budget', () => {
  const result = run('build', ['--out', DEFAULT_PKG]);
  assert.strictEqual(result.status, 0, result.stderr);
  const skill = fs.readFileSync(path.join(DEFAULT_PKG, 'SKILL.md'), 'utf8');
  assert.match(skill, /Three-mode routing/);
  assert.match(skill, /Design/);
  assert.match(skill, /Single Platform/);
  assert.match(skill, /Cross Platform/);
  assert.match(skill, /Forbidden as normative sources/);
  assert.match(skill, /design\/gallery\/\*\*/);
  assert.match(skill, /Stop conditions/);
  assert.match(skill, /On-demand loading rules/);
  assert.doesNotMatch(skill, /\{\{BUDGET_BYTES\}\}/);
  const info = readBuildInfo();
  assert.ok(info.residentBytes <= info.residentBudgetBytes);
  assert.strictEqual(info.platformApiLoaded, false);
  assert.strictEqual(info.corePackageContainsPlatformApi, false);
  assert.match(info.residentBudgetBasis, /budget basis/);
  assert.match(info.residentBudgetBasis, /6,000/);
});

test('manifest.json is schema-valid with real file counts and content hash', () => {
  const manifest = readManifest();
  const errors = validateDocument(manifest, JSON.parse(fs.readFileSync(MANIFEST_SCHEMA, 'utf8')));
  assert.deepStrictEqual(errors, [], 'manifest schema errors: ' + JSON.stringify(errors.slice(0, 8)));
  const actual = Object.keys(treeDigest(DEFAULT_PKG)).length;
  assert.strictEqual(manifest.contents.fileCount, actual, 'contents.fileCount must equal the real package file count');
  assert.match(manifest.contents.contentHash, /^[0-9a-f]{64}$/);
  assert.deepStrictEqual(manifest.contents.platforms, ['core']);
  assert.strictEqual(manifest.package, 'wisdom-page-core');
  assert.strictEqual(manifest.status.releaseKind, 'workspace-snapshot');
  const filesIndex = JSON.parse(fs.readFileSync(path.join(DEFAULT_PKG, 'files.json'), 'utf8'));
  assert.strictEqual(filesIndex.fileCount + 2, actual);
  for (const excluded of ['manifest.json', 'files.json']) assert.ok(filesIndex.excludes.includes(excluded));
  const listed = Object.keys(filesIndex.sha256).sort();
  const expected = Object.keys(treeDigest(DEFAULT_PKG)).filter(file => !filesIndex.excludes.includes(file)).sort();
  assert.deepStrictEqual(listed, expected, 'files.json must hash every non-self-referential file');
  for (const [file, hash] of Object.entries(filesIndex.sha256)) {
    assert.strictEqual(filesIndex.sha256[file], treeDigest(DEFAULT_PKG)[file], 'stale hash for ' + file + ' (' + hash + ')');
  }
  assert.match(manifest.verification.checksumsRef, /files\.json/);
  assert.ok(fs.existsSync(path.join(DEFAULT_PKG, manifest.verification.reportRef)), 'verification.reportRef must resolve inside the package');
});

test('two builds with the same inputs are byte-identical', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'core-build-'));
  const a = path.join(temp, 'a');
  const b = path.join(temp, 'b');
  assert.strictEqual(run('build', ['--out', a, '--allow-outside-root']).status, 0);
  assert.strictEqual(run('build', ['--out', b, '--allow-outside-root']).status, 0);
  assert.deepStrictEqual(treeDigest(a), treeDigest(b));
  fs.rmSync(temp, { recursive: true, force: true });
});

test('check rebuilds in temp and matches without overwriting official output', () => {
  const before = treeDigest(DEFAULT_PKG);
  const result = run('check');
  assert.strictEqual(result.status, 0, result.stderr);
  assert.match(result.stdout, /check OK/);
  assert.deepStrictEqual(treeDigest(DEFAULT_PKG), before);
});

test('generated package has no absolute paths, machine info, timestamps, or platform API', () => {
  for (const [relative] of Object.entries(treeDigest(DEFAULT_PKG))) {
    const content = fs.readFileSync(path.join(DEFAULT_PKG, relative), 'utf8');
    assert.ok(!content.includes(DESIGN_ROOT), 'absolute design root in ' + relative);
    assert.ok(!/Users\//.test(content), 'machine path in ' + relative);
    assert.ok(!/var\/folders/.test(content), 'temp path in ' + relative);
    assert.ok(!/\r\n/.test(content), 'CRLF in ' + relative);
    assert.ok(!/api\/cards|@escaping|Binding<|Modifier\./.test(content), 'platform API leak in ' + relative);
  }
});

test('Core package has no provider, api-card, or native template content', () => {
  const files = Object.keys(treeDigest(DEFAULT_PKG));
  assert.ok(!files.some(file => /provider|api-card|api\/cards/i.test(file)), files.join(','));
  assert.ok(!files.some(file => /template/i.test(file)), files.join(','));
  const manifest = readManifest();
  assert.deepStrictEqual(manifest.contents.platforms, ['core']);
  assert.deepStrictEqual(manifest.coverage.components, { specOnly: 37, experimental: 0, verified: 0, unsupported: 0 });
});

test('component overlay retrieval metadata ships inside the package', () => {
  const files = Object.keys(treeDigest(DEFAULT_PKG));
  assert.ok(files.includes('component-overlays/WDSearchField.json'), 'overlay must ship so package keyword search stays alias-aware');
  const catalog = JSON.parse(fs.readFileSync(path.join(DEFAULT_PKG, 'catalog', 'manifest.json'), 'utf8'));
  const withOverlay = catalog.components.filter(entry => entry.overlay);
  assert.ok(withOverlay.length > 0);
});

test('SKILL.md carries a valid frontmatter identity with declared scope', () => {
  // DSH and compatible hosts ignore a SKILL.md without YAML frontmatter
  // (name + description) or with a non-kebab-case name. The scope line must
  // also differ per package, otherwise design-only and code-capable packages
  // look identical to the agent.
  const skill = fs.readFileSync(path.join(DEFAULT_PKG, 'SKILL.md'), 'utf8');
  assert.ok(skill.startsWith('---\n'), 'SKILL.md must start with YAML frontmatter');
  const end = skill.indexOf('\n---\n', 4);
  assert.ok(end > 0, 'frontmatter must be closed');
  const frontmatter = skill.slice(4, end);
  const name = /^name: (.+)$/m.exec(frontmatter);
  const description = /^description: (.+)$/m.exec(frontmatter);
  assert.ok(name, 'frontmatter missing name');
  assert.ok(description && description[1].trim().length > 20, 'frontmatter missing description');
  assert.match(name[1].trim(), /^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'skill name must be kebab-case');
  assert.ok(skill.includes('**This package:'), 'SKILL.md must declare the package scope');
  for (const placeholder of ['{{SKILL_NAME}}', '{{SKILL_DESCRIPTION}}', '{{SKILL_SCOPE}}', '{{BUDGET_BYTES}}']) {
    assert.ok(!skill.includes(placeholder), 'unrendered template placeholder: ' + placeholder);
  }
});

test('CLI usage errors exit non-zero instead of silently using defaults', () => {
  const missingOut = run('build', ['--out']);
  assert.strictEqual(missingOut.status, 2, 'build --out without a value must be a usage error');
  assert.match(missingOut.stderr, /--out requires a value/);
  const missingCommand = spawnSync('node', [CLI], { encoding: 'utf8' });
  assert.strictEqual(missingCommand.status, 2);
  const unknown = spawnSync('node', [CLI, 'bogus'], { encoding: 'utf8' });
  assert.strictEqual(unknown.status, 2);
});

test('output path escape is rejected', () => {
  const outside = path.join(os.tmpdir(), 'core-build-outside');
  const result = run('build', ['--out', outside]);
  assert.notStrictEqual(result.status, 0);
  assert.match(result.stderr, /output path escapes design repo/);
  fs.rmSync(outside, { recursive: true, force: true });
});

test('all generated files carry banner or are deterministic JSON with generatedBy', () => {
  const files = Object.keys(treeDigest(DEFAULT_PKG));
  for (const file of files) {
    if (file.endsWith('.json')) continue;
    const content = fs.readFileSync(path.join(DEFAULT_PKG, file), 'utf8');
    assert.match(content, /<!-- GENERATED FILE - DO NOT EDIT\. -->|^['"]use strict['"];/m, 'no banner in ' + file);
    assert.ok(!/\{\{[A-Z_]+\}\}/.test(content), 'unresolved template token in ' + file);
  }
  assert.match(readBuildInfo().generatedBy, /manifest\.js/);
  assert.match(readManifest().generatedBy === undefined ? 'tools/ai-skill/lib/manifest.js' : readManifest().generatedBy, /manifest/);
});

test('F9: over-budget resident template fails the build (temp template copy only)', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'core-budget-'));
  const template = path.join(temp, 'SKILL.md.template');
  const padding = 'x'.repeat(7000);
  fs.writeFileSync(template, '# Wisdom Page Core Skill\n\n## 9. Resident entry budget\n\n' + padding + '\n');
  const out = path.join(temp, 'out');
  const result = run('build', ['--out', out, '--allow-outside-root', '--template', template]);
  assert.notStrictEqual(result.status, 0, 'over-budget template must fail');
  assert.match(result.stderr, /exceeds budget/);
  fs.rmSync(temp, { recursive: true, force: true });
});

let failed = 0;
for (const item of tests) {
  try { item.fn(); console.log('PASS ' + item.name); }
  catch (error) { failed += 1; console.error('FAIL ' + item.name + '\n  ' + (error.stack || error.message)); }
}
if (failed) { console.error('\n' + failed + '/' + tests.length + ' tests failed'); process.exit(1); }
console.log('\n' + tests.length + '/' + tests.length + ' tests passed');
