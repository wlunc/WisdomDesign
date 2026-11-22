'use strict';
// M1-1/M1-2 tests: design extraction negative cases and deterministic catalog generation.

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const TOOL_ROOT = path.resolve(__dirname, '..');
const DESIGN_ROOT = path.resolve(TOOL_ROOT, '..', '..');
const EXTRACTOR = path.join(TOOL_ROOT, 'lib', 'extract-design.js');
const GENERATOR = path.join(TOOL_ROOT, 'lib', 'generate-core-catalog.js');
const CONTRACT_GLOB = path.join(DESIGN_ROOT, 'contracts', 'WD*.yaml');

function run(command, args, options = {}) {
  return spawnSync(command, args, { encoding: 'utf8', ...options });
}

function extract() {
  const result = run('node', [EXTRACTOR]);
  assert.strictEqual(result.status, 0, `extractor failed: ${result.stderr}`);
  return JSON.parse(result.stdout);
}

function generate(outDir, extractJson, allowOutside = true) {
  const extractFile = path.join(outDir, 'extract.json');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(extractFile, JSON.stringify(extractJson, null, 2));
  const args = [GENERATOR, '--out', path.join(outDir, 'catalog'), '--extract', extractFile];
  if (allowOutside) args.push('--allow-outside-root');
  const result = run('node', args);
  fs.rmSync(extractFile, { force: true });
  return result;
}

function copyDesignIntoTemp(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-skill-extract-'));
  const design = path.join(root, 'wisdomdesign');
  fs.mkdirSync(path.join(design, 'tools', 'ai-skill', 'lib'), { recursive: true });
  fs.copyFileSync(EXTRACTOR, path.join(design, 'tools', 'ai-skill', 'lib', 'extract-design.js'));
  fs.copyFileSync(path.join(TOOL_ROOT, 'lib', 'simple-yaml.js'), path.join(design, 'tools', 'ai-skill', 'lib', 'simple-yaml.js'));
  for (const [relative, content] of Object.entries(files)) {
    const target = path.join(design, relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content);
  }
  return { root, design, extractor: path.join(design, 'tools', 'ai-skill', 'lib', 'extract-design.js') };
}

function minimalSourceOverrides() {
  const files = {};
  for (const filename of fs.readdirSync(path.join(DESIGN_ROOT, 'contracts'))) {
    if (filename.startsWith('WD') && filename.endsWith('.yaml')) {
      files[`contracts/${filename}`] = fs.readFileSync(path.join(DESIGN_ROOT, 'contracts', filename), 'utf8');
    }
  }
  for (const filename of ['01-basic.md', '02-advanced.md', '03-patterns.md']) {
    files[`docs/specs/${filename}`] = fs.readFileSync(path.join(DESIGN_ROOT, 'docs', 'specs', filename), 'utf8');
  }
  for (const filename of ['tokens/wisdom.tokens.json', 'docs/09-layout.md', 'docs/06-accessibility.md', 'docs/07-content.md']) {
    files[filename] = fs.readFileSync(path.join(DESIGN_ROOT, filename), 'utf8');
  }
  return files;
}

function componentBlock(text, component) {
  const heading = new RegExp(`^# \\d+ · ${component}\\b`, 'm');
  const match = heading.exec(text);
  assert.ok(match, `component ${component} heading not found`);
  const start = match.index;
  const next = text.indexOf('\n# ', start + 1);
  return text.slice(start, next === -1 ? text.length : next);
}

function replaceComponentBlock(text, component, replacement) {
  const heading = new RegExp(`^# \\d+ · ${component}\\b`, 'm');
  const match = heading.exec(text);
  assert.ok(match, `component ${component} heading not found`);
  const start = match.index;
  const next = text.indexOf('\n# ', start + 1);
  const end = next === -1 ? text.length : next;
  return text.slice(0, start) + replacement + text.slice(end);
}

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

