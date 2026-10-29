import { seedProducts, packs } from './catalog-seed.js';
export { packs };
export const CATALOG_KEY = 'flare-cards:catalog:v1';
export function readCatalog(storage) {
 try { const saved=JSON.parse(storage?.getItem(CATALOG_KEY)||'null'); return Array.isArray(saved)?saved:seedProducts.map(p=>({...p,published:true,stock:null,condition:null})); } catch { return seedProducts.map(p=>({...p,published:true,stock:null,condition:null})); }
}
export const products = readCatalog(typeof localStorage==='undefined'?null:localStorage).filter(p=>p.published!==false);
