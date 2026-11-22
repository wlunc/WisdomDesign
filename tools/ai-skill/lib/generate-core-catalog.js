'use strict';
// M1-2 组件目录与语义卡生成器。
// 输入是 extract-design.js 的标准输出；本脚本只读真源/提取结果，写限定输出目录。

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const TOOL_ROOT = path.resolve(__dirname, '..');
const DESIGN_ROOT = path.resolve(TOOL_ROOT, '..', '..');
const EXTRACTOR = path.join(TOOL_ROOT, 'lib', 'extract-design.js');
const BANNER = [
  'GENERATED FILE - DO NOT EDIT.',
  'Source: wisdomdesign design truth sources via tools/ai-skill/lib/extract-design.js.',
  'Regenerate with: node tools/ai-skill/lib/extract-design.js | node tools/ai-skill/lib/generate-core-catalog.js --out <dir>',
  'No platform API claims are included.'
].join('\n');

function usage(message) {
  if (message) console.error(`error: ${message}`);
  console.error('usage: node generate-core-catalog.js --out <catalog-dir> [--extract <json-file>]');
  process.exit(2);
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--out') args.out = argv[++i];
    else if (argv[i] === '--extract') args.extract = argv[++i];
    else if (argv[i] === '--allow-outside-root') args.allowOutsideRoot = true;
    else if (argv[i] === '--help') usage();
    else usage(`unknown argument ${argv[i]}`);
  }
  if (!args.out) usage('--out is required');
  return args;
}

function resolveOutside(base, target) {
  const relative = path.relative(base, target);
  return relative.startsWith('..') || path.isAbsolute(relative);
}

function extractFromDesign() {
  const result = spawnSync('node', [EXTRACTOR], { encoding: 'utf8' });
  if (result.error) throw new Error(`failed to start JS extractor: ${result.error.message}`);
  if (result.status !== 0) throw new Error(`JS extractor failed (${result.status}): ${result.stderr}`);
  return result.stdout;
}

function readExtract(args) {
  const text = args.extract ? fs.readFileSync(path.resolve(args.extract), 'utf8') : extractFromDesign();
  let data;
  try { data = JSON.parse(text); } catch (error) { throw new Error(`extract JSON parse failed: ${error.message}`); }
  if (!data || data.schemaVersion !== '1.0') throw new Error('unsupported extract schemaVersion');
  if (!Array.isArray(data.components) || data.components.length !== 37) throw new Error(`expected 37 components, got ${data.components?.length}`);
  const ids = data.components.map((component) => component.id);
  if (new Set(ids).size !== ids.length) throw new Error('duplicate component id in extract');
  return data;
}

function atomicWrite(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temp = `${file}.tmp-${process.pid}`;
  fs.writeFileSync(temp, content);
  fs.renameSync(temp, file);
}

