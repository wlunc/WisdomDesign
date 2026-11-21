#!/usr/bin/env node
/**
 * Build the Wisdom Design PWA.
 *
 * Inputs are the self-contained Codex gallery wrappers in design/preview and
 * design/gallery. Their payload lives inside an iframe data-srcdoc attribute,
 * so this build unescapes it, vendors the runtime scripts locally (offline),
 * adds stable anchors, and generates the installable PWA shell inventory.
 *
 * Usage:
 *   node tools/pwa/build.js           # write generated files
 *   node tools/pwa/build.js --check   # fail if generated files are stale
 */
'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '../..');
const PWA_DIR = path.join(ROOT, 'design/pwa');
const DOCS_DIR = path.join(PWA_DIR, 'docs');
const DATA_DIR = path.join(PWA_DIR, 'data');

// --------------------------------------------------------------------------
// Gallery configuration
// --------------------------------------------------------------------------

const GALLERIES = [
  {
    id: 'preview',
    source: 'design/preview/wisdom-light.html',
    outFile: 'docs/wisdom-light.html',
    title: '浅色版预览',
    fullTitle: '浅色版设计预览',
    kicker: '设计基础',
    description: '色彩、渐变材质、动效与双端屏幕，一页看完设计基调。',
    icon: 'layers',
    theme: 'lake',
    meta: '设计基础',
    hasModes: false,
    expectedSpecs: 0,
    expectedSections: 5,
  },
  {
    id: 'components',
    source: 'design/gallery/wisdom-components.html',
    outFile: 'docs/wisdom-components.html',
    title: '基础组件',
    fullTitle: '基础组件规格画廊',
    kicker: '01–20',
    description: '按钮、输入、开关、列表等 20 个基础组件的变体与状态。',
    icon: 'grid',
    theme: 'brand',
    meta: '20 个组件',
    hasModes: true,
    modeSelect: '#wd-gal-mode',
    expectedSpecs: 20,
  },
  {
    id: 'advanced',
    source: 'design/gallery/wisdom-advanced.html',
    outFile: 'docs/wisdom-advanced.html',
    title: '高级组件',
    fullTitle: '高级组件规格画廊',
    kicker: '21–36',
    description: '16 个带状态机与交互流程的组合组件。',
    icon: 'sliders',
    theme: 'deep',
    meta: '16 个组件',
    hasModes: true,
    modeSelect: '#wd-gal2-mode',
    expectedSpecs: 16,
  },
  {
    id: 'patterns',
    source: 'design/gallery/wisdom-patterns.html',
    outFile: 'docs/wisdom-patterns.html',
    title: '场景配方',
    fullTitle: '场景配方画廊',
    kicker: '37 · R1–R5',
    description: '家庭场景组件，以及 5 个由基础组件拼出的固定配方。',
    icon: 'blocks',
    theme: 'mid',
    meta: '6 个条目',
    hasModes: true,
    modeSelect: '#wd-gal3-mode',
    expectedSpecs: 6,
  },
];

const VENDOR_FILES = [
  'vendor/floating-ui.core.umd.min.js',
  'vendor/floating-ui.dom.umd.min.js',
  'vendor/lucide.min.js',
];

const VENDOR_URLS = new Map([
  [
    'https://unpkg.com/@floating-ui/core@1.7.3/dist/floating-ui.core.umd.min.js',
    '../vendor/floating-ui.core.umd.min.js',
  ],
  [
    'https://unpkg.com/@floating-ui/dom@1.7.4/dist/floating-ui.dom.umd.min.js',
    '../vendor/floating-ui.dom.umd.min.js',
  ],
  [
    'https://unpkg.com/lucide@1.17.0/dist/umd/lucide.js',
    '../vendor/lucide.min.js',
  ],
  [
    'https://unpkg.com/lucide@1.17.0/dist/umd/lucide.min.js',
    '../vendor/lucide.min.js',
  ],
]);

