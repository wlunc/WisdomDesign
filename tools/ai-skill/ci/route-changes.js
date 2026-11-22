'use strict';
// M4 CI change-scope router. Reads a GitHub Actions event payload (plus an optional
// explicit changed-file list) and emits a machine-readable plan of which gate layers
// must run. Read-only: never writes design truth sources or platform repos.
//
// Usage:
//   node tools/ai-skill/ci/route-changes.js [--event <payload.json>] [--paths-file <list.txt>]
//     [--require-paths] [--out <plan.json>]
//
// Why --paths-file: the GitHub pull_request webhook does not carry a file list
// (pull_request.changed_files is a number). The workflow therefore computes
// `git diff --name-only origin/<base>...HEAD` and passes it here; without it a PR
// plan would silently degrade to the baseline layer. --require-paths turns an empty
// PR file list into a hard error instead of a misleading baseline pass.

const fs = require('fs');

const RULES = [
  {
    id: 'tokens-contracts-specs',
    pattern: /(^|\/)(tokens\/|contracts\/|docs\/specs\/)/,
    layers: ['core-full', 'dual-platform-compat', 'affected-templates'],
    reason: 'Token / contract / spec truth sources changed'
  },
  {
    id: 'ios-platform',
    pattern: /(^|\/)(iOS\/ai\/skill-provider\/|iOS\/Sources\/|iOS\/Tests\/|iOS\/Scripts\/)/i,
    layers: ['ios-native-compile', 'ios-snapshot-ui'],
    reason: 'iOS Provider / API / template / native source changed'
  },
  {
    id: 'android-platform',
    pattern: /(^|\/)(android\/ai\/skill-provider\/|android\/wisdom-ui\/|android\/tools\/|android\/build\.gradle)/i,
    layers: ['android-native-compile', 'android-abi', 'android-screenshot-ui'],
    reason: 'Android Provider / API / template / native source changed'
  },
  {
    id: 'builder-runtime',
    pattern: /(^|\/)(tools\/ai-skill\/|ai\/skill\/)/,
    layers: ['structure-full', 'reproducibility', 'runtime-tests', 'budget-check', 'all-template-compile'],
    reason: 'Builder / renderer / CLI / runtime changed'
  },
  {
    id: 'packaging-manifest',
    pattern: /(^|\/)(dist\/ai-skill\/|tools\/ai-skill\/(package\.py|lib\/manifest\.js|lib\/write-manifest\.js)|ai\/skill\/manifest\/)/,
    layers: ['clean-unpack', 'host-load', 'checksum-verify', 'dist-package-tests'],
    reason: 'Packaging / manifest changed'
  },
  {
    id: 'docs-only',
    pattern: /(^|\/)(AIOptimize\/|docs\/|ai\/skill\/.*\.md$)/i,
    layers: ['doc-link-audit'],
    reason: 'Documentation-only change; native tests are NOT claimed'
  }
];

function readPathsFile(file) {
  if (!file || !fs.existsSync(file)) return [];
  return fs.readFileSync(file, 'utf8').split('\n').map(line => line.trim()).filter(Boolean);
}

function collectChangedPaths(payload, extraPaths = []) {
  const paths = new Set(extraPaths.map(String));
  if (payload && Array.isArray(payload.files)) payload.files.forEach(p => paths.add(String(p && p.filename ? p.filename : p)));
  if (payload && Array.isArray(payload.changed_files)) payload.changed_files.forEach(p => paths.add(String(p)));
  if (payload && payload.pull_request) {
    if (Array.isArray(payload.pull_request.changed_files)) payload.pull_request.changed_files.forEach(p => paths.add(String(p)));
    if (Array.isArray(payload.pull_request.files)) payload.pull_request.files.forEach(p => paths.add(String(p && p.filename ? p.filename : p)));
  }
  if (payload && Array.isArray(payload.commits))
    for (const c of payload.commits)
      for (const key of ['added', 'modified', 'removed'])
        if (Array.isArray(c[key])) c[key].forEach(p => paths.add(String(p)));
  return [...paths].sort();
}

function planFor(changedPaths) {
  const matched = [];
  for (const rule of RULES) {
    if (changedPaths.some(p => rule.pattern.test(p))) matched.push(rule);
  }
  const layers = [...new Set(matched.flatMap(r => r.layers))];
  const allLayers = layers.length ? layers : ['structure-baseline'];
  const nativeRequired = allLayers.some(l => /native|snapshot|screenshot|abi|host-load|template-compile/.test(l));
  const docOnly = changedPaths.length > 0 && matched.length > 0 && matched.every(r => r.id === 'docs-only');
  return {
    schemaVersion: '1.0',
    generatedBy: 'tools/ai-skill/ci/route-changes.js',
    changedPaths,
    matchedRules: matched.map(r => ({ id: r.id, reason: r.reason })),
    requiredLayers: allLayers,
    nativeRequired,
    docOnly,
    notes: docOnly
      ? ['文档变更只跑链接与范围检查，不宣称原生测试已执行']
      : nativeRequired
        ? ['本仓 CI 只编排；原生编译/快照/ABI 由对应平台仓负责，报告引用需存在']
        : ['仅结构/契约层门禁']
  };
}

function opt(name, fallback) {
  const i = process.argv.indexOf('--' + name);
  if (i >= 0 && process.argv[i + 1]) return process.argv[i + 1];
  return fallback;
}

function main(argv = process.argv.slice(2)) {
  const eventPath = opt('event', process.env.GITHUB_EVENT_PATH || '');
  const pathsFile = opt('paths-file', '');
  let payload = {};
  if (eventPath && fs.existsSync(eventPath)) {
    try { payload = JSON.parse(fs.readFileSync(eventPath, 'utf8')); }
    catch (e) { console.error('FAIL invalid event JSON: ' + e.message); process.exit(2); }
  }
  const changedPaths = collectChangedPaths(payload, readPathsFile(pathsFile));
  if (argv.includes('--require-paths') && changedPaths.length === 0) {
    console.error('FAIL no changed paths collected; refusing to degrade to baseline plan');
    process.exit(2);
  }
  const plan = planFor(changedPaths);
  const outPath = opt('out', '');
  const json = JSON.stringify(plan, null, 2) + String.fromCharCode(10);
  if (outPath) fs.writeFileSync(outPath, json); // only an explicit CI artifact path, never truth sources
  process.stdout.write(json);
}

if (require.main === module) main();
module.exports = { RULES, planFor, collectChangedPaths, readPathsFile };
