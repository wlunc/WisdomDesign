'use strict';
// M4 dist-package audit (M4-2/M4-3): audit the delivered package set (Core alone in a
// single-repo checkout, or Core + platform packages in a multi-repo workspace) as
// artefacts, not as fixtures. Zero dependencies; reads ZIPs directly with node:zlib.
//
// Covers: manifest schema validity, real file counts, per-file hashes (incl.
// LICENSE-NOTICE), manifest/files.json self-hash via checksums.json, deterministic
// ZIP metadata, path safety, scope isolation, packaged runtime execution, SKILL.md
// resident budget and in-package dead references.
//
// Usage: node tools/ai-skill/tests/dist-package.test.js [--dist <dir>] [--platforms core,ios,android]
// Without --platforms the expected set is read from checksums.json (auto-detect), so a
// core-only dist from a single-repo checkout is audited the same way as a full dist.
// Exit: 0 all checks passed; 1 audit failure; 2 dist missing (run package.py first).
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { spawnSync } = require('child_process');
const { validateDocument } = require('../lib/schema-lite.js');

const ROOT = path.resolve(__dirname, '..', '..', '..'); // wisdomdesign/
const ALL_PACKAGES = ['core', 'ios', 'android', 'all'];
const PLATFORM_FILES = { core: [], ios: ['ios'], android: ['android'], all: ['ios', 'android'] };
const RESIDENT_BUDGET_BYTES = 6000;

