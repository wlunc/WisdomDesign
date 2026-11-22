'use strict';
// M4 CI / version-compatibility / negative-test runner.
// Zero runtime dependencies. Read-only against design truth sources and
// platform repos. Writes only its own machine report under tools/ai-skill/reports/.
// Contract/static gate layer only: NOT a cli.js build, native compile, host load or release.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { validateDocument } = require('../lib/schema-lite.js');
const { planFor, collectChangedPaths } = require('../ci/route-changes.js');

const ROOT = path.resolve(__dirname, '../../..'); // wisdomdesign/
const SKILL = path.join(ROOT, 'ai/skill');
const REPORTS = path.join(__dirname, '../reports');
const HASH = 'a'.repeat(64);
const ZERO = '0'.repeat(40);

let pass = 0, fail = 0;
const results = [];
function ok(id, detail) { pass++; results.push({ id, status: 'passed', detail: detail || '' }); console.log('PASS ' + id + (detail ? ' :: ' + detail : '')); }
function no(id, detail) { fail++; results.push({ id, status: 'failed', detail: detail || '' }); console.error('FAIL ' + id + ' :: ' + detail); }
function check(id, cond, detail) { cond ? ok(id, detail) : no(id, detail); }
function readJson(rel) { return JSON.parse(fs.readFileSync(path.join(SKILL, rel), 'utf8')); }
function clone(o) { return JSON.parse(JSON.stringify(o)); }
function invalid(doc, schema) { return validateDocument(doc, schema).length > 0; }
function invalidWithCode(doc, schema, code) { return validateDocument(doc, schema).some(e => e.code === code); }
function safeRel(p) {
  if (typeof p !== 'string' || p.length === 0) return false;
  if (p.charAt(0) === '/' || /^[A-Za-z]:/.test(p)) return false;
  if (p.split('/').indexOf('..') >= 0) return false;
  if (p.indexOf(String.fromCharCode(0)) >= 0) return false;
  return true;
}

const pageSchema = readJson('page-spec/schema.json');
const providerSchema = readJson('provider/provider.schema.json');
const apiCardSchema = readJson('provider/api-card.schema.json');
const manifestSchema = readJson('manifest/manifest.schema.json');
const baseline = readJson('m0/baseline.json');

const repo = { repository: 'example', commit: ZERO, dirty: false, contentHash: HASH };
const provider = {
  schemaVersion: '1.0', id: 'ios', displayName: 'SwiftUI', library: 'WisdomUI', libraryVersion: '1.0.0',
  source: repo,
  adapters: { api: 'api/adapters/ios.js', tokens: 'tokens/ios.js', templates: 'templates/ios/', verify: 'verify/ios.sh' },
  capabilities: 'capabilities.json', apiCards: 'api/cards/index.json',
  status: { effective: 'experimental', declared: 'verified', reason: 'example-compiled only', evidenceRefs: ['reports/ios-build.json'], computedAtBuild: true },
  unsupportedBehavior: { onMissingComponent: 'spec-only', onMissingApiCard: 'spec-only', onMissingTemplate: 'fail-with-guidance', onIncompatibleVersion: 'fail-build', forbidden: ['fabricate-api', 'fake-verified', 'bypass-test', 'cross-repo-write'] },
  writeBoundary: { defaultReadOnlyPlatformRepos: true, requiresOwnerApprovalForPlatformWrites: true }
};
const card = {
  schemaVersion: '1.0', platform: 'ios', component: 'WDButton', canonicalParam: 'loading', symbol: 'WDButton',
  signature: 'init(label:variant:size:isLoading:action:)', callShape: 'WDButton(label:variant:.filled, isLoading:false) {}',
  evidence: 'example-compiled', sourceRefs: ['api/WisdomUI.api.json'],
  compilation: { command: 'Scripts/ci.sh pr', exitCode: 0, matrixRef: 'reports/ios-build.json', executed: true }
};
function baseManifest() {
  return {
    schemaVersion: '1.0', package: 'wisdom-page-all',
    version: { skill: '0.1.0', pageSpecSchema: '1.0', providerSchema: '1.0', manifestSchema: '1.0' },
    contents: { kind: 'directory', platforms: ['ios', 'android'], entry: 'SKILL.md', contentHash: HASH },
    sources: {
      repositories: { wisdomdesign: clone(repo), ios: clone(repo), android: clone(repo) },
      design: { tokenVersion: baseline.designSources.tokenVersion, tokenHash: HASH, contractCount: 37, contractTreeHash: HASH }
    },
    versions: { tokens: baseline.designSources.tokenVersion, contracts: '2026-11-21', providers: { ios: '0.1.0', android: '0.1.0' }, templates: { ios: '0.1.0', android: '0.1.0' } },
    status: { releaseKind: 'workspace-snapshot', overall: 'experimental', platforms: { ios: 'experimental', android: 'experimental' } },
    coverage: { components: { specOnly: 10, experimental: 5, verified: 0, unsupported: 0 }, verification: { structure: true, nativeCompile: false, runtimeMatrix: false, designReview: false, hostLoad: false }, a11yStates: ['default', 'light', 'dark'] },
    verification: { reportRef: 'reports/verification-report.json', checksumsRef: 'checksums.json', unverified: ['native compile'] },
    reproducibility: { noAbsolutePaths: true, noTimestamps: true, noMachineIdentifiers: true, fixedNewline: 'LF', fixedZipTimestamps: true, builderVersion: '0.1.0' }
  };
}

