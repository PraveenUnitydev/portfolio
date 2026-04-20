// START-SERVER.js
// Alternative server if you have Node.js installed.
// Run:  node START-SERVER.js
// Then open: http://localhost:8080

const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT = 8080;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.glb':  'model/gltf-binary',       // ← critical for GLB files
  '.gltf': 'model/gltf+json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.md':   'text/markdown',
};

http.createServer((req, res) => {
  let filePath = path.join(ROOT, req.url === '/' ? 'index.html' : req.url);

  // Strip query strings
  filePath = filePath.split('?')[0];

  const ext = path.extname(filePath).toLowerCase();
  const ct  = MIME[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      console.log(`  404  ${req.url}`);
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    console.log(`  200  ${req.url}`);
    res.writeHead(200, {
      'Content-Type': ct,
      'Access-Control-Allow-Origin': '*',   // allow local GLB loads
    });
    res.end(data);
  });
}).listen(PORT, () => {
  console.log('='.repeat(50));
  console.log('  🚀  XR Portfolio — Local Server (Node)');
  console.log('='.repeat(50));
  console.log(`  Serving from: ${ROOT}`);
  console.log(`  URL:          http://localhost:${PORT}`);
  console.log('  Stop:         Ctrl + C');
  console.log('='.repeat(50));
});
