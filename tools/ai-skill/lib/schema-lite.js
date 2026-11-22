'use strict';
// Minimal JSON Schema subset validator for M0 contract fixtures.
// Supports: $ref (local #/...), type, enum, const, required, additionalProperties,
// properties, patternProperties(?), pattern, minLength/maxLength, minimum/maximum,
// minItems/maxItems, uniqueItems, contains, items, oneOf, allOf, if/then.
// It is intentionally not a complete JSON Schema implementation.
function clone(v){ return JSON.parse(JSON.stringify(v)); }
function has(obj,key){ return Object.prototype.hasOwnProperty.call(obj,key); }
function pointer(root, ref){
  if (!ref.startsWith('#/')) throw new Error('only local refs supported: '+ref);
  let cur = root;
  for (const part of ref.slice(2).split('/')) cur = cur[part.replace(/~1/g,'/').replace(/~0/g,'~')];
  return cur;
}
function typeOf(v){
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  return typeof v;
}
function matchesType(v,t){
  if (t === 'integer') return typeof v === 'number' && Number.isInteger(v);
  if (t === 'object') return v !== null && typeof v === 'object' && !Array.isArray(v);
  return typeOf(v) === t;
}
function equal(a,b){ return JSON.stringify(a) === JSON.stringify(b); }
function validate(value, schema, root, path){
  const errors = [];
  const err = (code,message) => errors.push({code,path,message});
  if (!schema || typeof schema !== 'object') return errors;
  if (has(schema,'$ref')) return validate(value, pointer(root, schema.$ref), root, path);
  if (has(schema,'type')){
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!types.some(t => matchesType(value,t))){ err('TYPE', 'expected '+types.join('|')+' got '+typeOf(value)); return errors; }
  }
  if (has(schema,'enum') && !schema.enum.some(e => equal(e,value))) err('ENUM','value not in enum');
  if (has(schema,'const') && !equal(schema.const,value)) err('CONST','value must equal '+JSON.stringify(schema.const));
  if (typeof value === 'string'){
    if (has(schema,'minLength') && value.length < schema.minLength) err('MIN_LENGTH','string too short');
    if (has(schema,'maxLength') && value.length > schema.maxLength) err('MAX_LENGTH','string too long');
    if (has(schema,'pattern') && !new RegExp(schema.pattern).test(value)) err('PATTERN','string does not match '+schema.pattern);
  }
  if (typeof value === 'number'){
    if (has(schema,'minimum') && value < schema.minimum) err('MINIMUM','number below minimum');
    if (has(schema,'maximum') && value > schema.maximum) err('MAXIMUM','number above maximum');
  }
  if (Array.isArray(value)){
    if (has(schema,'minItems') && value.length < schema.minItems) err('MIN_ITEMS','array too short');
    if (has(schema,'maxItems') && value.length > schema.maxItems) err('MAX_ITEMS','array too long');
    if (schema.uniqueItems){
      const seen = new Set(value.map(v => JSON.stringify(v)));
      if (seen.size !== value.length) err('UNIQUE_ITEMS','duplicate array item');
    }
    if (schema.items) value.forEach((v,i) => errors.push(...validate(v,schema.items,root,path+'/'+i)));
    if (schema.contains && !value.some(v => validate(v,schema.contains,root,path).length === 0)) err('CONTAINS','no item satisfies contains');
  }
  if (matchesType(value,'object')){
    const props = schema.properties || {};
    const required = schema.required || [];
    for (const key of required) if (!has(value,key)) err('REQUIRED','missing required property '+key);
    for (const [key,val] of Object.entries(value)){
      const childPath = path+'/'+key.replace(/~/g,'~0').replace(/\//g,'~1');
      if (has(props,key)) errors.push(...validate(val,props[key],root,childPath));
      else if (schema.additionalProperties === false) err('ADDITIONAL_PROPERTY','unknown property '+key);
      else if (schema.additionalProperties && typeof schema.additionalProperties === 'object') errors.push(...validate(val,schema.additionalProperties,root,childPath));
    }
  }
  if (has(schema,'oneOf')){
    const counts = schema.oneOf.map(s => validate(value,s,root,path).length === 0 ? 1 : 0).reduce((a,b)=>a+b,0);
    if (counts !== 1) err('ONE_OF','expected exactly one matching branch, got '+counts);
  }
  if (Array.isArray(schema.allOf)) for (const s of schema.allOf) errors.push(...validate(value,s,root,path));
  if (has(schema,'if') && validate(value,schema.if,root,path).length === 0){
    if (has(schema,'then')) errors.push(...validate(value,schema.then,root,path));
  } else if (has(schema,'not') && validate(value,schema.not,root,path).length === 0){
    if (has(schema,'else')) errors.push(...validate(value,schema.else,root,path));
  }
  return errors;
}
function validateDocument(doc,schema){ return validate(doc,schema,schema,''); }
module.exports = { validateDocument };
