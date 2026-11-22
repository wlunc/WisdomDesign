'use strict';
// M5 three-arm controlled evaluation harness (qa-verifier / t11).
// Zero runtime dependencies. Enforces the M0 frozen protocol:
//   - 8 frozen tasks x 3 arms = 24 runs, identical fixed conditions.
//   - Readiness gate: without a pinned model/host/tools and a built Skill
//     package, NO run may claim results; every cell stays "not-executed".
//   - This script NEVER invents tokens, compile results, diffs or design scores.
//     It only records values supplied by real adapters (--results <json>) and
//     preserves failure samples.
//
// Usage:
//   node tools/ai-skill/eval/run.js --check-readiness
//   node tools/ai-skill/eval/run.js --dry-run            # plan only, no execution
//   node tools/ai-skill/eval/run.js --results <file.json> --run-id <id>
//   node tools/ai-skill/eval/run.js --report             # observation report
//
// Exit codes: 0 = ok/complete, 2 = prerequisites not satisfied (no fabrication),
//             1 = an actual evaluation error, 3 = invalid input.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '../../..'); // wisdomdesign/
const TASKS = path.join(ROOT, 'ai/skill/evaluation/tasks.json');
const MATRIX = path.join(ROOT, 'ai/skill/evaluation/golden-matrix.json');
const OUT = path.join(__dirname, 'results');
const RUN_MANIFEST = path.join(__dirname, 'run-manifest.json');

