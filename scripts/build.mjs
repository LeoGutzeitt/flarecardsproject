import './ticket-assets.mjs';
import { mkdir, copyFile, cp } from 'node:fs/promises';
await mkdir('dist', { recursive: true });
for (const file of ['ticket-models.js','ticket-preview.js','auction-winners.js','card-languages.js','flareadmin.html','flareadmin.css','flareadmin.js','platform-store.js','catalog-seed.js','index.html', 'daylight.css', 'styles.css', 'app.js', 'auctions.html', 'auctions.js', 'auction-store.js', 'auth.js', 'scroll-reveal.js', 'auction-backend.js', 'public-config.js', 'page-transition.js', 'page-transition.css', 'auction-categories.js', 'marketplace.html', 'binder.html', 'marketplace.js', 'marketplace.css', 'card-details.js', 'card-inventory.js', 'store-catalog.js', 'footer.js', 'store-contacts.js', 'header.js', 'pokemon-collections.js', 'auction-examples.js']) await copyFile(file, `dist/${file}`);
await copyFile('supabase/functions/_shared/ticket-template.mjs','dist/ticket-template.js');
await copyFile('supabase/functions/_shared/ticket-art.mjs','dist/ticket-art.mjs');
await copyFile('supabase/functions/_shared/ticket-models.mjs','dist/ticket-models.mjs');
await mkdir('dist/flareadmin', {recursive:true});
await copyFile('flareadmin.html','dist/flareadmin/index.html');
await cp('assets', 'dist/assets', { recursive: true });
console.log('Build concluído em dist/');








