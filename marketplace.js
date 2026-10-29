import {languageBadge} from './card-languages.js';
import { setupCardDetails } from './card-details.js';
import './app.js';
import { products } from './store-catalog.js';
import { pokemonCollections } from './pokemon-collections.js';
const previews = [{"id":"preview-sv03.5-001","name":"Bulbasaur","collection":"151","rarity":"Prévia da coleção","image":"https://assets.tcgdex.net/pt/sv/sv03.5/001/high.webp","preview":true},{"id":"preview-sv03.5-002","name":"Ivysaur","collection":"151","rarity":"Prévia da coleção","image":"https://assets.tcgdex.net/pt/sv/sv03.5/002/high.webp","preview":true},{"id":"preview-sv03.5-003","name":"Venusaur ex","collection":"151","rarity":"Prévia da coleção","image":"https://assets.tcgdex.net/pt/sv/sv03.5/003/high.webp","preview":true},{"id":"preview-sv03.5-004","name":"Charmander","collection":"151","rarity":"Prévia da coleção","image":"https://assets.tcgdex.net/pt/sv/sv03.5/004/high.webp","preview":true},{"id":"preview-sv03.5-005","name":"Charmeleon","collection":"151","rarity":"Prévia da coleção","image":"https://assets.tcgdex.net/pt/sv/sv03.5/005/high.webp","preview":true},{"id":"preview-xy6-1","name":"Exeggcute","collection":"Céus Estrondosos","rarity":"Prévia da coleção","image":"https://assets.tcgdex.net/pt/xy/xy6/1/high.webp","preview":true},{"id":"preview-xy6-2","name":"Exeggutor","collection":"Céus Estrondosos","rarity":"Prévia da coleção","image":"https://assets.tcgdex.net/pt/xy/xy6/2/high.webp","preview":true},{"id":"preview-xy6-3","name":"Wurmple","collection":"Céus Estrondosos","rarity":"Prévia da coleção","image":"https://assets.tcgdex.net/pt/xy/xy6/3/high.webp","preview":true},{"id":"preview-xy6-4","name":"Silcoon","collection":"Céus Estrondosos","rarity":"Prévia da coleção","image":"https://assets.tcgdex.net/pt/xy/xy6/4/high.webp","preview":true},{"id":"preview-xy6-5","name":"Beautifly","collection":"Céus Estrondosos","rarity":"Prévia da coleção","image":"https://assets.tcgdex.net/pt/xy/xy6/5/high.webp","preview":true},{"id":"preview-sv08.5-001","name":"Exeggcute","collection":"Evoluções Prismáticas","rarity":"Prévia da coleção","image":"https://assets.tcgdex.net/pt/sv/sv08.5/001/high.webp","preview":true},{"id":"preview-sv08.5-002","name":"Exeggutor","collection":"Evoluções Prismáticas","rarity":"Prévia da coleção","image":"https://assets.tcgdex.net/pt/sv/sv08.5/002/high.webp","preview":true},{"id":"preview-sv08.5-003","name":"Pinsir","collection":"Evoluções Prismáticas","rarity":"Prévia da coleção","image":"https://assets.tcgdex.net/pt/sv/sv08.5/003/high.webp","preview":true},{"id":"preview-sv08.5-004","name":"Budew","collection":"Evoluções Prismáticas","rarity":"Prévia da coleção","image":"https://assets.tcgdex.net/pt/sv/sv08.5/004/high.webp","preview":true},{"id":"preview-sv08.5-005","name":"Leafeon","collection":"Evoluções Prismáticas","rarity":"Prévia da coleção","image":"https://assets.tcgdex.net/pt/sv/sv08.5/005/high.webp","preview":true}];
const displayCards = [...products,...previews];
setupCardDetails(displayCards);
const $ = selector => document.querySelector(selector);
const money = value => value.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const collections = [...new Set(products.map(item => item.collection))];
const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const escape = value => String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const arrow = direction => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${direction<0?'m14 6-6 6 6 6':'m10 6 6 6-6 6'}"/></svg>`;
let filter = '', shelfGroups = [], renderVersion = 0;
const shelfPages = new Map(), busyShelves = new Set();
$('#collection-filters').innerHTML = ['',...collections].map(name=>`<button type="button" data-collection="${name}" aria-pressed="${!name}">${name || 'Todas as coleções'}</button>`).join('');
function cardGroup(items,page) {
 return items.slice(page*3,page*3+3).map((item,index)=>`<article class="floating-card ${item.preview?'is-preview':''}" style="--card-order:${index}"><button type="button" class="floating-card-art" data-inspect="${item.id}" aria-label="Ver detalhes de ${escape(item.name)}"><img src="${escape(item.image)}" alt="${escape(item.name)} — ${escape(item.collection)}" loading="eager"><span class="floating-shadow" aria-hidden="true"></span><span class="inspect-card-hint">Ver detalhes ↗</span></button><div class="floating-card-info"><span>${item.preview?'PRÉVIA · SEM VENDA':escape(item.rarity)}</span><h4>${escape(item.name)}</h4>${!item.preview?languageBadge(item.language):''}${item.preview?'<p>Exemplo visual da coleção</p>':`<strong>${money(item.price)}</strong><button class="add" data-add="${item.id}" aria-label="Adicionar ${escape(item.name)} ao carrinho">Adicionar +</button>`}</div></article>`).join('');
}
function renderShelves() {
 renderVersion++; busyShelves.clear(); shelfPages.clear();
 const query=normalize($('#market-search').value.trim()),onlyAvailable=$('#market-available').checked,sort=$('#market-sort').value;
 $('#market-clear').hidden=!query && !filter && !onlyAvailable && sort==='featured';
 const order=(a,b)=>sort==='name'?a.name.localeCompare(b.name,'pt-BR'):sort.startsWith('price')?(Number(!!a.preview)-Number(!!b.preview) || (a.preview && b.preview?0:sort==='price-low'?a.price-b.price:b.price-a.price)):0;
 shelfGroups=collections.filter(name=>!filter || name===filter).map(name=>({name,items:displayCards.filter(item=>item.collection===name && (!onlyAvailable || !item.preview && item.stock!==0) && normalize(`${item.name} ${item.collection} ${item.rarity}`).includes(query)).sort(order)})).filter(group=>group.items.length);
 $('#market-result').textContent = query || filter || onlyAvailable ? `${shelfGroups.reduce((sum,group)=>sum+group.items.length,0)} ${onlyAvailable?'cartas à venda encontradas':'cartas e prévias encontradas'}` : `Uma vitrine para explorar · ${products.length} cartas à venda · prévias de catálogo identificadas`;
 $('#collection-shelves').innerHTML=shelfGroups.length ? shelfGroups.map(({name,items},index)=>{
  const set=pokemonCollections.find(item=>item.name===name), total=Math.ceil(items.length/3);
  shelfPages.set(index,0);
  return `<section class="collection-shelf real-shelf" aria-label="Coleção ${name}"><div class="shelf-heading"><div class="shelf-collection-name">${set?.logo?`<img src="${set.logo}" alt="Logo ${name}" loading="lazy">`:''}<div><span class="eyebrow">PRATELEIRA / ${String(index+1).padStart(2,'0')}</span><h3>${name}</h3><span>Cartas físicas. Histórias para colecionar.</span></div></div><div class="shelf-controls"><span class="shelf-page-count" id="shelf-count-${index}" role="status" aria-live="polite">1 / ${total}</span><button type="button" data-shelf="${index}" data-step="-1" aria-label="Três cartas anteriores de ${name}" disabled>${arrow(-1)}</button><button type="button" data-shelf="${index}" data-step="1" aria-label="Próximas três cartas de ${name}" ${total<=1?'disabled':''}>${arrow(1)}</button></div></div><div class="shelf-display" role="region" aria-label="Vitrine de ${name}"><div class="shelf-wall" aria-hidden="true"></div><div class="shelf-plank" aria-hidden="true"></div><div class="shelf-card-group" id="shelf-group-${index}">${cardGroup(items,0)}</div></div></section>`;
 }).join('') : '<div class="market-no-results"><h3>Nenhuma carta por aqui… ainda.</h3><p>Tente outro nome ou explore todas as coleções.</p><button class="button outline" id="clear-market-search">Limpar filtros</button></div>';
}
function preloadShelves(){ shelfGroups.forEach(group=>group.items.forEach(item=>{const image=new Image();image.src=item.image;})); }
function updateControls(index){const page=shelfPages.get(index),total=Math.ceil(shelfGroups[index].items.length/3),busy=busyShelves.has(index); document.querySelectorAll(`[data-shelf="${index}"]`).forEach(button=>button.disabled=busy || (Number(button.dataset.step)<0?page===0:page>=total-1));$('#shelf-count-'+index).textContent=`${page+1} / ${total}`;}
async function turnShelf(index,direction) {
 if(busyShelves.has(index))return;
 const page=shelfPages.get(index), next=page+direction, group=shelfGroups[index];
 if(!group || next<0 || next>=Math.ceil(group.items.length/3))return;
 const element=$('#shelf-group-'+index),version=renderVersion,reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
 busyShelves.add(index);updateControls(index);element.inert=true;
 try {
  const images=group.items.slice(next*3,next*3+3).map(item=>{const image=new Image();image.src=item.image;return image.decode().catch(()=>{});});
  await Promise.race([Promise.all(images),new Promise(resolve=>setTimeout(resolve,2500))]);
  if(!element.isConnected || version!==renderVersion)return;
  if(!reduced) await element.animate([{opacity:1,transform:'translateX(0) translateY(0)'},{opacity:0,transform:`translateX(${-direction*90}px) translateY(-12px)`}],{duration:270,easing:'cubic-bezier(.4,0,1,1)',fill:'forwards'}).finished;
  if(!element.isConnected || version!==renderVersion)return;
  element.innerHTML=cardGroup(group.items,next);shelfPages.set(index,next);element.getAnimations().forEach(animation=>animation.cancel());
  if(!reduced) await element.animate([{opacity:0,transform:`translateX(${direction*90}px) translateY(16px)`},{opacity:1,transform:'translateX(0) translateY(0)'}],{duration:470,easing:'cubic-bezier(.16,1,.3,1)'}).finished;
 } finally {if(version===renderVersion){busyShelves.delete(index);element.inert=false;updateControls(index);}}
}
$('#collection-shelves').addEventListener('click',event=>{const button=event.target.closest('[data-shelf]');if(button)turnShelf(Number(button.dataset.shelf),Number(button.dataset.step));if(event.target.closest('#clear-market-search')){filter='';$('#market-search').value='';$('#market-available').checked=false;$('#market-sort').value='featured';document.querySelectorAll('[data-collection]').forEach(button=>button.setAttribute('aria-pressed',String(!button.dataset.collection)));renderShelves();}});
$('#collection-filters').addEventListener('click',event=>{const button=event.target.closest('[data-collection]');if(!button)return;filter=button.dataset.collection;document.querySelectorAll('[data-collection]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));renderShelves();});
$('#market-search').addEventListener('input',renderShelves);
$('#market-available').addEventListener('change',renderShelves);
$('#market-sort').addEventListener('change',renderShelves);
$('#market-clear').addEventListener('click',()=>{filter='';$('#market-search').value='';$('#market-available').checked=false;$('#market-sort').value='featured';document.querySelectorAll('[data-collection]').forEach(button=>button.setAttribute('aria-pressed',String(!button.dataset.collection)));renderShelves();});
$('#mystery-toggle').addEventListener('click',()=>{const button=$('#mystery-toggle'),open=button.getAttribute('aria-expanded')!=='true';button.setAttribute('aria-expanded',String(open));$('#mystery-content').classList.toggle('is-collapsed',!open);$('#mystery-content').inert=!open;button.querySelector('.mystery-toggle-label').firstChild.textContent=open?'Recolher ':'Ver packs ';});

renderShelves();
if ('requestIdleCallback' in window) requestIdleCallback(preloadShelves); else setTimeout(preloadShelves,300);