const argv = process.argv.slice(2);
function opt(name, fallback) {
  const i = argv.indexOf('--' + name);
  if (i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--')) return argv[i + 1];
  return fallback;
}
function flag(name) { return argv.indexOf('--' + name) >= 0; }
function readJson(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }
function sha256(p) { return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'); }
function notExecutedCell(taskId, arm) {
  return { taskId, arm, status: 'not-executed', quality: null, repair: null, cost: null, artifacts: null, reason: 'prerequisites-not-satisfied' };
}

function loadConfig() {
  const tasks = readJson(TASKS);
  return { tasks, combos: tasks.tasks.flatMap(t => tasks.fixedConditions.arms.map(a => ({ task: t.id, taskName: t.name, arm: a.id, armName: a.name }))) };
}

// Readiness: real evaluation may only start when every pinned field is concrete
// (not a placeholder) AND the Skill package / CLI exist.
function readiness() {
  const { tasks } = loadConfig();
  const p = tasks.fixedConditions.parameters;
  const blockers = [];
  const placeholder = /^(pin-before-M5|generic|TODO|TBD|placeholder)/i;
  for (const key of ['model', 'host', 'tools']) {
    const v = String(p[key] || '');
    if (!v || placeholder.test(v)) blockers.push({ code: 'UNPINNED_' + key.toUpperCase(), detail: 'fixedConditions.parameters.' + key + ' = ' + JSON.stringify(v) });
  }
  const cli = path.join(ROOT, 'tools/ai-skill/cli.js');
  const pkg = path.join(ROOT, 'dist/ai-skill');
  if (!fs.existsSync(cli)) blockers.push({ code: 'CLI_MISSING', detail: 'tools/ai-skill/cli.js not found (core-dev M1/M4-package)' });
  if (!fs.existsSync(pkg)) blockers.push({ code: 'PACKAGE_MISSING', detail: 'dist/ai-skill generated bundle not found (core-dev M4-package)' });
  // Native evidence responsibilities (M2/M3) must be reportable; check for at least a pin in golden matrix.
  const matrix = readJson(MATRIX);
  for (const plat of ['ios', 'android']) {
    const unresolved = (matrix.platforms[plat].verificationCommands || []).filter(c => c.requiresPinning);
    if (unresolved.length) blockers.push({ code: 'NATIVE_CMD_UNPINNED_' + plat.toUpperCase(), detail: unresolved.map(c => c.id).join(',') + ' requiresPinning' });
  }
  const ready = blockers.length === 0;
  return {
    schemaVersion: '1.0', ready, blockers,
    fixedConditions: {
      tasks: tasks.tasks.length, arms: tasks.fixedConditions.arms.length,
      combos: tasks.tasks.length * tasks.fixedConditions.arms.length,
      parameters: p
    },
    evaluatedAt: new Date().toISOString(),
    note: 'Readiness gate protects the protocol: without pinned model/host/tools and a built package, all 24 cells must stay not-executed.'
  };
}

function writeRunManifest(runId) {
  const { tasks } = loadConfig();
  const r = readiness();
  const manifest = {
    schemaVersion: '1.0',
    runId: runId || 'not-executed',
    status: r.ready ? 'ready' : 'not-executed',
    reason: r.ready ? null : 'readiness-gate-blocked',
    model: tasks.fixedConditions.parameters.model,
    host: tasks.fixedConditions.parameters.host,
    tools: tasks.fixedConditions.parameters.tools,
    parameters: tasks.fixedConditions.parameters,
    tasks: tasks.tasks.map(t => ({ id: t.id, name: t.name, inputs: t.inputs, focus: t.focus, expectedEvidence: t.expectedEvidence })),
    arms: tasks.fixedConditions.arms,
    blockers: r.blockers,
    inputHashes: { tasks: sha256(TASKS), goldenMatrix: sha256(MATRIX) },
    createdAt: new Date().toISOString(),
    note: 'When status=not-executed, every metric remains null and no results may be attached. Real runs require updating fixedConditions with pinned values.'
  };
  fs.writeFileSync(RUN_MANIFEST, JSON.stringify(manifest, null, 2) + String.fromCharCode(10));
  return manifest;
}

function writePlan(runId) {
  const { combos } = loadConfig();
  const r = readiness();
  const plan = {
    schemaVersion: '1.0',
    runId: runId || 'dry-run',
    generatedAt: new Date().toISOString(),
    ready: r.ready,
    blockers: r.blockers,
    cells: combos.map(c => Object.assign(notExecutedCell(c.task, c.arm), { taskName: c.taskName, armName: c.armName })),
    policy: 'No cell may be filled unless readiness.ready=true and a real adapter supplies measurements. Failure samples are preserved, never deleted.'
  };
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
  const p = path.join(OUT, (runId || 'dry-run') + '.plan.json');
  fs.writeFileSync(p, JSON.stringify(plan, null, 2) + String.fromCharCode(10));
  return plan;
}

// Accept real results only when readiness passes. Never compute/fabricate metrics.
function recordResults(file, runId) {
  const r = readiness();
  if (!r.ready) {
    console.error('REFUSING to record results: readiness gate blocked (' + r.blockers.map(b => b.code).join(',') + ')');
    process.exit(2);
  }
  const provided = readJson(file);
  if (!Array.isArray(provided.cells)) { console.error('invalid results file: cells[] required'); process.exit(3); }
  const { combos } = loadConfig();
  const expected = combos.map(c => c.task + ':' + c.arm).sort();
  const got = provided.cells.map(c => c.taskId + ':' + c.arm).sort();
  if (JSON.stringify(expected) !== JSON.stringify(got)) { console.error('results must cover exactly 24 task:arm cells'); process.exit(3); }
  const out = Object.assign({ schemaVersion: '1.0', runId: runId || 'recorded', recordedAt: new Date().toISOString() }, provided);
  const p = path.join(OUT, (runId || 'recorded') + '.results.json');
  fs.writeFileSync(p, JSON.stringify(out, null, 2) + String.fromCharCode(10));
  console.log('Recorded ' + got.length + ' cells to ' + path.relative(ROOT, p));
  return out;
}

function observationReport() {
  const r = readiness();
  const { tasks } = loadConfig();
  const report = {
    schemaVersion: '1.0',
    suite: 'm5-evaluation',
    generatedAt: new Date().toISOString(),
    status: r.ready ? 'ready-for-real-runs' : 'observation-only',
    readiness: r,
    frozenTasks: tasks.tasks.map(t => ({ id: t.id, name: t.name, platforms: (t.inputs && t.inputs.platforms) || [] })),
    arms: tasks.fixedConditions.arms.map(a => ({ id: a.id, name: a.name })),
    metrics: {
      quality: tasks.metrics.quality.map(m => ({ metric: m, value: null, status: 'not-executed' })),
      repair: tasks.metrics.repair.map(m => ({ metric: m, value: null, status: 'not-executed' })),
      cost: tasks.metrics.cost.map(m => ({ metric: m, value: null, status: 'not-executed' }))
    },
    comparisons: { A_vs_B: null, B_vs_C: null, A_vs_C: null, status: 'not-executed' },
    claims: [],
    policy: '样本不足只报告观察值，不承诺固定节省比例；真实结果需 readiness.ready=true 后由真实 adapter 提供。'
  };
  const p = path.join(OUT, 'observation-report.json');
  fs.writeFileSync(p, JSON.stringify(report, null, 2) + String.fromCharCode(10));
  console.log(JSON.stringify(report, null, 2));
  return report;
}

function main() {
  if (flag('check-readiness')) {
    const r = readiness();
    console.log(JSON.stringify(r, null, 2));
    process.exit(r.ready ? 0 : 2);
  }
  const runId = opt('run-id', '');
  writeRunManifest(runId);
  if (flag('dry-run')) {
    const plan = writePlan(runId || 'dry-run');
    console.log('Plan: ' + plan.cells.length + ' cells, ready=' + plan.ready + ', blockers=' + plan.blockers.length);
    process.exit(plan.ready ? 0 : 2);
  }
  if (flag('results')) {
    recordResults(opt('results', ''), runId);
    return;
  }
  if (flag('report')) { observationReport(); return; }
  console.error('Usage: run.js --check-readiness | --dry-run | --results <file> | --report [--run-id id]');
  process.exit(3);
}

if (require.main === module) main();
module.exports = { readiness, writeRunManifest, writePlan, notExecutedCell, loadConfig };
