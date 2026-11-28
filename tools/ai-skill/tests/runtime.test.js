'use strict';
// M1-3/M1-4 runtime tests: formal Page Spec validator and bounded Core query.
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const SKILL_ROOT = path.resolve(__dirname, '..', '..', '..', 'ai', 'skill');
const PRODUCT_ROOT = path.resolve(SKILL_ROOT, '..', '..');
// The design repo root (parent of ai/): where tools/ and tokens/ live.
const DESIGN_ROOT_FOR_TOKENS = PRODUCT_ROOT;
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

// Emphasis is derived from variant/defaults, so this test now pins the rule rather than the
// implementation detail of "how many WDButton regions sit in an actions region".
test('two filled actions are rejected, filled plus tonal is accepted', () => {
  const base = () => JSON.parse(fs.readFileSync(path.join(SKILL_ROOT, VALID_SPECS[1]), 'utf8'));

  const twoFilled = base();
  twoFilled.regions = twoFilled.regions.filter(region => region.kind !== 'actions');
  twoFilled.regions.push({ id: 'save', kind: 'actions', component: 'WDButton', variant: 'filled', action: 'saveSettings' });
  twoFilled.regions.push({ id: 'save-again', kind: 'actions', component: 'WDButton', variant: 'filled' });
  const filledPath = path.join(os.tmpdir(), 'page-spec-two-filled.json');
  fs.writeFileSync(filledPath, JSON.stringify(twoFilled));
  const filledResult = validate(filledPath);
  assert.strictEqual(filledResult.status, 1, 'two filled buttons must be rejected');
  assert.ok(JSON.parse(filledResult.stdout).errors.some(error => error.code === 'MULTIPLE_PRIMARY_ACTIONS'));
  fs.rmSync(filledPath, { force: true });

  // The complaint that started this: one filled + one tonal is a legal hierarchy, not two primaries.
  const legal = base();
  const legalResult = validate(path.join(SKILL_ROOT, VALID_SPECS[1]));
  assert.strictEqual(legalResult.status, 0, 'filled + plain must validate: ' + legalResult.stdout);
  assert.ok(legal.regions.some(region => region.variant === 'filled'));
  assert.ok(legal.regions.some(region => region.variant === 'plain'));
});

