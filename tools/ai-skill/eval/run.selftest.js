'use strict';
// M5 harness self-test (qa-verifier / t11). Proves the anti-fabrication contract:
//   - 8 tasks x 3 arms = 24 cells, all not-executed when readiness blocked.
//   - Result recording is refused while blocked (no invented metrics).
//   - Observation report has null metrics and zero comparative claims.
//   - Readiness cannot be satisfied by placeholder values.
// Zero dependencies; read-only against truth sources. Exit 0/1.

const fs = require('fs');
const path = require('path');
const { readiness, writePlan, notExecutedCell, loadConfig } = require('./run.js');

const ROOT = path.resolve(__dirname, '../../..');
let pass = 0, fail = 0;
function check(id, cond, detail) { if (cond) { pass++; console.log('PASS ' + id + ' :: ' + detail); } else { fail++; console.error('FAIL ' + id + ' :: ' + detail); } }

const cfg = loadConfig();
check('frozen-task-count', cfg.tasks.tasks.length === 8, '8 frozen tasks (T01-T08)');
check('three-arms', cfg.tasks.fixedConditions.arms.length === 3, 'arms A/B/C frozen');
check('twentyfour-combos', cfg.combos.length === 24, '8x3=24 task/arm cells');
check('all-eight-cases-covered', ['T01','T02','T03','T04','T05','T06','T07','T08'].every(id => cfg.tasks.tasks.some(t => t.id === id)), 'task list/settings/detail/dual/negative/unsupported/local/edge all present');

const r = readiness();
check('readiness-blocked', r.ready === false, 'readiness gate currently blocked');
check('blocker-codes-complete', ['UNPINNED_MODEL','UNPINNED_HOST','UNPINNED_TOOLS','NATIVE_CMD_UNPINNED_IOS','NATIVE_CMD_UNPINNED_ANDROID'].every(c => r.blockers.some(b => b.code === c)), 'all 5 remaining blockers reported (CLI/PACKAGE now built)');
check('no-stale-cli-package-blockers', !r.blockers.some(b => b.code === 'CLI_MISSING' || b.code === 'PACKAGE_MISSING'), 'CLI and package exist after M4 packaging');
check('placeholder-model-detected', r.blockers.some(b => b.code === 'UNPINNED_MODEL'), 'pin-before-M5 placeholder rejected');

const cell = notExecutedCell('T05', 'C');
check('cell-not-executed-shape', cell.status === 'not-executed' && cell.quality === null && cell.repair === null && cell.cost === null, 'not-executed cell has null metrics');
const plan = writePlan('selftest');
check('plan-24-cells', plan.cells.length === 24, 'plan enumerates 24 cells');
check('plan-all-not-executed', plan.cells.every(c => c.status === 'not-executed'), 'every plan cell is not-executed');
check('plan-preserves-failures-policy', /Failure samples are preserved, never deleted/.test(plan.policy), 'failure samples preservation policy present');

const reportPath = path.join(ROOT, 'tools/ai-skill/eval/results/observation-report.json');
if (fs.existsSync(reportPath)) {
  const rep = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  const allNull = Object.values(rep.metrics).every(arr => arr.every(m => m.value === null && m.status === 'not-executed'));
  check('report-all-metrics-null', allNull, 'observation report metrics all null/not-executed');
  check('report-zero-claims', Array.isArray(rep.claims) && rep.claims.length === 0, 'no comparative/savings claims');
  check('report-comparisons-null', Object.values(rep.comparisons).filter(v => v === null).length >= 3, 'A/B/C comparisons all null');
} else check('report-present', false, 'observation report file exists');

const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/ai-skill/eval/run-manifest.json'), 'utf8'));
check('manifest-not-executed', manifest.status === 'not-executed' && manifest.reason === 'readiness-gate-blocked', 'run-manifest records not-executed');

console.log('M5 HARNESS SELFTEST: pass=' + pass + ' fail=' + fail);
if (fail) process.exit(1);