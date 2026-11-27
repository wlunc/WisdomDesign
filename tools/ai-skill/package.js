#!/usr/bin/env node
'use strict';
// Deterministic M4 packaging: Core (+ optional iOS / Android / All) + checksums.
// Deterministic packager (JS): same CLI and package layout as the M4 design.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');
const { writeZip } = require('./lib/zip');

const DESIGN = path.resolve(__dirname, '..', '..');
const REPO = path.dirname(DESIGN);
const DIST = path.join(DESIGN, 'dist', 'ai-skill');
const VERSION = '1.0.0';
const STAGING = path.join(DIST, '_staging');
const RESIDENT_BUDGET_BYTES = 6000;
const WRITE_MANIFEST = path.join(DESIGN, 'tools', 'ai-skill', 'lib', 'write-manifest.js');
const CLI = path.join(DESIGN, 'tools', 'ai-skill', 'cli.js');
const PLATFORM_NAMES = ['ios', 'android'];
const PLATFORM_REPO_DIR = { ios: 'iOS', android: 'android' };
const PLATFORM_ENV = { ios: 'WISDOMDESIGN_IOS_ROOT', android: 'WISDOMDESIGN_ANDROID_ROOT' };
const PROVIDER_SUBDIR = 'ai/skill-provider';
// Provider sources contain two kinds of files the runtime never uses:
//  1. build/validation tooling (card generator, provider validator, template checker)
//  2. generation-time provenance docs (FIXES-*.md, SNAPSHOT.md)
// Shipping them inflates the package for no runtime benefit. The scaffolder is
// kept because the consumer actually runs it.
// Keep this list explicit and test it, instead of a broad glob that could
// silently drop a real runtime file.
const PROVIDER_EXCLUDE = [
  'api-cards/generate_api_cards.js',
  'validate_provider.js',
  'tools/validate-provider.js',
  'tools/check-template.js',
  'FIXES-t6.md',
  'SNAPSHOT.md',
];
const LICENSE_TEXT =
  'GENERATED PACKAGE - DO NOT EDIT.\n' +
  'Built by wisdomdesign/tools/ai-skill/package.js from WisdomDesign truth sources.\n' +
  'Core: design semantics only. Platforms: real public APIs, capability and verification status as recorded.\n';

