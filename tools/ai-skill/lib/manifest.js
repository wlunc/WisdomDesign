'use strict';
// Single manifest/report generator for the WisdomDesign Skill pipeline.
//
// Both producers use this module, so there is exactly one manifest format:
//   - tools/ai-skill/cli.js build            -> Core package
//   - tools/ai-skill/lib/write-manifest.js   -> package.js (Core / iOS / Android / All)
//
// The generated manifest is validated against the frozen M0 contract
// ai/skill/manifest/manifest.schema.json with tools/ai-skill/lib/schema-lite.js;
// an invalid manifest is a build failure (non-zero exit), never a warning.
//
// Package file accounting:
//   manifest.json  and  files.json  are the only files that cannot carry their own
//   SHA-256 (a file cannot contain its own digest). They are listed in
//   files.json.excludes, and their hashes are published in
//   dist/ai-skill/<version>/checksums.json so every package file is still verifiable.
//   manifest.contents.fileCount is the real on-disk file count of the package.
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { validateDocument } = require('./schema-lite.js');

const TOOL_ROOT = path.resolve(__dirname, '..');
const DESIGN_ROOT = path.resolve(TOOL_ROOT, '..', '..');
const REPO_ROOT = path.resolve(DESIGN_ROOT, '..');
const AI_ROOT = path.join(DESIGN_ROOT, 'ai', 'skill');
const SCHEMA_PATH = path.join(AI_ROOT, 'manifest', 'manifest.schema.json');
const BUILDER_VERSION = '1.0.0';
const SKILL_VERSION = '1.0.0';
const MANIFEST_FILE = 'manifest.json';
const FILES_INDEX_FILE = 'files.json';
const BUILD_INFO_FILE = 'build-info.json';
const RESIDENT_ENTRY = 'SKILL.md';
const RESIDENT_BUDGET_BYTES = 6000;
const LF = '\n';
const EXCLUDED_DIR_NAMES = new Set(['.git', 'node_modules', '__pycache__', '.build', 'dist', 'reports']);
const EXCLUDED_FILE_NAMES = new Set(['.DS_Store']);
// contentHash covers the packaged skill INPUTS. Generated evidence written by test /
// eval runs is an output, not an input: including it would make a reproducible package
// go stale whenever a test writes a report. Excluded explicitly and documented in
// tools/ai-skill/README.md.
const REPOSITORIES = {
  wisdomdesign: {
    name: 'wisdomdesign',
    path: '.',
    scopes: ['ai/skill', 'tools/ai-skill', 'contracts', 'tokens', 'docs/specs'],
    exclude: ['tools/ai-skill/eval/results', 'tools/ai-skill/eval/run-manifest.json', 'tools/ai-skill/reports']
  },
  ios: { name: 'iOS', path: 'iOS', scopes: ['ai/skill-provider'], exclude: [] },
  android: { name: 'android', path: 'android', scopes: ['ai/skill-provider'], exclude: [] }
};
// Platform checkouts are optional for a Core-only build. Resolution order:
//   1. explicit options.repoRoots[platform] (--ios-root / --android-root)
//   2. WISDOMDESIGN_IOS_ROOT / WISDOMDESIGN_ANDROID_ROOT environment variables
//   3. the sibling layout used by the multi-repo workspace (<parent>/iOS, <parent>/android)
const REPO_ROOT_ENV = { ios: 'WISDOMDESIGN_IOS_ROOT', android: 'WISDOMDESIGN_ANDROID_ROOT' };

function resolveRepoRoot(repoName, repoRoots = {}) {
  const settings = REPOSITORIES[repoName];
  if (repoName === 'wisdomdesign') return DESIGN_ROOT;
  const explicit = repoRoots[repoName] || process.env[REPO_ROOT_ENV[repoName]];
  if (explicit) {
    const resolved = path.resolve(explicit);
    if (!fs.existsSync(resolved)) throw new Error('platform source for ' + repoName + ' does not exist: ' + resolved + ' (from --' + repoName + '-root or ' + REPO_ROOT_ENV[repoName] + ')');
    return resolved;
  }
  const sibling = path.join(REPO_ROOT, settings.path);
  return fs.existsSync(sibling) ? sibling : null;
}

function platformSourceHint(repoName) {
  return 'checkout the ' + (repoName === 'ios' ? 'iOS' : 'android') + ' repo next to wisdomdesign, pass --' + repoName + '-root <dir>, or set ' + REPO_ROOT_ENV[repoName];
}