const SECTION_SLUGS = new Map([
  ['色彩', 'colors'],
  ['渐变 · 材质 · 形状', 'material'],
  ['组件画廊', 'gallery'],
  ['动效', 'motion'],
  ['双端屏幕', 'screens'],
]);

const CSP = [
  "default-src 'none'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' blob: data:",
  "style-src 'self' 'unsafe-inline' blob: data:",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "media-src 'self' data: blob:",
  "worker-src 'self' blob:",
  "connect-src 'self'",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
].join('; ');

const MOBILE_CSS = [
  'html > body { padding: 10px 14px calc(20px + env(safe-area-inset-bottom)); }',
  '@media (max-width: 560px) {',
  '  html { -webkit-text-size-adjust: 100%; }',
  '  [class~="pair"] { grid-template-columns: minmax(0, 1fr); }',
  '  [class~="cell"] { min-width: 0; }',
  '}',
  '[class~="spec"] { scroll-margin-top: 12px; }',
  '[id^="sec-"] { scroll-margin-top: 16px; }',
  '@media (min-width: 760px) {',
  '  html > body { padding: 20px 24px 28px; }',
  '  #wd-gallery, #wd-gal2, #wd-gal3 { max-width: 1040px; margin-left: auto; margin-right: auto; }',
  '}',
].join('\n');

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function decodeEntities(input) {
  const map = { '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#x27;': "'", '&amp;': '&' };
  return input.replace(/&(lt|gt|quot|#x27|amp);/g, (m) => map[m]);
}

function stripTags(input) {
  return decodeEntities(input.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'section';
}

function extractSrcdoc(sourceFile) {
  const wrapper = read(sourceFile);
  const match = wrapper.match(/data-srcdoc="([\s\S]*?)"\s*><\/iframe>/);
  if (!match) throw new Error('data-srcdoc not found in ' + sourceFile);
  const html = decodeEntities(match[1]);
  if (!html.includes('<!doctype html>')) throw new Error('payload does not look like HTML: ' + sourceFile);
  return html;
}

function removeDeadCodexShim(html, sourceFile) {
  const marker = '<script type="application/json" id="codex-visualization-widget-state">';
  const start = html.indexOf(marker);
  if (start === -1) return html;
  const container = html.indexOf('<div id="wd-', start);
  if (container === -1) throw new Error('gallery container not found after Codex shim: ' + sourceFile);
  const removed = html.slice(start, container);
  if (!removed.trimEnd().endsWith('</script>')) {
    throw new Error('unexpected Codex shim boundaries: ' + sourceFile);
  }
  return html.slice(0, start) + html.slice(container);
}

function splitSpecs(html) {
  const sections = [];
  const re = /<section class="spec" id="([^"]+)">([\s\S]*?)<\/section>/g;
  let match;
  while ((match = re.exec(html))) {
    const id = match[1];
    const body = match[2];
    const head = /<div class="spec-head">([\s\S]*?)<\/div>/.exec(body);
    const headHtml = head ? head[1] : '';
    const no = (/<span class="spec-id">([^<]*)<\/span>/.exec(headHtml) || ['', ''])[1];
    const name = (/<h2 class="spec-name">([^<]*)<\/h2>/.exec(headHtml) || ['', ''])[1];
    const tier = (/<span class="spec-tier">([^<]*)<\/span>/.exec(headHtml) || ['', ''])[1];
    const descRaw = (/<p class="spec-desc[^"]*">([\s\S]*?)<\/p>/.exec(body) || ['', ''])[1];
    sections.push({
      id,
      no: stripTags(no),
      name: stripTags(name),
      tier: stripTags(tier),
      desc: stripTags(descRaw),
    });
  }
  return sections;
}

function addSpecAnchors(html) {
  const seen = new Set();
  let n = 0;
  return html.replace(/<section class="spec">/g, (match, offset) => {
    const nearby = html.slice(offset, offset + 800);
    const name = (/<h2 class="spec-name">([^<]+)<\/h2>/.exec(nearby) || ['', 'spec-' + ++n])[1];
    const base = 'spec-' + slugify(stripTags(name));
    let id = base;
    let suffix = 2;
    while (seen.has(id)) id = base + '-' + suffix++;
    seen.add(id);
    return '<section class="spec" id="' + id + '">';
  });
}

function addPreviewAnchors(html) {
  const seen = new Set();
  const sections = [];
  let n = 0;
  const patched = html.replace(/<h2>([^<]{1,80})<\/h2>/g, (match, rawTitle) => {
    const title = stripTags(rawTitle);
    const slug = SECTION_SLUGS.get(title) || 'section-' + ++n;
    const base = 'sec-' + slug;
    let id = base;
    let suffix = 2;
    while (seen.has(id)) id = base + '-' + suffix++;
    seen.add(id);
    sections.push({ id, name: title });
    return '<h2 id="' + id + '">' + rawTitle + '</h2>';
  });
  return { html: patched, sections };
}

function modeBridge(modeSelect) {
  if (!modeSelect) return '';
  return [
    '<script>',
    '(() => {',
    '  const select = document.querySelector(' + JSON.stringify(modeSelect) + ');',
    '  if (!select) return;',
    '  const apply = (mode) => {',
    "    if (!['pair', 'light', 'dark'].includes(mode) || select.value === mode) return false;",
    '    select.value = mode;',
    "    select.dispatchEvent(new Event('change', { bubbles: true }));",
    '    return true;',
    '  };',
    "  const wanted = new URLSearchParams(location.search).get('mode');",
    '  if (wanted) apply(wanted);',
    '  window.__wdPwaSetMode = apply;',
    "  select.addEventListener('change', () => {",
    '    if (window.parent !== window) {',
    "      try { window.parent.postMessage({ type: 'wd:mode', mode: select.value }, location.origin); } catch (_) {}",
    '    }',
    '  });',
    '})();',
    '</script>',
  ].join('\n');
}

function transformGallery(gallery) {
  const sourceFile = path.join(ROOT, gallery.source);
  let html = extractSrcdoc(sourceFile);
  html = removeDeadCodexShim(html, sourceFile);

  // Local, offline-ready runtime.
  for (const pair of VENDOR_URLS) {
    html = html.split(pair[0]).join(pair[1]);
  }
  if (html.includes('https://unpkg.com/lucide@')) {
    throw new Error('unvendored script left in ' + sourceFile);
  }

  html = html.replace(
    /<meta http-equiv="Content-Security-Policy"[^>]*>/,
    '<meta http-equiv="Content-Security-Policy" content="' + CSP + '">',
  );
  html = html.replace(
    /<meta name="viewport" content="[^"]*">/,
    '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">',
  );

  let specs = [];
  let sections = [];
  if (gallery.id === 'preview') {
    const patched = addPreviewAnchors(html);
    html = patched.html;
    sections = patched.sections;
  } else {
    html = addSpecAnchors(html);
    specs = splitSpecs(html);
  }

  const extras = [
    '<style id="wd-pwa-mobile">' + MOBILE_CSS + '</style>',
    modeBridge(gallery.modeSelect),
  ].filter(Boolean).join('\n');
  html = html.replace('</body>', extras + '\n</body>');

  html = html.replace(/<html lang="en"/, '<html lang="zh-CN"');
  html = html.replace(
    /^<!doctype html>/i,
    '<!doctype html>\n<!-- Generated by tools/pwa/build.js from ' + gallery.source + '. Do not edit directly. -->',
  );

  if (gallery.expectedSpecs != null && specs.length !== gallery.expectedSpecs) {
    throw new Error(gallery.source + ': expected ' + gallery.expectedSpecs + ' specs, found ' + specs.length);
  }
  if (gallery.expectedSections != null && sections.length !== gallery.expectedSections) {
    throw new Error(gallery.source + ': expected ' + gallery.expectedSections + ' sections, found ' + sections.length);
  }

  return { html, specs, sections };
}

