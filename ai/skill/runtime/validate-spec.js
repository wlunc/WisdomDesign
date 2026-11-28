'use strict';
// M1-3 Page Spec formal validator. Reads frozen schema and performs structure + semantic rules.
const fs = require('fs');
const path = require('path');

const SKILL_ROOT = path.resolve(__dirname, '..');
const SCHEMA_PATH = path.join(SKILL_ROOT, 'page-spec', 'schema.json');
// Contract defaults/enums are derived from contracts/WD*.yaml into the shipped digest. Without it
// the validator could only compare `variant` against a list it did not have, which is exactly how
// the emphasis rule degraded into "count the buttons in an actions region" (P1-1/P1-2).
// Same two-layout resolution as get-component.js: packaged layout keeps the catalog beside the
// runtime, the source-repo layout keeps it under core/catalog.
function digestPath() {
  const packaged = path.join(SKILL_ROOT, 'catalog', 'contracts-digest.json');
  if (fs.existsSync(packaged)) return packaged;
  return path.join(SKILL_ROOT, 'core', 'catalog', 'contracts-digest.json');
}
const TOOL_NAME = 'validate_spec';
const STRUCTURE_NOTICE = 'Structural validation does not prove native compilation, snapshot/UI, visual design review, or host loading.';

function usage(message) {
  if (message) console.error('error: ' + message);
  console.error('usage: node ' + path.relative(SKILL_ROOT, __filename) + ' --file <page-spec.json> [--json]');
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
    if (argv[i] === '--file') { args.file = nextValue(argv, i, '--file'); i += 1; }
    else if (argv[i] === '--json') args.json = true;
    else if (argv[i] === '--help') usage();
    else usage('unknown argument ' + argv[i]);
  }
  if (!args.file) usage('--file is required');
  return args;
}
function pointerPart(value) { return String(value).replace(/~/g, '~0').replace(/\//g, '~1'); }
function childPath(base, key) { return base + '/' + pointerPart(key); }
function typeOf(value) { return value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value; }
function matchesType(value, type) {
  if (type === 'integer') return typeof value === 'number' && Number.isInteger(value);
  if (type === 'object') return value !== null && typeof value === 'object' && !Array.isArray(value);
  return typeOf(value) === type;
}
function sameValue(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
function resolveRef(root, ref) {
  if (typeof ref !== 'string' || !ref.startsWith('#/')) throw new Error('unsupported $ref: ' + ref);
  let node = root;
  for (const rawPart of ref.slice(2).split('/')) {
    const part = rawPart.replace(/~1/g, '/').replace(/~0/g, '~');
    node = node[part];
    if (node === undefined) throw new Error('unresolved $ref: ' + ref);
  }
  return node;
}
function addError(errors, error) {
  const key = [error.keyword, error.path, error.message].join('|');
  if (!errors.some(item => [item.keyword, item.path, item.message].join('|') === key)) errors.push(error);
}
function validateNode(value, schema, root, jsonPath, errors) {
  if (schema === true) return;
  if (schema === false) { addError(errors, { keyword: 'false-schema', path: jsonPath, message: 'schema is false', value }); return; }
  if (!schema || typeof schema !== 'object') return;
  if (Object.prototype.hasOwnProperty.call(schema, '$ref')) { validateNode(value, resolveRef(root, schema.$ref), root, jsonPath, errors); return; }
  if (schema.type !== undefined) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!types.some(type => matchesType(value, type))) {
      addError(errors, { keyword: 'type', path: jsonPath, message: 'expected ' + types.join('|') + ' got ' + typeOf(value), value });
      return;
    }
  }
  if (Object.prototype.hasOwnProperty.call(schema, 'const') && !sameValue(value, schema.const)) addError(errors, { keyword: 'const', path: jsonPath, message: 'value must equal ' + JSON.stringify(schema.const), value });
  if (Array.isArray(schema.enum) && !schema.enum.some(item => sameValue(item, value))) addError(errors, { keyword: 'enum', path: jsonPath, message: 'value not in enum', value });
  if (typeof value === 'string') {
    if (schema.minLength !== undefined && value.length < schema.minLength) addError(errors, { keyword: 'minLength', path: jsonPath, message: 'string shorter than ' + schema.minLength, value });
    if (schema.maxLength !== undefined && value.length > schema.maxLength) addError(errors, { keyword: 'maxLength', path: jsonPath, message: 'string longer than ' + schema.maxLength, value });
    if (schema.pattern !== undefined && !new RegExp(schema.pattern).test(value)) addError(errors, { keyword: 'pattern', path: jsonPath, message: 'string does not match ' + schema.pattern, value });
  }
  if (typeof value === 'number') {
    if (schema.minimum !== undefined && value < schema.minimum) addError(errors, { keyword: 'minimum', path: jsonPath, message: 'number below minimum', value });
    if (schema.maximum !== undefined && value > schema.maximum) addError(errors, { keyword: 'maximum', path: jsonPath, message: 'number above maximum', value });
  }
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) addError(errors, { keyword: 'minItems', path: jsonPath, message: 'array shorter than ' + schema.minItems, value });
    if (schema.maxItems !== undefined && value.length > schema.maxItems) addError(errors, { keyword: 'maxItems', path: jsonPath, message: 'array longer than ' + schema.maxItems, value });
    if (schema.uniqueItems === true && new Set(value.map(item => JSON.stringify(item))).size !== value.length) addError(errors, { keyword: 'uniqueItems', path: jsonPath, message: 'array items must be unique', value });
    if (schema.items) value.forEach((item, index) => validateNode(item, schema.items, root, childPath(jsonPath, index), errors));
    if (schema.contains) {
      let matched = false;
      value.forEach((item, index) => {
        const probe = [];
        validateNode(item, schema.contains, root, childPath(jsonPath, index), probe);
        if (probe.length === 0) matched = true;
      });
      if (!matched) addError(errors, { keyword: 'contains', path: jsonPath, message: 'no item satisfies contains schema', value });
    }
  }
  if (matchesType(value, 'object')) {
    const properties = schema.properties || {};
    for (const key of schema.required || []) {
      if (!Object.prototype.hasOwnProperty.call(value, key)) addError(errors, { keyword: 'required', path: childPath(jsonPath, key), message: 'missing required property ' + key, missingKey: key, value });
    }
    for (const [key, child] of Object.entries(value)) {
      const nextPath = childPath(jsonPath, key);
      if (Object.prototype.hasOwnProperty.call(properties, key)) validateNode(child, properties[key], root, nextPath, errors);
      else if (schema.additionalProperties === false) addError(errors, { keyword: 'additionalProperties', path: nextPath, message: 'unknown property ' + key, property: key, value });
      else if (schema.additionalProperties && typeof schema.additionalProperties === 'object') validateNode(child, schema.additionalProperties, root, nextPath, errors);
    }
  }
  if (Array.isArray(schema.allOf)) schema.allOf.forEach(branch => validateNode(value, branch, root, jsonPath, errors));
  if (Array.isArray(schema.oneOf)) {
    const count = schema.oneOf.filter(branch => {
      const probe = [];
      validateNode(value, branch, root, jsonPath, probe);
      return probe.length === 0;
    }).length;
    if (count !== 1) addError(errors, { keyword: 'oneOf', path: jsonPath, message: 'expected exactly one branch, got ' + count, value });
  }
  if (schema.if !== undefined) {
    const probe = [];
    validateNode(value, schema.if, root, jsonPath, probe);
    if (probe.length === 0 && schema.then) validateNode(value, schema.then, root, jsonPath, errors);
  }
}
function platformShaped(value) {
  return typeof value === 'string' && (/[<>]/u.test(value) || value.includes('.') || value.includes('::') || (/^[a-z][A-Za-z0-9]*$/.test(value) && !value.startsWith('WD')));
}
function domainError(error) {
  const keyword = error.keyword;
  const jsonPath = error.path || '';
  const message = error.message;
  if (jsonPath === '/schemaVersion') return { code: 'INVALID_SCHEMA_VERSION', message: 'schemaVersion must be 1.1.', suggestion: 'Set schemaVersion to "1.1" (the variant/action/extension revision).' };
  if (jsonPath === '/page/primaryAction' && keyword === 'required') return { code: 'NO_PRIMARY_ACTION', message: 'page.primaryAction is required.', suggestion: 'Add a stable business action ID such as createTask.' };
  if (keyword === 'additionalProperties') return { code: 'UNKNOWN_FIELD', message, suggestion: 'Remove the unknown field; Page Spec has no free-form extension fields.' };
  if (jsonPath === '/page/navigation') return { code: 'INVALID_NAVIGATION', message, suggestion: 'navigation must be tabRoot, stackRoot, detail, or modal.' };
  if (jsonPath === '/page/contentPattern') return { code: 'INVALID_CONTENT_PATTERN', message, suggestion: 'contentPattern must be collection, form, detail, overview, or onboarding.' };
  if (/^\/regions\/\d+\/component$/.test(jsonPath)) {
    if (platformShaped(error.value)) return { code: 'PLATFORM_TYPE_LEAK', message: 'regions[].component must not contain platform type syntax.', suggestion: 'Use a canonical WD component ID from contracts/WD*.yaml.' };
    return { code: 'UNKNOWN_COMPONENT', message: 'regions[].component is not a known canonical component.', suggestion: 'Use get_component to find a real component; do not invent names.' };
  }
  if (keyword === 'required') return { code: 'MISSING_FIELD', message, suggestion: 'Add the required field ' + (error.missingKey || '') + '.' };
  if (keyword === 'enum') return { code: 'INVALID_VALUE', message, suggestion: 'Use a value from the schema enum.' };
  return { code: 'INVALID_FIELD', message, suggestion: 'Correct this field according to page-spec/schema.json.' };
}
function loadDigest() {
  try { return JSON.parse(fs.readFileSync(digestPath(), 'utf8')); }
  catch (error) { return null; }
}