function json(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function markdownDoc(title, lines) {
  return [`<!-- ${BANNER.replace(/\n/g, ' -->\n<!-- ')} -->`, '', `# ${title}`, '', ...lines].join('\n');
}

// Spec prose may carry source-repo-relative markdown links (e.g. ../14-member-tones-...md)
// that cannot resolve inside a Skill package. Keep the visible label, drop the link
// target: every card already records the exact source anchor as path:line.
function stripLinks(text) {
  return String(text).replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
}

function bulletText(bullet) {
  const marker = bullet.kind === 'avoid' ? '不要用' : '用';
  return `- **${marker}**：${stripLinks(bullet.text)}`;
}

function refKey(ref) { return ref.path + ':' + ref.line; }

function sourceRefs(component) {
  const seen = new Set();
  const refs = [];
  const add = (ref) => {
    if (!ref || typeof ref.path !== 'string' || typeof ref.line !== 'number') return;
    const key = refKey(ref);
    if (seen.has(key)) return;
    seen.add(key);
    refs.push(ref);
  };
  component.purpose.sourceRefs.forEach(add);
  for (const key of ['states', 'content', 'accessibility']) {
    const block = (component.conclusions || {})[key];
    if (block) block.sourceRefs.forEach(add);
  }
  return refs;
}

function conclusionBlock(title, block) {
  const lines = [`## ${title}`, ''];
  if (!block || !Array.isArray(block.items) || block.items.length === 0) {
    lines.push('- 规格中未找到该节结论。', '');
    return lines;
  }
  for (const item of block.items) lines.push(`- ${stripLinks(item.text)}（\`${item.sourceRef.path}:${item.sourceRef.line}\`）`);
  lines.push('');
  return lines;
}

function card(component) {
  const lines = [
    `Component: \`${component.id}\``,
    `Spec: \`${component.purpose.sourceRefs[0]?.path ?? ""}\` (number ${component.specNumber})`,
    `Contract: \`${component.contract.path}\` (sha256 \`${component.contract.sha256}\`)`,
    '',
    '## 用途（来自正式规格 §1）',
    '',
    stripLinks(component.purpose.summary),
    '',
    ...component.purpose.bullets.map(bulletText),
    ...component.purpose.notes.map((note) => `- ${stripLinks(note.text)}`),
    '',
    '## 来源追溯',
    '',
    ...sourceRefs(component).map((ref) => `- \`${ref.path}:${ref.line}\``),
    '',
    ...conclusionBlock('状态（来自正式规格 §5）', (component.conclusions || {}).states),
    ...conclusionBlock('内容（来自正式规格 §7）', (component.conclusions || {}).content),
    ...conclusionBlock('无障碍（来自正式规格 §10）', (component.conclusions || {}).accessibility),
    '## 契约摘要（来自 YAML）',
    '',
    `- params: ${component.contract.params.length}`,
    `- slots: ${Array.isArray(component.contract.slots) ? component.contract.slots.join(', ') || 'none' : component.contract.slots}`,
    `- enums: ${Object.keys(component.contract.enums || {}).join(', ') || 'none'}`,
    '',
    '## 检索与组合 overlay（不得覆盖真源）',
    '',
    `- searchAliases: ${component.overlay.searchAliases.join(', ') || 'none'}`,
    `- combinesWith: ${component.overlay.combinesWith.join(', ') || 'none'}`,
    `- pageRegions: ${component.overlay.pageRegions.join(', ') || 'none'}`,
    '',
    '## 平台说明',
    '',
    '本卡不包含任何 Swift / Kotlin 平台 API 猜测。平台实现与证据只由对应 Provider 提供。',
    ''
  ];
  return markdownDoc(`${component.id} 语义卡`, lines);
}

function catalog(data, manifest) {
  const lines = [
    '用途与反例来自正式 specs §1，参数与槽位来自 contracts YAML；平台 API 不在本目录。',
    '',
    '| ID | 用途摘要 | 检索关键词 | 来源 |',
    '| --- | --- | --- | --- |',
    ...data.components.map((component) => {
      const summary = stripLinks(component.purpose.summary).replace(/\|/g, '\\|');
      const aliases = component.overlay.searchAliases.join(', ') || '-';
      const ref = component.purpose.sourceRefs[0];
      return `| \`${component.id}\` | ${summary} | ${aliases} | \`${ref.path}:${ref.line}\` |`;
    }),
    '',
    `Count: ${manifest.counts.components} formal components; R1-R5 recipes are excluded.`,
    ''
  ];
  return markdownDoc('Wisdom Design 组件目录', lines);
}

function sourceFile(sourcePath, text) {
  const resolved = path.resolve(DESIGN_ROOT, sourcePath);
  if (resolveOutside(DESIGN_ROOT, resolved)) throw new Error(`source path escapes design repo: ${sourcePath}`);
  return { path: sourcePath, sha256: crypto.createHash('sha256').update(text).digest('hex') };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const out = path.resolve(args.out);
  if (!args.allowOutsideRoot && resolveOutside(DESIGN_ROOT, out)) throw new Error(`output path escapes design repo: ${out}`);
  const cardsDir = path.join(out, 'components');
  if (fs.existsSync(out) && !fs.statSync(out).isDirectory()) throw new Error(`output path is not a directory: ${out}`);
  if (fs.existsSync(cardsDir) && !fs.statSync(cardsDir).isDirectory()) throw new Error(`component cards path is not a directory: ${cardsDir}`);

  const data = readExtract(args);
  const sourcePaths = [
    'tokens/wisdom.tokens.json',
    'docs/specs/01-basic.md',
    'docs/specs/02-advanced.md',
    'docs/specs/03-patterns.md',
    'docs/09-layout.md',
    'docs/06-accessibility.md',
    'docs/07-content.md',
    'contracts/README.md',
    ...data.components.map((component) => component.contract.path)
  ];
  const sources = sourcePaths.map((sourcePath) => sourceFile(sourcePath, fs.readFileSync(path.resolve(DESIGN_ROOT, sourcePath))));

  const manifest = {
    schemaVersion: '1.0',
    generator: 'tools/ai-skill/lib/generate-core-catalog.js',
    generatorVersion: '1.0',
    banner: BANNER,
    policy: data.policy,
    counts: data.counts,
    tokens: data.tokens,
    rules: data.rules,
    components: data.components.map((component) => ({
      id: component.id,
      specNumber: component.specNumber,
      specName: component.specName,
      card: `components/${component.id}.md`,
      purposeSource: component.purpose.sourceRefs[0],
      contract: { path: component.contract.path, sha256: component.contract.sha256 },
      overlay: component.overlay.path
    })),
    sources
  };

  fs.mkdirSync(cardsDir, { recursive: true });
  const expectedCards = new Set(data.components.map((component) => `${component.id}.md`));
  for (const existing of fs.readdirSync(cardsDir)) {
    if (existing.endsWith('.md') && !expectedCards.has(existing)) {
      fs.rmSync(path.join(cardsDir, existing), { force: true });
    }
  }
  for (const component of data.components) {
    atomicWrite(path.join(cardsDir, `${component.id}.md`), card(component));
  }
  atomicWrite(path.join(out, 'catalog.md'), catalog(data, manifest));
  atomicWrite(path.join(out, 'manifest.json'), json(manifest));
  console.log(`generated ${manifest.counts.components} semantic cards in ${path.relative(DESIGN_ROOT, out)}`);
}

try { main(); } catch (error) { console.error(`catalog generation failed: ${error.message}`); process.exit(1); }
