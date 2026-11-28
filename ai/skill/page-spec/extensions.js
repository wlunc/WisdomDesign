'use strict';
// Registry reader for accepted product-specific extensions.
//
// Page Spec's regions[].component is a closed enum of 37 canonical IDs. A product needing a
// composition the library does not ship had two bad options: invent an ID (UNKNOWN_COMPONENT) or
// lie about kind (which silently disabled semantic rules). This registry is the third option:
// declare the extension, say what it is based on, and the validator accepts it — with a warning
// while it is still `proposed`.
const fs = require('fs');
const path = require('path');

const REGISTRY = path.join(__dirname, 'extensions.json');

function load() { return JSON.parse(fs.readFileSync(REGISTRY, 'utf8')); }
function find(id) { return (load().extensions || []).find(entry => entry.id === id) || null; }

if (require.main === module) {
  const id = process.argv[2];
  const registry = load();
  if (!id) {
    for (const entry of registry.extensions || []) console.log(entry.id + ' (' + entry.status + ') basedOn ' + entry.basedOn + ' — ' + entry.summary);
    process.exit(0);
  }
  const entry = find(id);
  if (!entry) { console.log('UNREGISTERED ' + id); process.exit(3); }
  console.log(JSON.stringify(entry, null, 2));
}

module.exports = { load, find, REGISTRY };
