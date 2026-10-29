import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
const root = process.cwd();
try { process.loadEnvFile(path.join(root, '.env')); } catch { /* Configuração opcional. */ }
const publicFiles = new Set(['ticket-preview.js','ticket-template.js','ticket-art.mjs','ticket-models.js','ticket-models.mjs','auction-winners.js','card-languages.js','flareadmin.html','flareadmin.css','flareadmin.js','platform-store.js','catalog-seed.js','index.html','auctions.html','daylight.css', 'styles.css','app.js','auctions.js','auction-store.js','auth.js','scroll-reveal.js','auction-backend.js','public-config.js','page-transition.js','page-transition.css','auction-categories.js','marketplace.html', 'binder.html', 'marketplace.js', 'marketplace.css', 'card-details.js', 'card-inventory.js', 'store-catalog.js', 'footer.js', 'store-contacts.js', 'header.js', 'pokemon-collections.js', 'auction-examples.js']);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs':'text/javascript', '.png': 'image/png', '.webp': 'image/webp' };
http.createServer(async (req, res) => {
  try {
    let pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if(pathname==='/flareadmin'||pathname==='/flareadmin/')pathname='/flareadmin.html';
    if (pathname === '/api/config') {
      const key = process.env.SUPABASE_PUBLISHABLE_KEY || '';
      let safe = key.startsWith('sb_publishable_');
      try { safe ||= JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString()).role === 'anon'; } catch { /* Chave não JWT. */ }
      res.writeHead(200, { 'Content-Type':'application/json', 'Cache-Control':'no-store' });
      res.end(JSON.stringify({ supabaseUrl: safe ? process.env.SUPABASE_URL || '' : '', supabasePublishableKey: safe ? key : '',
        ...(process.env.SUPABASE_URL && !safe ? { configurationError: 'Configure a chave pública do Supabase no servidor.' } : {}) })); return;
    }
    const requested = pathname === '/' ? 'index.html' : pathname.slice(1);
    if (!publicFiles.has(requested) && !/^assets\/[a-zA-Z0-9_-]+\.(png|webp|jpg|jpeg|svg)$/.test(requested)) { res.writeHead(404).end('Não encontrado'); return; }
    const aliases={'ticket-models.mjs':'supabase/functions/_shared/ticket-models.mjs','ticket-template.js':'supabase/functions/_shared/ticket-template.mjs','ticket-art.mjs':'supabase/functions/_shared/ticket-art.mjs'};
    const file = path.resolve(root, aliases[requested] || '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    const data = await readFile(file);
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' }); res.end(data);
  } catch { res.writeHead(404).end('Não encontrado'); }
}).listen(5173, '127.0.0.1', () => console.log('Flare Cards: http://127.0.0.1:5173'));




