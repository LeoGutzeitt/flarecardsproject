import {createAuth} from './auth.js';
import {createPlatformStore} from './platform-store.js';
import { products, packs } from './store-catalog.js';
export { products, packs };
const money = value => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const escape = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const catalog = [...products, ...packs];
const storageKey = 'flare-cards:cart:v1';
let cart = {};
try { const saved = JSON.parse(localStorage.getItem(storageKey) || '{}'); for (const item of catalog) if (Number.isInteger(saved?.[item.id]) && saved[item.id] > 0) cart[item.id] = Math.min(saved[item.id], 99); } catch { /* Carrinho vazio se o armazenamento não estiver disponível. */ }
const $ = selector => document.querySelector(selector);
let toastTimer;
function notify(message) { $('#toast').textContent = message; $('#toast').hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').hidden = true, 2800); }
function renderProducts(query = '') {
  if (!$('#product-grid')) return;
  const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const filtered = products.filter(item => normalize(`${escape(item.name)} ${escape(item.collection)} ${escape(item.rarity)}`).includes(normalize(query.trim())));
  $('#product-grid').innerHTML = filtered.map(item => `<article class="product"><div class="card-image"><span class="rank">TOP ${products.indexOf(item) + 1} / FLARE SELECTION</span><img src="${escape(item.image)}" alt="Carta ${escape(item.name)}" loading="lazy"></div><div class="card-content"><h3>${escape(item.name)}</h3><p>${escape(item.rarity)} · ${escape(item.collection)}</p><div class="card-bottom"><strong class="price">${money(item.price)}</strong><button class="add" data-add="${item.id}" aria-label="Adicionar ${escape(item.name)} ao carrinho">Adicionar +</button></div></div></article>`).join('');
  $('#empty').hidden = filtered.length !== 0;
}
const homePacks = Boolean(document.querySelector('.home-mystery'));
if ($('#packs-grid')) $('#packs-grid').innerHTML = packs.map((item, index) => `<article class="pack ${index === 1 ? 'featured' : ''}" data-open="false">${index === 1 ? '<span class="popular">MAIS VENDIDO</span>' : ''}<h3 class="sr-only">Mystery Pack ${escape(item.name)}</h3>${homePacks ? `<div class="home-pack-heading"><span>0${index+1} / FLARE PACK</span><strong>${escape(item.name)}</strong></div><div class="home-pack-scene">` : ''}<button type="button" class="pack-art" data-pack-peek="${item.id}" aria-pressed="false" aria-label="Abrir prévia do Mystery Pack ${escape(item.name)}"><span class="pack-stage" aria-hidden="true"><span class="pack-back"></span><span class="pack-mouth"></span>${[-1, 0, 1].map(i => `<span class="mystery-card" style="--i:${i};--order:${i + 1}"><span class="card-back-frame"><span class="card-back-star">✦</span><img src="assets/logo.png" alt=""><span class="card-back-star">✦</span></span></span>`).join('')}<span class="pack-wrap"><span class="pack-shine"></span><img src="assets/mascot-transparent.png" alt=""><strong>${escape(item.name)}</strong><small>MYSTERY PACK</small><span class="pack-seal-bottom"></span></span><span class="pack-tear"><span>FLARE CARDS</span><span class="tear-arrow">RASGUE AQUI ↗</span></span><span class="pack-tear-flash"></span></span></button>${homePacks ? '</div>' : ''}<div class="pack-details">${homePacks ? '<span class="home-pack-price-label">SEU PACOTE SURPRESA</span>' : ''}<strong class="pack-price">${money(item.price)}</strong><p class="pack-description">${homePacks ? item.description.split(' · ').map((text,i)=>`<span class="home-pack-benefit"><span aria-hidden="true">${i ? '✦' : '+'}</span><span>${text}</span></span>`).join('') : item.description.replace(' · ', '<br>')}</p><button class="button" data-add="${item.id}" aria-label="Adicionar pack ${escape(item.name)} ao carrinho">${homePacks ? `Escolher ${escape(item.name)} <span aria-hidden="true">↗</span>` : 'Comprar pack +'}</button></div></article>`).join('');
function renderCart() {
  const items = catalog.filter(item => cart[item.id]);
  $('#cart-count').textContent = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);
  $('#cart-items').innerHTML = items.length ? items.map(item => `<div class="cart-row"><div><strong>${escape(item.name)}${packs.includes(item) ? ' — Mystery Pack' : ''}</strong><div class="quantity-controls"><button data-change="${item.id}" data-delta="-1" aria-label="Diminuir quantidade de ${escape(item.name)}">−</button><span>${cart[item.id]}</span><button data-change="${item.id}" data-delta="1" aria-label="Aumentar quantidade de ${escape(item.name)}">+</button><small>${money(item.price)} / un.</small></div></div><strong>${money(item.price * cart[item.id])}</strong></div>`).join('') : '<p>Seu carrinho está vazio. Explore as cartas e os packs da Flare.</p>';
  $('#cart-total').textContent = money(items.reduce((total, item) => total + item.price * cart[item.id], 0));
  $('#export-cart').disabled = items.length === 0;
  try { localStorage.setItem(storageKey, JSON.stringify(cart)); } catch { /* A sessão continua sem persistência. */ }
}
document.addEventListener('click', event => {
  const peek = event.target.closest('[data-pack-peek]');
  if (peek) {
    const pack = peek.closest('.pack'), open = pack.dataset.open !== 'true';
    pack.dataset.open = String(open); peek.setAttribute('aria-pressed', String(open));
    peek.setAttribute('aria-label', `${open ? 'Fechar prévia do' : 'Abrir prévia do'} Mystery Pack ${packs.find(item => item.id === peek.dataset.packPeek).name}`);
  }
  const add = event.target.closest('[data-add]');
  if (add) { const item = catalog.find(item => item.id === add.dataset.add); if(!item)return; if(Number.isInteger(item.stock)&&(cart[item.id]||0)>=item.stock){notify('Quantidade indisponível em estoque.');return;} cart[item.id] = Math.min((cart[item.id] || 0) + 1, 99); renderCart(); notify(`${escape(item.name)} adicionado ao carrinho`); }
  const change = event.target.closest('[data-change]');
  if (change) { const id = change.dataset.change; cart[id] = Math.min(99, cart[id] + Number(change.dataset.delta)); if (cart[id] <= 0) delete cart[id]; renderCart(); }
});
$('#search-form')?.addEventListener('submit', event => { event.preventDefault(); renderProducts($('#search').value); });
$('#search')?.addEventListener('input', event => renderProducts(event.target.value));
$('#open-cart').addEventListener('click', () => $('#cart').showModal());
$('#close-cart').addEventListener('click', () => $('#cart').close());
function download(text, name) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = name; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
$('#export-cart').addEventListener('click', () => {
  const items = catalog.filter(item => cart[item.id]);
  download(`FLARE CARDS — RESUMO DO PEDIDO\n\n${items.map(item => `${cart[item.id]} × ${escape(item.name)} — ${money(item.price * cart[item.id])}`).join('\n')}\n\nSubtotal: ${$('#cart-total').textContent}\n\nSimulação. Estoque, frete e pagamento precisam ser confirmados pela loja.`, 'flare-cards-pedido.txt');
});
$('#evaluation-form')?.addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  download(`FLARE CARDS — PEDIDO DE AVALIAÇÃO\n\nNome: ${data.get('name')}\nE-mail: ${data.get('contact')}\nQuantidade: ${data.get('quantity')}\nSobre a coleção: ${data.get('details')}\n\nPedido preparado localmente. Envie este arquivo pelo canal oficial da loja.`, 'flare-cards-avaliacao.txt');
  $('#form-status').textContent = 'Pedido preparado para download. Nenhum dado foi enviado à loja; encaminhe o arquivo pelo canal oficial da Flare Cards.';
});
renderProducts(); renderCart();





const requestButton=document.createElement('button');requestButton.className='button';requestButton.id='request-order';requestButton.textContent='Solicitar pedido ↗';$('#export-cart').after(requestButton);
const orderStatus=document.createElement('p');orderStatus.setAttribute('role','status');orderStatus.className='catalog-note';requestButton.after(orderStatus);
requestButton.addEventListener('click',()=>{try{const auth=createAuth(localStorage,sessionStorage);if(!auth.currentUser()){orderStatus.replaceChildren();const a=document.createElement('a');a.href='/auctions.html';a.textContent='Entre ou crie sua conta de cliente nos leilões e volte ao carrinho.';orderStatus.append(a);return;}const store=createPlatformStore(localStorage,role=>auth.requireUser(role));const order=store.requestOrder(Object.entries(cart).map(([id,quantity])=>({id,quantity})),packs);cart={};renderCart();orderStatus.textContent='Pedido #'+order.id.slice(0,8)+' solicitado neste navegador. Aguarde confirmação da loja. Nenhum pagamento foi realizado.';}catch(error){orderStatus.textContent=error.message;}});
window.addEventListener('storage',event=>{if(event.key==='flare-cards:catalog:v1')location.reload();});