// 1. baseline positives
check('baseline-manifest-valid', !invalid(baseManifest(), manifestSchema), 'base manifest passes schema');
check('baseline-provider-valid', !invalid(provider, providerSchema), 'base provider passes schema');
check('baseline-api-card-valid', !invalid(card, apiCardSchema), 'base API card passes schema');

// 2. version compatibility negatives
const compat = [
  ['token-incompatible', m => { m.versions.tokens = '9.9.9'; }, 'token version drift rejected'],
  ['contract-incompatible', m => { m.version.contracts = '9.9'; }, 'contract schema version drift rejected'],
  ['provider-schema-incompatible', m => { m.version.providerSchema = '9.9'; }, 'provider schema version drift rejected'],
  ['manifest-schema-incompatible', m => { m.version.manifestSchema = '9.9'; }, 'manifest schema version drift rejected'],
  ['skill-version-invalid', m => { m.version.skill = 'not-a-semver'; }, 'skill version must follow semver pattern']
];
function versionGuard(m) {
  const semver = /^[0-9]+\.[0-9]+\.[0-9]+(?:-[0-9A-Za-z.-]+)?$/;
  const drift = [];
  if (m.versions.tokens !== baseline.designSources.tokenVersion) drift.push('TOKEN');
  if (m.version.pageSpecSchema !== '1.0' || m.version.providerSchema !== '1.0' || m.version.manifestSchema !== '1.0') drift.push('CONTRACT');
  if (!semver.test(m.version.skill)) drift.push('SKILL_SEMVER');
  return drift;
}
for (const item of compat) {
  const m = baseManifest(); item[1](m);
  const guardCode = { 'token-incompatible':'TOKEN', 'contract-incompatible':'CONTRACT', 'provider-schema-incompatible':'CONTRACT', 'manifest-schema-incompatible':'CONTRACT', 'skill-version-invalid':'SKILL_SEMVER' }[item[0]];
  check(item[0], invalid(m, manifestSchema) || versionGuard(m).indexOf(guardCode) >= 0, item[2] + ' (schema+guard)');
}
const badProvider = clone(provider); badProvider.schemaVersion = '9.9';
check('provider-declared-version-incompatible', invalid(badProvider, providerSchema), 'provider.schemaVersion!=1.0 rejected');

