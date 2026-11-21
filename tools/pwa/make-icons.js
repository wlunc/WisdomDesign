#!/usr/bin/env node
/**
 * Regenerate the PWA PNG icons from assets/icon.svg.
 *
 * The icons are rendered with headless Chrome so the SVG gradients and
 * filters are rasterized exactly the way a browser draws them. Outputs are
 * committed; run this only when the mark changes.
 *
 * Usage:
 *   node tools/pwa/make-icons.js
 *   CHROME_PATH=/path/to/chrome node tools/pwa/make-icons.js
 */
'use strict';

const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '../..');
const SVG_PATH = path.join(ROOT, 'design/pwa/assets/icon.svg');
const OUT_DIR = path.join(ROOT, 'design/pwa/assets/icons');
const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean);

const TARGETS = [
  { file: 'icon-192.png', size: 192, purpose: 'any' },
  { file: 'icon-512.png', size: 512, purpose: 'any' },
  { file: 'icon-maskable-512.png', size: 512, purpose: 'maskable' },
  { file: 'apple-touch-icon.png', size: 180, purpose: 'apple' },
  { file: 'favicon-32.png', size: 32, purpose: 'favicon' },
];

function findChrome() {
  for (const candidate of CHROME_CANDIDATES) {
    if (fs.existsSync(candidate)) return candidate;
  }
  throw new Error(
    'Chrome/Chromium not found. Set CHROME_PATH to a headless-capable browser.',
  );
}

function pngSize(buffer) {
  const signature = '89504e470d0a1a0a';
  if (buffer.subarray(0, 8).toString('hex') !== signature) return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function main() {
  const chrome = findChrome();
  const svg = fs.readFileSync(SVG_PATH, 'utf8');
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wd-icons-'));

  try {
    for (const target of TARGETS) {
      const wrapper = path.join(tmp, 'icon-' + target.size + '.html');
      const out = path.join(OUT_DIR, target.file);
      const html = '<!doctype html><html><head><meta charset="utf-8">' +
        '<style>html,body{margin:0;padding:0;background:transparent;overflow:hidden}' +
        'svg{display:block;width:' + target.size + 'px;height:' + target.size + 'px}</style>' +
        '</head><body>' + svg + '</body></html>';
      fs.writeFileSync(wrapper, html);
      const profile = path.join(tmp, 'profile-' + target.size);
      fs.mkdirSync(profile, { recursive: true });
      const args = [
        '--headless=new',
        '--no-sandbox',
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--disable-crash-reporter',
        '--disable-breakpad',
        '--hide-scrollbars',
        '--no-first-run',
        '--force-device-scale-factor=1',
        '--user-data-dir=' + profile,
        '--window-size=' + target.size + ',' + target.size,
        '--screenshot=' + out,
        '--virtual-time-budget=1500',
        'file://' + wrapper,
      ];
      execFileSync(chrome, args, { stdio: 'ignore' });
      const buffer = fs.readFileSync(out);
      const size = pngSize(buffer);
      if (!size || size.width !== target.size || size.height !== target.size) {
        throw new Error(target.file + ': expected ' + target.size + 'x' + target.size + ', got ' + JSON.stringify(size));
      }
      console.log('  ' + target.file + '  ' + target.size + 'x' + target.size + '  ' + (buffer.length / 1024).toFixed(1) + ' KB');
    }
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  console.log('Icons written to design/pwa/assets/icons/');
}

main();
