#!/usr/bin/env node
'use strict';
// M1-1 read-only design truth extractor (JavaScript; no Ruby dependency).
// Uses lib/simple-yaml.js; never writes source files.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { parseYaml } = require('./simple-yaml');
const tokenIndex = require('./token-index');

const VERSION = '1.0';
const EXPECTED_COMPONENT_COUNT = 37;
const DESIGN_ROOT = path.resolve(__dirname, '..', '..', '..');
const AI_ROOT = path.join(DESIGN_ROOT, 'ai', 'skill');
const OVERLAY_ROOT = path.join(AI_ROOT, 'component-overlays');
const SPEC_FILES = ['01-basic.md', '02-advanced.md', '03-patterns.md'];
const FORMAL_SECTIONS = Array.from({ length: 12 }, (_, i) => i + 1);
const RECIPE_IDS = ['R1', 'R2', 'R3', 'R4', 'R5'];

class ExtractError extends Error {
  constructor(issues) { super(issues.length === 1 ? issues[0] : issues.length + ' extraction errors'); this.issues = issues; }
}
const rel = (file) => path.relative(DESIGN_ROOT, file).split(path.sep).join('/');
const sha256 = (data) => crypto.createHash('sha256').update(data).digest('hex');
const sha256File = (file) => sha256(fs.readFileSync(file));
const readText = (file) => { try { return fs.readFileSync(file, 'utf8'); } catch (e) { throw new ExtractError([rel(file) + ': 无法读取：' + e.message]); } };
const sourceRef = (file, line) => ({ path: rel(file), line });
const lineRef = (file, entry) => sourceRef(file, entry[0] + 1);