// --------------------------------------------------------------------------
// Service worker
// --------------------------------------------------------------------------

function serviceWorker(version, precache) {
  const lines = [
    '// Generated by tools/pwa/build.js. Do not edit.',
    "const VERSION = '" + version + "';",
    "const CACHE = 'wd-pwa-' + VERSION;",
    'const PRECACHE = ' + JSON.stringify(precache, null, 2) + ';',
    '',
    "self.addEventListener('install', (event) => {",
    '  event.waitUntil((async () => {',
    '    const cache = await caches.open(CACHE);',
    '    await cache.addAll(PRECACHE);',
    '    await self.skipWaiting();',
    '  })());',
    '});',
    '',
    "self.addEventListener('activate', (event) => {",
    '  event.waitUntil((async () => {',
    '    const keys = await caches.keys();',
    '    await Promise.all(',
    '      keys',
    "        .filter((key) => key.startsWith('wd-pwa-') && key !== CACHE)",
    '        .map((key) => caches.delete(key)),',
    '    );',
    '    await self.clients.claim();',
    '  })());',
    '});',
    '',
    "self.addEventListener('fetch', (event) => {",
    '  const request = event.request;',
    "  if (request.method !== 'GET') return;",
    '',
    '  const url = new URL(request.url);',
    '  if (url.origin !== self.location.origin) return;',
    "  if (url.pathname.endsWith('/sw.js')) return;",
    '',
    "  if (request.mode === 'navigate') {",
    '    event.respondWith((async () => {',
    '      const cache = await caches.open(CACHE);',
    '      const cached = await cache.match(request, { ignoreSearch: true });',
    '      if (cached) return cached;',
    '      try {',
    '        const response = await fetch(request);',
    '        if (response.ok) cache.put(request, response.clone());',
    '        return response;',
    '      } catch (_) {',
    "        return (await cache.match('./index.html')) || (await cache.match('./')) || Response.error();",
    '      }',
    '    })());',
    '    return;',
    '  }',
    '',
    '  event.respondWith((async () => {',
    '    const cache = await caches.open(CACHE);',
    '    const cached = await cache.match(request, { ignoreSearch: true });',
    '    if (cached) return cached;',
    '    const response = await fetch(request);',
    '    if (response.ok) cache.put(request, response.clone());',
    '    return response;',
    '  })());',
    '});',
    '',
  ];
  return lines.join('\n');
}