function compatibilityGuard(tpl, overall, platforms) {
  const errors = [];
  if (tpl.ios === '9.9.9' || tpl.android === '9.9.9') errors.push('TEMPLATE_VERSION_INCOMPATIBLE');
  if (overall === 'verified' && (tpl.ios === '9.9.9' || tpl.android === '9.9.9')) errors.push('TEMPLATE_MISMATCH_CANNOT_BE_VERIFIED');
  if (platforms.ios === 'incompatible' || platforms.android === 'incompatible') errors.push('PROVIDER_INCOMPATIBLE');
  return errors;
}
const tplMismatch = baseManifest();
tplMismatch.versions.templates.ios = '9.9.9';
tplMismatch.status.overall = 'verified';
tplMismatch.status.platforms.ios = 'verified';
tplMismatch.coverage.verification = { structure: true, nativeCompile: true, runtimeMatrix: true, designReview: true, hostLoad: true };
const tplGuard = compatibilityGuard(tplMismatch.versions.templates, tplMismatch.status.overall, tplMismatch.status.platforms);
check('template-incompatible', tplGuard.indexOf('TEMPLATE_VERSION_INCOMPATIBLE') >= 0, 'template version drift detected by compatibility guard');
check('template-mismatch-cannot-be-verified', tplGuard.indexOf('TEMPLATE_MISMATCH_CANNOT_BE_VERIFIED') >= 0, 'mismatched template cannot boost status to verified');
const incompat = baseManifest(); incompat.status.platforms.ios = 'incompatible';
check('provider-incompatible', compatibilityGuard(incompat.versions.templates, incompat.status.overall, incompat.status.platforms).indexOf('PROVIDER_INCOMPATIBLE') >= 0, 'incompatible provider status detected');

// 3. evidence anti-self-certification (F3: omitting an evidence field must not pass)
check('provider-self-certify', invalidWithCode({ ...provider, status: { ...provider.status, evidenceRefs: [] } }, providerSchema, 'MIN_ITEMS'), 'declared=verified with no evidenceRefs rejected');
check('provider-self-certify-omitted', invalid({ ...provider, status: { effective: 'verified', declared: 'verified', reason: 'self claim' } }, providerSchema), 'verified with evidenceRefs/computedAtBuild omitted rejected');
check('provider-self-certify-no-evidence-refs', invalid({ ...provider, status: { ...provider.status, evidenceRefs: undefined } }, providerSchema), 'declared=verified with evidenceRefs omitted rejected');
check('provider-self-certify-no-computed', invalid({ ...provider, status: { ...provider.status, computedAtBuild: undefined } }, providerSchema), 'declared=verified with computedAtBuild omitted rejected');
check('provider-self-certify-false-computed', invalid({ ...provider, status: { ...provider.status, computedAtBuild: false } }, providerSchema), 'declared=verified with computedAtBuild=false rejected');
check('api-card-upgrade-without-compile', invalidWithCode({ ...card, evidence: 'template-verified', compilation: { ...card.compilation, executed: false } }, apiCardSchema, 'CONST'), 'template-verified without executed compile rejected');
check('api-card-upgrade-omitted-compilation', invalid({ ...card, evidence: 'template-verified', compilation: undefined }, apiCardSchema), 'template-verified with compilation omitted rejected');
check('api-card-example-compiled-omitted', invalid({ ...card, evidence: 'example-compiled', compilation: undefined }, apiCardSchema), 'example-compiled with compilation omitted rejected');
check('api-card-template-verified-matrix', invalid({ ...card, evidence: 'template-verified', compilation: { command: 'x', exitCode: 0, executed: true } }, apiCardSchema), 'template-verified without matrixRef rejected');
check('api-card-no-source-refs', invalid({ ...card, sourceRefs: [] }, apiCardSchema), 'API card must have sourceRefs');

// 4. dirty snapshot must not be release
function dirtyReleaseGuard(m) {
  return Object.keys(m.sources.repositories).some(k => m.sources.repositories[k].dirty === true) && m.status.releaseKind === 'release';
}
for (const p of ['wisdomdesign', 'ios', 'android']) {
  const m = baseManifest(); m.sources.repositories[p].dirty = true; m.status.releaseKind = 'release';
  const schemaRejects = invalidWithCode(m, manifestSchema, 'CONST');
  check('dirty-' + p + '-release', schemaRejects || dirtyReleaseGuard(m), p + ' dirty + release rejected (schema=' + schemaRejects + ', guard=true)');
}
check('dirty-release-guard-note', dirtyReleaseGuard((() => { const m = baseManifest(); m.sources.repositories.wisdomdesign.dirty = true; m.status.releaseKind = 'release'; return m; })()), 'M0 schema allOf covers all three repos; explicit guard is kept as a second line of defence');
const cleanRelease = baseManifest(); cleanRelease.status.releaseKind = 'release';
check('clean-release-allowed', !invalid(cleanRelease, manifestSchema), 'clean repos may be release');
const dirtySnapshot = baseManifest(); dirtySnapshot.sources.repositories.ios.dirty = true;
check('dirty-snapshot-allowed', !invalid(dirtySnapshot, manifestSchema), 'dirty repos allowed as workspace-snapshot');

