'use strict';
// Core token resolver. Reads the shipped tokens/wisdom.tokens.json only; resolves one DTCG leaf
// path and prints its value, description and the file hash so a caller can cite it.
//
// Why this exists: Page Specs and semantic cards reference visual numbers by token name
// (`text.tertiary`, `radius.full`). Without a resolver inside the package those names are
// unresolvable — which is exactly why design review could only review prose (P0-1).
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SKILL_ROOT = path.resolve(__dirname, '..');
const TOKEN_RELATIVE = path.join('tokens', 'wisdom.tokens.json');
const TOOL_NAME = 'resolve_token';

function usage(message) {
  if (message) console.error('error: ' + message);
  console.error('usage: node ' + path.relative(SKILL_ROOT, __filename) + ' --path <token.path> [--scheme light|dark] [--json]');
  process.exit(2);
}
function nextValue(argv, index, flag) {
  const value = argv[index + 1];
  if (value === undefined || value === '' || value.startsWith('--')) usage(flag + ' requires a value');
  return value;
}
function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--path') { args.path = nextValue(argv, i, '--path'); i += 1; }
    else if (argv[i] === '--scheme') { args.scheme = nextValue(argv, i, '--scheme'); i += 1; }
    else if (argv[i] === '--json') args.json = true;
    else if (argv[i] === '--help') usage();
    else usage('unknown argument ' + argv[i]);
  }
  if (!args.path) usage('--path is required');
  if (!/^\$?[A-Za-z0-9_.-]+$/.test(args.path)) usage('--path accepts dotted token paths only');
  if (args.scheme !== undefined && args.scheme !== 'light' && args.scheme !== 'dark') usage('--scheme must be light or dark');
  return args;
}
function isInside(base, target) {
  const relative = path.relative(path.resolve(base), path.resolve(target));
  return relative === '' || (!relative.startsWith('..' + path.sep) && relative !== '..' && !path.isAbsolute(relative));
}
// Two layouts, mirroring get-component.js: the packaged layout ships tokens/ next to the runtime,
// the source-repo layout keeps the truth source at <design repo>/tokens. The packaged copy wins
// when both exist so a test run against the built package exercises what consumers actually get.
function tokenFile() {
  const packaged = path.resolve(SKILL_ROOT, TOKEN_RELATIVE);
  if (!isInside(SKILL_ROOT, packaged)) throw new Error('token path escapes Skill package');
  if (fs.existsSync(packaged)) return packaged;
  const sourceRepo = path.resolve(SKILL_ROOT, '..', '..', TOKEN_RELATIVE);
  if (fs.existsSync(sourceRepo)) return sourceRepo;
  throw new Error('tokens/wisdom.tokens.json is not shipped in this package');
}
function walk(node, parts, trail) {
  if (parts.length === 0) return { node, trail };
  if (node === null || typeof node !== 'object') return null;
  const [head, ...rest] = parts;
  if (!Object.prototype.hasOwnProperty.call(node, head)) return null;
  return walk(node[head], rest, trail.concat(head));
}
function readLeaf(find) {
  const node = find.node;
  if (node && typeof node === 'object' && Object.prototype.hasOwnProperty.call(node, '$value')) {
    return { value: node.$value, description: node.$description || null };
  }
  if (node && typeof node === 'object') return { group: Object.keys(node).filter(k => !k.startsWith('$')).sort() };
  return { value: node, description: null };
}
function main() {
  const args = parseArgs(process.argv.slice(2));
  const file = tokenFile();
  const document = JSON.parse(fs.readFileSync(file, 'utf8'));
  const sha256 = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  const requested = args.path.replace(/^\$/, '');
  const parts = requested.split('.').filter(Boolean);

  // A scheme-qualified path resolves exactly. A bare semantic leaf (text.tertiary) expands to
  // semantic.<scheme>.text.tertiary, and an unqualified path resolves at the document root.
  const attempts = [];
  if (args.scheme) attempts.push(['semantic', args.scheme].concat(parts));
  attempts.push(parts);
  if (!args.scheme) { attempts.push(['semantic', 'light'].concat(parts)); }

  let resolved = null;
  let used = null;
  for (const attempt of attempts) {
    const found = walk(document, attempt, []);
    if (found) { resolved = found; used = attempt; break; }
  }

  if (!resolved) {
    const result = { tool: TOOL_NAME, found: false, path: args.path, scheme: args.scheme || null, sha256, notice: 'token path not found; do not invent a value' };
    if (args.json) console.log(JSON.stringify(result, null, 2));
    else console.log('NOT_FOUND ' + args.path + '\n  ' + result.notice);
    process.exit(3);
  }

  const leaf = readLeaf(resolved);
  const result = {
    tool: TOOL_NAME, found: true, path: args.path, resolvedPath: used.join('.'), scheme: args.scheme || (used[0] === 'semantic' ? used[1] : null),
    value: leaf.value !== undefined ? leaf.value : null, group: leaf.group || null, description: leaf.description,
    source: 'tokens/wisdom.tokens.json', sha256
  };
  if (args.json) console.log(JSON.stringify(result, null, 2));
  else if (result.value !== null) console.log(result.resolvedPath + ' = ' + JSON.stringify(result.value));
  else console.log(result.resolvedPath + ' is a group: ' + (result.group || []).join(', '));
  process.exit(0);
}
try { main(); }
catch (error) { console.error(TOOL_NAME + ' failed: ' + error.message); process.exit(2); }