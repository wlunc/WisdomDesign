'use strict';
// M1-3/M1-4 runtime tests: formal Page Spec validator and bounded Core query.
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const SKILL_ROOT = path.resolve(__dirname, '..', '..', '..', 'ai', 'skill');
const PRODUCT_ROOT = path.resolve(SKILL_ROOT, '..', '..');
const CLI = path.join(__dirname, '..', 'cli.js');
const GENERATOR = path.join(__dirname, '..', 'lib', 'generate-core-catalog.js');
const VALIDATOR = path.join(SKILL_ROOT, 'runtime', 'validate-spec.js');
const QUERY = path.join(SKILL_ROOT, 'runtime', 'get-component.js');
const VALID_SPECS = ['page-spec/examples/task-list.valid.json', 'page-spec/examples/settings-form.valid.json'];
const NEGATIVE_FILE = 'page-spec/examples/invalid-cases.json';

// The source-layout runtime reads ai/skill/core/catalog. That directory is a generated
// artefact and is absent in a clean single-repo checkout, so bootstrap it from the
// design truth before the source-layout queries run (same generator cli.js build uses).
function ensureSourceCatalog() {
  const catalogDir = path.join(SKILL_ROOT, 'core', 'catalog');
  if (fs.existsSync(path.join(catalogDir, 'manifest.json'))) return;
  const result = spawnSync('node', [GENERATOR, '--out', catalogDir], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error('cannot bootstrap the source catalog: ' + (result.stderr || result.stdout));
}
ensureSourceCatalog();

function run(command, args, options = {}) { return spawnSync(command, args, { encoding: 'utf8', ...options }); }
function validate(file, json = true) {
  const args = [VALIDATOR, '--file', file];
  if (json) args.push('--json');
  return run('node', args);
}
function query(args) { return run('node', [QUERY, ...args]); }
function jsonResult(result) {
  assert.strictEqual(result.status, 0, 'unexpected exit ' + result.status + ': ' + result.stderr);
  return JSON.parse(result.stdout);
}
const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

test('valid Page Spec examples pass with explicit not-evaluated gates', () => {
  for (const relative of VALID_SPECS) {
    const report = jsonResult(validate(path.join(SKILL_ROOT, relative)));
    assert.strictEqual(report.valid, true, relative);
    assert.strictEqual(report.structureValid, true, relative);
    assert.strictEqual(report.gates.structure, 'passed');
    assert.strictEqual(report.gates.nativeCompile, 'not-evaluated');
    assert.strictEqual(report.gates.snapshotUi, 'not-evaluated');
    assert.strictEqual(report.gates.visualDesignReview, 'not-evaluated');
    assert.strictEqual(report.gates.hostLoad, 'not-evaluated');
    assert.match(report.notice, /does not prove native compilation/i);
  }
});

test('frozen negative fixtures fail with expected code/jsonPath/message/suggestion', () => {
  const cases = JSON.parse(fs.readFileSync(path.join(SKILL_ROOT, NEGATIVE_FILE), 'utf8')).cases;
  for (const item of cases) {
    const temp = path.join(os.tmpdir(), 'page-spec-' + item.id + '.json');
    fs.writeFileSync(temp, JSON.stringify(item.spec, null, 2));
    const result = validate(temp);
    assert.notStrictEqual(result.status, 0, item.id + ' must fail');
    assert.strictEqual(result.status, 1, item.id + ' should fail validation, not IO');
    const report = JSON.parse(result.stdout);
    assert.strictEqual(report.valid, false, item.id);
    assert.ok(report.errors.some(error => error.code === item.expectedError.code && error.jsonPath === item.expectedError.jsonPath && typeof error.message === 'string' && error.message.length > 0 && typeof error.suggestion === 'string' && error.suggestion.length > 0), item.id + ' structured error: ' + JSON.stringify(report.errors));
    fs.rmSync(temp, { force: true });
  }
});

test('invalid navigation and content pattern return dedicated codes', () => {
  const base = JSON.parse(fs.readFileSync(path.join(SKILL_ROOT, VALID_SPECS[0]), 'utf8'));
  for (const tuple of [['navigation', 'wizard', 'INVALID_NAVIGATION'], ['contentPattern', 'dashboard', 'INVALID_CONTENT_PATTERN']]) {
    const spec = JSON.parse(JSON.stringify(base));
    spec.page[tuple[0]] = tuple[1];
    const temp = path.join(os.tmpdir(), 'page-spec-' + tuple[0] + '.json');
    fs.writeFileSync(temp, JSON.stringify(spec));
    const result = validate(temp);
    assert.strictEqual(result.status, 1);
    assert.ok(JSON.parse(result.stdout).errors.some(error => error.code === tuple[2]), tuple[2]);
    fs.rmSync(temp, { force: true });
  }
});

test('multiple primary actions are rejected', () => {
  const spec = JSON.parse(fs.readFileSync(path.join(SKILL_ROOT, VALID_SPECS[0]), 'utf8'));
  spec.regions.push({ id: 'secondary-action', kind: 'actions', component: 'WDButton', intent: 'duplicate primary' });
  const temp = path.join(os.tmpdir(), 'page-spec-multiple-actions.json');
  fs.writeFileSync(temp, JSON.stringify(spec));
  const result = validate(temp);
  assert.strictEqual(result.status, 1);
  assert.ok(JSON.parse(result.stdout).errors.some(error => error.code === 'MULTIPLE_PRIMARY_ACTIONS'));
  fs.rmSync(temp, { force: true });
});

test('malformed JSON returns IO/parse exit code 2', () => {
  const temp = path.join(os.tmpdir(), 'page-spec-broken.json');
  fs.writeFileSync(temp, '{not json');
  const result = validate(temp);
  assert.strictEqual(result.status, 2);
  assert.match(JSON.parse(result.stdout).readError, /JSON parse failed/);
  fs.rmSync(temp, { force: true });
});

test('get_component exact query returns one bounded semantic card with no platform API', () => {
  const data = jsonResult(query(['--id', 'WDButton', '--json']));
  assert.strictEqual(data.mode, 'exact');
  assert.strictEqual(data.found, true);
  assert.strictEqual(data.returned, 1);
  assert.strictEqual(data.component.id, 'WDButton');
  assert.ok(data.component.summary.length > 0);
  assert.strictEqual(data.returned <= data.limit, true);
  assert.doesNotMatch(JSON.stringify(data), /init\(label:|@escaping|Binding<|Modifier\./);
});

test('get_component keyword query is bounded and alias-aware', () => {
  const data = jsonResult(query(['--query', '搜索', '--limit', '2', '--json']));
  assert.strictEqual(data.mode, 'keyword');
  assert.strictEqual(data.found, true);
  assert.strictEqual(data.returned, 2);
  assert.strictEqual(data.limit, 2);
  assert.ok(data.totalCandidates >= 2);
  assert.strictEqual(data.truncated, true);
  assert.strictEqual(data.candidates[0].id, 'WDSearchField');
});

test('get_component unknown id does not fabricate candidates', () => {
  const result = query(['--id', 'WDFake', '--json']);
  assert.strictEqual(result.status, 3);
  const data = JSON.parse(result.stdout);
  assert.strictEqual(data.found, false);
  assert.strictEqual(data.returned, 0);
  assert.ok(data.suggestions.length >= 2);
  assert.strictEqual(data.totalCandidates, 0);
  assert.strictEqual(data.component, undefined);
  assert.strictEqual(data.candidates, undefined);
});

test('get_component rejects catalog path escape and invalid limits', () => {
  const escape = query(['--id', 'WDButton', '--catalog', path.join(PRODUCT_ROOT, 'contracts'), '--json']);
  assert.strictEqual(escape.status, 2);
  assert.match(escape.stderr, /catalog path escapes Skill package/);
  const limit = query(['--query', 'button', '--limit', '99', '--json']);
  assert.strictEqual(limit.status, 2);
  assert.match(limit.stderr, /limit must be 1-20/);
});

test('missing flag values are usage errors (never a silent success)', () => {
  for (const args of [['--id'], ['--query'], ['--catalog', '--json', '--id', 'WDButton'], ['--limit', '--query', 'x']]) {
    const result = query(args);
    assert.strictEqual(result.status, 2, JSON.stringify(args) + ' must exit 2, got ' + result.status);
    assert.match(result.stderr, /requires a value/);
  }
  const validator = run('node', [VALIDATOR, '--file']);
  assert.strictEqual(validator.status, 2);
  assert.match(validator.stderr, /--file requires a value/);
});

test('semantic-only failures do not report a structural failure', () => {
  const spec = JSON.parse(fs.readFileSync(path.join(SKILL_ROOT, VALID_SPECS[0]), 'utf8'));
  spec.states = spec.states.filter(state => state.kind !== 'empty');
  spec.page.contentPattern = 'collection';
  const temp = path.join(os.tmpdir(), 'page-spec-semantic-only.json');
  fs.writeFileSync(temp, JSON.stringify(spec));
  const result = validate(temp);
  assert.strictEqual(result.status, 1);
  const report = JSON.parse(result.stdout);
  assert.strictEqual(report.valid, false);
  assert.ok(report.errors.some(error => error.code === 'COLLECTION_MISSING_EMPTY'), 'expected COLLECTION_MISSING_EMPTY');
  assert.strictEqual(report.structureValid, true, 'structureValid must stay true for a semantic-only failure');
  assert.strictEqual(report.semanticValid, false);
  assert.strictEqual(report.gates.structure, 'passed');
  assert.strictEqual(report.gates.semantics, 'failed');
  fs.rmSync(temp, { force: true });
});

test('packaged layout: built Core package runtime works without escaping the package', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'runtime-packaged-'));
  const out = path.join(temp, 'wisdom-page-core');
  const build = run('node', [CLI, 'build', '--out', out, '--allow-outside-root']);
  assert.strictEqual(build.status, 0, build.stderr);
  const runtime = path.join(out, 'runtime');
  // cwd is outside the package: default catalog must still resolve from the package root.
  const exact = run('node', [path.join(runtime, 'get-component.js'), '--id', 'WDButton', '--json'], { cwd: temp });
  assert.strictEqual(exact.status, 0, exact.stderr);
  assert.strictEqual(JSON.parse(exact.stdout).component.id, 'WDButton');
  // Overlay aliases shipped in the package keep keyword search identical.
  const keyword = run('node', [path.join(runtime, 'get-component.js'), '--query', '搜索', '--limit', '2', '--json'], { cwd: temp });
  assert.strictEqual(keyword.status, 0, keyword.stderr);
  const keywordData = JSON.parse(keyword.stdout);
  assert.strictEqual(keywordData.candidates[0].id, 'WDSearchField');
  assert.strictEqual(keywordData.returned, 2);
  const missing = run('node', [path.join(runtime, 'get-component.js'), '--id', 'WDFake'], { cwd: temp });
  assert.strictEqual(missing.status, 3);
  const escape = run('node', [path.join(runtime, 'get-component.js'), '--id', 'WDButton', '--catalog', path.join(SKILL_ROOT, 'core', 'catalog')], { cwd: temp });
  assert.strictEqual(escape.status, 2);
  assert.match(escape.stderr, /catalog path escapes Skill package/);
  const packagedValidator = run('node', [path.join(runtime, 'validate-spec.js'), '--file', path.join(out, 'page-spec', 'examples', 'task-list.valid.json')], { cwd: temp });
  assert.strictEqual(packagedValidator.status, 0, packagedValidator.stderr);
  fs.rmSync(temp, { recursive: true, force: true });
});

let failed = 0;
for (const item of tests) {
  try { item.fn(); console.log('PASS ' + item.name); }
  catch (error) { failed += 1; console.error('FAIL ' + item.name + '\n  ' + (error.stack || error.message)); }
}
if (failed) { console.error('\n' + failed + '/' + tests.length + ' tests failed'); process.exit(1); }
console.log('\n' + tests.length + '/' + tests.length + ' tests passed');
