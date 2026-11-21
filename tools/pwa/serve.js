#!/usr/bin/env node
/**
 * Tiny static server for the PWA. No dependencies.
 *
 * Usage:
 *   node tools/pwa/serve.js
 *   node tools/pwa/serve.js --port 8080 --host 0.0.0.0
 */
'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const ROOT = path.resolve(__dirname, '../../design/pwa');

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index !== -1 && process.argv[index + 1]) return process.argv[index + 1];
  return fallback;
}

const PORT = Number(argValue('--port', process.env.PORT || 4173));
const HOST = argValue('--host', '0.0.0.0');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
};

function localAddresses() {
  const result = [];
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const entry of interfaces[name] || []) {
      if (entry.family === 'IPv4' && !entry.internal) {
        result.push({ name: name, address: entry.address });
      }
    }
  }
  return result;
}

function send(response, status, body, type) {
  response.writeHead(status, {
    'Content-Type': type || 'text/plain; charset=utf-8',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'X-Content-Type-Options': 'nosniff',
  });
  response.end(body);
}

const server = http.createServer(function (request, response) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    send(response, 405, 'Method Not Allowed');
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  } catch (_) {
    send(response, 400, 'Bad Request');
    return;
  }

  if (pathname.endsWith('/')) pathname += 'index.html';
  const file = path.resolve(ROOT, '.' + pathname);
  const rootPrefix = ROOT.endsWith(path.sep) ? ROOT : ROOT + path.sep;
  if (file !== ROOT && !file.startsWith(rootPrefix)) {
    send(response, 403, 'Forbidden');
    return;
  }

  fs.stat(file, function (statError, stats) {
    if (statError || !stats.isFile()) {
      send(response, 404, 'Not Found');
      return;
    }

    const type = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
    response.writeHead(200, {
      'Content-Type': type,
      'Content-Length': stats.size,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Content-Type-Options': 'nosniff',
    });
    if (request.method === 'HEAD') {
      response.end();
      return;
    }
    fs.createReadStream(file).pipe(response);
  });
});

server.on('error', function (error) {
  if (error.code === 'EADDRINUSE') {
    console.error('Port ' + PORT + ' is already in use. Try: node tools/pwa/serve.js --port 4174');
  } else {
    console.error(error.message);
  }
  process.exitCode = 1;
});

server.listen(PORT, HOST, function () {
  const local = 'http://localhost:' + PORT + '/';
  console.log('');
  console.log('Wisdom Design PWA');
  console.log('  Local   ' + local);
  const addresses = localAddresses();
  if (addresses.length) {
    console.log('  Phone   http://' + addresses[0].address + ':' + PORT + '/   (same Wi-Fi)');
  }
  console.log('  Root    ' + ROOT);
  console.log('');
  console.log('  Note: Service worker + offline install require HTTPS (or localhost).');
  console.log('        LAN HTTP still works for browsing; deploy design/pwa to HTTPS for the full PWA.');
  console.log('  Stop    Ctrl+C');
  console.log('');
});

function shutdown() {
  server.close(function () {
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