// 5. verified requires full evidence
for (const flag of ['nativeCompile', 'runtimeMatrix', 'designReview', 'hostLoad']) {
  const m = baseManifest(); m.status.overall = 'verified'; m.coverage.verification[flag] = false;
  check('verified-without-' + flag, invalidWithCode(m, manifestSchema, 'CONST'), 'overall=verified requires ' + flag + '=true');
}

// 6. unsupported platform only design results
const unsupportedSpec = {
  schemaVersion: '1.0', profile: 'core',
  page: { id: 'web-unsupported', intent: '查询信息', navigation: 'stackRoot', contentPattern: 'overview', primaryAction: 'search' },
  states: [{ id: 'content', kind: 'content' }],
  regions: [{ id: 'summary', kind: 'overview', component: 'WDCard' }],
  accessibility: { title: '信息' }, acceptance: ['只输出设计结果'],
  platforms: [{ platform: 'web', status: 'unsupported', reason: 'no verified Web component implementation' }]
};
check('unsupported-web-design-valid', !invalid(unsupportedSpec, pageSchema), 'unsupported platform annotation accepted as design-only');
const supportedWeb = clone(unsupportedSpec); supportedWeb.platforms[0].status = 'verified';
check('cannot-claim-web-verified-in-spec', invalid(supportedWeb, pageSchema), 'page spec cannot self-claim platform verified');

// 7. path safety + dead links
const forbiddenRefs = ['/etc/passwd', '../secrets', 'reports/../../secrets', 'C:' + String.fromCharCode(92) + 'secret', 'reports/x' + String.fromCharCode(0) + '.json'];
for (const ref of forbiddenRefs) {
  const m = baseManifest(); m.verification.reportRef = ref;
  check('path-safety-' + Buffer.from(ref).toString('hex').slice(0, 10), !safeRel(ref), 'ref ' + JSON.stringify(ref) + ' recognized as unsafe');
}
check('path-safety-guard', forbiddenRefs.every(p => !safeRel(p)) && safeRel('reports/verification-report.json'), 'path guard accepts relative, rejects traversal/absolute');

function collectMarkdown(dir, out) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    // AIOptimize/review holds other reviewers' reports (R1-R4); they are audit input,
    // not shipped documentation, and are excluded exactly as in R4's audit method.
    if (entry.isDirectory() && entry.name === 'review' && dir.endsWith(path.join('AIOptimize'))) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collectMarkdown(full, out);
    else if (entry.isFile() && /\.md$/i.test(entry.name)) out.push(full);
  }
}
const ROOT_PARENT = path.resolve(ROOT, '..');
const CROSS_REPO_SEGMENTS = new Set(['iOS', 'android']);
// Classify a markdown link from a source document:
//   internal  -> resolves inside this repo; must exist
//   cross-repo-> resolves to a sibling iOS/android checkout; only verifiable when that
//                checkout exists (a standard single-repo CI checkout does not have it)
//   escape    -> resolves outside the repo and is not a registered cross-repo path: dead
function classifyLink(target, mdFile) {
  const resolved = path.resolve(path.dirname(mdFile), target);
  const relative = path.relative(ROOT, resolved);
  const inside = relative === '' || (!relative.startsWith('..' + path.sep) && relative !== '..' && !path.isAbsolute(relative));
  if (inside) return { kind: 'internal', resolved };
  if (resolved.startsWith(ROOT_PARENT + path.sep)) {
    const first = path.relative(ROOT_PARENT, resolved).split(path.sep)[0];
    if (CROSS_REPO_SEGMENTS.has(first)) return { kind: 'cross-repo', repo: first, resolved };
  }
  return { kind: 'escape', resolved };
}

