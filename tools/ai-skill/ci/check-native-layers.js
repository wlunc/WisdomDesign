#!/usr/bin/env node
'use strict';
// L2 native-layer declaration checker.
//
// The wisdomdesign repo never runs xcodebuild / gradle. Its L2 job only verifies that
// every native / UI layer required by the change-scope plan is registered with an
// owner, a real command, a real status and a resolvable evidence reference, and that
// no layer is silently turned into a pass. Platform repos own the execution.
//
// Usage:
//   node tools/ai-skill/ci/check-native-layers.js --plan <m4-change-plan.json>
//     [--registry ai/skill/manifest/native-layers.json] [--json]
//     [--ios-root <dir>] [--android-root <dir>] [--strict-evidence]
//
// Platform checkouts are optional: without them L2 verifies only the declaration
// (owner/command/status/evidence shape) and prints that evidence is external-owned.
// With --strict-evidence (or the root flags pointing at real checkouts) the evidence
// JSON pointers must resolve. The wisdomdesign repo never runs the native commands.
//
// Exit codes: 0 registered and consistent; 1 unregistered/inconsistent evidence; 2 usage/IO.
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..', '..'); // wisdomdesign/
const DEFAULT_REGISTRY = path.join(ROOT, 'ai/skill/manifest/native-layers.json');
const NATIVE_LAYER = /native|snapshot|screenshot|abi|host-load|template-compile/;

function usage(message) {
  if (message) console.error('error: ' + message);
  console.error('usage: node tools/ai-skill/ci/check-native-layers.js --plan <plan.json> [--registry <file>] [--ios-root <dir>] [--android-root <dir>] [--strict-evidence]');
  process.exit(2);
}
function opt(argv, name, fallback) {
  const index = argv.indexOf('--' + name);
  if (index >= 0 && argv[index + 1]) return argv[index + 1];
  return fallback;
}
function resolveAnchor(document, anchor) {
  if (!anchor) return { ok: true };
  if (!anchor.startsWith('/')) return { ok: false, reason: 'anchor must start with /' };
  let node = document;
  for (const rawPart of anchor.slice(1).split('/')) {
    const part = rawPart.replace(/~1/g, '/').replace(/~0/g, '~');
    if (node === null || typeof node !== 'object' || !(part in node)) return { ok: false, reason: 'anchor ' + anchor + ' not found' };
    node = node[part];
  }
  return { ok: true };
}
const REPO_ROOT_ENV = { iOS: 'WISDOMDESIGN_IOS_ROOT', android: 'WISDOMDESIGN_ANDROID_ROOT' };

function repoRoot(repo, roots = {}) {
  if (repo === 'wisdomdesign') return ROOT;
  const explicit = roots[repo] || process.env[REPO_ROOT_ENV[repo]];
  if (explicit) return path.resolve(explicit);
  return path.join(path.resolve(ROOT, '..'), repo);
}
function checkEvidence(entry, strict, roots) {
  const errors = [];
  const notes = [];
  if (!Array.isArray(entry.evidence) || entry.evidence.length === 0) {
    errors.push('missing evidence reference');
    return { errors, notes };
  }
  for (const evidence of entry.evidence) {
    if (!evidence || typeof evidence.repo !== 'string' || typeof evidence.path !== 'string') {
      errors.push('malformed evidence entry');
      continue;
    }
    const root = repoRoot(evidence.repo, roots);
    const repoPresent = fs.existsSync(root);
    if (!repoPresent) {
      notes.push(evidence.repo + ': repository not present in this checkout (external-owned, evidence not verifiable here)');
      if (strict) errors.push(evidence.repo + ': strict mode requires the ' + evidence.repo + ' checkout to verify ' + evidence.path);
      continue;
    }
    const file = path.join(root, evidence.path);
    if (!fs.existsSync(file)) {
      errors.push(evidence.repo + ': evidence file missing: ' + evidence.path);
      continue;
    }
    if (evidence.kind === 'document') continue;
    if (evidence.kind !== 'json') {
      errors.push(evidence.repo + ': unsupported evidence kind ' + evidence.kind);
      continue;
    }
    const document = JSON.parse(fs.readFileSync(file, 'utf8'));
    const resolved = resolveAnchor(document, evidence.anchor);
    if (!resolved.ok) errors.push(evidence.repo + ': ' + resolved.reason);
    else notes.push(evidence.repo + ': evidence OK ' + evidence.path + (evidence.anchor || ''));
  }
  return { errors, notes };
}
function main() {
  const argv = process.argv.slice(2);
  if (argv.includes('--help')) usage();
  const planPath = opt(argv, 'plan', '');
  if (!planPath) usage('--plan is required');
  const registryPath = path.resolve(opt(argv, 'registry', DEFAULT_REGISTRY));
  const strict = argv.includes('--strict-evidence');
  const roots = { iOS: opt(argv, 'ios-root', ''), android: opt(argv, 'android-root', '') };
  if (!fs.existsSync(planPath)) usage('plan not found: ' + planPath);
  if (!fs.existsSync(registryPath)) usage('registry not found: ' + registryPath);
  const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
  const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
  const layers = JSON.parse(JSON.stringify(registry.layers || {}));
  const required = (plan.requiredLayers || []).filter(layer => NATIVE_LAYER.test(layer));
  if (required.length === 0) {
    console.log('L2: no native layer required by this change scope; nothing to declare (native pass is still not claimed)');
    return;
  }
  let failed = 0;
  for (const layer of required) {
    const entry = layers[layer];
    if (!entry) {
      failed += 1;
      console.error('FAIL ' + layer + ': required native layer is not registered in ' + path.relative(ROOT, registryPath));
      continue;
    }
    const problems = [];
    if (!entry.owner) problems.push('missing owner');
    if (!entry.command) problems.push('missing command');
    if (!entry.status || !['passed', 'blocked', 'not-run', 'failed'].includes(entry.status)) problems.push('status must be passed|blocked|not-run|failed');
    if (entry.status === 'passed' && !entry.statusNote) problems.push('passed requires a status note');
    const evidence = checkEvidence(entry, strict, roots);
    problems.push(...evidence.errors);
    if (problems.length) {
      failed += 1;
      console.error('FAIL ' + layer + ': ' + problems.join('; '));
      continue;
    }
    console.log('OK ' + layer + ': owner=' + entry.owner + ' status=' + entry.status + ' (declared, not executed here)');
    for (const note of evidence.notes) console.log('    ' + note);
  }
  if (failed) {
    console.error('L2 native-layer declaration FAILED: ' + failed + ' issue(s)');
    process.exit(1);
  }
  console.log('L2 native-layer declaration OK: ' + required.length + ' layer(s) registered; no native pass claimed by this repo');
}
try { main(); }
catch (error) { console.error('check-native-layers failed: ' + error.message); process.exit(2); }
