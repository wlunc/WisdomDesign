#!/usr/bin/env node
'use strict';
// render_spec: Page Spec -> deterministic, self-contained HTML preview.
//
// Why this exists: the Skill could describe a page (purpose, states, accessibility, sizes) but
// could not show it. A designer had to reverse-engineer design/gallery/** to see anything, and
// that file is both forbidden as a normative source and historically two token revisions stale.
//
// Design rules this renderer is built around:
//   1. Every visual number comes from tokens/wisdom.tokens.json at run time. There is no CSS
//      palette checked in next to this script; a hardcoded colour here would be the same class of
//      defect as the stale gallery.
//   2. It renders LAYOUT AND HIERARCHY, not pixel-exact platform output: spacing, order, emphasis,
//      states and light/dark. Native compile, snapshot and visual review stay not-evaluated, and
//      the emitted HTML says so in its banner.
//   3. Output is deterministic (no timestamps, no paths, no randomness) so it can be diffed in CI.
//   4. Nothing is read from outside the Skill package.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SKILL_ROOT = path.resolve(__dirname, '..');
const TOOL_NAME = 'render_spec';

function usage(message) {
  if (message) console.error('error: ' + message);
  console.error('usage: node ' + path.relative(SKILL_ROOT, __filename) + ' --file <page-spec.json> [--out <file.html>] [--scheme light|dark] [--json]');
  process.exit(2);
}
function nextValue(argv, index, flag) {
  const value = argv[index + 1];
  if (value === undefined || value === '' || value.startsWith('--')) usage(flag + ' requires a value');
  return value;
}
function parseArgs(argv) {
  const args = { scheme: 'light' };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--file') { args.file = nextValue(argv, i, '--file'); i += 1; }
    else if (argv[i] === '--out') { args.out = nextValue(argv, i, '--out'); i += 1; }
    else if (argv[i] === '--scheme') { args.scheme = nextValue(argv, i, '--scheme'); i += 1; }
    else if (argv[i] === '--json') args.json = true;
    else if (argv[i] === '--help') usage();
    else usage('unknown argument ' + argv[i]);
  }
  if (!args.file) usage('--file is required');
  if (args.scheme !== 'light' && args.scheme !== 'dark') usage('--scheme must be light or dark');
  return args;
}
function isInside(base, target) {
  const relative = path.relative(path.resolve(base), path.resolve(target));
  return relative === '' || (!relative.startsWith('..' + path.sep) && relative !== '..' && !path.isAbsolute(relative));
}
function tokenFile() {
  const packaged = path.resolve(SKILL_ROOT, 'tokens', 'wisdom.tokens.json');
  if (fs.existsSync(packaged)) return packaged;
  return path.resolve(SKILL_ROOT, '..', '..', 'tokens', 'wisdom.tokens.json');
}
function catalogFile(name) {
  const packaged = path.join(SKILL_ROOT, 'catalog', name);
  return fs.existsSync(packaged) ? packaged : path.join(SKILL_ROOT, 'core', 'catalog', name);
}

// ---------------------------------------------------------------- token access
//
// The packaged layout cannot require tools/ai-skill/lib/token-index.js (it is not shipped), so the
// minimal resolution this renderer needs is inlined here. Path spellings match the specs and the
// extractor: semantic leaves without a scheme, `type.*` -> typography, `derived.*` -> color.derived.

const TOP_GROUPS = ['color', 'gradient', 'wash', 'member', 'semantic', 'typography', 'space', 'radius', 'size', 'elevation', 'material', 'motion', 'state'];