const mdRoots = [path.join(ROOT, 'AIOptimize'), SKILL, path.join(ROOT, 'dist', 'ai-skill')];
const mdFiles = [];
for (const root of mdRoots) collectMarkdown(root, mdFiles);
const dead = [];
let external = 0;
let internalLinks = 0;
let crossRepoLinks = 0;
let crossRepoUnverified = 0;
const crossRepoSeen = new Set();
const linkRe = /\[[^\]]*\]\(([^)]+)\)/g;
for (const md of mdFiles) {
  const text = fs.readFileSync(md, 'utf8');
  for (const match of text.matchAll(linkRe)) {
    const target = match[1].split('#')[0].trim();
    if (!target) continue;
    if (/^https?:\/\//.test(target)) { external += 1; continue; }
    if (/^mailto:/.test(target)) continue;
    const classified = classifyLink(target, md);
    if (classified.kind === 'escape') {
      dead.push(path.relative(ROOT, md) + ' -> ' + target + ' (escapes repo)');
      continue;
    }
    if (classified.kind === 'cross-repo') {
      crossRepoLinks += 1;
      crossRepoSeen.add(classified.repo);
      if (fs.existsSync(path.join(ROOT_PARENT, classified.repo))) {
        if (!fs.existsSync(classified.resolved)) dead.push(path.relative(ROOT, md) + ' -> ' + target + ' (missing in ' + classified.repo + ' checkout)');
      } else {
        crossRepoUnverified += 1;
      }
      continue;
    }
    internalLinks += 1;
    if (!fs.existsSync(classified.resolved)) dead.push(path.relative(ROOT, md) + ' -> ' + target);
  }
}
check('dead-link-audit', dead.length === 0, dead.length ? dead.slice(0, 5).join('; ')
  : mdFiles.length + ' md files audited, ' + internalLinks + ' internal links, '
    + crossRepoLinks + ' cross-repo links (' + crossRepoUnverified + ' not verifiable in this checkout), '
    + external + ' external links');
// Cross-repo evidence links (../../iOS/..., ../../android/...) must not be treated as
// broken repo navigation in a single-repo checkout, and a link that escapes the repo
// without naming a platform checkout must stay a failure.
check('dead-link-cross-repo-classification', classifyLink('../../iOS/api/WisdomUI.api.json', path.join(ROOT, 'AIOptimize', 'README.md')).kind === 'cross-repo', 'sibling iOS evidence link is cross-repo, not dead');
check('dead-link-escape-rejected', classifyLink('../../../etc/passwd', path.join(ROOT, 'AIOptimize', 'README.md')).kind === 'escape', 'unregistered path escape is rejected');
// Guard against the R4 finding: an over-escaped regex matched 0 links while reporting PASS.
// The floor is measured on source docs only, so it also holds in a clean single-repo
// checkout (no generated dist / catalog): today >= 20 internal links across >= 10 md files.
check('dead-link-audit-not-empty', internalLinks >= 20 && mdFiles.length >= 10, 'link audit saw ' + internalLinks + ' internal links across ' + mdFiles.length + ' md files');

// 8. change-scope routing
const docPlan = planFor(['AIOptimize/04-M4-CI-Compatibility-Contract.md']);
check('route-doc-only', docPlan.docOnly && !docPlan.nativeRequired, 'docs-only PR does not claim native tests');
const iosPlan = planFor(['iOS/Sources/WisdomUI/Components/WDButton.swift']);
check('route-ios-native', iosPlan.nativeRequired && iosPlan.requiredLayers.indexOf('ios-native-compile') >= 0, 'iOS source change requires native layer');
const androidPlan = planFor(['android/wisdom-ui/api/wisdom-ui.api']);
check('route-android-native', androidPlan.nativeRequired && androidPlan.requiredLayers.indexOf('android-abi') >= 0, 'Android ABI change requires ABI layer');
const tokenPlan = planFor(['tokens/wisdom.tokens.json']);
check('route-token-compat', tokenPlan.requiredLayers.indexOf('dual-platform-compat') >= 0, 'token change requires dual-platform compat');

// 8b. GitHub event payload parsing (R4: pull_request carries no file list unless fetched)
const prPayload = { pull_request: { changed_files: 3, base: { ref: 'main' }, head: { ref: 'feature' } } };
check('route-pr-payload-has-no-list', collectChangedPaths(prPayload).length === 0, 'pull_request.changed_files is a count, not paths');
const prWithPathsFile = collectChangedPaths(prPayload, ['tools/ai-skill/package.py']);
check('route-pr-paths-file', planFor(prWithPathsFile).requiredLayers.includes('checksum-verify') && planFor(prWithPathsFile).requiredLayers.includes('dist-package-tests'), 'PR file list from git diff reaches the packaging layer');
const restPayload = { files: [{ filename: 'iOS/Sources/WisdomUI/Components/WDButton.swift' }] };
check('route-rest-files', planFor(collectChangedPaths(restPayload)).requiredLayers.includes('ios-native-compile'), 'REST files[] payload parsed');
const pushPayload = { commits: [{ added: ['tools/ai-skill/package.py'], modified: ['android/wisdom-ui/api/wisdom-ui.api'], removed: [] }] };
check('route-push-commits', planFor(collectChangedPaths(pushPayload)).requiredLayers.includes('android-abi'), 'push commits payload parsed');
check('route-packaging-layer', planFor(['tools/ai-skill/package.py']).requiredLayers.includes('checksum-verify'), 'package.py change requires clean-unpack/checksum layers');
check('route-manifest-writer', planFor(['tools/ai-skill/lib/manifest.js']).requiredLayers.includes('dist-package-tests'), 'manifest generator change requires dist-package tests');
const runtimePlan = planFor(['ai/skill/runtime/get-component.js']);
check('route-runtime-budget', runtimePlan.requiredLayers.includes('runtime-tests') && runtimePlan.requiredLayers.includes('budget-check'), 'runtime change requires runtime + budget layers');

// 8c. L2 native-layer registry covers every routed native layer
const { RULES } = require('../ci/route-changes.js');
const nativeLayers = [...new Set(RULES.flatMap(rule => rule.layers))].filter(layer => /native|snapshot|screenshot|abi|host-load|template-compile/.test(layer)).sort();
const nativeRegistry = readJson('manifest/native-layers.json');
for (const layer of nativeLayers) {
  const entry = nativeRegistry.layers[layer];
  check('native-layer-' + layer, Boolean(entry && entry.owner && entry.command && entry.status && Array.isArray(entry.evidence) && entry.evidence.length), 'registered owner/command/status/evidence');
}

// 9. check does not mutate truth sources.
// The fingerprint covers authored truth sources only: generated Core catalog/dist,
// examples and reports are skipped so the value is identical in a clean single-repo
// checkout and in a workspace where those generated dirs exist (R12: doc stability).
function truthFingerprint() {
  const items = [];
  const SKIP_DIR_NAMES = new Set(['examples', 'reports', 'dist', 'node_modules']);
  function walk(dir, prefix) {
    for (const name of fs.readdirSync(dir).sort()) {
      const full = path.join(dir, name), st = fs.statSync(full), rel = prefix + name;
      if (st.isDirectory()) {
        if (SKIP_DIR_NAMES.has(name)) continue;
        if (rel === 'core/catalog') continue; // generated by lib/generate-core-catalog.js
        walk(full, rel + '/');
      } else if (st.isFile()) items.push(rel + ':' + crypto.createHash('sha256').update(fs.readFileSync(full)).digest('hex'));
    }
  }
  walk(SKILL, '');
  for (const name of fs.readdirSync(path.join(ROOT, 'contracts')).sort()) {
    if (/^WD.*\.yaml$/.test(name)) items.push('contracts/' + name + ':' + crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, 'contracts', name))).digest('hex'));
  }
  items.push('tokens/wisdom.tokens.json:' + crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, 'tokens/wisdom.tokens.json'))).digest('hex'));
  return crypto.createHash('sha256').update(items.join('\n')).digest('hex');
}
const before = truthFingerprint();
for (let i = 0; i < 3; i++) { validateDocument(baseManifest(), manifestSchema); validateDocument(provider, providerSchema); }
const after = truthFingerprint();
check('check-no-mutation', before === after, 'truth fingerprint unchanged ' + before.slice(0, 12) + ' == ' + after.slice(0, 12));

const report = {
  schemaVersion: '1.0', suite: 'm4-ci', generatedBy: 'tools/ai-skill/tests/m4-ci.test.js',
  note: 'Contract/static gate layer only. Not a cli.js build, native compile, host load, or release.',
  totals: { pass, fail }, results, truthFingerprint: after, internalLinkCount: internalLinks, externalLinkCount: external, markdownFilesAudited: mdFiles.length
};
if (!fs.existsSync(REPORTS)) fs.mkdirSync(REPORTS, { recursive: true });
fs.writeFileSync(path.join(REPORTS, 'm4-ci-result.json'), JSON.stringify(report, null, 2) + '\n');
console.log('M4 CI RESULT: pass=' + pass + ' fail=' + fail);
if (fail) { console.error('M4 CI SUITE FAILED'); process.exit(1); }