function sha256(value) { return crypto.createHash('sha256').update(value).digest('hex'); }
function sha256File(file) { return sha256(fs.readFileSync(file)); }
function json(value) { return JSON.stringify(value, null, 2) + LF; }
function toPosix(value) { return value.split(path.sep).join('/'); }

function listFiles(root, prefix = '') {
  const files = [];
  const directory = path.join(root, prefix);
  for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const relative = prefix ? prefix + '/' + entry.name : entry.name;
    if (entry.isDirectory()) {
      if (EXCLUDED_DIR_NAMES.has(entry.name)) continue;
      files.push(...listFiles(root, relative));
    } else if (entry.isFile()) {
      if (EXCLUDED_FILE_NAMES.has(entry.name)) continue;
      files.push(relative);
    }
  }
  return files.sort();
}

function listingHash(entries) {
  return sha256(entries.map(([file, hash]) => file + '\u0000' + hash).join(LF));
}

// Deterministic subtree hash: sha256 over sorted "<path>\0<file sha256>" lines.
// Same recipe as ai/skill/m0/baseline.json captureMethod (verified against its
// contractTreeHash / specTreeHash / tokenHash values).
function subtreeHash(repoRoot, scopes, exclude = []) {
  const entries = [];
  for (const scope of scopes) {
    const absolute = path.join(repoRoot, scope);
    if (!fs.existsSync(absolute)) continue;
    for (const relative of listFiles(absolute)) {
      const repoRelative = toPosix(path.join(scope, relative));
      if (exclude.some(prefix => repoRelative === prefix || repoRelative.startsWith(prefix + '/'))) continue;
      entries.push([repoRelative, sha256File(path.join(absolute, relative))]);
    }
  }
  entries.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  return listingHash(entries);
}

function git(repoRoot, args) {
  const result = spawnSync('git', ['-C', repoRoot, ...args], { encoding: 'utf8' });
  if (result.error) throw new Error('git failed: ' + result.error.message);
  if (result.status !== 0) throw new Error('git ' + args.join(' ') + ' failed: ' + (result.stderr || '').trim());
  return result.stdout;
}

function repoSettings(repoName) {
  const settings = REPOSITORIES[repoName];
  if (!settings) throw new Error('unknown repository ' + repoName);
  return settings;
}

function repoState(repoName, repoRoots = {}) {
  const settings = repoSettings(repoName);
  const repoRoot = resolveRepoRoot(repoName, repoRoots);
  if (!repoRoot) return null;
  const commit = git(repoRoot, ['rev-parse', 'HEAD']).trim();
  if (!/^[0-9a-f]{40}$/.test(commit)) throw new Error('unsupported git commit for ' + repoName + ': ' + commit);
  const status = git(repoRoot, ['status', '--porcelain']).split('\n').filter(Boolean);
  const dirtyFiles = status.map(line => line.slice(3).trim()).filter(Boolean).slice(0, 200);
  return {
    repository: settings.name,
    commit,
    dirty: status.length > 0,
    dirtyFiles,
    contentHash: subtreeHash(repoRoot, settings.scopes, settings.exclude)
  };
}

function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (error) { return fallback; }
}

function readText(file) { return fs.readFileSync(file, 'utf8'); }

function firstSemver(text) {
  const match = String(text || '').match(/[0-9]+\.[0-9]+\.[0-9]+(?:-[0-9A-Za-z.-]+)?/);
  return match ? match[0] : null;
}

function designSources() {
  const contractFiles = fs.readdirSync(path.join(DESIGN_ROOT, 'contracts'))
    .filter(name => /^WD.*\.yaml$/.test(name)).sort();
  const tokens = readJson(path.join(DESIGN_ROOT, 'tokens', 'wisdom.tokens.json'), {});
  // Contract tree hash covers exactly contracts/WD*.yaml (37), matching
  // ai/skill/m0/baseline.json designSources.contractTreeHash.
  const contractEntries = contractFiles.map(name => ['contracts/' + name, sha256File(path.join(DESIGN_ROOT, 'contracts', name))]);
  return {
    tokenVersion: tokens.$version || 'unknown',
    tokenHash: sha256File(path.join(DESIGN_ROOT, 'tokens', 'wisdom.tokens.json')),
    // The package ships tokens/wisdom.tokens.json verbatim; this flag says the value above is a
    // hash of a file the reader can open inside the package, not just of an outside truth source.
    tokenShipped: true,
    contractCount: contractFiles.length,
    contractTreeHash: listingHash(contractEntries),
    contractDigest: 'catalog/contracts-digest.json',
    specTreeHash: subtreeHash(DESIGN_ROOT, ['docs/specs'])
  };
}