// Page Spec 1.1: the rules that used to be unexpressible or bypassable.
test('emphasis is derived from variant, and a secondary action needs no kind hack', () => {
  const spec = JSON.parse(fs.readFileSync(path.join(SKILL_ROOT, VALID_SPECS[1]), 'utf8'));
  const temp = path.join(os.tmpdir(), 'page-spec-derived-emphasis.json');
  fs.writeFileSync(temp, JSON.stringify(spec));
  const report = JSON.parse(validate(temp).stdout);
  assert.strictEqual(report.valid, true, 'filled + plain in the same actions-area must be valid');
  const demoted = JSON.parse(JSON.stringify(spec));
  demoted.regions = demoted.regions.map(region => (region.variant === 'plain' ? { ...region, variant: 'filled' } : region));
  fs.writeFileSync(temp, JSON.stringify(demoted));
  assert.ok(JSON.parse(validate(temp).stdout).errors.some(error => error.code === 'MULTIPLE_PRIMARY_ACTIONS'));
  fs.rmSync(temp, { force: true });
});
test('warnings are reported instead of being swallowed', () => {
  const spec = JSON.parse(fs.readFileSync(path.join(SKILL_ROOT, VALID_SPECS[1]), 'utf8'));
  spec.states = [{ id: 'content', kind: 'content' }];
  const temp = path.join(os.tmpdir(), 'page-spec-warnings.json');
  fs.writeFileSync(temp, JSON.stringify(spec));
  const report = JSON.parse(validate(temp).stdout);
  assert.strictEqual(report.valid, true, 'missing optional states must not block structure');
  assert.ok(Array.isArray(report.warnings) && report.warnings.length > 0, 'warnings must actually be populated');
  assert.ok(report.warnings.every(warning => warning.code && warning.jsonPath && warning.message && warning.suggestion));
  fs.rmSync(temp, { force: true });
});
test('registered extensions pass with a warning, unregistered ones fail', () => {
  const spec = JSON.parse(fs.readFileSync(path.join(SKILL_ROOT, VALID_SPECS[0]), 'utf8'));
  const temp = path.join(os.tmpdir(), 'page-spec-extension.json');
  spec.regions.push({ id: 'state-seg', kind: 'actions', component: 'WDSegmentedControl', extension: { id: 'WDStateSegment', basedOn: 'WDSegmentedControl' } });
  fs.writeFileSync(temp, JSON.stringify(spec));
  const report = JSON.parse(validate(temp).stdout);
  assert.strictEqual(report.valid, true, 'a registered proposal must be usable: ' + JSON.stringify(report.errors));
  assert.ok(report.warnings.some(warning => warning.code === 'PROPOSED_EXTENSION'));
  const unregistered = JSON.parse(JSON.stringify(spec));
  unregistered.regions[unregistered.regions.length - 1].extension.id = 'WDNothing';
  fs.writeFileSync(temp, JSON.stringify(unregistered));
  assert.ok(JSON.parse(validate(temp).stdout).errors.some(error => error.code === 'UNREGISTERED_EXTENSION'));
  fs.rmSync(temp, { force: true });
});
test('kind "custom" is retired so semantic rules cannot be switched off', () => {
  const spec = JSON.parse(fs.readFileSync(path.join(SKILL_ROOT, VALID_SPECS[0]), 'utf8'));
  spec.regions[0].kind = 'custom';
  const temp = path.join(os.tmpdir(), 'page-spec-custom-kind.json');
  fs.writeFileSync(temp, JSON.stringify(spec));
  const report = JSON.parse(validate(temp).stdout);
  assert.strictEqual(report.valid, false, 'kind custom must be rejected now');
  assert.ok(report.errors.some(error => error.code === 'INVALID_VALUE' && error.jsonPath === '/regions/0/kind'));
  fs.rmSync(temp, { force: true });
});
const RENDERER = path.join(SKILL_ROOT, 'runtime', 'render-spec.js');