function arg(name, fallback) {
  const index = process.argv.indexOf('--' + name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

let pass = 0, fail = 0;
const failures = [];
function check(id, condition, detail) {
  if (condition) { pass += 1; console.log('PASS ' + id + (detail ? ' :: ' + detail : '')); }
  else { fail += 1; failures.push(id + (detail ? ' :: ' + detail : '')); console.error('FAIL ' + id + (detail ? ' :: ' + detail : '')); }
}
function readJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function sha256(buffer) { return require('crypto').createHash('sha256').update(buffer).digest('hex'); }
function walk(dir, prefix = '') {
  const files = [];
  for (const entry of fs.readdirSync(path.join(dir, prefix), { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const relative = prefix ? prefix + '/' + entry.name : entry.name;
    if (entry.isDirectory()) files.push(...walk(dir, relative));
    else if (entry.isFile()) files.push(relative);
  }
  return files;
}
function crc32(buffer) {
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i += 1) {
    crc ^= buffer[i];
    for (let j = 0; j < 8; j += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function readZip(file) {
  const buffer = fs.readFileSync(file);
  let eocd = -1;
  for (let i = buffer.length - 22; i >= Math.max(0, buffer.length - 65558); i -= 1) {
    if (buffer.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('ZIP EOCD not found');
  const count = buffer.readUInt16LE(eocd + 10);
  const cdOffset = buffer.readUInt32LE(eocd + 16);
  const entries = [];
  let offset = cdOffset;
  for (let i = 0; i < count; i += 1) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) throw new Error('bad ZIP central directory at ' + offset);
    const method = buffer.readUInt16LE(offset + 10);
    const dosTime = buffer.readUInt16LE(offset + 12);
    const dosDate = buffer.readUInt16LE(offset + 14);
    const crc = buffer.readUInt32LE(offset + 16);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const uncompressedSize = buffer.readUInt32LE(offset + 24);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const externalAttr = buffer.readUInt32LE(offset + 38);
    const localOffset = buffer.readUInt32LE(offset + 42);
    const name = buffer.slice(offset + 46, offset + 46 + nameLength).toString('utf8');
    const localNameLength = buffer.readUInt16LE(localOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localOffset + 28);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const raw = buffer.slice(dataStart, dataStart + compressedSize);
    const content = method === 0 ? raw : zlib.inflateRawSync(raw);
    entries.push({ name, method, dosTime, dosDate, crc, compressedSize, uncompressedSize, externalAttr, content });
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}
function metadataOf(entry) {
  const year = ((entry.dosDate >> 9) & 0x7f) + 1980;
  const month = (entry.dosDate >> 5) & 0x0f;
  const day = entry.dosDate & 0x1f;
  return { year, month, day, externalAttr: (entry.externalAttr >>> 16) & 0xffff };
}

const distArgument = arg('dist', path.join(ROOT, 'dist', 'ai-skill', 'v1.0.0'));
const dist = path.resolve(distArgument);
if (!fs.existsSync(dist)) {
  console.error('dist package directory missing: ' + dist + '\nrun: python3 tools/ai-skill/package.py');
  process.exit(2);
}

const manifestSchema = readJson(path.join(ROOT, 'ai/skill/manifest/manifest.schema.json'));
const exemptions = readJson(path.join(ROOT, 'ai/skill/manifest/package-exemptions.json'));
const checksumsPath = path.join(dist, 'checksums.json');
check('checksums-present', fs.existsSync(checksumsPath), path.relative(ROOT, checksumsPath));
const checksums = fs.existsSync(checksumsPath) ? readJson(checksumsPath) : { packages: {} };

function expectedPackages() {
  const explicit = arg('platforms', '');
  if (explicit) {
    const requested = explicit.split(',').map(item => item.trim()).filter(Boolean);
    const unknown = requested.filter(item => !['core', 'ios', 'android'].includes(item));
    if (unknown.length) {
      console.error('unknown platform(s): ' + unknown.join(',') + '; choose from core,ios,android');
      process.exit(2);
    }
    const selected = ['core', ...requested.filter(item => item !== 'core')];
    if (selected.includes('ios') && selected.includes('android')) selected.push('all');
    return selected;
  }
  const declared = Object.keys(checksums.packages || {}).map(name => name.replace('wisdom-page-', ''));
  return declared.length ? declared : ['core'];
}

const expectedNames = expectedPackages();
console.log('auditing packages: ' + expectedNames.join(', '));

for (const name of expectedNames) {
  const pkg = path.join(dist, 'wisdom-page-' + name);
  const label = 'pkg-' + name;
  check(label + '-present', fs.existsSync(pkg), path.relative(ROOT, pkg));
  if (!fs.existsSync(pkg)) continue;

  const files = walk(pkg);
  const manifest = readJson(path.join(pkg, 'manifest.json'));
  const errors = validateDocument(manifest, manifestSchema);
  check(label + '-manifest-schema', errors.length === 0, errors.length ? JSON.stringify(errors.slice(0, 6)) : '0 errors');
  check(label + '-file-count', manifest.contents.fileCount === files.length, 'manifest ' + manifest.contents.fileCount + ' == actual ' + files.length);
  check(label + '-entry', manifest.contents.entry === 'SKILL.md' && files.includes('SKILL.md'));

  const filesIndex = readJson(path.join(pkg, 'files.json'));
  const excluded = filesIndex.excludes || [];
  const expectedListed = files.filter(file => !excluded.includes(file)).sort();
  check(label + '-files-index-complete', JSON.stringify(expectedListed) === JSON.stringify(Object.keys(filesIndex.sha256).sort()), 'files.json must hash every non-self-referential file');
  let hashMismatch = 0;
  for (const [file, hash] of Object.entries(filesIndex.sha256)) {
    if (!fs.existsSync(path.join(pkg, file))) { hashMismatch += 1; continue; }
    if (sha256(fs.readFileSync(path.join(pkg, file))) !== hash) hashMismatch += 1;
  }
  check(label + '-file-hashes', hashMismatch === 0, hashMismatch + ' mismatched file hashes');
  check(label + '-license-hashed', Object.prototype.hasOwnProperty.call(filesIndex.sha256, 'LICENSE-NOTICE.txt'), 'LICENSE-NOTICE.txt must be in the hash table');
  check(label + '-content-hash', filesIndex.contentHash === manifest.contents.contentHash, 'manifest/files.json contentHash agree');

  const entry = (checksums.packages || {})['wisdom-page-' + name];
  check(label + '-checksums-entry', Boolean(entry), 'checksums.json entry');
  if (entry) {
    check(label + '-zip-sha', sha256(fs.readFileSync(path.join(dist, entry.zipPath))) === entry.zipSha256, 'zip sha matches checksums');
    check(label + '-manifest-self-hash', sha256(fs.readFileSync(path.join(pkg, 'manifest.json'))) === entry.manifestSha256, 'manifest.json hash matches checksums (stale self-hash regression)');
    check(label + '-files-index-self-hash', sha256(fs.readFileSync(path.join(pkg, 'files.json'))) === entry.filesIndexSha256, 'files.json hash matches checksums');
    check(label + '-filecount-agree', entry.fileCount === manifest.contents.fileCount, 'checksums fileCount agrees');

    const zipEntries = readZip(path.join(dist, entry.zipPath));
    check(label + '-zip-entries', zipEntries.length === entry.zipEntries && zipEntries.length === files.length, 'zip entries ' + zipEntries.length + ' == files ' + files.length);
    const names = zipEntries.map(item => item.name);
    check(label + '-zip-names', JSON.stringify(names.slice().sort()) === JSON.stringify(files.slice().sort()), 'zip entries match on-disk files');
    const metadataProblems = [];
    const crcProblems = [];
    for (const item of zipEntries) {
      const meta = metadataOf(item);
      if (meta.year !== 2020 || meta.month !== 1 || meta.day !== 1) metadataProblems.push('date ' + item.name);
      if (meta.externalAttr !== 0o644) metadataProblems.push('attrs ' + item.name);
      if (crc32(item.content) !== item.crc) crcProblems.push('crc ' + item.name);
      if (item.uncompressedSize !== item.content.length) crcProblems.push('size ' + item.name);
      const onDisk = fs.readFileSync(path.join(pkg, item.name));
      if (!onDisk.equals(item.content)) crcProblems.push('bytes ' + item.name);
    }
    check(label + '-zip-metadata', metadataProblems.length === 0, metadataProblems.slice(0, 3).join('; '));
    check(label + '-zip-integrity', crcProblems.length === 0, crcProblems.slice(0, 3).join('; '));
    const unsafe = names.filter(item => item.startsWith('/') || item.includes('..') || item.includes('\\') || item.includes(String.fromCharCode(0)) || /^[A-Za-z]:/.test(item));
    check(label + '-zip-paths', unsafe.length === 0, unsafe.slice(0, 3).join('; '));
  }

  const platformDirs = files.filter(file => file.startsWith('platforms/')).map(file => file.split('/')[1]);
  const uniquePlatforms = [...new Set(platformDirs)].sort();
  check(label + '-scope', JSON.stringify(uniquePlatforms) === JSON.stringify(PLATFORM_FILES[name].slice().sort()), 'platforms dirs ' + JSON.stringify(uniquePlatforms));
  check(label + '-no-platform-api-in-core', name !== 'core' || !files.some(file => /provider|api-card|api\/cards/i.test(file)));

  const skillPath = path.join(pkg, 'SKILL.md');
  const skillSize = fs.statSync(skillPath).size;
  // Platform packages append a short provider/index section to the Core entry point.
  const coreSize = fs.statSync(path.join(dist, 'wisdom-page-core', 'SKILL.md')).size;
  check(label + '-budget', skillSize <= RESIDENT_BUDGET_BYTES && skillSize >= coreSize, 'SKILL.md ' + skillSize + ' bytes (core ' + coreSize + ', cap ' + RESIDENT_BUDGET_BYTES + ')');

  const refProblems = [];
  for (const file of files.filter(item => /\.md$/i.test(item))) {
    const text = fs.readFileSync(path.join(pkg, file), 'utf8');
    for (const match of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
      const target = match[1].split('#')[0].trim();
      if (!target || /^https?:\/\//.test(target) || target.startsWith('mailto:')) continue;
      if (!fs.existsSync(path.join(path.dirname(path.join(pkg, file)), target))) refProblems.push(file + ' -> ' + target);
    }
    for (const literal of ['truth-source-map.json']) {
      if (text.includes(literal) && !fs.existsSync(path.join(pkg, literal))) refProblems.push(file + ' -> ' + literal);
    }
  }
  check(label + '-dead-refs', refProblems.length === 0, refProblems.slice(0, 4).join('; '));

  const runtime = path.join(pkg, 'runtime');
  const samples = path.join(pkg, 'page-spec', 'examples', 'task-list.valid.json');
  const exact = spawnSync('node', [path.join(runtime, 'get-component.js'), '--id', 'WDButton', '--json'], { encoding: 'utf8', cwd: dist });
  check(label + '-runtime-exact', exact.status === 0 && JSON.parse(exact.stdout || '{}').component && JSON.parse(exact.stdout).component.id === 'WDButton', 'get-component exit ' + exact.status);
  const keyword = spawnSync('node', [path.join(runtime, 'get-component.js'), '--query', '搜索', '--limit', '2', '--json'], { encoding: 'utf8', cwd: dist });
  let keywordData = {};
  try { keywordData = JSON.parse(keyword.stdout || '{}'); } catch (error) { keywordData = {}; }
  check(label + '-runtime-keyword', keyword.status === 0 && keywordData.candidates && keywordData.candidates[0].id === 'WDSearchField', 'alias-aware keyword search inside package');
  const invalid = spawnSync('node', [path.join(runtime, 'get-component.js'), '--id', 'WDFake'], { encoding: 'utf8', cwd: dist });
  check(label + '-runtime-notfound', invalid.status === 3, 'unknown component exits 3');
  const escape = spawnSync('node', [path.join(runtime, 'get-component.js'), '--id', 'WDButton', '--catalog', path.join(ROOT, 'contracts')], { encoding: 'utf8', cwd: dist });
  check(label + '-runtime-escape', escape.status === 2 && /escapes Skill package/.test(escape.stderr), 'catalog escape exits 2');
  const validSpec = spawnSync('node', [path.join(runtime, 'validate-spec.js'), '--file', samples], { encoding: 'utf8', cwd: dist });
  check(label + '-runtime-validate', validSpec.status === 0, 'validate-spec exit ' + validSpec.status);
  const brokenSpec = spawnSync('node', [path.join(runtime, 'validate-spec.js'), '--file', path.join(dist, 'does-not-exist.json')], { encoding: 'utf8', cwd: dist });
  check(label + '-runtime-io-error', brokenSpec.status === 2, 'missing spec file exits 2');

  const machineProblems = [];
  const machineExempt = [];
  for (const file of files) {
    if (!/\.(md|json|js|txt)$/i.test(file)) continue;
    const text = fs.readFileSync(path.join(pkg, file), 'utf8');
    const hits = [];
    if (text.includes(ROOT)) hits.push('absolute-root');
    if (/\/Users\//.test(text)) hits.push('/Users/');
    if (/var\/folders/.test(text)) hits.push('/var/folders');
    if (/\r\n/.test(text)) hits.push('CRLF');
    if (!hits.length) continue;
    const exemption = exemptions.exemptions.find(item => item.path === file && hits.some(hit => hit === item.match || text.includes(item.match)));
    if (exemption) machineExempt.push(file + ' (' + exemption.match + ', owner ' + exemption.owner + ')');
    else machineProblems.push(file + ' (' + hits.join(',') + ')');
  }
  check(label + '-no-machine-info', machineProblems.length === 0, machineExempt.length ? 'registered exemptions: ' + machineExempt.join('; ') : machineProblems.slice(0, 3).join('; '));
}

const presentDirs = fs.readdirSync(dist)
  .filter(name => /^wisdom-page-/.test(name) && fs.statSync(path.join(dist, name)).isDirectory())
  .map(name => name.replace('wisdom-page-', ''))
  .sort();
const declaredPackages = Object.keys(checksums.packages || {}).map(name => name.replace('wisdom-page-', '')).sort();
check(
  'package-set',
  JSON.stringify(presentDirs) === JSON.stringify(expectedNames.slice().sort())
    && JSON.stringify(declaredPackages) === JSON.stringify(expectedNames.slice().sort()),
  'expected ' + expectedNames.join(',') + '; dirs ' + presentDirs.join(',') + '; checksums ' + declaredPackages.join(',')
);
const allowed = new Set(ALL_PACKAGES);
check('package-set-known', expectedNames.every(name => allowed.has(name)), 'no unknown package names');

console.log('\nM4 DIST-PACKAGE RESULT: pass=' + pass + ' fail=' + fail);
if (fail) {
  console.error('FAILURES:\n  ' + failures.join('\n  '));
  process.exit(1);
}