function templateVersion(platform, repoRoots = {}) {
  const root = resolveRepoRoot(platform, repoRoots);
  if (!root) return null;
  if (platform === 'android') {
    const manifest = readJson(path.join(root, 'ai', 'skill-provider', 'templates', 'task-list.manifest.json'), {});
    return manifest.templateId || 'unknown';
  }
  const template = path.join(root, 'ai', 'skill-provider', 'templates', 'task-list.swift');
  const match = fs.existsSync(template) ? readText(template).match(/Template ID:\s*([A-Za-z0-9_-]+)/) : null;
  return match ? match[1] : 'unknown';
}

function providerState(platform, repoRoots = {}) {
  const repoRoot = resolveRepoRoot(platform, repoRoots);
  if (!repoRoot) throw new Error('platform source for ' + platform + ' is not available; ' + platformSourceHint(platform));
  const root = path.join(repoRoot, 'ai', 'skill-provider');
  if (!fs.existsSync(path.join(root, 'provider.json'))) {
    throw new Error(platform + ' provider not found at ' + path.join(root, 'provider.json') + '; ' + platformSourceHint(platform));
  }
  const provider = readJson(path.join(root, 'provider.json'), {});
  const verification = readJson(path.join(root, 'verification.json'), {});
  return {
    root,
    provider,
    verification,
    effective: provider.status && provider.status.effective ? provider.status.effective : 'spec-only',
    providerVersion: firstSemver(provider.libraryVersion) || '1.0.0',
    templateVersion: templateVersion(platform, repoRoots)
  };
}

// Canonical component set comes from the design truth (contracts/WD*.yaml), not from a
// previously generated catalog. This keeps `cli.js build` bootstrap-able in a clean
// checkout where ai/skill/core/catalog does not exist yet.
function catalogIds() {
  const contractsDir = path.join(DESIGN_ROOT, 'contracts');
  if (!fs.existsSync(contractsDir)) throw new Error('design contracts directory missing: ' + contractsDir);
  const ids = fs.readdirSync(contractsDir).filter(name => /^WD.*[.]yaml$/.test(name)).map(name => name.replace(/[.]yaml$/, '')).sort();
  if (!ids.length) throw new Error('no contracts/WD*.yaml found; cannot determine the canonical component set');
  return ids;
}

function platformCoverage(platform, ids, repoRoots = {}) {
  const state = providerState(platform, repoRoots);
  const covered = new Set();
  if (platform === 'ios') {
    const coverage = state.verification.apiCardCoverage || {};
    for (const id of coverage.withCards || []) if (ids.has(id)) covered.add(id);
  } else {
    const index = readJson(path.join(state.root, 'api', 'cards', 'index.json'), {});
    for (const card of index.cards || []) if (card && ids.has(card.component)) covered.add(card.component);
  }
  return { state, covered };
}

function cardEvidence(platform, ids, repoRoots = {}) {
  const state = providerState(platform, repoRoots);
  const evidence = new Map();
  const directory = path.join(state.root, platform === 'ios' ? 'api-cards' : path.join('api', 'cards'));
  if (!fs.existsSync(directory)) return evidence;
  for (const name of fs.readdirSync(directory).sort()) {
    if (!name.endsWith('.json') || name === 'index.json' || name === 'SOURCES.json') continue;
    const card = readJson(path.join(directory, name), null);
    if (!card || !ids.has(card.component)) continue;
    if (!evidence.has(card.component)) evidence.set(card.component, new Set());
    evidence.get(card.component).add(card.evidence);
  }
  return evidence;
}

