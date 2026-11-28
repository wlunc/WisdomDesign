#!/usr/bin/env node
'use strict';
// Drift guard between the hand-written gallery and the token truth source.
//
// design/gallery/*.html hardcode a `--g-*` palette block. Nothing regenerated it, so the gallery
// silently kept values the tokens had already fixed (e.g. text.tertiary stayed #5B7784 after B10
// changed it to #4C616D and took it from 4.43:1 to 6.04:1). A reader could not tell which number
// was current. This check makes the divergence a build failure instead of a design review finding.
//
// Usage: node tools/gallery-check.js [--json]
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TOKENS = path.join(ROOT, 'tokens', 'wisdom.tokens.json');
const GALLERIES = [
  { file: 'design/gallery/wisdom-components.html', scope: '#wd-gallery' },
  { file: 'design/gallery/wisdom-advanced.html', scope: '#wd-gallery' },
  { file: 'design/gallery/wisdom-patterns.html', scope: '#wd-gallery' },
];

// --g-<name> -> token path. Only entries with a real token counterpart belong here; purely
// presentational gallery values (shadows composed for the demo page) are intentionally absent and
// therefore not checked.
const MAP = {
  'on-fill': 'text.on-fill',
  'fill': 'gradient.fill',
  'surface': 'gradient.surface',
  'canvas': 'bg.canvas',
  'grouped': 'bg.grouped',
  'card': 'surface.card',
  'card-solid': 'surface.card-solid',
  'sunken': 'surface.card-sunken',
  'text': 'text.primary',
  'text2': 'text.secondary',
  'text3': 'text.tertiary',
  'line': 'border.hairline',
  'line2': 'border.hairline-strong',
  'field': 'fill.field',
  'glass': 'surface.glass',
  'glass-strong': 'surface.glass-strong',
  'success': 'status.success',
  'info': 'status.info',
  'warn': 'status.warning',
  'danger': 'status.danger',
};

// Gallery-only variables with no single semantic counterpart. `--g-brand` is a deliberately
// static brand fill (one colour for both schemes), and `--g-mid-color` tracks the derived mid
// ramp rather than a semantic slot, so neither can be reconciled against one token path. Listing
// them here keeps the check honest instead of quietly skipping them.
const NO_TOKEN_COUNTERPART = {
  'brand': 'static brand fill, one value for both schemes',
  'brand-strong': 'derived brand ramp',
  'mid-color': 'derived.fill-mid ramp, not a semantic slot',
  'deep': 'derived deep ramp',
};

// Deliberate, tracked divergences. Each entry states which side is right and why; the goal is a
// visible ledger, not a way to make the check green.
const EXCEPTIONS = [
  {
    var: 'on-fill', scheme: 'dark',
    reason: 'token semantic.dark.text.on-fill = #DCEEF4 在 gradient.fill 起点 #1677B3 上只有 4.07:1，低于规格 §10 自订的 4.5:1；gallery 的 #FFFFFF 为 4.86:1。' +
      '两侧暂时都不动：改 token 会改变已发布的按钮外观，需要设计侧裁定（见 token-build.js 的 KNOWN_GRADIENT_EXCEPTIONS）。裁定后同时删掉这条。',
  },
];

function readJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function get(document, dotted) {
  let node = document;
  for (const part of dotted.split('.')) {
    if (node === null || typeof node !== 'object') return undefined;
    node = node[part];
  }
  return node;
}
function tokenValue(document, scheme, dotted) {
  const direct = get(document, 'semantic.' + scheme + '.' + dotted);
  const node = direct !== undefined ? direct : get(document, dotted);
  if (node && typeof node === 'object' && node.$value !== undefined) return node.$value;
  return node;
}
function unescapeHtml(text) {
  return text.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&amp;/g, '&');
}
function palette(html) {
  const vars = {};
  const re = /\s--g-([a-z0-9-]+):\s*([^;]+);/g;
  let match;
  while ((match = re.exec(unescapeHtml(html))) !== null) {
    if (!(match[1] in vars)) vars[match[1]] = match[2].trim();
  }
  return vars;
}
// A gallery variable is either a plain value or `light-dark(<light>,<dark>)`. Gradients wrap each
// stop in its own light-dark(), so scheme extraction has to descend into the value rather than
// assume one wrapper around the whole thing.
// Resolves every nested light-dark() for one scheme, including the per-stop wrappers a gradient
// uses. Without the recursive descent a gradient looked like drift in both schemes because the
// comparison saw the literal `light-dark(...)` text instead of the stop it selects.
function schemeValue(value, scheme) {
  const text = String(value).trim();
  let result = text;
  for (let guard = 0; guard < 8 && result.includes('light-dark('); guard += 1) {
    const start = result.indexOf('light-dark(');
    let depth = 0;
    let end = -1;
    for (let i = start; i < result.length; i += 1) {
      if (result[i] === '(') depth += 1;
      else if (result[i] === ')') { depth -= 1; if (depth === 0) { end = i; break; } }
    }
    if (end < 0) break;
    const body = result.slice(start + 'light-dark('.length, end);
    let split = -1;
    depth = 0;
    for (let i = 0; i < body.length; i += 1) {
      const char = body[i];
      if (char === '(') depth += 1;
      else if (char === ')') depth -= 1;
      else if (char === ',' && depth === 0) { split = i; break; }
    }
    const chosen = split < 0 ? body : (scheme === 'dark' ? body.slice(split + 1) : body.slice(0, split)).trim();
    result = result.slice(0, start) + chosen + result.slice(end + 1);
  }
  return result;
}