test('extracts 37 components with traceable purposes and no gallery source', () => {
  const data = extract();
  assert.strictEqual(data.counts.components, 37);
  assert.strictEqual(data.counts.contracts, 37);
  assert.strictEqual(data.counts.formalSpecs, 37);
  assert.strictEqual(data.counts.formalRecipes, 5);
  assert.strictEqual(data.tokens.version, '1.1.0');
  assert.deepStrictEqual(data.policy.excluded, ['design/gallery/**', 'docs/02-components.md']);

  const yamlIds = fs.readdirSync(path.join(DESIGN_ROOT, 'contracts'))
    .filter((file) => file.startsWith('WD') && file.endsWith('.yaml'))
    .map((file) => path.basename(file, '.yaml'))
    .sort();
  assert.deepStrictEqual(data.components.map((component) => component.id).sort(), yamlIds);

  for (const component of data.components) {
    assert.ok(component.purpose.summary.length > 0, `${component.id} missing purpose summary`);
    assert.ok(
      component.purpose.sourceRefs.some((ref) => ref.path.startsWith('docs/specs/') && ref.path !== 'docs/specs/README.md'),
      `${component.id} purpose has no formal spec sourceRef`
    );
    assert.ok(component.contract.path.startsWith('contracts/WD'), `${component.id} missing contract source`);
    assert.ok(/^[a-f0-9]{64}$/.test(component.contract.sha256), `${component.id} invalid contract hash`);
  }

  const button = data.components.find((component) => component.id === 'WDButton');
  assert.ok(button.purpose.bullets.some((bullet) => bullet.kind === 'avoid' && bullet.text.includes('WDListRow')));
});

test('F4: every purpose/conclusion sourceRef points at the exact source line', () => {
  const data = extract();
  let checked = 0;
  for (const component of data.components) {
    const refs = [
      ...component.purpose.sourceRefs,
      ...['states', 'content', 'accessibility'].flatMap((key) => (component.conclusions[key] || { sourceRefs: [] }).sourceRefs)
    ];
    for (const ref of refs) {
      const file = path.join(DESIGN_ROOT, ref.path);
      assert.ok(fs.existsSync(file), component.id + ' sourceRef file missing: ' + ref.path);
      const lines = fs.readFileSync(file, 'utf8').split('\n');
      assert.ok(ref.line >= 1 && ref.line <= lines.length, component.id + ' sourceRef line out of range: ' + ref.path + ':' + ref.line);
      assert.strictEqual(lines[ref.line - 1].trim(), ref.lineText, component.id + ' sourceRef mismatch at ' + ref.path + ':' + ref.line);
      checked += 1;
    }
    for (const [key, section] of [['states', 5], ['content', 7], ['accessibility', 10]]) {
      const block = component.conclusions[key];
      assert.ok(block && block.items.length > 0, component.id + ' missing ' + key + ' conclusions');
      assert.ok(block.heading.includes('### ' + section + '.'), component.id + ' ' + key + ' heading mismatch');
      for (const item of block.items) {
        assert.ok(item.text.length > 0, component.id + ' empty ' + key + ' item');
        assert.ok(/^[^\s]/.test(item.lineText), component.id + ' ' + key + ' item has no raw line text');
      }
    }
  }
  assert.ok(checked >= 37 * 5, 'expected at least 5 checked sourceRefs per component, got ' + checked);
});

test('fails on duplicate component id', () => {
  const files = minimalSourceOverrides();
  const buttonFile = 'docs/specs/01-basic.md';
  const duplicate = componentBlock(files[buttonFile], 'Button').replace('# 1 · Button', '# 2 · Button');
  files[buttonFile] += `\n${duplicate}\n`;
  const temp = copyDesignIntoTemp(files);
  const result = run('node', [temp.extractor], { cwd: temp.root });
  assert.notStrictEqual(result.status, 0, 'duplicate id must fail');
  assert.match(result.stderr, /规格重复 WDButton|缺少正式章节/);
  fs.rmSync(temp.root, { recursive: true, force: true });
});

