import {readFile,writeFile,copyFile} from 'node:fs/promises';
const base64=async path=>(await readFile(new URL('../'+path,import.meta.url))).toString('base64');
const assets={brasa:'data:image/png;base64,'+await base64('assets/ticket-brasa.png'),ouro:'data:image/png;base64,'+await base64('assets/ticket-ouro.png'),logo:'data:image/png;base64,'+await base64('assets/logo.png'),font:await base64('assets/ticket-font.ttf')};
await writeFile(new URL('../supabase/functions/_shared/ticket-art.mjs',import.meta.url),'// Gerado por scripts/ticket-assets.mjs a partir das artes e da fonte licenciada.\nexport const ticketArt='+JSON.stringify(assets)+';\n');
const wasm=await readFile(new URL('../node_modules/@resvg/resvg-wasm/index_bg.wasm',import.meta.url));
await writeFile(new URL('../supabase/functions/_shared/ticket-wasm.mjs',import.meta.url),'// Renderizador WASM empacotado para a Edge Function.\nexport const wasmBase64='+JSON.stringify(wasm.toString('base64'))+';\n');
console.log('Artes, fonte e renderizador dos tickets sincronizados.');

await copyFile(new URL('../ticket-models.js',import.meta.url),new URL('../supabase/functions/_shared/ticket-models.mjs',import.meta.url));
