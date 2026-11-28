'use strict';
// M1-4 Core get_component runtime. Reads generated catalog only; no platform API data.
//
// Layout adaptation: the same script runs in two layouts and never reads outside
// its Skill package root.
//   source repo layout : <ai/skill>/runtime/get-component.js, catalog at <ai/skill>/core/catalog
//   packaged layout    : <package>/runtime/get-component.js, catalog at <package>/catalog
// Overlay refs in the generated catalog manifest are source-repo paths
// (ai/skill/component-overlays/WD*.json); they are resolved package-relatively so a
// packaged Skill can read the same overlay files it ships. Any path that resolves
// outside the Skill package is rejected, never silently followed.
const fs = require('fs');
const path = require('path');

const SKILL_ROOT = path.resolve(__dirname, '..');
const OVERLAY_PREFIX = 'ai/skill/';
const DEFAULT_LIMIT = 8;
const MAX_LIMIT = 20;
const TOOL_NAME = 'get_component';

function usage(message) {
  if (message) console.error('error: ' + message);
  console.error('usage: node ' + path.relative(SKILL_ROOT, __filename) + ' (--id <WDComponent> | --query <text>) [--catalog <dir>] [--limit <1-20>] [--json]');
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
    if (argv[i] === '--id') { args.id = nextValue(argv, i, '--id'); i += 1; }
    else if (argv[i] === '--query') { args.query = nextValue(argv, i, '--query'); i += 1; }
    else if (argv[i] === '--catalog') { args.catalog = nextValue(argv, i, '--catalog'); i += 1; }
    else if (argv[i] === '--limit') { args.limit = nextValue(argv, i, '--limit'); i += 1; }
    else if (argv[i] === '--json') args.json = true;
    else if (argv[i] === '--help') usage();
    else usage('unknown argument ' + argv[i]);
  }
  if ((args.id === undefined) === (args.query === undefined)) usage('provide exactly one of --id or --query');
  if (args.limit !== undefined && (!/^\d+$/.test(args.limit) || Number(args.limit) < 1 || Number(args.limit) > MAX_LIMIT)) usage('--limit must be 1-' + MAX_LIMIT);
  return args;
}
function isInside(base, target) {
  const relative = path.relative(path.resolve(base), path.resolve(target));
  return relative === '' || (!relative.startsWith('..' + path.sep) && relative !== '..' && !path.isAbsolute(relative));
}
function defaultCatalog() {
  const packaged = path.join(SKILL_ROOT, 'catalog');
  if (fs.existsSync(path.join(packaged, 'manifest.json'))) return packaged;
  return path.join(SKILL_ROOT, 'core', 'catalog');
}
function resolveCatalog(argument) {
  if (argument === undefined) return defaultCatalog();
  // Explicit --catalog is resolved against the current working directory (as before);
  // it must stay inside this Skill package or the call is rejected.
  const resolved = path.resolve(argument);
  if (!isInside(SKILL_ROOT, resolved)) throw new Error('catalog path escapes Skill package');
  return resolved;
}
function resolveOverlay(reference) {
  if (typeof reference !== 'string' || !reference) return null;
  const relative = reference.startsWith(OVERLAY_PREFIX) ? reference.slice(OVERLAY_PREFIX.length) : reference;
  const candidates = [path.resolve(SKILL_ROOT, relative), path.resolve(SKILL_ROOT, reference)];
  for (const candidate of candidates) {
    if (!isInside(SKILL_ROOT, candidate)) throw new Error('overlay path escapes Skill package');
    if (fs.existsSync(candidate)) return candidate;
  }
  // Overlays are optional retrieval metadata. A catalog rendered without the
  // overlay files still resolves, but the escape check above is never skipped.
  return null;
}
function readCatalog(dir) {
  const root = path.resolve(dir);
  if (!isInside(SKILL_ROOT, root)) throw new Error('catalog path escapes Skill package');
  const manifestPath = path.join(root, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (manifest.schemaVersion !== '1.0' || !Array.isArray(manifest.components)) throw new Error('unsupported catalog manifest');
  const components = manifest.components.map(entry => {
    let searchAliases = [];
    const overlayPath = resolveOverlay(entry.overlay);
    if (overlayPath) {
      const overlay = JSON.parse(fs.readFileSync(overlayPath, 'utf8'));
      searchAliases = Array.isArray(overlay.searchAliases) ? overlay.searchAliases : [];
    }
    return { ...entry, searchAliases };
  });
  return { root, manifest, components };
}
function cardText(root, entry) {
  if (!entry || typeof entry.card !== 'string' || entry.card.includes('..') || path.isAbsolute(entry.card)) throw new Error('invalid card path in catalog manifest');
  const cardPath = path.resolve(root, entry.card);
  if (!isInside(root, cardPath)) throw new Error('card path escapes catalog directory');
  return fs.readFileSync(cardPath, 'utf8');
}
function stripMarkdown(text) {
  return text
    .split('\n')
    .filter(line => !line.startsWith('<!--') && !line.startsWith('#'))
    .map(line => line.replace(/\*\*/g, '').trim())
    .filter(Boolean);
}
function summaryLines(text) {
  const lines = stripMarkdown(text);
  const start = lines.indexOf('用途（来自正式规格 §1）');
  const end = lines.indexOf('来源追溯');
  const segment = start >= 0 && end > start ? lines.slice(start + 1, end) : lines.slice(0, 8);
  return segment.filter(line => line.length <= 300).slice(0, 4);
}
// Search must behave the same for Chinese and English. Ranked evidence tiers (highest wins):
//   id exact 100 / alias exact 60 / alias prefix 45 / specName 40 / alias substring 30 / body 5
// Body hits alone are a weak signal: they match almost every card for a common word, so they
// must never outrank an actual alias. Ties resolve through a deterministic, intent-bearing order
// (alias rank -> pageRegions coverage -> spec order) instead of the alphabetical id, which made
// `--query 按钮` return nineteen cards all scoring 5 with WDButton missing entirely.
const ALIAS_EXACT = 60;
const ALIAS_PREFIX = 45;
const SPEC_NAME = 40;
const ALIAS_SUBSTRING = 30;
const BODY = 5;
function tokenize(value) {
  return String(value).toLowerCase().match(/[\p{Script=Han}]+|[a-z][a-z0-9_-]*/gu) || [];
}
function aliasMatch(aliases, normalized) {
  let best = 0;
  for (const alias of aliases) {
    const value = alias.toLowerCase();
    if (value === normalized) return ALIAS_EXACT;
    if (value.startsWith(normalized)) best = Math.max(best, ALIAS_PREFIX);
    else if (value.includes(normalized)) best = Math.max(best, ALIAS_SUBSTRING);
  }
  return best;
}
function score(entry, text, terms) {
  if (!terms.length) return 0;
  const aliases = entry.searchAliases || [];
  const plainText = stripMarkdown(text).join(' ').toLowerCase();
  let value = 0;
  for (const term of new Set(terms)) {
    const normalized = term.toLowerCase();
    if (entry.id.toLowerCase() === normalized) value += 100;
    else if (String(entry.specName || '').toLowerCase() === normalized) value += SPEC_NAME;
    else value += aliasMatch(aliases, normalized);
    if (plainText.includes(normalized)) value += BODY;
  }
  return value;
}
function exactResult(root, entry) {
  const card = cardText(root, entry);
  return {
    tool: TOOL_NAME, mode: 'exact', query: entry.id, found: true, totalCandidates: 1, returned: 1, limit: 1,
    component: {
      id: entry.id, specName: entry.specName, card: entry.card, purposeSource: entry.purposeSource,
      contract: entry.contract, overlay: entry.overlay, summary: summaryLines(card)
    },
    truncated: false,
    notice: '本查询只返回设计语义，不包含平台 API；请再从目标 Provider 获取 API 卡。'
  };
}
// Why this candidate surfaced. Without it a bounded result list is unreadable: the caller
// cannot tell an alias match from an incidental mention in body prose.
function matchReason(entry, terms) {
  const reasons = [];
  const aliases = entry.searchAliases || [];
  for (const term of new Set(terms)) {
    const normalized = term.toLowerCase();
    if (entry.id.toLowerCase() === normalized) reasons.push('id:exact');
    if (String(entry.specName || '').toLowerCase() === normalized) reasons.push('name:exact');
    const hit = aliasMatch(aliases, normalized);
    if (hit === ALIAS_EXACT) reasons.push('alias:exact:' + normalized);
    else if (hit === ALIAS_PREFIX) reasons.push('alias:prefix:' + normalized);
    else if (hit === ALIAS_SUBSTRING) reasons.push('alias:contains:' + normalized);
  }
  return [...new Set(reasons)];
}
// Alias evidence outranks an incidental body mention when scores tie. The final tie-break is
// spec order (the design spec's own component numbering), never the alphabetical id: id order
// is arbitrary and silently decided which components a caller ever saw.
function aliasStrength(entry, terms) {
  const aliases = entry.searchAliases || [];
  let best = 0;
  for (const term of new Set(terms)) {
    const normalized = term.toLowerCase();
    if (entry.id.toLowerCase() === normalized) return 5;
    const hit = aliasMatch(aliases, normalized);
    const tier = hit === ALIAS_EXACT ? 4 : hit === ALIAS_PREFIX ? 3 : hit === ALIAS_SUBSTRING ? 2 : 0;
    best = Math.max(best, tier);
  }
  return best;
}
function searchResult(root, entries, query, limit) {
  const terms = tokenize(query);
  const scored = entries.map(entry => {
    let text = '';
    try { text = cardText(root, entry); } catch (error) { text = ''; }
    return { entry, value: score(entry, text, terms) };
  }).filter(item => item.value > 0).sort((a, b) => {
    if (b.value !== a.value) return b.value - a.value;
    const strength = aliasStrength(b.entry, terms) - aliasStrength(a.entry, terms);
    if (strength !== 0) return strength;
    const order = (a.entry.specNumber || 0) - (b.entry.specNumber || 0);
    if (order !== 0) return order;
    return a.entry.id.localeCompare(b.entry.id);
  });
  const total = scored.length;
  const selected = scored.slice(0, limit);
  return {
    tool: TOOL_NAME, mode: 'keyword', query, found: selected.length > 0, totalCandidates: total, returned: selected.length, limit,
    candidates: selected.map(({ entry }) => ({
      id: entry.id, specName: entry.specName, card: entry.card, purposeSource: entry.purposeSource,
      overlay: entry.overlay, matched: matchReason(entry, terms), summary: entry.id + (entry.specName ? ' - ' + entry.specName : '')
    })),
    truncated: total > selected.length,
    truncatedBy: total > selected.length ? total - selected.length : 0,
    notice: total > selected.length
      ? '候选已按上限截断（还有 ' + (total - selected.length) + ' 条未显示）；请缩小关键词或提高 --limit。'
      : '候选按别名/名称/正文证据排序；matched 说明了每条入选的理由。不包含平台 API。'
  };
}
function notFound(entries, query) {
  const ids = entries.map(entry => entry.id).sort();
  return {
    tool: TOOL_NAME, mode: query.startsWith('WD') ? 'exact' : 'keyword', query, found: false, totalCandidates: 0, returned: 0,
    suggestions: ['使用 --query 搜索用途或别名', '只使用 contracts/WD*.yaml 中的 canonical ID', '不要编造相近组件或平台 API'],
    sampleIds: ids.slice(0, 5),
    notice: '未找到组件；本工具不会编造相近 API。'
  };
}
function printHuman(result) {
  console.log((result.found ? 'FOUND ' : 'NOT_FOUND ') + result.query);
  if (result.component) {
    console.log('  ' + result.component.id + (result.component.specName ? ' - ' + result.component.specName : ''));
    result.component.summary.forEach(line => console.log('  ' + line));
  }
  if (result.candidates) result.candidates.forEach(item => console.log('  ' + item.id + (item.specName ? ' - ' + item.specName : '')));
  console.log('  ' + result.notice);
}
function main() {
  const args = parseArgs(process.argv.slice(2));
  const { root, components: entries } = readCatalog(resolveCatalog(args.catalog));
  let result;
  if (args.id !== undefined) {
    const match = entries.find(entry => entry.id === args.id);
    result = match ? exactResult(root, match) : notFound(entries, args.id);
  } else {
    const limit = args.limit === undefined ? DEFAULT_LIMIT : Number(args.limit);
    result = searchResult(root, entries, args.query, limit);
  }
  if (args.json) console.log(JSON.stringify(result, null, 2));
  else printHuman(result);
  process.exit(result.found ? 0 : 3);
}
try { main(); }
catch (error) { console.error(TOOL_NAME + ' failed: ' + error.message); process.exit(2); }
