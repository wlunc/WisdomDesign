'use strict';
// M1-5/M1-6 Core Skill renderer and reproducible build CLI.
//
// Package layout is intentionally flat and stable:
//   SKILL.md, catalog/, page-spec/, runtime/, component-overlays/,
//   build-info.json, files.json, manifest.json
// manifest.json / files.json / build-info.json are produced by lib/manifest.js, the
// same generator the M4 packager (tools/ai-skill/package.js) uses, and are validated
// against ai/skill/manifest/manifest.schema.json before the build is accepted.
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const os = require('os');
const manifestLib = require('./lib/manifest.js');

const TOOL_ROOT = __dirname;
const DESIGN_ROOT = path.resolve(TOOL_ROOT, '..', '..');
const AI_ROOT = path.join(DESIGN_ROOT, 'ai', 'skill');
const GENERATOR = path.join(__dirname, 'lib', 'generate-core-catalog.js');
const TEMPLATE = path.join(AI_ROOT, 'SKILL.md.template');
const DEFAULT_OUT = path.join(AI_ROOT, 'core', 'dist', 'wisdom-page-core');
const RESIDENT_BUDGET_BYTES = manifestLib.RESIDENT_BUDGET_BYTES;
const LF = '\n';
const BANNER_LINES = [
  'GENERATED FILE - DO NOT EDIT.',
  'Source: wisdomdesign truth sources via tools/ai-skill/cli.js build.',
  'Regenerate: node tools/ai-skill/cli.js build --out ai/skill/core/dist/wisdom-page-core',
  'Core package: design semantics only; no platform API and no native verification claims.'
];

function usage(message) {
  if (message) console.error('error: ' + message);
  console.error('usage: node tools/ai-skill/cli.js <build|check|test> [--out <dir>] [--template <file>] [--ios-root <dir>] [--android-root <dir>]  (platform roots are optional provenance; Core build never requires them)');
  process.exit(2);
}
function parseArgs(argv) {
  const command = argv[0];
  if (!command || !['build', 'check', 'test'].includes(command)) usage('command must be build, check, or test');
  const args = { command };
  for (let i = 1; i < argv.length; i += 1) {
    if (argv[i] === '--out') {
      const value = argv[i + 1];
      if (value === undefined || value === '' || value.startsWith('--')) usage('--out requires a value');
      args.out = value;
      i += 1;
    } else if (argv[i] === '--template') {
      const value = argv[i + 1];
      if (value === undefined || value === '') usage('--template requires a value');
      args.template = value;
      i += 1;
    } else if (argv[i] === '--ios-root' || argv[i] === '--android-root') {
      const value = argv[i + 1];
      if (value === undefined || value === '') usage(argv[i] + ' requires a value');
      args[argv[i] === '--ios-root' ? 'iosRoot' : 'androidRoot'] = value;
      i += 1;
    } else if (argv[i] === '--allow-outside-root') args.allowOutsideRoot = true;
    else if (argv[i] === '--help') usage();
    else usage('unknown argument ' + argv[i]);
  }
  return args;
}
function isInside(base, target) {
  const relative = path.relative(path.resolve(base), path.resolve(target));
  return relative === '' || (!relative.startsWith('..' + path.sep) && relative !== '..' && !path.isAbsolute(relative));
}
function normalize(text) { return text.replace(/\r\n/g, '\n'); }
function writeFile(root, relative, content) {
  const target = path.join(root, relative);
  if (!isInside(root, target)) throw new Error('output path escapes build directory: ' + relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, normalize(content));
}
function runGenerator(tempCatalog) {
  const result = spawnSync('node', [GENERATOR, '--out', tempCatalog, '--allow-outside-root'], { encoding: 'utf8' });
  if (result.error) throw new Error('catalog generator failed to start: ' + result.error.message);
  if (result.status !== 0) throw new Error('catalog generator failed: ' + result.stderr);
}
function listTree(root) {
  return manifestLib.listFiles(root, '');
}
// Package identity lives here so Core and the platform packages never drift.
// The name encodes the package scope: an agent seeing "wisdom-page-ios" knows it
// carries SwiftUI evidence, and "wisdom-page-design" knows it must stop before
// generating native code. Same-name packages would silently compete for one rank.
const SKILL_IDENTITY = {
  core: {
    name: 'wisdom-page-design',
    scope: 'design semantics only. No platform API, no native template, no code generation.',
    description: 'WisdomDesign 页面设计 Skill（仅设计语义）：37 组件用途与反例检索、Page Spec 编写与结构校验、跨端页面交接。适合设计与需求评审；不包含任何 SwiftUI/Compose API，需要写代码时请改用 wisdom-page-ios。',
  },
  ios: {
    name: 'wisdom-page-ios',
    scope: 'design semantics + iOS SwiftUI public API cards, golden template and scaffolder. Android is not included.',
    description: 'WisdomDesign iOS 开发 Skill：37 组件设计语义 + 79 张真实 SwiftUI API 卡（签名/调用形态）+ 黄金页面模板与脚手架 + iOS 能力画像。用于 SwiftUI 页面实现；编译与 UI 验证仍需在 Xcode 工程内执行。',
  },
  android: {
    name: 'wisdom-page-android',
    scope: 'design semantics + Android Compose public API cards and template. Android implementation is paused; treat as experimental.',
    description: 'WisdomDesign Android 开发 Skill（实验/暂停）：37 组件设计语义 + 17 张 Compose API 卡 + Compose 黄金模板。Android 组件库尚未完成，原生编译与 UI 矩阵未验证；仅在明确知道限制时使用。',
  },
  all: {
    name: 'wisdom-page',
    scope: 'design semantics + iOS and Android payloads. Route by task; never mix platform APIs.',
    description: 'WisdomDesign 跨端页面 Skill：37 组件语义、Page Spec 校验，附 iOS（79 张）与 Android（17 张）API 卡与黄金模板。用于双端设计与代码生成；不宣称未经编译/UI 矩阵验证的通过结论。',
  },
};