function coverageBlock(platforms, repoRoots = {}) {
  const allIds = catalogIds();
  const ids = new Set(allIds);
  const base = {
    verification: { structure: true, nativeCompile: false, runtimeMatrix: false, designReview: false, hostLoad: false },
    a11yStates: []
  };
  if (!platforms.length) {
    return { components: { specOnly: ids.size, experimental: 0, verified: 0, unsupported: 0 }, ...base };
  }
  const covered = new Set();
  const evidence = [];
  for (const platform of platforms) {
    const result = platformCoverage(platform, ids, repoRoots);
    for (const id of result.covered) covered.add(id);
    evidence.push(cardEvidence(platform, ids, repoRoots));
  }
  // experimental = has a real API card on at least one included platform;
  // verified = every included platform has a template-verified card;
  // specOnly = no API card on any included platform; unsupported = 0 (none declared).
  const verified = [...covered].filter(id => evidence.every(map => (map.get(id) || new Set()).has('template-verified'))).length;
  return {
    components: { specOnly: ids.size - covered.size, experimental: covered.size - verified, verified, unsupported: 0 },
    ...base
  };
}

function unverifiedBlock(platforms, repoRoots = {}) {
  const items = [
    'native compile (xcodebuild / gradle) is owned by the platform repos and was not executed by this builder',
    'snapshot / UI matrix not executed',
    'host loading not executed',
    'independent design review not performed',
    'M5 AI evaluation not executed'
  ];
  for (const platform of platforms) {
    const state = providerState(platform, repoRoots);
    for (const entry of state.verification.unverified || []) {
      if (typeof entry === 'string' && entry && item_length_ok(entry) && !items.includes(entry)) items.push(entry);
    }
  }
  return items.slice(0, 50);
}
function item_length_ok(value) { return value.length <= 300; }

function statusBlock(platforms, sources, repoRoots = {}) {
  const dirty = Object.values(sources.repositories).some(state => state.dirty);
  const platformStatus = {};
  for (const platform of platforms) platformStatus[platform] = providerState(platform, repoRoots).effective;
  let overall = 'spec-only';
  if (platforms.length) {
    const values = Object.values(platformStatus);
    overall = values.includes('incompatible') ? 'incompatible'
      : values.includes('unsupported') ? 'unsupported'
        : values.includes('experimental') ? 'experimental'
          : values.includes('verified') ? 'verified' : 'spec-only';
  }
  return { releaseKind: dirty ? 'workspace-snapshot' : 'release', overall, platforms: platformStatus };
}

function versionsBlock(availablePlatforms, repoRoots = {}) {
  const providers = {};
  const templates = {};
  for (const platform of availablePlatforms) {
    const state = providerState(platform, repoRoots);
    providers[platform] = state.providerVersion;
    templates[platform] = state.templateVersion || 'unknown';
  }
  return {
    tokens: readJson(path.join(DESIGN_ROOT, 'tokens', 'wisdom.tokens.json'), {}).$version || 'unknown',
    contracts: '1.0',
    providers,
    templates
  };
}

function buildInfo(root, details) {
  const skillPath = path.join(root, RESIDENT_ENTRY);
  const residentBytes = fs.existsSync(skillPath) ? fs.statSync(skillPath).size : 0;
  return {
    schemaVersion: '1.0',
    generatedBy: 'tools/ai-skill/lib/manifest.js',
    package: details.packageName,
    scope: details.platforms.join('+') || 'core',
    platforms: details.platforms,
    builderVersion: BUILDER_VERSION,
    skillVersion: details.skillVersion,
    residentEntry: RESIDENT_ENTRY,
    residentBytes,
    residentBudgetBytes: RESIDENT_BUDGET_BYTES,
    residentBudgetBasis: 'budget basis: this package resident entry is ' + residentBytes + ' bytes; the 6,000-byte cap is the M1-5 host-entry budget (measured Core entry 5,389 bytes, platform appendices add <150 bytes) enforced by build and tests/build.test.js over-budget negative case; see tools/ai-skill/README.md §常驻预算',
    platformApiLoaded: false,
    corePackageContainsPlatformApi: false,
    manifestSchema: 'ai/skill/manifest/manifest.schema.json',
    fileAccounting: {
      selfReferential: [MANIFEST_FILE, FILES_INDEX_FILE],
      reason: 'a file cannot contain its own SHA-256; these two hashes are published in dist/ai-skill/<version>/checksums.json',
      filesIndex: FILES_INDEX_FILE
    },
    inputs: details.sources,
    sourceRefs: ['ai/skill/SKILL.md.template', 'ai/skill/page-spec/', 'ai/skill/core/catalog/', 'ai/skill/runtime/', 'ai/skill/component-overlays/'],
    banner: details.banner
  };
}