function splitSections(lines, pattern) {
  const sections = [];
  let current = null;
  lines.forEach((line, index) => {
    const match = line.match(pattern);
    if (match) {
      current = { id: match[1], name: match[2], headerLine: index + 1, lines: [] };
      sections.push(current);
    } else if (current) {
      current.lines.push([index, line]);
    } else if (/^# /.test(line)) current = null;
  });
  return sections;
}
function subsectionRange(sectionLines, number) {
  let start = null;
  let finish = sectionLines.length;
  for (let i = 0; i < sectionLines.length; i += 1) {
    const line = sectionLines[i][1];
    if (new RegExp('^### ' + number + '\\. ').test(line)) start = i + 1;
    else if (start !== null && /^### \d+\. /.test(line)) { finish = i; break; }
  }
  return start === null ? null : [start, finish];
}
function extractPurpose(section, file) {
  const range = subsectionRange(section.lines, 1);
  const issues = [];
  if (!range) { issues.push(rel(file) + ': ' + section.name + ' 缺少规格 §1'); return [{ summary: '', bullets: [], notes: [], sourceRefs: [] }, issues]; }
  const [start, finish] = range;
  const body = section.lines.slice(start, finish);
  const headingEntry = section.lines[start - 1];
  if (body.length === 0 || body.every(([, line]) => line.trim() === '')) {
    issues.push(rel(file) + ': ' + section.name + ' 规格 §1 为空');
    return [{ summary: '', bullets: [], notes: [], sourceRefs: [] }, issues];
  }
  let summary = '';
  let summaryRef = null;
  const bullets = [];
  const notes = [];
  let lastBodyEntry = null;
  for (const [absoluteIndex, line] of body) {
    const stripped = line.trim();
    if (stripped === '') continue;
    lastBodyEntry = [absoluteIndex, line];
    let match;
    if ((match = stripped.match(/^- \*\*不要用\*\*[：:]\s*(.*)$/))) {
      bullets.push({ kind: 'avoid', text: match[1].trim(), lineText: stripped, sourceRef: sourceRef(file, absoluteIndex + 1) });
    } else if ((match = stripped.match(/^- \*\*用\*\*[：:]\s*(.*)$/))) {
      const text = match[1].trim();
      if (text) bullets.push({ kind: 'use', text, lineText: stripped, sourceRef: sourceRef(file, absoluteIndex + 1) });
    } else if ((match = stripped.match(/^- (.*)$/))) {
      notes.push({ text: match[1].trim(), lineText: stripped, sourceRef: sourceRef(file, absoluteIndex + 1) });
    } else if (summary === '') {
      summary = stripped;
      summaryRef = { path: rel(file), line: absoluteIndex + 1, lineText: stripped };
    }
  }
  if (summary === '') {
    summary = body[0][1].trim();
    summaryRef = { path: rel(file), line: body[0][0] + 1, lineText: body[0][1].trim() };
  }
  if (summary === '') issues.push(rel(file) + ': ' + section.name + ' 规格 §1 缺少用途摘要');
  const avoidInBody = body.some(([, line]) => line.includes('不要用') || line.includes('不要混在'));
  if (!bullets.some((b) => b.kind === 'avoid') && !avoidInBody) issues.push(rel(file) + ': ' + section.name + ' 规格 §1 缺少反例（不要用）');
  const refs = [
    { path: rel(file), line: headingEntry[0] + 1, lineText: headingEntry[1].trim() },
    summaryRef,
    lastBodyEntry ? { ...lineRef(file, lastBodyEntry), lineText: lastBodyEntry[1].trim() } : null,
  ].filter(Boolean);
  refs.push(...bullets.map((b) => ({ ...b.sourceRef, lineText: b.lineText })));
  refs.push(...notes.map((n) => ({ ...n.sourceRef, lineText: n.lineText })));
  const unique = [];
  const seen = new Set();
  for (const ref of refs) { const key = JSON.stringify(ref); if (!seen.has(key)) { seen.add(key); unique.push(ref); } }
  return [{ summary, summaryRef, bullets, notes, sourceRefs: unique }, issues];
}
// §2/§3/§4 carry editorial decision records as blockquotes (`> **2026-11-14 用户裁决…**`).
// They are narrative, not component anatomy: quoting them as table rows produced fragments like
// "`> `（`border.glass-top`）。这是…" and buried the actual anatomy rows. They stay reachable
// through 来源追溯, which already lists every line of the section.
function extractConclusions(section, file, number, options) {
  const skipBlockquotes = Boolean(options && options.skipBlockquotes);
  const range = subsectionRange(section.lines, number);
  if (!range) return null;
  const [start, finish] = range;
  const body = section.lines.slice(start, finish);
  const headingEntry = section.lines[start - 1];
  const items = [];
  let headerCells = null;
  for (const [absoluteIndex, line] of body) {
    const stripped = line.trim();
    if (stripped === '') continue;
    if (skipBlockquotes && stripped.startsWith('>')) continue;
    let text;
    if (stripped.startsWith('|')) {
      const cells = stripped.split('|').map((c) => c.trim()).filter((c) => c !== '');
      if (cells.length === 0 || cells.every((c) => /^:?-{3,}:?$/.test(c))) continue;
      // A section may hold more than one table (§4 often pairs a variant table with prose).
      // Without this reset the second table's header row was consumed as data and every later
      // row inherited the wrong column names.
      if (headerCells === null) { headerCells = cells; continue; }
      text = cells.map((cell, index) => headerCells[index] ? headerCells[index] + '=' + cell : cell).join('; ');
    } else if (stripped.startsWith('- ')) {
      headerCells = null;
      text = stripped.replace(/^-\s*/, '');
    } else { headerCells = null; text = stripped; }
    items.push({ text, lineText: stripped, sourceRef: sourceRef(file, absoluteIndex + 1) });
  }
  if (items.length === 0) return null;
  const refs = [{ path: rel(file), line: headingEntry[0] + 1, lineText: headingEntry[1].trim() }];
  refs.push(...items.map((item) => ({ ...item.sourceRef, lineText: item.lineText })));
  return { heading: headingEntry[1].trim(), items, sourceRefs: refs };
}
function parseJsonFile(file, issues) {
  try { return JSON.parse(readText(file)); } catch (e) { if (e instanceof ExtractError) throw e; issues.push(rel(file) + ': JSON 解析失败：' + e.message); return null; }
}
function loadSpecs(issues) {
  const specs = {};
  for (const filename of SPEC_FILES) {
    const file = path.join(DESIGN_ROOT, 'docs', 'specs', filename);
    const lines = readText(file).replace(/\r\n/g, '\n').split('\n');
    for (const section of splitSections(lines, /^# (\d+) · (.+)$/)) {
      const name = section.name.trim();
      let componentId = 'WD' + name;
      if (componentId === 'WDPullToRefresh') componentId = 'WDPullRefresh';
      if (Object.prototype.hasOwnProperty.call(specs, componentId)) { issues.push('docs/specs: 规格重复 ' + componentId); continue; }
      const [purpose, purposeIssues] = extractPurpose(section, file);
      issues.push(...purposeIssues);
      const missingSections = FORMAL_SECTIONS.filter((n) => !subsectionRange(section.lines, n));
      if (missingSections.length) issues.push(rel(file) + ': ' + componentId + ' 缺少正式章节 ' + missingSections.join(','));
      const conclusions = {
        states: extractConclusions(section, file, 5),
        content: extractConclusions(section, file, 7),
        accessibility: extractConclusions(section, file, 10),
      };
      // §2 anatomy / §3 size / §4 variants are the only place the specs state what a component
      // is made of and how big it is. They were never extracted, which is why a card could talk
      // about a component's purpose but never let a designer draw it (P0-1).
      const visualOptions = { skipBlockquotes: true };
      const visual = {
        anatomy: extractConclusions(section, file, 2, visualOptions),
        size: extractConclusions(section, file, 3, visualOptions),
        variants: extractConclusions(section, file, 4, visualOptions),
      };
      for (const [key, block] of Object.entries(visual)) {
        if (!block) issues.push(rel(file) + ': ' + componentId + ' 缺少视觉结论（§' + { anatomy: 2, size: 3, variants: 4 }[key] + '）');
      }
      for (const [key, block] of Object.entries(conclusions)) {
        if (!block) issues.push(rel(file) + ': ' + componentId + ' 缺少' + key + '结论（§' + { states: 5, content: 7, accessibility: 10 }[key] + '）');
      }
      const sectionLines = {};
      for (const n of FORMAL_SECTIONS) {
        const range = subsectionRange(section.lines, n);
        sectionLines[String(n)] = range ? [section.headerLine + range[0], section.headerLine + range[1]] : null;
      }
      specs[componentId] = { component: componentId, specNumber: Number(section.id), specName: name, path: rel(file), headingLine: section.headerLine, purpose, conclusions, visual, sectionLines };
    }
    const recipes = splitSections(lines, /^# (R[1-5]) · (.+)$/);
    if (recipes.length === 0) continue;
    const recipeIds = recipes.map((r) => r.id);
    const unexpected = recipeIds.filter((id) => !RECIPE_IDS.includes(id));
    if (unexpected.length) issues.push(rel(file) + ': 未知配方 ID ' + unexpected.join(','));
    const missingRecipes = RECIPE_IDS.filter((id) => !recipeIds.includes(id));
    if (missingRecipes.length) issues.push(rel(file) + ': 缺少配方 ' + missingRecipes.join(','));
  }
  const missingContracts = Object.keys(specs).filter((component) => !fs.existsSync(path.join(DESIGN_ROOT, 'contracts', component + '.yaml')));
  if (missingContracts.length) issues.push('docs/specs: 正式规格引用了不存在的 YAML ' + missingContracts.join(','));
  return specs;
}
function loadContracts(componentIds, issues) {
  const contracts = {};
  const files = fs.readdirSync(path.join(DESIGN_ROOT, 'contracts')).filter((f) => /^WD.*\.yaml$/.test(f)).sort();
  for (const filename of files) {
    const file = path.join(DESIGN_ROOT, 'contracts', filename);
    let document;
    try { document = parseYaml(readText(file)); } catch (e) { issues.push(filename + ': YAML 解析失败：' + e.message); continue; }
    if (!document || typeof document !== 'object' || Array.isArray(document)) { issues.push(filename + ': YAML 顶层必须是 Hash'); continue; }
    const component = document.component;
    if (typeof component !== 'string' || component.trim() === '') { issues.push(filename + ': component 必须是非空字符串'); continue; }
    if (component !== path.basename(filename, '.yaml')) issues.push(filename + ': component ' + component + ' 与文件名不一致');
    if (Object.prototype.hasOwnProperty.call(contracts, component)) { issues.push(filename + ': 重复 component ' + component); continue; }
    for (const key of ['params', 'slots', 'default', 'enums']) if (!Object.prototype.hasOwnProperty.call(document, key)) issues.push(filename + ': 缺少 ' + key);
    const params = document.params;
    if (Array.isArray(params)) {
      const names = params.filter((p) => p && typeof p === 'object').map((p) => p.name);
      const duplicates = names.filter((name, i) => names.indexOf(name) !== i);
      if (duplicates.length) issues.push(filename + ': params.name 重复 ' + [...new Set(duplicates)].join(','));
    } else issues.push(filename + ': params 必须是数组');
    const slots = document.slots;
    if (!(slots === '无' || Array.isArray(slots))) issues.push(filename + ': slots 必须是数组或 无');
    const enumNames = document.enums && typeof document.enums === 'object' && !Array.isArray(document.enums) ? Object.keys(document.enums) : [];
    contracts[component] = { component, path: rel(file), sha256: sha256File(file), params: Array.isArray(params) ? params : [], slots, default: document.default, enums: document.enums, enumNames };
  }
  if (files.length !== EXPECTED_COMPONENT_COUNT) issues.push('contracts: 期望 ' + EXPECTED_COMPONENT_COUNT + ' 个 WD*.yaml，实际 ' + files.length);
  const missingSpecs = Object.keys(contracts).filter((c) => !componentIds.includes(c));
  if (missingSpecs.length) issues.push('contracts: YAML 组件缺少正式规格 ' + missingSpecs.join(','));
  const missingYaml = componentIds.filter((c) => !Object.prototype.hasOwnProperty.call(contracts, c));
  if (missingYaml.length) issues.push('contracts: 正式规格缺少 YAML ' + missingYaml.join(','));
  return contracts;
}
function loadTokens(issues) {
  const file = path.join(DESIGN_ROOT, 'tokens', 'wisdom.tokens.json');
  const document = parseJsonFile(file, issues);
  if (!document || typeof document !== 'object') return {};
  return {
    path: rel(file), sha256: sha256File(file), version: document.$version, description: document.$description,
    schemeNames: Object.keys(document.schemes || {}).filter((k) => !k.startsWith('$')).sort(),
    topLevelKeys: Object.keys(document).filter((k) => !k.startsWith('$')).sort(),
  };
}
function loadRuleDocument(filename, issues, requiredHeadings) {
  const file = path.join(DESIGN_ROOT, 'docs', filename);
  const text = readText(file);
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  if (lines.length && lines[lines.length - 1] === '') lines.pop();
  const missing = requiredHeadings.filter((heading) => !lines.some((line) => line.startsWith(heading)));
  if (missing.length) issues.push(rel(file) + ': 缺少章节 ' + missing.join(','));
  return { path: rel(file), sha256: sha256(text), lineCount: lines.length, requiredHeadings };
}
function loadOverlays(componentIds, issues) {
  if (!fs.existsSync(OVERLAY_ROOT)) return {};
  const overlays = {};
  const files = fs.readdirSync(OVERLAY_ROOT).filter((f) => /^WD.*\.json$/.test(f)).sort();
  for (const filename of files) {
    const component = path.basename(filename, '.json');
    const file = path.join(OVERLAY_ROOT, filename);
    if (!componentIds.includes(component)) { issues.push(rel(file) + ': 未知组件 overlay ' + component); continue; }
    const document = parseJsonFile(file, issues);
    if (!document || typeof document !== 'object' || Array.isArray(document)) continue;
    if (document.component !== component) issues.push(rel(file) + ': component 必须与文件名一致');
    const allowed = ['schemaVersion', 'component', 'searchAliases', 'combinesWith', 'pageRegions'];
    const unknown = Object.keys(document).filter((k) => !allowed.includes(k));
    if (unknown.length) issues.push(rel(file) + ': 未知 overlay 字段 ' + unknown.join(','));
    if (Object.prototype.hasOwnProperty.call(document, 'combinesWith')) {
      const refs = document.combinesWith;
      if (!Array.isArray(refs) || !refs.every((x) => typeof x === 'string')) issues.push(rel(file) + ': combinesWith 必须是字符串数组');
      else {
        const unknownRefs = [...new Set(refs)].filter((x) => !componentIds.includes(x));
        if (unknownRefs.length) issues.push(rel(file) + ': 未知组合引用 ' + unknownRefs.join(','));
      }
    }
    if (Object.prototype.hasOwnProperty.call(document, 'searchAliases') && !(Array.isArray(document.searchAliases) && document.searchAliases.every((x) => typeof x === 'string' && x.trim() !== ''))) issues.push(rel(file) + ': searchAliases 必须是非空字符串数组');
    if (Object.prototype.hasOwnProperty.call(document, 'pageRegions') && !(Array.isArray(document.pageRegions) && document.pageRegions.every((x) => typeof x === 'string' && x.trim() !== ''))) issues.push(rel(file) + ': pageRegions 必须是非空字符串数组');
    overlays[component] = document;
  }
  return overlays;
}
// Every token name a component's §2/§3/§4 mentions must resolve against the token truth source.
// This is the guard that keeps a card from quoting a number nobody can look up: without it the
// card would print a token name and leave the reader to guess the value — or worse, hardcode it.
// Names that fail here are real design-source defects (e.g. `size.touch-target-min`, renamed to
// the two-key form `touch-target-min-ios` / `-android` in M0-1), so they surface as build errors.
const TOKEN_SPAN = /`([a-z][A-Za-z0-9-]*(?:\.[A-Za-z0-9-]+)+)`/g;
function tokenRefsIn(blocks) {
  const found = [];
  for (const block of blocks) {
    if (!block || !Array.isArray(block.items)) continue;
    for (const item of block.items) {
      TOKEN_SPAN.lastIndex = 0;
      let match;
      while ((match = TOKEN_SPAN.exec(item.text)) !== null) found.push({ name: match[1], block, item });
    }
  }
  return found;
}
function resolveVisualTokens(document, component, issues) {
  const blocks = [component.visual.anatomy, component.visual.size, component.visual.variants];
  for (const ref of tokenRefsIn(blocks)) {
    const resolved = tokenIndex.resolve(document, ref.name, 'light');
    if (!resolved) {
      issues.push(component.id + ' §' + ref.item.sourceRef.line + ': 令牌无法解析 `' + ref.name + '`（' + ref.item.sourceRef.path + ':' + ref.item.sourceRef.line + '）；视觉结论必须引用 tokens/wisdom.tokens.json 里存在的路径');
      continue;
    }
    const entry = { name: ref.name, path: resolved.path, value: tokenIndex.formatValue(document, ref.name, 'light') };
    if (!Array.isArray(ref.item.tokens)) ref.item.tokens = [];
    if (!ref.item.tokens.some(token => token.name === entry.name)) ref.item.tokens.push(entry);
  }
}

function build() {
  const issues = [];
  const specs = loadSpecs(issues);
  const contracts = loadContracts(Object.keys(specs), issues);
  const overlays = loadOverlays(Object.keys(specs), issues);
  const tokens = loadTokens(issues);
  const layout = loadRuleDocument('09-layout.md', issues, ['## 1. 页面骨架', '## 2. 边距与栅格', '## 3. 纵向节奏', '## 4. 密度', '## 5. 多设备', '## 6. 键盘与安全区', '## 7. 滚动行为', '## 8. 列表长度']);
  const accessibility = loadRuleDocument('06-accessibility.md', issues, ['## 2. 四条底线', '## 3. 屏幕阅读器', '## 4. 动态字体', '## 5. 对比度']);
  const content = loadRuleDocument('07-content.md', issues, ['## 1. 三条原则', '## 2. 句式规则', '## 3. 时间与日期', '## 4. 长度上限', '## 5. 分场景写法']);
  if (issues.length) throw new ExtractError(issues);
  const tokenDocument = tokenIndex.readTokens(path.join(DESIGN_ROOT, 'tokens', 'wisdom.tokens.json'));
  const components = Object.keys(specs).sort().map((componentId) => {
    const spec = specs[componentId];
    const contract = contracts[componentId];
    const overlay = overlays[componentId] || {};
    const visual = {
      anatomy: spec.visual.anatomy, size: spec.visual.size, variants: spec.visual.variants,
    };
    resolveVisualTokens(tokenDocument, { id: componentId, visual }, issues);
    const visualRefs = Object.values(visual).flatMap(block => (block || {}).sourceRefs || []);
    const refs = [
      sourceRef(path.join(DESIGN_ROOT, spec.path), spec.headingLine),
      sourceRef(path.join(DESIGN_ROOT, contract.path), 1),
      ...spec.purpose.sourceRefs,
      ...['states', 'content', 'accessibility'].flatMap((key) => ((spec.conclusions[key] || {}).sourceRefs || [])),
      ...visualRefs,
    ];
    return {
      id: componentId, specNumber: spec.specNumber, specName: spec.specName, purpose: spec.purpose, conclusions: spec.conclusions, visual,
      contract: { path: contract.path, sha256: contract.sha256, params: contract.params, slots: contract.slots, default: contract.default, enums: contract.enums },
      overlay: {
        path: Object.prototype.hasOwnProperty.call(overlays, componentId) ? rel(path.join(OVERLAY_ROOT, componentId + '.json')) : null,
        searchAliases: overlay.searchAliases || [], combinesWith: overlay.combinesWith || [], pageRegions: overlay.pageRegions || [],
      },
      sourceRefs: refs,
    };
  });
  // The map above adds token-resolution issues per component; the earlier throw ran before it,
  // so this second check is what actually fails the build when a §2/§3/§4 token name is unknown.
  if (issues.length) throw new ExtractError(issues);
  return {
    schemaVersion: '1.0', extractorVersion: VERSION,
    policy: {
      specs: '用途、反例、状态、内容与无障碍结论唯一来自 docs/specs/01-basic.md、02-advanced.md、03-patterns.md。',
      contracts: '参数、槽位、默认值与枚举唯一来自 contracts/WD*.yaml。',
      tokens: '视觉数值唯一来自 tokens/wisdom.tokens.json；本提取器只记录版本与摘要。',
      overlay: 'overlay 只补检索关键词、组合关系和页面区域，不覆盖真源。',
      excluded: ['design/gallery/**', 'docs/02-components.md'], specAliases: { WDPullToRefresh: 'WDPullRefresh' },
    },
    counts: { components: components.length, contracts: Object.keys(contracts).length, formalSpecs: Object.keys(specs).length, formalRecipes: RECIPE_IDS.length },
    tokens, rules: { layout, accessibility, content }, components,
  };
}
if (require.main === module) {
  try { process.stdout.write(JSON.stringify(build(), null, 2) + '\n'); }
  catch (error) {
    console.error('设计真源提取失败：');
    if (error instanceof ExtractError) error.issues.forEach((issue) => console.error('  ' + issue));
    else console.error(error.stack || String(error));
    process.exit(1);
  }
}
module.exports = { build, ExtractError };