function die(message) { console.error('package failed: ' + message); process.exit(1); }
function sha256(file) { return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'); }
function tree(root) {
  if (!fs.existsSync(root)) return [];
  const out = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile()) out.push(full);
    }
  };
  walk(root);
  return out.sort();
}
function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (error) { if (error.code === 'ENOENT') return fallback; throw error; }
}
function copyTree(src, dst, options = {}) {
  if (!fs.existsSync(src)) die('missing provider source: ' + src);
  const exclude = options.exclude || [];
  for (const file of tree(src)) {
    const rel = path.relative(src, file).split(path.sep).join('/');
    if (exclude.includes(rel)) continue;
    const target = path.join(dst, rel);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(file, target);
  }
}
function runNode(args) {
  const result = spawnSync('node', args, { cwd: DESIGN, encoding: 'utf8' });
  if (result.status !== 0) die('node ' + args.join(' ') + ' failed: ' + (result.stdout || '') + (result.stderr || ''));
  return (result.stdout || '').trim();
}
function platformRoot(platform, args) {
  const explicit = args[platform + 'Root'];
  if (explicit) {
    const root = path.resolve(explicit);
    if (!fs.existsSync(root)) die('--' + platform + '-root does not exist: ' + root);
    return root;
  }
  const env = process.env[PLATFORM_ENV[platform]];
  if (env) {
    const root = path.resolve(env);
    if (!fs.existsSync(root)) die(PLATFORM_ENV[platform] + ' does not exist: ' + root);
    return root;
  }
  const sibling = path.join(REPO, PLATFORM_REPO_DIR[platform]);
  return fs.existsSync(sibling) ? sibling : null;
}
function requirePlatformRoot(platform, args) {
  const root = platformRoot(platform, args);
  if (!root) {
    die("platform source for '" + platform + "' is not available: expected sibling '" + path.join(REPO, PLATFORM_REPO_DIR[platform]) +
      "'. Checkout the repo there, pass --" + platform + '-root <dir>, set ' + PLATFORM_ENV[platform] + ', or run --platforms core.');
  }
  const provider = path.join(root, PROVIDER_SUBDIR);
  if (!fs.existsSync(path.join(provider, 'provider.json'))) die(platform + ' provider not found at ' + path.join(provider, 'provider.json'));
  return root;
}
function selectedPackages(platforms) {
  const packages = ['core', ...platforms];
  if (platforms.includes('ios') && platforms.includes('android')) packages.push('all');
  return packages;
}
function parseArgs(argv) {
  const args = { platforms: 'core,ios,android', iosRoot: null, androidRoot: null, distVersion: VERSION };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--help' || a === '-h') {
      console.log('usage: package.js [--platforms core|core,ios,android] [--ios-root dir] [--android-root dir]');
      process.exit(0);
    }
    if (a === '--platforms') args.platforms = argv[++i];
    else if (a === '--ios-root') args.iosRoot = argv[++i];
    else if (a === '--android-root') args.androidRoot = argv[++i];
    else if (a === '--dist-version') args.distVersion = argv[++i];
    else die('unknown argument ' + a);
  }
  args.wanted = args.platforms.split(',').filter(p => p && p !== 'core');
  const unknown = args.wanted.filter(p => !PLATFORM_NAMES.includes(p));
  if (unknown.length) die('unknown platform(s): ' + unknown.join(',') + '; choose from core,' + PLATFORM_NAMES.join(','));
  return args;
}
function writeManifest(pkgRoot, packageName, platforms, args) {
  const command = [WRITE_MANIFEST, '--root', pkgRoot, '--package', packageName, '--platforms', ['core', ...platforms].join(','), '--skill-version', VERSION];
  for (const platform of platforms) command.push('--' + platform + '-root', requirePlatformRoot(platform, args));
  runNode(command);
  const manifest = readJson(path.join(pkgRoot, 'manifest.json'));
  const actual = tree(pkgRoot).length;
  if (manifest.contents.fileCount !== actual) die(packageName + ': manifest.contents.fileCount ' + manifest.contents.fileCount + ' != actual ' + actual);
  return manifest;
}
function appendPlatformSkill(pkgRoot, title, lines) {
  const file = path.join(pkgRoot, 'SKILL.md');
  fs.appendFileSync(file, '\n## ' + title + '\n\n' + lines.join('\n') + '\n');
  const size = fs.statSync(file).size;
  if (size > RESIDENT_BUDGET_BYTES) die(path.basename(pkgRoot) + ': SKILL.md exceeds resident budget ' + size + ' > ' + RESIDENT_BUDGET_BYTES);
  return size;
}
function zipPackage(pkgRoot, outPath) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
  const entries = tree(pkgRoot).map(file => ({
    name: path.relative(pkgRoot, file).split(path.sep).join('/'),
    data: fs.readFileSync(file),
  }));
  writeZip(outPath, entries, fs);
  return outPath;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  for (const platform of args.wanted) requirePlatformRoot(platform, args);
  if (fs.existsSync(STAGING)) fs.rmSync(STAGING, { recursive: true, force: true });
  fs.mkdirSync(STAGING, { recursive: true });
  const core = path.join(STAGING, 'wisdom-page-core');
  const coreCommand = [CLI, 'build', '--out', core];
  for (const platform of args.wanted) coreCommand.push('--' + platform + '-root', platformRoot(platform, args));
  runNode(coreCommand);

  const packages = { core };
  for (const platform of args.wanted) {
    const root = requirePlatformRoot(platform, args);
    const pkg = path.join(STAGING, 'wisdom-page-' + platform);
    fs.cpSync(core, pkg, { recursive: true });
    copyTree(path.join(root, PROVIDER_SUBDIR), path.join(pkg, 'platforms', platform), { exclude: PROVIDER_EXCLUDE });
    const status = readJson(path.join(root, PROVIDER_SUBDIR, 'provider.json'), {}).status || {};
    const effective = status && typeof status === 'object' ? (status.effective || 'spec-only') : String(status);
    appendPlatformSkill(pkg, 'Platform: ' + platform, [
      'Provider and API cards are under platforms/' + platform + '/.',
      'Effective status: ' + effective + '.',
    ]);
    packages[platform] = pkg;
  }
  if (args.wanted.includes('ios') && args.wanted.includes('android')) {
    const allpkg = path.join(STAGING, 'wisdom-page-all');
    fs.cpSync(core, allpkg, { recursive: true });
    for (const platform of args.wanted) copyTree(path.join(requirePlatformRoot(platform, args), PROVIDER_SUBDIR), path.join(allpkg, 'platforms', platform), { exclude: PROVIDER_EXCLUDE });
    appendPlatformSkill(allpkg, 'Platforms: ios, android', [
      'Use platforms/<id>/ provider data per task; do not mix platform APIs.',
      'Each platform keeps its own evidence; never mechanically translate one platform into another.',
    ]);
    packages.all = allpkg;
  }
  for (const pkg of Object.values(packages)) fs.writeFileSync(path.join(pkg, 'LICENSE-NOTICE.txt'), LICENSE_TEXT);

  const manifests = {};
  for (const name of ['core', ...args.wanted, ...(packages.all ? ['all'] : [])]) {
    const platforms = name === 'core' ? [] : (name === 'all' ? [...args.wanted] : [name]);
    manifests[name] = writeManifest(packages[name], 'wisdom-page-' + name, platforms, args);
  }

  const finalDir = path.join(DIST, 'v' + args.distVersion);
  if (fs.existsSync(finalDir)) fs.rmSync(finalDir, { recursive: true, force: true });
  fs.mkdirSync(path.join(finalDir, 'packages'), { recursive: true });
  const checksums = { schemaVersion: '1.0', generatedBy: 'tools/ai-skill/package.js', version: args.distVersion, packages: {} };
  for (const name of Object.keys(packages)) {
    const pkg = packages[name];
    const dest = path.join(finalDir, 'wisdom-page-' + name);
    fs.cpSync(pkg, dest, { recursive: true });
    const zipPath = zipPackage(dest, path.join(finalDir, 'packages', 'wisdom-page-' + name + '.zip'));
    const zipEntries = tree(dest).length;
    checksums.packages['wisdom-page-' + name] = {
      zipPath: 'packages/wisdom-page-' + name + '.zip',
      zipSha256: sha256(zipPath),
      zipBytes: fs.statSync(zipPath).size,
      zipEntries,
      manifestPath: 'wisdom-page-' + name + '/manifest.json',
      manifestSha256: sha256(path.join(dest, 'manifest.json')),
      filesIndexPath: 'wisdom-page-' + name + '/files.json',
      filesIndexSha256: sha256(path.join(dest, 'files.json')),
      fileCount: manifests[name].contents.fileCount,
      contentHash: manifests[name].contents.contentHash,
    };
  }
  fs.writeFileSync(path.join(finalDir, 'checksums.json'), JSON.stringify(checksums, null, 2) + '\n');
  fs.rmSync(STAGING, { recursive: true, force: true });
  console.log('platforms: ' + ['core', ...args.wanted].join(','));
  for (const name of Object.keys(packages)) {
    const entry = checksums.packages['wisdom-page-' + name];
    console.log('packaged ' + name + ': ' + entry.fileCount + ' files, zip ' + entry.zipEntries + ' entries, ' + entry.zipSha256);
  }
  console.log('checksums: ' + sha256(path.join(finalDir, 'checksums.json')));
}
try { main(); } catch (error) { die(error && error.stack ? error.stack : String(error)); }