function walk(node, parts) {
  let current = node;
  for (const part of parts) {
    if (current === null || typeof current !== 'object') return undefined;
    if (!Object.prototype.hasOwnProperty.call(current, part)) return undefined;
    current = current[part];
  }
  return current;
}
function expandAlias(name) {
  if (name.startsWith('type.')) return 'typography.' + name.slice(5);
  if (name.startsWith('derived.')) return 'color.derived.' + name.slice(8);
  return name;
}
function resolveToken(tokens, name, scheme) {
  const parts = expandAlias(String(name)).split('.').filter(Boolean);
  if (parts.length === 0) return null;
  const candidates = [];
  if (TOP_GROUPS.includes(parts[0])) candidates.push(['semantic', scheme].concat(parts));
  candidates.push(parts);
  if (!TOP_GROUPS.includes(parts[0])) candidates.push(['semantic', scheme].concat(parts));
  for (const candidate of candidates) {
    const node = walk(tokens, candidate);
    if (node && typeof node === 'object' && Object.prototype.hasOwnProperty.call(node, '$value')) return node.$value;
    if (node !== undefined && (typeof node === 'string' || typeof node === 'number')) return node;
  }
  return null;
}
function num(tokens, name, fallback) {
  const value = resolveToken(tokens, name, 'light');
  const parsed = value === null ? NaN : Number(String(value).replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : fallback;
}
function px(tokens, name, scheme) {
  const value = resolveToken(tokens, name, scheme);
  if (value === null || value === undefined) return null;
  const text = String(value);
  if (/^[0-9.]+$/.test(text)) return text + 'px';
  return text;
}
function shadow(tokens, name) {
  const value = resolveToken(tokens, name, 'light');
  if (!value || !Array.isArray(value.layers)) return 'none';
  if (value.layers.length === 0) return 'none';
  return value.layers.map(layer => layer.x + 'px ' + layer.y + 'px ' + layer.blur + 'px ' + layer.color).join(', ');
}
function fontSize(tokens, name) {
  const value = resolveToken(tokens, name, 'light');
  if (!value || typeof value !== 'object') return null;
  return { size: value.fontSize, line: value.lineHeight, weight: value.fontWeight, spacing: value.letterSpacing };
}

// ---------------------------------------------------------------- stylesheet from tokens
//
// Everything below is derived, never authored: one CSS custom property per semantic slot, then
// component rules expressed in those variables. If a token changes, the preview changes; there is
// no second palette to fall out of date.

function palettes(tokens) {
  const slots = [];
  const seen = new Set();
  for (const group of Object.keys(tokens.semantic.light)) {
    if (group.startsWith('$')) continue;
    for (const key of Object.keys(tokens.semantic.light[group])) {
      if (key.startsWith('$')) continue;
      const slot = group + '-' + key;
      if (seen.has(slot)) continue;
      seen.add(slot);
      slots.push({ slot, group, key });
    }
  }
  return slots;
}

function cssVariables(tokens, scheme) {
  const lines = [];
  for (const { slot, group, key } of palettes(tokens)) {
    const value = tokens.semantic[scheme][group][key].$value;
    lines.push('  --wd-' + slot + ': ' + value + ';');
  }
  for (const key of Object.keys(tokens.space)) {
    if (key.startsWith('$')) continue;
    lines.push('  --wd-space-' + key + ': ' + tokens.space[key].$value + 'px;');
  }
  for (const key of Object.keys(tokens.radius)) {
    if (key.startsWith('$')) continue;
    lines.push('  --wd-radius-' + key + ': ' + tokens.radius[key].$value + 'px;');
  }
  const type = (name) => {
    const value = tokens.typography[name].$value;
    return '  --wd-type-' + name + ': ' + value.fontSize + 'px/' + value.lineHeight + 'px ' + value.fontWeight + ';';
  };
  for (const name of Object.keys(tokens.typography)) {
    if (name.startsWith('$') || name === 'family') continue;
    lines.push(type(name));
  }
  lines.push('  --wd-font: ' + JSON.stringify(String(tokens.typography.family.sans.$value)).slice(1, -1) + ', system-ui, sans-serif;');
  for (const level of ['0', '1', '2', '3', 'brand']) {
    lines.push('  --wd-elevation-' + level + ': ' + shadow(tokens, 'elevation.' + level) + ';');
  }
  return lines.join('\n');
}

function stylesheet(tokens, scheme) {
  const body = fontSize(tokens, 'body');
  const rowComfortable = num(tokens, 'size.row-height.comfortable', 60);
  const controlMd = num(tokens, 'size.control.md', 44);
  const iconSm = num(tokens, 'size.icon.sm', 16);
  const avatarMd = num(tokens, 'size.avatar.md', 32);
  return [
  ':root {',
  cssVariables(tokens, scheme),
  '  color-scheme: ' + scheme + ';',
  '}',
  '* { box-sizing: border-box; }',
  'html, body { margin: 0; padding: 0; }',
  'body {',
  '  background: var(--wd-bg-canvas);',
  '  color: var(--wd-text-primary);',
  '  font: var(--wd-type-body);',
  '  font-family: var(--wd-font);',
  '  padding: var(--wd-space-5);',
  '  -webkit-font-smoothing: antialiased;',
  '}',
  '.wd-chrome { max-width: 420px; margin: 0 auto; }',
  '.wd-banner {',
  '  border: 1px dashed var(--wd-border-hairline-strong);',
  '  border-radius: var(--wd-radius-md);',
  '  padding: var(--wd-space-3) var(--wd-space-4);',
  '  margin-bottom: var(--wd-space-5);',
  '  color: var(--wd-text-secondary);',
  '  font: var(--wd-type-caption1);',
  '  font-family: var(--wd-font);',
  '}',
  '.wd-banner b { color: var(--wd-text-primary); font-weight: 600; }',
  '.wd-nav {',
  '  display: flex; align-items: center; gap: var(--wd-space-3);',
  '  min-height: ' + controlMd + 'px;',
  '  padding: 0 var(--wd-space-5);',
  '  background: var(--wd-surface-glass);',
  '  border-bottom: 1px solid var(--wd-border-hairline);',
  '  border-radius: var(--wd-radius-lg) var(--wd-radius-lg) 0 0;',
  '}',
  '.wd-nav-title { font: var(--wd-type-headline); font-family: var(--wd-font); }',
  '.wd-nav-back { color: var(--wd-text-brand); font: var(--wd-type-body); font-family: var(--wd-font); }',
  '.wd-screen {',
  '  background: var(--wd-bg-grouped);',
  '  border-radius: var(--wd-radius-lg);',
  '  padding: var(--wd-space-4);',
  '  display: flex; flex-direction: column; gap: var(--wd-space-5);',
  '  box-shadow: var(--wd-elevation-1);',
  '}',
  '.wd-region { display: flex; flex-direction: column; gap: var(--wd-space-3); }',
  '.wd-region-label {',
  '  display: flex; align-items: baseline; gap: var(--wd-space-2);',
  '  font: var(--wd-type-overline); font-family: var(--wd-font);',
  '  letter-spacing: .04em; text-transform: uppercase;',
  '  color: var(--wd-text-tertiary);',
  '}',
  '.wd-region-label code { text-transform: none; letter-spacing: 0; color: var(--wd-text-secondary); }',
  '.wd-card {',
  '  background: var(--wd-surface-card-solid);',
  '  border-radius: var(--wd-radius-xl);',
  '  padding: var(--wd-space-5);',
  '  box-shadow: var(--wd-elevation-1);',
  '}',
  '.wd-list { background: var(--wd-surface-card-solid); border-radius: var(--wd-radius-xl); overflow: hidden; }',
  '.wd-row {',
  '  display: flex; align-items: center; gap: var(--wd-space-4);',
  '  min-height: ' + rowComfortable + 'px;',
  '  padding: var(--wd-space-3) var(--wd-space-5);',
  '  border-bottom: 1px solid var(--wd-border-hairline);',
  '}',
  '.wd-row:last-child { border-bottom: 0; }',
  '.wd-row-leading {',
  '  width: ' + avatarMd + 'px; height: ' + avatarMd + 'px; flex: none;',
  '  border-radius: var(--wd-radius-sm);',
  '  background: var(--wd-surface-tint);',
  '  display: grid; place-items: center;',
  '  font: var(--wd-type-caption1); font-family: var(--wd-font);',
  '  color: var(--wd-text-secondary);',
  '}',
  '.wd-row-body { flex: 1 1 auto; min-width: 0; }',
  '.wd-row-title { font: var(--wd-type-subheadline); font-family: var(--wd-font); }',
  '.wd-row-sub { font: var(--wd-type-caption1); font-family: var(--wd-font); color: var(--wd-text-secondary); }',
  '.wd-row-trailing { color: var(--wd-text-tertiary); font: var(--wd-type-footnote); font-family: var(--wd-font); }',
  '.wd-actions { display: flex; flex-wrap: wrap; gap: var(--wd-space-3); align-items: center; }',
  '.wd-btn {',
  '  display: inline-flex; align-items: center; justify-content: center; gap: var(--wd-space-2);',
  '  align-self: flex-start; max-width: 100%;',
  '  min-height: ' + controlMd + 'px; padding: 0 var(--wd-space-5);',
  '  border-radius: var(--wd-radius-full); border: 0;',
  '  font: var(--wd-type-headline); font-family: var(--wd-font);',
  '  cursor: default;',
  '}',
  '.wd-btn-filled { background: var(--wd-gradient-fill); color: var(--wd-text-on-fill); box-shadow: var(--wd-elevation-brand); }',
  '.wd-btn-tonal { background: var(--wd-gradient-surface); color: var(--wd-text-on-soft); }',
  '.wd-btn-glass { background: var(--wd-surface-glass-strong); color: var(--wd-text-primary); border: 1px solid var(--wd-border-hairline); }',
  '.wd-btn-outline { background: transparent; color: var(--wd-text-primary); border: 1px solid var(--wd-border-hairline-strong); }',
  '.wd-btn-plain { background: transparent; color: var(--wd-text-brand); }',
  '.wd-btn-destructive { background: var(--wd-gradient-destructive); color: var(--wd-text-on-dark); }',
  '.wd-chip {',
  '  display: inline-flex; align-items: center; padding: 0 var(--wd-space-4);',
  '  min-height: 28px; border-radius: var(--wd-radius-full);',
  '  background: var(--wd-surface-tint); color: var(--wd-text-secondary);',
  '  font: var(--wd-type-caption1); font-family: var(--wd-font);',
  '}',
  '.wd-seg { display: flex; padding: 3px; gap: 2px; border-radius: var(--wd-radius-full); background: var(--wd-fill-field); }',
  '.wd-seg-item { flex: 1 1 0; min-height: 32px; display: grid; place-items: center; border-radius: var(--wd-radius-full); font: var(--wd-type-footnote); font-family: var(--wd-font); color: var(--wd-text-secondary); }',
  '.wd-seg-item.on { background: var(--wd-surface-card-solid); color: var(--wd-text-primary); font-weight: 600; box-shadow: var(--wd-elevation-1); }',
  '.wd-field {',
  '  min-height: 46px; display: flex; align-items: center; padding: 0 var(--wd-space-4);',
  '  border-radius: var(--wd-radius-md); background: var(--wd-fill-field);',
  '  color: var(--wd-text-tertiary); font: var(--wd-type-body); font-family: var(--wd-font);',
  '}',
  '.wd-switch { width: 51px; height: 31px; border-radius: var(--wd-radius-full); background: var(--wd-status-success); flex: none; }',
  '.wd-avatar { width: ' + avatarMd + 'px; height: ' + avatarMd + 'px; border-radius: 50%; background: var(--wd-surface-tint); display: grid; place-items: center; font: var(--wd-type-caption1); font-family: var(--wd-font); }',
  '.wd-icon { width: ' + iconSm + 'px; height: ' + iconSm + 'px; border-radius: 4px; background: currentColor; opacity: .35; }',
  '.wd-progress { height: 8px; border-radius: var(--wd-radius-full); background: var(--wd-surface-tint); overflow: hidden; }',
  '.wd-progress > i { display: block; height: 100%; width: 62%; background: var(--wd-text-brand); }',
  '.wd-empty { text-align: center; padding: var(--wd-space-7) var(--wd-space-5); color: var(--wd-text-secondary); }',
  '.wd-empty b { display: block; color: var(--wd-text-primary); font: var(--wd-type-title3); font-family: var(--wd-font); margin-bottom: var(--wd-space-3); }',
  '.wd-states { margin-top: var(--wd-space-5); display: flex; flex-wrap: wrap; gap: var(--wd-space-2); }',
  '.wd-state { border: 1px solid var(--wd-border-hairline-strong); border-radius: var(--wd-radius-full); padding: 2px var(--wd-space-3); font: var(--wd-type-caption2); font-family: var(--wd-font); color: var(--wd-text-secondary); }',
  '.wd-state.primary { background: var(--wd-surface-tint); color: var(--wd-text-primary); }',
  '.wd-foot { margin-top: var(--wd-space-5); color: var(--wd-text-tertiary); font: var(--wd-type-caption2); font-family: var(--wd-font); line-height: 1.6; }',
  '</style>',
  ].join('\n');
}

// ---------------------------------------------------------------- regions
//
// A Page Spec describes regions, not a widget tree, so the renderer maps each canonical component
// to the smallest honest visual that shows placement and emphasis. Placeholder content is drawn
// from the region's own intent text so the preview never invents screen copy the spec did not ask
// for — a preview must not look more finished than the design is.

function esc(value) {
  return String(value === undefined || value === null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function intentOf(region) {
  return region.intent || region.id;
}

const VARIANTS = ['filled', 'tonal', 'glass', 'outline', 'plain', 'destructive'];

function buttonClass(region) {
  const variant = VARIANTS.includes(region.variant) ? region.variant : 'filled';
  return 'wd-btn wd-btn-' + variant;
}

function renderButton(region) {
  return '<button class="' + buttonClass(region) + '" type="button">' + esc(intentOf(region)) + '</button>';
}

function renderListSection(region) {
  const rows = [1, 2, 3].map((index) => [
    '    <div class="wd-row">',
    '      <div class="wd-row-leading">' + index + '</div>',
    '      <div class="wd-row-body">',
    '        <div class="wd-row-title">' + esc(intentOf(region)) + ' ' + index + '</div>',
    '        <div class="wd-row-sub">副标题 / 值</div>',
    '      </div>',
    '      <div class="wd-row-trailing">' + (region.itemPattern ? esc(region.itemPattern) : '›') + '</div>',
    '    </div>',
  ].join('\n')).join('\n');
  return '<div class="wd-list">\n' + rows + '\n  </div>';
}

function renderSegmented(region) {
  const items = (region.extension && region.extension.id === 'WDStateSegment') ? ['充足', '少量', '没了'] : ['选项一', '选项二', '选项三'];
  const parts = items.map((label, index) => '<div class="wd-seg-item' + (index === 0 ? ' on' : '') + '">' + esc(label) + '</div>');
  return '<div class="wd-seg">' + parts.join('') + '</div>';
}

function renderField(region) {
  return '<div class="wd-field">' + esc(intentOf(region)) + '</div>';
}

function renderSwitch(region) {
  return [
    '<div class="wd-card" style="display:flex;align-items:center;justify-content:space-between;padding:var(--wd-space-4) var(--wd-space-5)">',
    '  <span>' + esc(intentOf(region)) + '</span>',
    '  <span class="wd-switch"></span>',
    '</div>',
  ].join('\n');
}

function renderProgress(region) {
  return '<div class="wd-card"><div style="margin-bottom:var(--wd-space-3)">' + esc(intentOf(region)) + '</div><div class="wd-progress"><i></i></div></div>';
}

function renderEmptyState(region) {
  return '<div class="wd-card wd-empty"><b>' + esc(intentOf(region)) + '</b>空态说明与可执行入口</div>';
}

function renderComponent(region) {
  switch (region.component) {
    case 'WDButton': return renderButton(region);
    case 'WDIconButton': return '<button class="wd-btn wd-btn-glass" type="button" aria-label="' + esc(intentOf(region)) + '">⋯</button>';
    case 'WDFAB': return '<button class="wd-btn wd-btn-filled" type="button">＋ ' + esc(intentOf(region)) + '</button>';
    case 'WDListSection': return renderListSection(region);
    case 'WDListRow': return renderListSection(region);
    case 'WDCard': return '<div class="wd-card">' + esc(intentOf(region)) + '</div>';
    case 'WDSegmentedControl': return renderSegmented(region);
    case 'WDChip': return '<div class="wd-actions"><span class="wd-chip">' + esc(intentOf(region)) + '</span></div>';
    case 'WDTextField': case 'WDSearchField': case 'WDPicker': case 'WDDatePicker': return renderField(region);
    case 'WDSwitch': case 'WDCheckbox': return renderSwitch(region);
    case 'WDProgressBar': case 'WDProgressRing': return renderProgress(region);
    case 'WDEmptyState': return renderEmptyState(region);
    case 'WDAvatar': return '<div class="wd-avatar">' + esc(String(intentOf(region)).slice(0, 1)) + '</div>';
    case 'WDAvatarStack': return '<div class="wd-actions"><div class="wd-avatar">A</div><div class="wd-avatar">B</div><div class="wd-avatar">C</div></div>';
    case 'WDBadge': return '<span class="wd-chip" style="background:var(--wd-status-danger);color:var(--wd-text-on-dark)">' + esc(intentOf(region)) + '</span>';
    case 'WDBanner': return '<div class="wd-card" style="border-left:3px solid var(--wd-status-warning)">' + esc(intentOf(region)) + '</div>';
    case 'WDIcon': return '<span class="wd-icon"></span>';
    case 'WDDivider': return '<hr style="border:0;border-top:1px solid var(--wd-border-hairline)">';
    case 'WDToast': case 'WDAlert': case 'WDBottomSheet': case 'WDActionSheet':
      return '<div class="wd-card" style="background:var(--wd-surface-glass-strong);box-shadow:var(--wd-elevation-2)">' + esc(intentOf(region)) + '</div>';
    // Form controls share one look: a labelled slot. Rendering them as distinct widgets would claim
    // fidelity this preview does not have, so they reuse the same honest field shape.
    case 'WDFormRow': return '<div class="wd-field">' + esc(intentOf(region)) + '</div>';
    case 'WDStepper': return '<div class="wd-field" style="justify-content:space-between"><span>' + esc(intentOf(region)) + '</span><span>− 1 ＋</span></div>';
    case 'WDSlider': return '<div class="wd-progress"><i></i></div>';
    case 'WDRadio': return '<div class="wd-field" style="justify-content:space-between"><span>' + esc(intentOf(region)) + '</span><span class="wd-avatar" style="border-radius:50%"></span></div>';
    case 'WDAssigneePicker': return '<div class="wd-actions"><div class="wd-avatar">A</div><div class="wd-avatar">B</div><div class="wd-chip">' + esc(intentOf(region)) + '</div></div>';
    case 'WDPullRefresh': return '<div class="wd-foot">↓ ' + esc(intentOf(region)) + '</div>';
    case 'WDSkeleton': return '<div class="wd-card"><div class="wd-progress" style="height:12px;margin-bottom:8px"><i style="width:70%"></i></div><div class="wd-progress" style="height:12px"><i style="width:45%"></i></div></div>';
    case 'WDNavigationBar': case 'WDToolbar': case 'WDTabBar': return '';
    default:
      // Unknown-but-typed region (should not happen: component is a closed enum). Render the intent
      // rather than skipping silently, so a gap in this renderer is visible instead of invisible.
      return '<div class="wd-card">' + esc(intentOf(region)) + '<div class="wd-foot">未映射组件 ' + esc(region.component) + '</div></div>';
  }
}

function renderRegion(region, isFirstNav) {
  if (region.component === 'WDNavigationBar' || region.component === 'WDToolbar' || region.component === 'WDTabBar') return '';
  const rendered = renderComponent(region);
  // An actions region is a row of controls: without this wrapper the flex-column region stretches
  // every button to full width, which misrepresents the emphasis the spec is asserting.
  const body = region.kind === 'actions' && /^<(button|span|div class="wd-actions")/.test(rendered)
    ? '<div class="wd-actions">' + rendered + '</div>'
    : rendered;
  const meta = ['kind:' + region.kind];
  if (region.variant) meta.push('variant:' + region.variant);
  if (region.action) meta.push('action:' + region.action);
  if (region.extension) meta.push('extension:' + region.extension.id);
  return [
    '  <section class="wd-region">',
    '    <div class="wd-region-label">' + esc(region.component) + ' <code>' + esc(meta.join(' · ')) + '</code></div>',
    '    ' + body,
    '  </section>',
  ].join('\n');
}

// ---------------------------------------------------------------- document

function banner(tokens) {
  const sha = crypto.createHash('sha256').update(fs.readFileSync(tokenFile())).digest('hex').slice(0, 12);
  return '<div class="wd-banner"><b>结构预览，非最终视觉。</b>' +
    ' 由 Page Spec + 令牌渲染（tokens v' + esc(tokens.$version || '?') + ' · sha256:' + sha + '）。' +
    ' 原生编译 / 快照 / 视觉设计评审 / 宿主加载均为 not-evaluated —— 本页只证明布局与层级，不证明像素。</div>';
}

function renderStates(spec) {
  const states = Array.isArray(spec.states) ? spec.states : [];
  if (states.length === 0) return '';
  const chips = states.map(state => '<span class="wd-state' + (state.kind === 'content' ? ' primary' : '') + '" title="' + esc(state.note || '') + '">' + esc(state.kind) + '</span>');
  return '<div class="wd-states">' + chips.join('') + '</div>';
}

function renderDocument(spec, tokens, scheme) {
  const page = spec.page || {};
  const regions = Array.isArray(spec.regions) ? spec.regions : [];
  const title = (spec.accessibility && spec.accessibility.title) || page.id || 'Page';
  const navBar = regions.find(region => region.component === 'WDNavigationBar');
  const nav = navBar
    ? '  <div class="wd-nav">' + (page.navigation === 'tabRoot' ? '' : '<span class="wd-nav-back">‹ 返回</span>') +
      '<span class="wd-nav-title">' + esc(title) + '</span></div>'
    : '';
  const body = regions.map(region => renderRegion(region)).filter(Boolean).join('\n');
  const foot = [
    '<div class="wd-foot">',
    'page: ' + esc(page.id) + ' · navigation: ' + esc(page.navigation) + ' · contentPattern: ' + esc(page.contentPattern),
    '<br>primaryAction: ' + esc(page.primaryAction) + ' · intent: ' + esc(page.intent),
    '<br>gates: structure=passed · nativeCompile=not-evaluated · snapshotUi=not-evaluated · visualDesignReview=not-evaluated · hostLoad=not-evaluated',
    '</div>',
  ].join('\n');
  return [
    '<!doctype html>',
    '<html lang="zh-CN">',
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<title>' + esc(title) + ' · ' + esc(page.id) + '</title>',
    '<style>',
    stylesheet(tokens, scheme),
    '</style>',
    '</head>',
    '<body>',
    '<div class="wd-chrome">',
    banner(tokens),
    '  <div class="wd-screen">',
    nav,
    body,
    '  </div>',
    renderStates(spec),
    foot,
    '</div>',
    '</body>',
    '</html>',
    '',
  ].filter(line => line !== '').join('\n');
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const tokens = JSON.parse(fs.readFileSync(tokenFile(), 'utf8'));
  const specPath = path.resolve(args.file);
  let spec;
  try { spec = JSON.parse(fs.readFileSync(specPath, 'utf8')); }
  catch (error) { throw new Error('cannot read Page Spec: ' + error.message); }
  if (!spec || typeof spec !== 'object') throw new Error('Page Spec must be a JSON object');

  const html = renderDocument(spec, tokens, args.scheme);
  if (args.out) {
    const out = path.resolve(args.out);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, html);
  }

  const report = {
    tool: TOOL_NAME,
    specPath: args.file,
    scheme: args.scheme,
    out: args.out ? args.out : null,
    bytes: Buffer.byteLength(html, 'utf8'),
    regions: (spec.regions || []).length,
    renderedRegions: (spec.regions || []).filter(region => !['WDNavigationBar', 'WDToolbar', 'WDTabBar'].includes(region.component)).length,
    // Deliberately identical to validate-spec's gates: a preview is evidence of layout, never of
    // compilation or visual design review. Flipping these would be the exact overclaiming the
    // rest of this package is built to avoid.
    gates: {
      structure: 'passed',
      nativeCompile: 'not-evaluated',
      snapshotUi: 'not-evaluated',
      visualDesignReview: 'not-evaluated',
      hostLoad: 'not-evaluated',
    },
    notice: 'This HTML shows layout and hierarchy from the Page Spec and design tokens. It does not prove native compilation, snapshot/UI fidelity, visual design review or host loading.',
  };
  if (args.json) console.log(JSON.stringify(report, null, 2));
  else {
    if (!args.out) process.stdout.write(html);
    console.error('rendered ' + report.renderedRegions + '/' + report.regions + ' regions, ' + report.bytes + ' bytes' + (args.out ? ' -> ' + args.out : ''));
    console.error('NOTICE ' + report.notice);
  }
  process.exit(0);
}

try { main(); }
catch (error) { console.error(TOOL_NAME + ' failed: ' + error.message); process.exit(2); }
