#!/usr/bin/env node
'use strict';
// Package manifest writer used by tools/ai-skill/package.js (and any other packager).
// It is the only place that renders manifest.json / files.json / build-info.json, so
// the Core builder and the M4 packager cannot drift into a second manifest format.
//
// Usage:
//   node tools/ai-skill/lib/write-manifest.js --root <package-dir> --package <enum>
//     [--platforms core,ios,android] [--skill-version 1.0.0]
//     [--ios-root <dir>] [--android-root <dir>] [--json]
//
// Platform roots are optional for a Core-only package and required for a package that
// ships a platform payload. They override the sibling layout / env vars used by
// lib/manifest.js, so CI can check the platform repos out anywhere.
//
// Exit codes: 0 written and schema-valid; 1 build error or manifest schema violation; 2 usage error.
const fs = require('fs');
const path = require('path');
const { buildManifest, MANIFEST_FILE, SKILL_VERSION } = require('./manifest.js');

const PACKAGES = ['wisdom-page-core', 'wisdom-page-ios', 'wisdom-page-android', 'wisdom-page-all'];
const PLATFORMS = ['core', 'ios', 'android'];

function usage(message) {
  if (message) console.error('error: ' + message);
  console.error('usage: node tools/ai-skill/lib/write-manifest.js --root <package-dir> --package <' + PACKAGES.join('|') + '> [--platforms core,ios,android] [--skill-version x.y.z] [--ios-root <dir>] [--android-root <dir>] [--json]');
  process.exit(2);
}
function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const value = () => {
      const next = argv[i + 1];
      if (next === undefined || next === '') usage(argv[i] + ' requires a value');
      i += 1;
      return next;
    };
    if (argv[i] === '--root') args.root = value();
    else if (argv[i] === '--package') args.package = value();
    else if (argv[i] === '--platforms') args.platforms = value().split(',').map(item => item.trim()).filter(Boolean);
    else if (argv[i] === '--skill-version') args.skillVersion = value();
    else if (argv[i] === '--ios-root') args.iosRoot = value();
    else if (argv[i] === '--android-root') args.androidRoot = value();
    else if (argv[i] === '--json') args.json = true;
    else if (argv[i] === '--help') usage();
    else usage('unknown argument ' + argv[i]);
  }
  if (!args.root) usage('--root is required');
  if (!PACKAGES.includes(args.package)) usage('--package must be one of ' + PACKAGES.join(', '));
  const platforms = args.platforms || ['core'];
  const unknown = platforms.filter(platform => !PLATFORMS.includes(platform));
  if (unknown.length) usage('unknown platform(s): ' + unknown.join(','));
  if (!platforms.includes('core')) platforms.unshift('core');
  if (platforms.filter(platform => platform !== 'core').length === 0 && args.package !== 'wisdom-page-core') usage('platform package needs at least one platform');
  args.platforms = platforms;
  if (args.skillVersion && !/^[0-9]+\.[0-9]+\.[0-9]+(?:-[0-9A-Za-z.-]+)?$/.test(args.skillVersion)) usage('--skill-version must be semver');
  return args;
}
function main() {
  const args = parseArgs(process.argv.slice(2));
  const root = path.resolve(args.root);
  if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) throw new Error('package root is not a directory: ' + root);
  if (!fs.existsSync(path.join(root, 'SKILL.md'))) throw new Error('package root has no SKILL.md entry point: ' + root);
  const manifest = buildManifest(root, {
    packageName: args.package,
    platforms: args.platforms,
    skillVersion: args.skillVersion || SKILL_VERSION,
    repoRoots: { ios: args.iosRoot, android: args.androidRoot }
  });
  const summary = {
    package: manifest.package,
    manifest: path.relative(process.cwd(), path.join(root, MANIFEST_FILE)),
    fileCount: manifest.contents.fileCount,
    contentHash: manifest.contents.contentHash,
    releaseKind: manifest.status.releaseKind,
    overall: manifest.status.overall
  };
  if (args.json) console.log(JSON.stringify(summary, null, 2));
  else console.log('manifest OK: ' + summary.package + ' (' + summary.fileCount + ' files, ' + summary.releaseKind + '/' + summary.overall + ')');
}
try { main(); }
catch (error) { console.error('write-manifest failed: ' + error.message); process.exit(1); }