// The preview is the whole point of this tool: a Skill that is called a design Skill must be able
// to show a page. These assertions keep it honest in both directions — it must render, and it must
// not overclaim what rendering proves.
test('render_spec produces a self-contained preview with not-evaluated gates', () => {
  const out = path.join(os.tmpdir(), 'preview-task-list.html');
  const result = run('node', [RENDERER, '--file', path.join(SKILL_ROOT, VALID_SPECS[0]), '--out', out, '--json']);
  assert.strictEqual(result.status, 0, result.stderr);
  const report = JSON.parse(result.stdout);
  assert.strictEqual(report.tool, 'render_spec');
  assert.ok(report.bytes > 4000, 'preview must actually contain content');
  for (const gate of ['nativeCompile', 'snapshotUi', 'visualDesignReview', 'hostLoad']) {
    assert.strictEqual(report.gates[gate], 'not-evaluated', gate + ' must stay not-evaluated: a preview is not verification');
  }
  const html = fs.readFileSync(out, 'utf8');
  assert.match(html, /^<!doctype html>/);
  assert.match(html, /结构预览，非最终视觉/, 'the banner must say this is not final visual');
  assert.match(html, /not-evaluated/, 'the gates must be visible in the page itself');
  assert.doesNotMatch(html, /<script/i, 'the preview must not execute anything');
  assert.doesNotMatch(html, /https?:\/\//, 'the preview must be self-contained, no remote assets');
  fs.rmSync(out, { force: true });
});
test('render_spec derives every visual number from the tokens, not from a baked-in palette', () => {
  const tokens = JSON.parse(fs.readFileSync(path.join(SKILL_ROOT, '..', '..', 'tokens', 'wisdom.tokens.json'), 'utf8'));
  const html = run('node', [RENDERER, '--file', path.join(SKILL_ROOT, VALID_SPECS[0])]).stdout;
  const probes = [
    ['canvas', tokens.semantic.light.bg.canvas.$value],
    ['tertiary text', tokens.semantic.light.text.tertiary.$value],
    ['on-fill text', tokens.semantic.light.text['on-fill'].$value],
    ['radius full', tokens.radius.full.$value + 'px'],
    ['space 5', tokens.space['5'].$value + 'px'],
  ];
  for (const [label, value] of probes) assert.ok(html.includes(value), 'preview must carry the token value for ' + label + ' (' + value + ')');
  // If it shipped its own palette it would still contain the old gallery colour, which the token
  // source explicitly retired for failing contrast.
  assert.ok(!html.includes('#5B7784'), 'the retired text.tertiary value must not appear: that would mean a second, stale palette');
});
test('render_spec is deterministic and honours --scheme', () => {
  const file = path.join(SKILL_ROOT, VALID_SPECS[0]);
  const first = run('node', [RENDERER, '--file', file]).stdout;
  const second = run('node', [RENDERER, '--file', file]).stdout;
  assert.strictEqual(first, second, 'two renders of the same spec must be byte-identical');
  assert.doesNotMatch(first, /[0-9]{4}-[0-9]{2}-[0-9]{2}T/, 'no timestamps: the preview is diffable');
  assert.ok(!first.includes(SKILL_ROOT), 'no absolute paths leak into the output');
  const dark = run('node', [RENDERER, '--file', file, '--scheme', 'dark']).stdout;
  assert.notStrictEqual(first, dark, 'dark scheme must differ from light');
});
test('render_spec maps every canonical component instead of silently skipping it', () => {
  const schema = JSON.parse(fs.readFileSync(path.join(SKILL_ROOT, 'page-spec', 'schema.json'), 'utf8'));
  const ids = schema.properties.regions.items.properties.component.enum;
  const source = fs.readFileSync(RENDERER, 'utf8');
  const unmapped = ids.filter(id => id !== 'WDNavigationBar' && !source.includes("case '" + id + "'"));
  assert.deepStrictEqual(unmapped, [], 'components without a renderer branch: ' + unmapped.join(','));
});
// The renderer inlines token resolution because a package cannot require tools/. That duplication is
// the one place a second copy of the rules could drift, so pin the two implementations together.
test('render_spec token resolution agrees with the build-time token index', () => {
  const tokenIndex = require(path.join(DESIGN_ROOT_FOR_TOKENS, 'tools', 'ai-skill', 'lib', 'token-index.js'));
  const tokens = tokenIndex.readTokens(path.join(DESIGN_ROOT_FOR_TOKENS, 'tokens', 'wisdom.tokens.json'));
  const names = ['radius.full', 'space.4', 'size.control.md', 'type.headline', 'derived.text-on-fill', 'text.tertiary', 'status.danger', 'surface.glass', 'border.hairline', 'motion.duration.fast'];
  const html = run('node', [RENDERER, '--file', path.join(SKILL_ROOT, VALID_SPECS[0])]).stdout;
  for (const name of names) {
    const resolved = tokenIndex.resolve(tokens, name, 'light');
    assert.ok(resolved, 'token index must resolve ' + name);
    const value = String(resolved.value);
    if (/^#[0-9A-Fa-f]{6,8}$/.test(value)) {
      assert.ok(html.includes(value), 'renderer must carry ' + name + ' = ' + value + ' (resolution drifted from token-index.js)');
    }
  }
});
test('render_spec refuses a malformed spec instead of emitting a broken page', () => {
  const temp = path.join(os.tmpdir(), 'render-broken.json');
  fs.writeFileSync(temp, '{not json');
  const result = run('node', [RENDERER, '--file', temp]);
  assert.strictEqual(result.status, 2);
  assert.match(result.stderr, /cannot read Page Spec/);
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

// M-1 regression: Chinese is the primary language of these specs, and a common Chinese word used
// to return every card at the same body-only score, ordered alphabetically, with the component the
// user actually wanted missing entirely (`--query button`) . Pin both the ranking and the reason.
test('Chinese keyword queries rank the canonical component first', () => {
  const cases = [['按钮', 'WDButton'], ['输入框', 'WDTextField'], ['进度条', 'WDProgressBar'], ['弹窗', 'WDAlert'], ['空状态', 'WDEmptyState'], ['导航栏', 'WDNavigationBar'], ['开关', 'WDSwitch']];
  for (const [term, expected] of cases) {
    const data = jsonResult(query(['--query', term, '--limit', '5', '--json']));
    assert.strictEqual(data.found, true, term + ' must find candidates');
    assert.strictEqual(data.candidates[0].id, expected, term + ' must rank ' + expected + ' first, got ' + data.candidates.map(c => c.id).join(','));
    assert.ok(Array.isArray(data.candidates[0].matched) && data.candidates[0].matched.length > 0, term + ' must explain why the candidate matched');
  }
});
test('every component ships Chinese search aliases', () => {
  // Source layout keeps the generated catalog under core/catalog; the packaged layout uses catalog/.
  const manifest = JSON.parse(fs.readFileSync(path.join(SKILL_ROOT, 'core', 'catalog', 'manifest.json'), 'utf8'));
  const missing = manifest.components.filter(entry => {
    if (!entry.overlay) return true;
    const overlay = JSON.parse(fs.readFileSync(path.join(SKILL_ROOT, entry.overlay.replace(/^ai\/skill\//, '').replace(/^core\//, '')), 'utf8'));
    return !Array.isArray(overlay.searchAliases) || overlay.searchAliases.length === 0;
  }).map(entry => entry.id);
  assert.deepStrictEqual(missing, [], 'components without searchAliases: ' + missing.join(','));
});
test('keyword ties break on spec order, not the alphabetical id', () => {
  const data = jsonResult(query(['--query', '状态', '--limit', '8', '--json']));
  assert.ok(data.totalCandidates > data.returned, 'a broad term must still report the full candidate count');
  assert.ok(data.truncatedBy > 0, 'truncation must say how many candidates were withheld');
  assert.doesNotMatch(data.notice, /^候选按设计语义排序/, 'notice must state the truncation reason');
});
const TOKEN_RESOLVER = path.join(SKILL_ROOT, 'runtime', 'resolve-token.js');
test('resolve_token resolves a shipped token value and refuses to invent one', () => {
  const okRun = run('node', [TOKEN_RESOLVER, '--path', 'text.tertiary', '--json']);
  assert.strictEqual(okRun.status, 0, okRun.stderr);
  const ok = JSON.parse(okRun.stdout);
  assert.strictEqual(ok.found, true);
  assert.strictEqual(ok.value, '#4C616D');
  assert.strictEqual(ok.resolvedPath, 'semantic.light.text.tertiary');
  assert.match(ok.sha256, /^[0-9a-f]{64}$/);
  const dark = JSON.parse(run('node', [TOKEN_RESOLVER, '--path', 'text.on-fill', '--scheme', 'dark', '--json']).stdout);
  assert.strictEqual(dark.value, '#DCEEF4');
  const missing = run('node', [TOKEN_RESOLVER, '--path', 'nope.nothing', '--json']);
  assert.strictEqual(missing.status, 3);
  assert.strictEqual(JSON.parse(missing.stdout).found, false);
  const escape = run('node', [TOKEN_RESOLVER, '--path', '../../etc/passwd', '--json']);
  assert.strictEqual(escape.status, 2, 'path traversal must be a usage error');
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