test('fails on missing formal section', () => {
  const files = minimalSourceOverrides();
  const withoutSection5 = componentBlock(files['docs/specs/01-basic.md'], 'Button').replace(/^### 5\. 状态[\s\S]*?(?=^### 6\. 布局)/m, '');
  files['docs/specs/01-basic.md'] = replaceComponentBlock(files['docs/specs/01-basic.md'], 'Button', withoutSection5);
  const temp = copyDesignIntoTemp(files);
  const result = run('node', [temp.extractor], { cwd: temp.root });
  assert.notStrictEqual(result.status, 0, 'missing section must fail');
  assert.match(result.stderr, /缺少正式章节 5/);
  fs.rmSync(temp.root, { recursive: true, force: true });
});

test('fails on missing purpose counterexample', () => {
  const files = minimalSourceOverrides();
  const block = componentBlock(files['docs/specs/01-basic.md'], 'Button').replace(/^- \*\*不要用\*\*：.*$/m, '- **用**：只留用途\n');
  files['docs/specs/01-basic.md'] = replaceComponentBlock(files['docs/specs/01-basic.md'], 'Button', block);
  const temp = copyDesignIntoTemp(files);
  const result = run('node', [temp.extractor], { cwd: temp.root });
  assert.notStrictEqual(result.status, 0, 'missing counterexample must fail');
  assert.match(result.stderr, /缺少反例/);
  fs.rmSync(temp.root, { recursive: true, force: true });
});

test('fails on unknown overlay component and unknown combination reference', () => {
  const files = minimalSourceOverrides();
  files['ai/skill/component-overlays/WDUnknown.json'] = JSON.stringify({ component: 'WDUnknown' });
  files['ai/skill/component-overlays/WDSearchField.json'] = JSON.stringify({
    schemaVersion: '1.0', component: 'WDSearchField', combinesWith: ['WDNotReal']
  });
  const temp = copyDesignIntoTemp(files);
  const result = run('node', [temp.extractor], { cwd: temp.root });
  assert.notStrictEqual(result.status, 0, 'unknown overlay references must fail');
  assert.match(result.stderr, /未知组件 overlay WDUnknown/);
  assert.match(result.stderr, /未知组合引用 WDNotReal/);
  fs.rmSync(temp.root, { recursive: true, force: true });
});

test('generates deterministic 37-card catalog with traceable cards', () => {
  const data = extract();
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-skill-catalog-'));
  const first = generate(path.join(temp, 'first'), data);
  const second = generate(path.join(temp, 'second'), data);
  assert.strictEqual(first.status, 0, `first generation failed: ${first.stderr}`);
  assert.strictEqual(second.status, 0, `second generation failed: ${second.stderr}`);

  const digestTree = (dir, root = dir) => {
    const result = {};
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const target = path.join(dir, entry.name);
      if (entry.isDirectory()) Object.assign(result, digestTree(target, root));
      else result[path.relative(root, target)] = crypto.createHash('sha256').update(fs.readFileSync(target)).digest('hex');
    }
    return result;
  };
  const firstTree = digestTree(path.join(temp, 'first', 'catalog'));
  const secondTree = digestTree(path.join(temp, 'second', 'catalog'));
  assert.deepStrictEqual(firstTree, secondTree, 'catalog generation must be deterministic');
  assert.strictEqual(Object.keys(firstTree).length, 39);
  assert.ok(firstTree['components/WDButton.md']);
  assert.ok(firstTree['catalog.md']);
  assert.ok(firstTree['manifest.json']);

  const card = fs.readFileSync(path.join(temp, 'first', 'catalog', 'components', 'WDButton.md'), 'utf8');
  assert.match(card, /用途（来自正式规格 §1）/);
  assert.match(card, /\*\*不要用\*\*：导航到别的页面/);
  assert.match(card, /docs\/specs\/01-basic\.md:\d+/);
  assert.match(card, /状态（来自正式规格 §5）/);
  assert.match(card, /内容（来自正式规格 §7）/);
  assert.match(card, /无障碍（来自正式规格 §10）/);
  assert.match(card, /状态=加载/);
  assert.doesNotMatch(card, /@escaping|Binding<|ViewBuilder|UIFont|Modifier\./);
  // No markdown links in shipped cards: source-repo-relative targets cannot resolve
  // inside a package; the exact source anchor is rendered as path:line instead.
  assert.doesNotMatch(card, /\[[^\]]*\]\([^)]*\)/, 'card must not contain markdown links');
  for (const name of Object.keys(firstTree).filter((file) => file.endsWith('.md'))) {
    const text = fs.readFileSync(path.join(temp, 'first', 'catalog', name), 'utf8');
    assert.doesNotMatch(text, /\[[^\]]*\]\([^)]*\)/, name + ' must not contain markdown links');
  }
  fs.rmSync(temp, { recursive: true, force: true });
});

test('rejects output path escape', () => {
  const data = extract();
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-skill-escape-'));
  const outside = path.join(temp, 'outside');
  const result = generate(outside, data, false);
  assert.notStrictEqual(result.status, 0, 'output outside design repo must fail');
  assert.match(result.stderr, /output path escapes design repo/);
  fs.rmSync(temp, { recursive: true, force: true });
});

let failed = 0;
for (const { name, fn } of tests) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`FAIL ${name}\n  ${error.stack || error.message}`);
  }
}
if (failed) {
  console.error(`\n${failed}/${tests.length} tests failed`);
  process.exit(1);
}
console.log(`\n${tests.length}/${tests.length} tests passed`);