function loadExtensions() {
  try { return JSON.parse(fs.readFileSync(path.join(SKILL_ROOT, 'page-spec', 'extensions.json'), 'utf8')); }
  catch (error) { return { extensions: [] }; }
}

// Emphasis is DERIVED, never declared. A region is primary when it carries the page's own
// primaryAction, when its component is the floating primary-action control, or when its resolved
// variant (explicit, else the contract default) is `filled`. Deriving it is what stops a caller
// from switching the rule off by editing `kind` (M-2) and what lets a spec legitimately place two
// secondary buttons side by side (P1-1).
function resolveVariant(region, contract) {
  if (typeof region.variant === 'string' && region.variant !== '') return region.variant;
  const defaults = contract && contract.defaults ? contract.defaults : {};
  const direct = defaults.variant !== undefined ? defaults.variant : defaults.style;
  if (typeof direct !== 'string') return null;
  return direct.replace(/^\./, '');
}

function emphasisOf(region, page, digest) {
  if (!region || typeof region !== 'object') return 'secondary';
  if (page && typeof page.primaryAction === 'string' && region.action === page.primaryAction) return 'primary';
  if (region.component === 'WDFAB') return 'primary';
  const contract = digest && digest.components ? digest.components[region.component] : null;
  return resolveVariant(region, contract) === 'filled' ? 'primary' : 'secondary';
}

