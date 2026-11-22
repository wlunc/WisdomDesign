'use strict';
// Minimal YAML subset parser for contracts/WD*.yaml (maps, sequences, inline arrays,
// quoted scalars, null/bool/number). Deliberately rejects unsupported YAML features so a
// future contract cannot silently bypass extraction.

function stripComment(line) {
  let quote = null;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (quote) {
      if (ch === '\\') { i += 1; continue; }
      if (ch === quote) quote = null;
    } else if (ch === '"' || ch === "'") {
      quote = ch;
    } else if (ch === '#') {
      return line.slice(0, i).replace(/\s+$/, '');
    }
  }
  return line.replace(/\s+$/, '');
}

function splitInline(text) {
  const parts = [];
  let current = '';
  let quote = null;
  let depth = 0;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quote) {
      current += ch;
      if (ch === '\\') { current += text[++i] || ''; continue; }
      if (ch === quote) quote = null;
    } else if (ch === '"' || ch === "'") {
      quote = ch; current += ch;
    } else if (ch === '[' || ch === '(' || ch === '<') {
      depth += 1; current += ch;
    } else if (ch === ']' || ch === ')' || ch === '>') {
      depth = Math.max(0, depth - 1); current += ch;
    } else if (ch === ',' && depth === 0) {
      parts.push(current.trim()); current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim() !== '') parts.push(current.trim());
  return parts;
}

function scalar(text) {
  const value = text.trim();
  if (value === '' || value === '~' || value === 'null') return null;
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === '{}') return {};
  if (value === '[]') return [];
  if (value.startsWith('[') && value.endsWith(']')) {
    return splitInline(value.slice(1, -1)).map(scalar);
  }
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    const inner = value.slice(1, -1);
    return value[0] === '"' ? inner.replace(/\\"/g, '"').replace(/\\\\/g, '\\') : inner.replace(/''/g, "'");
  }
  if (/^-?\d+$/.test(value)) return Number(value);
  if (/^-?\d+\.\d+$/.test(value)) return Number(value);
  if (value.startsWith('&') || value.startsWith('*') || value === '|' || value === '>') {
    throw new Error('unsupported YAML feature: ' + value);
  }
  return value;
}

function parseYaml(text) {
  const raw = text.replace(/\r\n/g, '\n').split('\n');
  const lines = [];
  for (let i = 0; i < raw.length; i += 1) {
    const stripped = stripComment(raw[i]);
    if (stripped.trim() === '' || stripped.trim() === '---') continue;
    const indent = stripped.match(/^ */)[0].length;
    lines.push({ indent, text: stripped.slice(indent), line: i + 1 });
  }
  let index = 0;
  function parseBlock(indent) {
    if (index >= lines.length) return null;
    const isList = lines[index].text.startsWith('- ');
    return isList ? parseList(indent) : parseMap(indent);
  }
  function parseMap(indent) {
    const out = {};
    while (index < lines.length && lines[index].indent === indent) {
      const entry = lines[index];
      if (entry.text.startsWith('- ')) break;
      const colon = findColon(entry.text);
      if (colon < 0) throw new Error('invalid YAML mapping at line ' + entry.line + ': ' + entry.text);
      const key = entry.text.slice(0, colon).trim();
      const rest = entry.text.slice(colon + 1).trim();
      index += 1;
      if (rest === '') {
        if (index < lines.length && lines[index].indent > indent) out[key] = parseBlock(lines[index].indent);
        else out[key] = null;
      } else {
        out[key] = scalar(rest);
      }
    }
    return out;
  }
  function parseList(indent) {
    const out = [];
    while (index < lines.length && lines[index].indent === indent && lines[index].text.startsWith('- ')) {
      const entry = lines[index];
      const rest = entry.text.slice(2).trim();
      index += 1;
      if (rest === '') {
        out.push(index < lines.length && lines[index].indent > indent ? parseBlock(lines[index].indent) : null);
        continue;
      }
      const colon = findColon(rest);
      if (colon > 0) {
        const item = {};
        const key = rest.slice(0, colon).trim();
        const value = rest.slice(colon + 1).trim();
        item[key] = value === '' ? null : scalar(value);
        if (index < lines.length && lines[index].indent > indent) {
          const child = parseBlock(lines[index].indent);
          if (child && typeof child === 'object' && !Array.isArray(child)) Object.assign(item, child);
        }
        out.push(item);
      } else {
        out.push(scalar(rest));
      }
    }
    return out;
  }
  function findColon(text) {
    let quote = null;
    let depth = 0;
    for (let i = 0; i < text.length; i += 1) {
      const ch = text[i];
      if (quote) { if (ch === quote) quote = null; continue; }
      if (ch === '"' || ch === "'") { quote = ch; continue; }
      if (ch === '[' || ch === '(' || ch === '<') depth += 1;
      else if (ch === ']' || ch === ')' || ch === '>') depth = Math.max(0, depth - 1);
      else if (ch === ':' && depth === 0) return i;
    }
    return -1;
  }
  const value = parseBlock(0);
  if (index !== lines.length) throw new Error('unexpected YAML at line ' + lines[index].line);
  return value;
}

module.exports = { parseYaml };