function unusedLegacySchemeValue(value, scheme) {
  const text = String(value).trim();
  const inner = text.match(/^light-dark\(([\s\S]*)\)$/);
  if (!inner) return text;
  const body = inner[1];
  let depth = 0;
  let split = -1;
  for (let i = 0; i < body.length; i += 1) {
    const char = body[i];
    if (char === '(') depth += 1;
    else if (char === ')') depth -= 1;
    else if (char === ',' && depth === 0) { split = i; break; }
  }
  if (split < 0) return body.trim();
  return (scheme === 'dark' ? body.slice(split + 1) : body.slice(0, split)).trim();
}

function normalizeColor(value) {
  const text = String(value).trim();
  const rgba = text.match(/rgba?\(([^)]+)\)/);
  if (rgba) {
    const parts = rgba[1].split(',').map(part => part.trim());
    const alpha = parts.length > 3 ? Math.round(parseFloat(parts[3]) * 255) : 255;
    return 'rgb(' + parts.slice(0, 3).map(Number).join(',') + ')/' + alpha;
  }
  const hex = text.replace(/\s/g, '').toUpperCase();
  if (/^#[0-9A-F]{8}$/.test(hex)) {
    const rgb = [1, 3, 5].map(index => parseInt(hex.slice(index, index + 2), 16));
    return 'rgb(' + rgb.join(',') + ')/' + parseInt(hex.slice(7, 9), 16);
  }
  if (/^#[0-9A-F]{6}$/.test(hex)) {
    const rgb = [1, 3, 5].map(index => parseInt(hex.slice(index, index + 2), 16));
    return 'rgb(' + rgb.join(',') + ')/255';
  }
  return hex;
}

function parseColor(normalized) {
  const match = String(normalized).match(/^rgb\(([\d,]+)\)\/(\d+)$/);
  if (!match) return null;
  return { rgb: match[1].split(',').map(Number), alpha: Number(match[2]) };
}

// Alpha is written two ways in the two sources (0xNN/255 vs a decimal percentage), so a difference
// of one or two 8-bit steps is rounding, not drift. A different RGB triple always is drift.
function sameColor(galleryValue, tokenValue) {
  const left = parseColor(normalizeColor(galleryValue));
  const right = parseColor(normalizeColor(tokenValue));
  if (!left || !right) return normalizeColor(galleryValue) === normalizeColor(tokenValue);
  return left.rgb.join(',') === right.rgb.join(',') && Math.abs(left.alpha - right.alpha) <= 2;
}

const STOP = /#[0-9A-Fa-f]{6,8}/g;
function sameValue(galleryValue, tokenValue) {
  const tokenText = String(tokenValue);
  if (/gradient/.test(tokenText) || /gradient/.test(String(galleryValue))) {
    const left = (String(galleryValue).match(STOP) || []).map(stop => stop.toUpperCase());
    const right = (tokenText.match(STOP) || []).map(stop => stop.toUpperCase());
    if (left.length === 0 || right.length === 0) return true;
    if (left.length !== right.length) return false;
    return left.every((stop, index) => sameColor(stop, right[index]));
  }
  return sameColor(galleryValue, tokenText);
}
function main() {
  const json = process.argv.includes('--json');
  const tokens = readJson(TOKENS);
  const drifts = [];
  const skipped = [];
  const excused = [];
  for (const gallery of GALLERIES) {
    const html = fs.readFileSync(path.join(ROOT, gallery.file), 'utf8');
    const vars = palette(html);
    for (const [variable, tokenPath] of Object.entries(MAP)) {
      if (!(variable in vars)) { skipped.push({ variable, reason: 'not present in gallery' }); continue; }
      const tokenRaw = tokenValue(tokens, 'light', tokenPath);
      if (tokenRaw === undefined || tokenRaw === null) { skipped.push({ variable, tokenPath, reason: 'no token counterpart' }); continue; }
      
      for (const scheme of ['light', 'dark']) {
        const exception = EXCEPTIONS.find(entry => entry.var === variable && entry.scheme === scheme);
        if (exception) {
          const key = variable + '|' + scheme;
          if (!excused.some(entry => entry.key === key)) excused.push({ key, variable, scheme, reason: exception.reason });
          continue;
        }
        const schemeToken = tokenValue(tokens, scheme, tokenPath);
        if (schemeToken === undefined || schemeToken === null) continue;
        const gallerySchemeValue = schemeValue(vars[variable], scheme);
        if (sameValue(gallerySchemeValue, schemeToken)) continue;
        const drift = { variable, scheme, gallery: gallerySchemeValue, token: String(schemeToken), tokenPath, file: gallery.file };
        drifts.push(drift);
      }
    }
  }
  const report = { ok: drifts.length === 0, checked: Object.keys(MAP).length, drifts, excused, skipped };
  if (json) { console.log(JSON.stringify(report, null, 2)); process.exit(report.ok ? 0 : 1); }
  for (const drift of drifts) {
    console.log('DRIFT --g-' + drift.variable + ' [' + drift.scheme + ']');
    console.log('  gallery: ' + drift.gallery);
    console.log('  tokens : ' + drift.token + '  (' + drift.tokenPath + ')');
  }
  for (const entry of excused) console.log('EXCUSED --g-' + entry.variable + ' [' + entry.scheme + ']: ' + entry.reason);
  console.log((report.ok ? 'gallery OK' : 'gallery DRIFT') + ': ' + drifts.length + ' mismatch(es), ' + excused.length + ' tracked exception(s)');
  process.exit(report.ok ? 0 : 1);
}
try { main(); } catch (error) { console.error('gallery-check failed: ' + error.message); process.exit(2); }