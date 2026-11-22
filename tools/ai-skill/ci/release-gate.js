#!/usr/bin/env node
'use strict';
// L3 release gate. Runs only on an explicit workflow_dispatch release approval and
// validates a freshly built dist tree as a release candidate:
//   - the built package set (Core alone, or Core + selected platforms) is covered by
//     checksums.json exactly once; extra/missing packages fail the gate
//   - every package manifest is schema-valid and its refs resolve inside the package
//   - zip / manifest / files.json hashes match checksums.json
//   - dirty sources cannot be published as release
//   - verified status cannot be claimed without the four verification flags
// It never publishes, tags or commits: approval stays outside CI.
//
// Usage: node tools/ai-skill/ci/release-gate.js [--dist <dir>] [--platforms core,ios,android] [--json]
// Exit codes: 0 candidate valid; 1 gate failure; 2 usage/IO.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { validateDocument } = require('../lib/schema-lite.js');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const ALL_PACKAGES = ['core', 'ios', 'android', 'all'];
const FLAGS = ['nativeCompile', 'runtimeMatrix', 'designReview', 'hostLoad'];

function opt(name, fallback) {
  const index = process.argv.indexOf('--' + name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}
function readJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function sha256File(file) { return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'); }
function walk(dir, prefix = '') {
  const files = [];
  for (const entry of fs.readdirSync(path.join(dir, prefix), { withFileTypes: true })) {
    const relative = prefix ? prefix + '/' + entry.name : entry.name;
    if (entry.isDirectory()) files.push(...walk(dir, relative));
    else if (entry.isFile()) files.push(relative);
  }
  return files;
}

function main() {
  const dist = path.resolve(opt('dist', path.join(ROOT, 'dist', 'ai-skill', 'v1.0.0')));
  const asJson = process.argv.includes('--json');
  if (!fs.existsSync(dist)) {
    console.error('release dist missing: ' + dist);
    process.exit(2);
  }
  const schema = readJson(path.join(ROOT, 'ai/skill/manifest/manifest.schema.json'));
  const checksumsFile = path.join(dist, 'checksums.json');
  if (!fs.existsSync(checksumsFile)) {
    console.error('release checksums.json missing; abort');
    process.exit(1);
  }
  const checksums = readJson(checksumsFile);
  const problems = [];
  const evidence = [];
  const fail = (message) => problems.push(message);

  const declared = Object.keys(checksums.packages || {}).map(name => name.replace('wisdom-page-', '')).sort();
  const present = fs.readdirSync(dist)
    .filter(name => /^wisdom-page-/.test(name) && fs.statSync(path.join(dist, name)).isDirectory())
    .map(name => name.replace('wisdom-page-', ''))
    .sort();
  if (JSON.stringify(declared) !== JSON.stringify(present)) fail('checksums.json packages ' + JSON.stringify(declared) + ' != directories ' + JSON.stringify(present));
  const explicit = opt('platforms', '');
  if (explicit) {
    const requested = explicit.split(',').map(item => item.trim()).filter(Boolean);
    const expected = ['core', ...requested.filter(item => item !== 'core')];
    if (expected.includes('ios') && expected.includes('android')) expected.push('all');
    if (JSON.stringify(expected.slice().sort()) !== JSON.stringify(present)) fail('expected package set ' + expected.join(',') + ' but dist has ' + present.join(','));
  }
  if (!present.includes('core')) fail('core package is mandatory');
  for (const name of present.filter(item => ALL_PACKAGES.includes(item))) {
    const pkg = path.join(dist, 'wisdom-page-' + name);
    const manifestPath = path.join(pkg, 'manifest.json');
    if (!fs.existsSync(manifestPath)) { fail('missing manifest for ' + name); continue; }
    const manifest = readJson(manifestPath);
    const errors = validateDocument(manifest, schema);
    if (errors.length) { fail(name + ': manifest invalid (' + JSON.stringify(errors.slice(0, 5)) + ')'); continue; }
    const actual = walk(pkg).length;
    if (actual !== manifest.contents.fileCount) fail(name + ': contents.fileCount ' + manifest.contents.fileCount + ' != ' + actual);
    for (const ref of [manifest.verification.reportRef, manifest.verification.checksumsRef]) {
      if (!fs.existsSync(path.join(pkg, ref))) fail(name + ': verification ref missing inside package: ' + ref);
    }
    const dirty = Object.entries(manifest.sources.repositories).filter(([, state]) => state.dirty).map(([key]) => key);
    if (manifest.status.releaseKind === 'release' && dirty.length) fail(name + ': dirty repositories cannot be release: ' + dirty.join(','));
    if (manifest.status.overall === 'verified') {
      for (const flag of FLAGS) if (!manifest.coverage.verification[flag]) fail(name + ': verified requires ' + flag);
    }
    const missingFlags = FLAGS.filter(flag => !manifest.coverage.verification[flag]);
    if (missingFlags.length && manifest.verification.unverified.length === 0) fail(name + ': unverified list must not be empty when flags are false (' + missingFlags.join(',') + ')');
    const entry = (checksums.packages || {})[manifest.package];
    if (!entry) { fail(name + ': not covered by checksums.json'); continue; }
    const zipPath = path.join(dist, entry.zipPath);
    if (!fs.existsSync(zipPath)) { fail(name + ': zip missing ' + entry.zipPath); continue; }
    if (sha256File(zipPath) !== entry.zipSha256) fail(name + ': zip sha mismatch');
    if (sha256File(manifestPath) !== entry.manifestSha256) fail(name + ': manifest self-hash mismatch');
    if (sha256File(path.join(pkg, 'files.json')) !== entry.filesIndexSha256) fail(name + ': files.json hash mismatch');
    evidence.push({ package: manifest.package, fileCount: manifest.contents.fileCount, releaseKind: manifest.status.releaseKind, overall: manifest.status.overall, dirtyRepositories: dirty });
  }

  const report = { schemaVersion: '1.0', generatedBy: 'tools/ai-skill/ci/release-gate.js', dist: path.relative(ROOT, dist), approved: problems.length === 0, packages: evidence, problems };
  if (asJson) console.log(JSON.stringify(report, null, 2));
  else {
    for (const item of evidence) console.log('PACKAGE ' + item.package + ' :: ' + item.fileCount + ' files, ' + item.releaseKind + '/' + item.overall + ', dirty=' + (item.dirtyRepositories.join(',') || 'none'));
    if (problems.length) console.error('RELEASE GATE FAILED:\n  ' + problems.join('\n  '));
    else console.log('release gate candidate validated (upload/approval still required outside CI)');
  }
  if (problems.length) process.exit(1);
}

try { main(); }
catch (error) { console.error('release-gate failed: ' + error.message); process.exit(2); }