function buildManifest(root, options) {
  const platforms = (options.platforms || []).filter(platform => platform && platform !== 'core');
  const repoRoots = options.repoRoots || {};
  const sources = { repositories: {}, design: designSources() };
  const states = {};
  for (const name of ['wisdomdesign', 'ios', 'android']) {
    const state = repoState(name, repoRoots);
    if (!state) continue;
    states[name] = state;
    sources.repositories[name] = state;
  }
  if (!states.wisdomdesign) throw new Error('cannot read the wisdomdesign repository state from ' + DESIGN_ROOT);
  for (const platform of platforms) {
    if (!states[platform]) {
      throw new Error('package includes ' + platform + ' but its source checkout is unavailable; ' + platformSourceHint(platform));
    }
  }
  const availablePlatforms = ['ios', 'android'].filter(platform => states[platform]);
  const coverage = coverageBlock(platforms, repoRoots);
  const status = statusBlock(platforms, sources, repoRoots);
  const versions = versionsBlock(availablePlatforms, repoRoots);
  const info = buildInfo(root, { packageName: options.packageName, platforms: options.platforms || [], skillVersion: options.skillVersion || SKILL_VERSION, sources, banner: options.banner || [] });
  fs.writeFileSync(path.join(root, BUILD_INFO_FILE), json(info));

  const all = listFiles(root, '');
  const payload = all.filter(file => file !== MANIFEST_FILE && file !== FILES_INDEX_FILE);
  const hashes = {};
  for (const file of payload) hashes[file] = sha256File(path.join(root, file));
  const contentHash = listingHash(payload.map(file => [file, hashes[file]]));
  const fileCount = payload.length + 2;
  const filesIndex = {
    schemaVersion: '1.0',
    package: options.packageName,
    generatedBy: 'tools/ai-skill/lib/manifest.js',
    excludes: [MANIFEST_FILE, FILES_INDEX_FILE],
    exclusionReason: 'self-referential: a file cannot contain its own SHA-256; both hashes are published in dist/ai-skill/<version>/checksums.json',
    fileCount: payload.length,
    packageFileCount: fileCount,
    contentHash,
    sha256: hashes
  };
  fs.writeFileSync(path.join(root, FILES_INDEX_FILE), json(filesIndex));

  const manifest = {
    schemaVersion: '1.0',
    package: options.packageName,
    version: {
      skill: options.skillVersion || SKILL_VERSION,
      pageSpecSchema: '1.1',
      providerSchema: '1.0',
      manifestSchema: '1.0'
    },
    contents: { kind: 'directory', platforms: options.platforms || ['core'], entry: RESIDENT_ENTRY, fileCount, contentHash },
    sources,
    versions,
    status,
    coverage,
    verification: { reportRef: BUILD_INFO_FILE, checksumsRef: FILES_INDEX_FILE, unverified: unverifiedBlock(platforms, repoRoots) },
    reproducibility: { noAbsolutePaths: true, noTimestamps: true, noMachineIdentifiers: true, fixedNewline: 'LF', fixedZipTimestamps: true, builderVersion: BUILDER_VERSION }
  };

  const schema = readJson(SCHEMA_PATH, null);
  if (!schema) throw new Error('cannot read manifest schema: ' + path.relative(DESIGN_ROOT, SCHEMA_PATH));
  const errors = validateDocument(manifest, schema);
  if (errors.length) throw new Error('generated manifest violates manifest.schema.json (' + errors.length + '): ' + JSON.stringify(errors.slice(0, 8)));
  fs.writeFileSync(path.join(root, MANIFEST_FILE), json(manifest));

  const written = listFiles(root, '').length;
  if (written !== manifest.contents.fileCount) throw new Error('manifest.contents.fileCount ' + manifest.contents.fileCount + ' != actual ' + written);
  const resident = fs.statSync(path.join(root, RESIDENT_ENTRY)).size;
  if (resident > RESIDENT_BUDGET_BYTES) throw new Error('resident ' + RESIDENT_ENTRY + ' exceeds budget: ' + resident + ' > ' + RESIDENT_BUDGET_BYTES);
  return manifest;
}

module.exports = {
  BUILD_INFO_FILE,
  BUILDER_VERSION,
  DESIGN_ROOT,
  FILES_INDEX_FILE,
  MANIFEST_FILE,
  RESIDENT_BUDGET_BYTES,
  RESIDENT_ENTRY,
  SKILL_VERSION,
  buildManifest,
  catalogIds,
  designSources,
  platformSourceHint,
  resolveRepoRoot,
  json,
  listFiles,
  repoState,
  sha256,
  sha256File,
  subtreeHash
};