// --------------------------------------------------------------------------
// Main
// --------------------------------------------------------------------------

function pwaAssetFiles() {
  return [
    'index.html',
    'viewer.html',
    'manifest.webmanifest',
    'assets/app.css',
    'assets/app.js',
    'assets/icon.svg',
    'assets/icons/icon-192.png',
    'assets/icons/icon-512.png',
    'assets/icons/icon-maskable-512.png',
    'assets/icons/apple-touch-icon.png',
    'assets/icons/favicon-32.png',
    ...VENDOR_FILES,
  ].map((file) => path.join(PWA_DIR, file));
}

function build() {
  for (const file of VENDOR_FILES) {
    const full = path.join(PWA_DIR, file);
    if (!fs.existsSync(full) || fs.statSync(full).size === 0) {
      throw new Error('missing vendor asset: ' + path.relative(ROOT, full) + ' (see design/pwa/vendor/README.md)');
    }
  }

  const transformed = GALLERIES.map((gallery) => ({
    gallery,
    ...transformGallery(gallery),
  }));

  const specs = transformed.flatMap((entry) =>
    entry.specs.map((spec) => ({
      ...spec,
      gallery: entry.gallery.id,
      file: entry.gallery.outFile,
    })),
  );
  const sections = transformed.flatMap((entry) =>
    entry.sections.map((section) => ({
      ...section,
      gallery: entry.gallery.id,
      file: entry.gallery.outFile,
    })),
  );

  const galleries = transformed.map((entry) => {
    const gallery = entry.gallery;
    return {
      id: gallery.id,
      title: gallery.title,
      fullTitle: gallery.fullTitle,
      kicker: gallery.kicker,
      description: gallery.description,
      icon: gallery.icon,
      theme: gallery.theme,
      meta: gallery.meta,
      hasModes: gallery.hasModes,
      file: gallery.outFile,
      count: gallery.id === 'preview' ? entry.sections.length : entry.specs.length,
    };
  });

  const docs = transformed.map((entry) => ({ file: entry.gallery.outFile, html: entry.html }));

  const indexBase = {
    app: { name: 'Wisdom Design', designVersion: 'v1.0' },
    totals: {
      galleries: galleries.length,
      specs: specs.length,
      sections: sections.length,
    },
    galleries,
    specs,
    sections,
  };

  // A stable version hash covers every generated/served file. The index base
  // is included so metadata-only changes also invalidate the cache. The worker
  // and the final index are excluded because they embed the hash itself.
  const hash = crypto.createHash('sha256');
  for (const doc of docs) {
    hash.update('\n\0' + doc.file + '\0');
    hash.update(doc.html);
  }
  for (const file of pwaAssetFiles()) {
    hash.update('\n\0' + path.relative(PWA_DIR, file) + '\0');
    hash.update(fs.readFileSync(file));
  }
  hash.update('\n\0index-base\0');
  hash.update(JSON.stringify(indexBase));
  const version = hash.digest('hex').slice(0, 12);

  const index = Object.assign({ version }, indexBase);
  const indexJson = JSON.stringify(index, null, 2) + '\n';

  const precache = [
    './',
    './index.html',
    './viewer.html',
    './manifest.webmanifest',
    './assets/app.css',
    './assets/app.js',
    './assets/icon.svg',
    './assets/icons/icon-192.png',
    './assets/icons/icon-512.png',
    './assets/icons/icon-maskable-512.png',
    './assets/icons/apple-touch-icon.png',
    './assets/icons/favicon-32.png',
    './data/index.json',
    ...docs.map((doc) => './' + doc.file),
    ...VENDOR_FILES.map((file) => './' + file),
  ];
  const sw = serviceWorker(version, precache);

  const outputs = [
    ...docs.map((doc) => ({ file: path.join(PWA_DIR, doc.file), content: doc.html })),
    { file: path.join(DATA_DIR, 'index.json'), content: indexJson },
    { file: path.join(PWA_DIR, 'sw.js'), content: sw },
  ];

  const check = process.argv.includes('--check');
  const stale = [];
  for (const output of outputs) {
    const current = fs.existsSync(output.file) ? fs.readFileSync(output.file, 'utf8') : null;
    if (current !== output.content) stale.push(output);
  }

  if (check) {
    if (stale.length) {
      console.error('PWA build is stale:');
      for (const output of stale) console.error('  ' + path.relative(ROOT, output.file));
      console.error('Run: node tools/pwa/build.js');
      process.exitCode = 1;
      return;
    }
    console.log('PWA build is up to date (version ' + version + ').');
    return;
  }

  fs.mkdirSync(DOCS_DIR, { recursive: true });
  fs.mkdirSync(DATA_DIR, { recursive: true });
  for (const output of outputs) {
    fs.writeFileSync(output.file, output.content);
  }

  console.log('PWA built: version ' + version);
  for (const gallery of galleries) {
    console.log(
      '  ' + gallery.id.padEnd(11) + String(gallery.count).padStart(3) + '  ' + gallery.title + '  -> ' + gallery.file,
    );
  }
  console.log('  specs: ' + specs.length + ' · sections: ' + sections.length + ' · precache: ' + precache.length + ' URLs');
  if (stale.length) {
    console.log('  changed: ' + stale.map((output) => path.relative(ROOT, output.file)).join(', '));
  }
}

try {
  build();
} catch (error) {
  console.error('PWA build failed: ' + error.message);
  process.exitCode = 1;
}
