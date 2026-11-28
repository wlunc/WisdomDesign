#!/usr/bin/env node
'use strict';
// Gallery/checkbox self-test: asserts the drift guard actually fails when the gallery is off.
// A checker that only ever prints OK is indistinguishable from a checker that checks nothing.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CHECK = path.join(__dirname, 'gallery-check.js');
const GALLERY = path.join(ROOT, 'design', 'gallery', 'wisdom-components.html');

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }
function run(args) { return spawnSync('node', [CHECK, ...args], { encoding: 'utf8' }); }

test('gallery matches the token truth source', () => {
  const result = run(['--json']);
  assert.strictEqual(result.status, 0, result.stdout + result.stderr);
  const report = JSON.parse(result.stdout);
  assert.strictEqual(report.ok, true);
  assert.deepStrictEqual(report.drifts, []);
  assert.ok(report.checked > 10, 'expected to compare many variables, saw ' + report.checked);
});
test('every tracked exception is still real (stale excuses fail the guard)', () => {
  const report = JSON.parse(run(['--json']).stdout);
  assert.ok(report.excused.length >= 1, 'the one known divergence must be recorded, not hidden');
  for (const entry of report.excused) {
    assert.ok(entry.reason && entry.reason.length > 40, 'an exception without a reason is a loophole');
  }
});
test('drift is detected when a gallery value is changed', () => {
  const original = fs.readFileSync(GALLERY, 'utf8');
  const marker = '--g-text3:light-dark(#4C616D,#839EB0);';
  assert.ok(original.includes(marker), 'fixture drifted; update the marker in this test');
  try {
    fs.writeFileSync(GALLERY, original.replace(marker, '--g-text3:light-dark(#5B7784,#839EB0);'));
    const result = run(['--json']);
    assert.strictEqual(result.status, 1, 'a stale gallery value must fail the guard');
    const report = JSON.parse(result.stdout);
    assert.ok(report.drifts.some(d => d.variable === 'text3' && d.scheme === 'light'));
  } finally {
    fs.writeFileSync(GALLERY, original);
  }
});

let failed = 0;
for (const { name, fn } of tests) {
  try { fn(); console.log('PASS ' + name); }
  catch (error) { failed += 1; console.log('FAIL ' + name); console.log('  ' + (error.stack || error.message).split('\n').slice(0, 6).join('\n  ')); }
}
console.log(tests.length - failed + '/' + tests.length + ' tests passed');
if (failed > 0) process.exit(1);