function skillIdentity(packageKey) {
  const identity = SKILL_IDENTITY[packageKey];
  if (!identity) throw new Error('unknown package identity: ' + packageKey);
  return identity;
}

function renderTemplate(template, packageKey) {
  const identity = skillIdentity(packageKey);
  return template
    .replace('{{BUDGET_BYTES}}', String(RESIDENT_BUDGET_BYTES))
    .replace('{{SKILL_NAME}}', identity.name)
    .replace('{{SKILL_DESCRIPTION}}', identity.description)
    .replace('{{SKILL_SCOPE}}', identity.scope);
}

function cleanOut(out) {
  fs.mkdirSync(out, { recursive: true });
  for (const entry of fs.readdirSync(out)) fs.rmSync(path.join(out, entry), { recursive: true, force: true });
}
function renderInto(out, templatePath = TEMPLATE, repoRoots = {}) {
  cleanOut(out);
  const catalogSource = path.join(out, 'catalog');
  runGenerator(catalogSource);

  const template = normalize(fs.readFileSync(templatePath, 'utf8'));
  const skill = renderTemplate(template, 'core');
  const skillBytes = Buffer.byteLength(skill, 'utf8');
  if (skillBytes > RESIDENT_BUDGET_BYTES) throw new Error('resident SKILL.md exceeds budget: ' + skillBytes + ' > ' + RESIDENT_BUDGET_BYTES);
  writeFile(out, 'SKILL.md', skill);

  const copyTree = (sourceDir, destinationRelative) => {
    if (!fs.existsSync(sourceDir)) throw new Error('missing source directory: ' + path.relative(DESIGN_ROOT, sourceDir));
    for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
      const relative = path.join(destinationRelative, entry.name);
      const source = path.join(sourceDir, entry.name);
      if (entry.isDirectory()) copyTree(source, relative);
      else if (entry.isFile()) {
        let content = normalize(fs.readFileSync(source, 'utf8'));
        if (relative.endsWith('.md') && !content.startsWith('<!-- GENERATED FILE')) {
          content = BANNER_LINES.map(line => '<!-- ' + line + ' -->').join(LF) + LF + LF + content;
        }
        writeFile(out, relative, content);
      }
    }
  };
  copyTree(path.join(AI_ROOT, 'page-spec'), 'page-spec');
  copyTree(path.join(AI_ROOT, 'runtime'), 'runtime');
  // Catalog overlay refs (ai/skill/component-overlays/WD*.json) are resolution
  // metadata for get_component; shipping them keeps alias search identical in the
  // packaged layout without any outside-package read.
  copyTree(path.join(AI_ROOT, 'component-overlays'), 'component-overlays');
  // Long-form path table and conflict-resolution order, kept out of the resident entry so the
  // budget covers routing only. SKILL.md §3 tells the reader to load it before citing a spec line.
  writeFile(out, 'REFERENCES.md', fs.readFileSync(path.join(AI_ROOT, 'REFERENCES.md'), 'utf8'));

  // The design tokens are the only normative source for visual numbers, and every card and the
  // renderer quote them by name. Shipping the file itself (one copy, no derived digest) is what
  // makes "visual numbers" resolvable inside the package: without it SKILL.md's source-priority
  // paragraph pointed at a path that does not exist in the package at all (P0-1/P0-2).
  // The copy is byte-identical to tokens/wisdom.tokens.json; manifest.sources.design.tokenHash
  // pins it, and tests assert the two hashes agree, so this copy cannot silently drift.
  writeFile(out, 'tokens/wisdom.tokens.json', fs.readFileSync(path.join(DESIGN_ROOT, 'tokens', 'wisdom.tokens.json'), 'utf8'));

  const manifest = manifestLib.buildManifest(out, { packageName: 'wisdom-page-core', platforms: ['core'], skillVersion: manifestLib.SKILL_VERSION, banner: BANNER_LINES, repoRoots });
  return { out, skillBytes, files: manifest.contents.fileCount };
}
function build(args) {
  const out = args.out ? path.resolve(args.out) : DEFAULT_OUT;
  if (!args.allowOutsideRoot && !isInside(DESIGN_ROOT, out)) throw new Error('output path escapes design repo: ' + out);
  const templatePath = args.template ? path.resolve(args.template) : TEMPLATE;
  if (!fs.existsSync(templatePath)) throw new Error('template not found: ' + templatePath);
  const repoRoots = { ios: args.iosRoot, android: args.androidRoot };
  const result = renderInto(out, templatePath, repoRoots);
  console.log('built ' + path.relative(DESIGN_ROOT, out) + ' (' + result.files + ' files, resident ' + result.skillBytes + ' bytes, manifest schema-valid)');
}
function check(args) {
  const out = args.out ? path.resolve(args.out) : DEFAULT_OUT;
  if (!isInside(DESIGN_ROOT, out)) throw new Error('output path escapes design repo: ' + out);
  if (!fs.existsSync(path.join(out, 'manifest.json'))) throw new Error('no built Core package found at ' + path.relative(DESIGN_ROOT, out));
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'wisdom-core-check-'));
  try {
    const rebuilt = path.join(temp, 'wisdom-page-core');
    renderInto(rebuilt, TEMPLATE, { ios: args.iosRoot, android: args.androidRoot });
    const actual = listTree(out);
    const expected = listTree(rebuilt);
    if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error('file set differs from reproducible rebuild');
    for (const file of expected) {
      const a = fs.readFileSync(path.join(out, file));
      const b = fs.readFileSync(path.join(rebuilt, file));
      if (!a.equals(b)) throw new Error('content differs from reproducible rebuild: ' + file);
    }
    console.log('check OK: ' + expected.length + ' files match reproducible rebuild');
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}
function test() {
  const tests = [
    ['contract-selftest.js', path.join(TOOL_ROOT, 'tests', 'contract-selftest.js')],
    ['core-catalog.test.js', path.join(TOOL_ROOT, 'tests', 'core-catalog.test.js')],
    ['runtime.test.js', path.join(TOOL_ROOT, 'tests', 'runtime.test.js')],
    ['build.test.js', path.join(TOOL_ROOT, 'tests', 'build.test.js')],
    // The gallery is the only place a reader can see the tokens rendered, so a stale palette
    // there is a design-review defect, not a cosmetic one. Keep it in the same gate.
    ['gallery-check.selftest.js', path.join(DESIGN_ROOT, 'tools', 'gallery-check.selftest.js')],
  ];
  for (const [name, script] of tests) {
    const result = spawnSync('node', [script], { encoding: 'utf8' });
    process.stdout.write(result.stdout || '');
    process.stderr.write(result.stderr || '');
    if (result.status !== 0) throw new Error(name + ' failed with exit ' + result.status);
  }
  console.log('test OK: M0 contracts + M1 catalog + M1 runtime + M1 build');
}
function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.command === 'build') build(args);
  else if (args.command === 'check') check(args);
  else test();
}
module.exports = { SKILL_IDENTITY, skillIdentity, renderTemplate };
if (require.main === module) {
  try { main(); }
  catch (error) { console.error('cli failed: ' + error.message); process.exit(1); }
}