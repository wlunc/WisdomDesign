'use strict';
// M1-3 Page Spec formal validator. Reads frozen schema and performs structure + semantic rules.
const fs = require('fs');
const path = require('path');

const SKILL_ROOT = path.resolve(__dirname, '..');
const SCHEMA_PATH = path.join(SKILL_ROOT, 'page-spec', 'schema.json');
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
  if (jsonPath === '/schemaVersion') return { code: 'INVALID_SCHEMA_VERSION', message: 'schemaVersion must be 1.0.', suggestion: 'Set schemaVersion to the frozen 1.0 value.' };
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
function semanticErrors(spec, schemaErrors) {
  const errors = [];
  const page = spec && typeof spec.page === 'object' ? spec.page : null;
  const states = Array.isArray(spec && spec.states) ? spec.states : [];
  const regions = Array.isArray(spec && spec.regions) ? spec.regions : [];
  if (page && page.contentPattern === 'collection' && !states.some(state => state && state.kind === 'empty')) {
    errors.push({ code: 'COLLECTION_MISSING_EMPTY', jsonPath: '/states', message: 'collection pages must include an empty state.', suggestion: 'Add a state with kind empty and describe the empty-state action.' });
    for (let i = schemaErrors.length - 1; i >= 0; i -= 1) if (schemaErrors[i].keyword === 'contains' && schemaErrors[i].path === '/states') schemaErrors.splice(i, 1);
  }
  const actionComponents = new Set(['WDButton', 'WDIconButton', 'WDFAB']);
  const primaryRegions = regions.filter(region => region && region.kind === 'actions' && actionComponents.has(region.component));
  if (primaryRegions.length > 1) errors.push({ code: 'MULTIPLE_PRIMARY_ACTIONS', jsonPath: '/regions', message: 'More than one primary action region detected; at most one is allowed.', suggestion: 'Keep one action component and demote or remove the rest.' });
  return errors;
}
function validate(spec, schema) {
  const schemaErrors = [];
  validateNode(spec, schema, schema, '', schemaErrors);
  // Semantic rules may absorb a schema keyword error (COLLECTION_MISSING_EMPTY replaces
  // the schema "contains" error). Structural validity is judged after that absorption so
  // a semantic-only failure is never reported as a structural failure.
  const semantic = semanticErrors(spec, schemaErrors);
  const structureValid = schemaErrors.length === 0;
  const errors = [...semantic, ...schemaErrors.map(error => {
    const mapped = domainError(error);
    return { code: mapped.code, jsonPath: error.path || '', message: mapped.message, suggestion: mapped.suggestion };
  })];
  const unique = [];
  const seen = new Set();
  for (const error of errors) {
    const key = [error.code, error.jsonPath, error.message].join('|');
    if (!seen.has(key)) { seen.add(key); unique.push(error); }
  }
  return { errors: unique, structureValid, semanticValid: semantic.length === 0 };
}
function buildReport(file, outcome, readError) {
  const errors = outcome ? outcome.errors : [];
  const structureValid = Boolean(outcome && outcome.structureValid && !readError);
  const semanticValid = Boolean(outcome && outcome.semanticValid && !readError);
  const valid = !readError && errors.length === 0;
  const gate = (ok) => readError ? 'not-evaluated' : (ok ? 'passed' : 'failed');
  return {
    schemaVersion: '1.0', tool: TOOL_NAME, specPath: file, valid, structureValid, semanticValid,
    structure: { valid: structureValid }, semantics: { valid: semanticValid }, errors, warnings: [],
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
    console.log('NOTICE ' + result.notice);
  }
  if (readError) process.exit(2);
  process.exit(result.valid ? 0 : 1);
}
try { main(); }
catch (error) { console.error(TOOL_NAME + ' failed: ' + error.message); process.exit(2); }
