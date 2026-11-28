'use strict';
// Design-token resolver shared by the extractor (build-time gate) and the catalog generator
// (rendering values into cards). One implementation so a token name that the gate accepts is
// exactly a token name the card can print — a divergence would let a card quote a number the
// gate never checked.
//
// Accepted spellings (the specs use all of them):
//   semantic.<scheme>.<group>.<key>   full path
//   <group>.<key>                     semantic, scheme resolved per call
//   type.<key>                        -> typography.<key>
//   derived.<key>                     -> color.derived.<key>
//   radius.* / space.* / size.* / elevation.* / motion.* / state.* / material.* / typography.*
//                                    top-level groups
const fs = require('fs');
const path = require('path');

const TOP_LEVEL_GROUPS = ['color', 'gradient', 'wash', 'member', 'semantic', 'typography', 'space', 'radius', 'size', 'elevation', 'material', 'motion', 'state', 'schemes'];
const ALIASES = [
  { prefix: 'type.', target: 'typography.' },
  { prefix: 'derived.', target: 'color.derived.' }
];

function readTokens(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }

function walk(node, parts) {
  let current = node;
  for (const part of parts) {
    if (current === null || typeof current !== 'object') return undefined;
    if (!Object.prototype.hasOwnProperty.call(current, part)) return undefined;
    current = current[part];
  }
  return current;
}

function expand(name) {
  for (const alias of ALIASES) {
    if (name.startsWith(alias.prefix)) return alias.target + name.slice(alias.prefix.length);
  }
  return name;
}

// Returns { path, value, description, scheme } or null. A group node (no $value) counts as
// unresolved: quoting a group where a number belongs is a bug, not a hit.
function resolve(document, name, scheme) {
  const expanded = expand(String(name));
  const parts = expanded.split('.').filter(Boolean);
  if (parts.length < 2) return null;
  const candidates = [];
  const isSemanticShorthand = TOP_LEVEL_GROUPS.includes(parts[0]) && parts[0] === 'semantic' ? false : TOP_LEVEL_GROUPS.includes(parts[0]);
  if (isSemanticShorthand && scheme) candidates.push(['semantic', scheme].concat(parts));
  else if (scheme) candidates.push(['semantic', scheme].concat(parts));
  candidates.push(parts);
  if (scheme) candidates.push(['semantic', scheme === 'light' ? 'dark' : 'light'].concat(parts));

  for (const candidate of candidates) {
    const node = walk(document, candidate);
    if (node && typeof node === 'object' && Object.prototype.hasOwnProperty.call(node, '$value')) {
      const resolvedScheme = candidate[0] === 'semantic' ? candidate[1] : null;
      return { path: candidate.join('.'), value: node.$value, description: node.$description || null, scheme: resolvedScheme };
    }
  }
  return null;
}

// Cards are read by designers, so a composite token must be legible rather than dumped as JSON.
// typography -> `17/22 · 600`, elevation -> `0 6 16 #1677B32E`, gradients stay verbatim.
function renderValue(value) {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return JSON.stringify(value);
  if (value && typeof value === 'object') {
    if (value.fontSize !== undefined) {
      const parts = [value.fontSize + '/' + value.lineHeight];
      if (value.fontWeight !== undefined) parts.push(String(value.fontWeight));
      return parts.join(' · ');
    }
    if (Array.isArray(value.layers)) {
      return value.layers.map(layer => [layer.x, layer.y, layer.blur, layer.color].filter(part => part !== undefined).join(' ')).join(' ; ');
    }
  }
  return JSON.stringify(value);
}

// Human-facing rendering: semantic colours show the dark counterpart only when it actually
// differs, so a card never implies two values are equal when they are not, and never repeats
// a value that is the same.
function formatValue(document, name, scheme) {
  const primary = resolve(document, name, scheme || 'light');
  if (!primary) return null;
  const other = resolve(document, name, scheme === 'dark' ? 'light' : 'dark');
  const same = other && JSON.stringify(other.value) === JSON.stringify(primary.value);
  if (primary.scheme && other && other.scheme && !same) {
    return '浅 ' + renderValue(primary.value) + ' / 深 ' + renderValue(other.value);
  }
  return renderValue(primary.value);
}

module.exports = { readTokens, resolve, formatValue, renderValue, expand, TOP_LEVEL_GROUPS, ALIASES };