function semanticErrors(spec, schemaErrors) {
  const errors = [];
  const warnings = [];
  const page = spec && typeof spec.page === 'object' ? spec.page : null;
  const states = Array.isArray(spec && spec.states) ? spec.states : [];
  const regions = Array.isArray(spec && spec.regions) ? spec.regions : [];
  const digest = loadDigest();
  const extensions = loadExtensions();

  if (page && page.contentPattern === 'collection' && !states.some(state => state && state.kind === 'empty')) {
    errors.push({ code: 'COLLECTION_MISSING_EMPTY', jsonPath: '/states', message: 'collection pages must include an empty state.', suggestion: 'Add a state with kind empty and describe the empty-state action.' });
    for (let i = schemaErrors.length - 1; i >= 0; i -= 1) if (schemaErrors[i].keyword === 'contains' && schemaErrors[i].path === '/states') schemaErrors.splice(i, 1);
  }

  // One primary action at most, judged on derived emphasis rather than on how many buttons happen
  // to sit in an `actions` region.
  const primaries = regions.filter(region => emphasisOf(region, page, digest) === 'primary');
  if (primaries.length > 1) {
    errors.push({
      code: 'MULTIPLE_PRIMARY_ACTIONS',
      jsonPath: '/regions',
      message: 'More than one region resolves to primary emphasis (' + primaries.map(region => region.id).join(', ') + '); at most one is allowed.',
      suggestion: 'Declare variant (e.g. "tonal") on the secondary buttons, or move its action off page.primaryAction. Per spec.md §1, a screen has one filled action and the rest are tonal/glass/plain.',
    });
  }

  // A declared primary action must be performed by some region. It is a hard error when the page
  // does have an actions region that carries a different action — that is a contradiction, not an
  // implicit gesture. On pages whose primary action is whole-row (tapping a card), no actions
  // region exists and the mapping is advisory, so it stays a warning: the intent is still recorded
  // and a reviewer can see it, without failing a spec that is genuinely fine.
  if (page && typeof page.primaryAction === 'string') {
    const carries = regions.some(region => region && region.action === page.primaryAction);
    const actionRegions = regions.filter(region => region && region.kind === 'actions');
    if (!carries && actionRegions.length > 0) {
      errors.push({ code: 'PRIMARY_ACTION_NOT_CONNECTED', jsonPath: '/page/primaryAction', message: 'page.primaryAction is ' + page.primaryAction + ' but the actions region(s) ' + actionRegions.map(region => region.id).join(', ') + ' declare a different action.', suggestion: 'Set action: "' + page.primaryAction + '" on the region that performs it, or change page.primaryAction.' });
    } else if (!carries) {
      warnings.push({ code: 'PRIMARY_ACTION_IMPLICIT', jsonPath: '/page/primaryAction', message: 'page.primaryAction is not declared by any regions[].action; the primary action is inferred from component emphasis only.', suggestion: 'Set regions[].action on the region that performs it so the mapping is checkable.' });
    }
  }

  // Variant must be something the component contract actually declares.
  if (digest && digest.components) {
    regions.forEach((region, index) => {
      if (!region || region.variant === undefined) return;
      const contract = digest.components[region.component];
      if (!contract) return;
      const values = new Set();
      for (const list of Object.values(contract.enums || {})) for (const value of list) values.add(value);
      const defaultVariant = resolveVariant({}, contract);
      if (defaultVariant) values.add(defaultVariant);
      if (values.size > 0 && !values.has(region.variant)) {
        errors.push({ code: 'UNKNOWN_VARIANT', jsonPath: '/regions/' + index + '/variant', message: region.component + ' has no variant ' + region.variant + '.', suggestion: 'Use one of: ' + [...values].sort().join(', ') + '.' });
      }
    });
  }

  // A top-level page has no back affordance, so a navigation bar there contradicts itself.
  if (page && page.navigation === 'tabRoot') {
    const navBar = regions.find(region => region && region.component === 'WDNavigationBar');
    if (navBar) {
      errors.push({ code: 'NAVIGATION_CONFLICT', jsonPath: '/regions', message: 'tabRoot page ' + page.id + ' uses WDNavigationBar, which is for second-level and deeper pages (spec §1: 一级页面没有返回).', suggestion: 'Drop the navigation bar, or use WDToolbar if the page needs page-level actions.' });
    }
  }

  // Extensions have a registered home; proposed ones are accepted with a visible warning.
  const registered = new Map((extensions.extensions || []).map(entry => [entry.id, entry]));
  regions.forEach((region, index) => {
    if (!region || !region.extension) return;
    const entry = registered.get(region.extension.id);
    if (!entry) {
      errors.push({ code: 'UNREGISTERED_EXTENSION', jsonPath: '/regions/' + index + '/extension/id', message: 'extension ' + region.extension.id + ' is not registered in page-spec/extensions.json.', suggestion: 'Register the extension (id, basedOn, status, summary) or use a canonical component.' });
      return;
    }
    const status = region.extension.status || entry.status;
    if (status !== 'accepted') {
      warnings.push({ code: 'PROPOSED_EXTENSION', jsonPath: '/regions/' + index + '/extension', message: 'extension ' + entry.id + ' is ' + status + '; it is accepted as a registered proposal, not as a shipped component.', suggestion: 'Track it in page-spec/extensions.json until the design system ships or rejects it.' });
    }
  });

  // State completeness: empty is mandatory for collections (hard rule above); the remaining
  // canonical states are advisory because not every page owns every one.
  const kinds = new Set(states.map(state => state && state.kind));
  for (const required of ['content']) {
    if (!kinds.has(required)) warnings.push({ code: 'STATE_INCOMPLETE', jsonPath: '/states', message: 'no "' + required + '" state declared; design review cannot confirm the page has renderable content.', suggestion: 'Declare the states the page really has, including content.' });
  }
  for (const optional of ['loading', 'error']) {
    if (!kinds.has(optional)) warnings.push({ code: 'STATE_INCOMPLETE', jsonPath: '/states', message: 'no "' + optional + '" state declared.', suggestion: 'Add it if the page actually fetches data; otherwise say so in acceptance.' });
  }

  return { errors, warnings };
}
function validate(spec, schema) {
  const schemaErrors = [];
  validateNode(spec, schema, schema, '', schemaErrors);
  // Semantic rules may absorb a schema keyword error (COLLECTION_MISSING_EMPTY replaces
  // the schema "contains" error). Structural validity is judged after that absorption so
  // a semantic-only failure is never reported as a structural failure.
  const semantic = semanticErrors(spec, schemaErrors);
  const structureValid = schemaErrors.length === 0;
  const errors = [...semantic.errors, ...schemaErrors.map(error => {
    const mapped = domainError(error);
    return { code: mapped.code, jsonPath: error.path || '', message: mapped.message, suggestion: mapped.suggestion };
  })];
  const unique = [];
  const seen = new Set();
  for (const error of errors) {
    const key = [error.code, error.jsonPath, error.message].join('|');
    if (!seen.has(key)) { seen.add(key); unique.push(error); }
  }
  const uniqueWarnings = [];
  const seenWarnings = new Set();
  for (const warning of semantic.warnings || []) {
    const key = [warning.code, warning.jsonPath, warning.message].join('|');
    if (!seenWarnings.has(key)) { seenWarnings.add(key); uniqueWarnings.push(warning); }
  }
  return { errors: unique, warnings: uniqueWarnings, structureValid, semanticValid: semantic.errors.length === 0 };
}
function buildReport(file, outcome, readError) {
  const errors = outcome ? outcome.errors : [];
  const warnings = outcome ? outcome.warnings || [] : [];
  const structureValid = Boolean(outcome && outcome.structureValid && !readError);
  const semanticValid = Boolean(outcome && outcome.semanticValid && !readError);
  const valid = !readError && errors.length === 0;
  const gate = (ok) => readError ? 'not-evaluated' : (ok ? 'passed' : 'failed');
  return {
    schemaVersion: '1.0', tool: TOOL_NAME, specPath: file, valid, structureValid, semanticValid,
    structure: { valid: structureValid }, semantics: { valid: semanticValid }, errors, warnings,
    gates: {
      structure: gate(structureValid),
      semantics: gate(semanticValid),
      nativeCompile: 'not-evaluated', snapshotUi: 'not-evaluated', visualDesignReview: 'not-evaluated', hostLoad: 'not-evaluated'
    },
    notice: STRUCTURE_NOTICE, readError: readError || null
  };
}
function main() {
  const args = parseArgs(process.argv.slice(2));
  let schema;
  try { schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8')); }
  catch (error) { throw new Error('cannot read Page Spec schema: ' + error.message); }
  let spec = null;
  let readError = null;
  let outcome = null;
  try {
    const text = fs.readFileSync(path.resolve(args.file), 'utf8');
    try { spec = JSON.parse(text); }
    catch (error) { readError = 'JSON parse failed: ' + error.message; }
    if (!readError) outcome = validate(spec, schema);
  } catch (error) { readError = error.message; }
  const result = buildReport(args.file, outcome, readError);
  if (args.json) console.log(JSON.stringify(result, null, 2));
  else {
    if (result.readError) console.error('ERROR ' + result.readError);
    console.log((result.valid ? 'VALID ' : 'INVALID ') + result.specPath);
    for (const error of result.errors) console.log('  ' + error.code + ' ' + error.jsonPath + ': ' + error.message);
    for (const warning of result.warnings) console.log('  WARN ' + warning.code + ' ' + warning.jsonPath + ': ' + warning.message);
    console.log('NOTICE ' + result.notice);
  }
  if (readError) process.exit(2);
  process.exit(result.valid ? 0 : 1);
}
try { main(); }
catch (error) { console.error(TOOL_NAME + ' failed: ' + error.message); process.exit(2); }
