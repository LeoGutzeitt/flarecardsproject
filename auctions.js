import {languageBadge} from './card-languages.js';
import { collectionFor } from './pokemon-collections.js';
import { AUCTION_KEY, createAuctionStore, minimumBid } from './auction-store.js';
import { createAuth, ACCOUNTS_KEY } from './auth.js';
import { connectAuctionBackend } from './auction-backend.js';
import { auctionCategories, auctionCategory } from './auction-categories.js';
import { auctionExamples } from './auction-examples.js';

let backend, backendError;
try { backend = await connectAuctionBackend(); } catch { backendError = 'Não foi possível conectar ao Supabase. Confira a configuração e recarregue a página.'; }
const auth = backend?.auth || createAuth(localStorage, sessionStorage);
const $ = selector => document.querySelector(selector);
const money = cents => (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const date = time => new Date(time).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' });
const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
let store, auctions = [], selectedId, historyId;
let activeView = 'browse';
let openedCategory = null, animateCategoryCard = false, animateSectionOpen = false;
const categoryCards = new Map();
try { if (backendError) throw new Error(backendError); store = backend?.store || createAuctionStore(localStorage, () => Date.now(), role => auth.requireUser(role)); auctions = await store.list(); }
catch (error) { $('#auction-status').textContent = error.message; }
function remaining(end) {
  const seconds = Math.max(0, Math.ceil((end - Date.now()) / 1000));
  const hours = Math.floor(seconds / 3600), minutes = Math.floor(seconds % 3600 / 60);
  return `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds % 60).padStart(2, '0')}s`;
}
function browsingItems() {
  const filter = $('#auction-filter').value;
  const lots = auctions.filter(item => filter === 'all' || (filter === 'active' ? Date.now() < item.endsAt : Date.now() >= item.endsAt));
  return !backend && filter === 'all' ? [...lots,...auctionExamples.filter(example => !lots.some(lot => auctionCategory(lot) === example.category))] : lots;
}
function categoryLogo(item) {
  const set = collectionFor(item);
  const logo = set?.logo || item?.setLogo || 'assets/logo.png';
  return `<img class="category-set-logo" src="${escape(logo)}" alt="${escape(set ? 'Logo de ' + set.name : 'Flare Cards')}" onerror="this.onerror=null;this.src='assets/logo.png'">`;
}
function cardBall(index) {
  const names=['poke','great','ultra','master'];
  const variant = (Math.max(0,auctionCategories.findIndex(item => item.id === openedCategory)) + index) % 4;
  return `<div class="card-change-ball ball-${names[variant]}" aria-hidden="true"><span class="orb-upper"><i></i><b>${variant === 3 ? 'M' : ''}</b></span><span class="orb-lower"></span><span class="orb-button"></span><span class="orb-light"></span></div>`;
}
function render() {
  renderSession();
  $('#overview-open').textContent = auctions.filter(item => Date.now() < item.endsAt).length;
  $('#overview-bids').textContent = auctions.reduce((total, item) => total + item.bids.length, 0);
  const filter = $('#auction-filter').value;
  const shown = browsingItems();
  $('#auction-empty').hidden = shown.length > 0 || !store;

  const card = item => {
    if (item.example) return `<article class="product auction-card example-card" data-example="${item.id}"><div class="card-image"><span class="rank">EXEMPLO ILUSTRATIVO</span><img src="${item.image}" alt="${escape(item.name)} — exemplo de ${escape(item.collection)}" draggable="false"></div><div class="card-content"><img class="example-set-logo" src="${item.setLogo}" alt="Logo original da coleção"><p class="eyebrow">UM POUCO DE INSPIRAÇÃO</p><h3>${item.name}</h3><p>${item.collection}</p><p class="example-description">Uma prévia do que você pode encontrar nesta seção. Quando um lote real for cadastrado, ele aparecerá aqui com foto, prazo e lances.</p><span class="example-label">Exemplo visual · sem lances</span><p class="catalog-note">Imagem de catálogo via TCGdex.</p></div></article>`;
    const ended = Date.now() >= item.endsAt, latest = item.bids.at(-1);
    return `<article class="product auction-card" data-ended="${ended}" data-auction="${item.id}"><div class="card-image"><span class="rank">LOTE ${String(auctions.indexOf(item) + 1).padStart(3, '0')} / ${ended ? 'ENCERRADO' : 'EM ANDAMENTO'}</span><img src="${escape(item.image)}" alt="Carta ${escape(item.name)}" loading="lazy"></div><div class="card-content"><h3>${escape(item.name)}</h3><p>${languageBadge(item.language)} · ${escape(item.collection)}${item.number?' · '+escape(item.number):''}</p><div class="auction-clock ${ended ? 'ended' : ''}"><span>${ended ? 'Leilão encerrado' : 'Encerra em'}</span><strong data-clock="${item.id}" aria-label="Tempo restante">${ended ? 'Encerrado' : remaining(item.endsAt)}</strong><small>Encerramento: ${date(item.endsAt)} · Brasília</small></div><div class="auction-value"><span>${latest ? 'Maior lance' : 'Lance inicial'}</span><strong>${money(latest?.amount ?? item.opening)}</strong></div><div class="auction-leader">${latest ? `${ended ? 'Líder ao encerrar' : 'Na liderança'}: <strong>${escape(latest.bidder)}</strong>` : (ended ? 'Este leilão terminou sem lances.' : 'Seja o primeiro a dar um lance.')}</div><p class="auction-minimum">Incremento mínimo: ${money(item.increment)}${ended ? '' : `<br>Próximo lance: ${money(minimumBid(item))}`}</p><button class="button" data-bid="${item.id}" ${ended ? 'disabled' : ''}>${ended ? 'Leilão encerrado' : 'Dar lance ↗'}</button><button class="history-button" data-history="${item.id}">Ver histórico · ${item.bids.length} lance${item.bids.length === 1 ? '' : 's'}</button></div></article>`;
  };
  const categories = auctionCategories.filter(category => category.id !== 'other' || shown.some(item => auctionCategory(item) === category.id));
  const category = categories.find(item => item.id === openedCategory);
  const items = category ? shown.filter(item => auctionCategory(item) === category.id) : [];
  const selected = categoryCards.get(openedCategory);
  const index = Math.max(0,items.findIndex(item => item.id === selected));
  if (items.length) categoryCards.set(openedCategory,items[index].id);
  $('#auction-grid').innerHTML = `<div class="auction-category-menu" aria-label="Escolha uma seção de leilões">${categories.map(group => {
    const count = shown.filter(item => auctionCategory(item) === group.id).length;
    return `<button class="auction-category-button" data-open-category="${group.id}" aria-expanded="${openedCategory === group.id}" aria-controls="category-auction-panel"><span class="category-card-peek" aria-hidden="true">${shown.filter(item => auctionCategory(item) === group.id).slice(0,2).map(item => `<img src="${escape(item.image)}" alt="">`).join('')}</span><strong>${group.name}</strong><span>${count} ${shown.filter(item => auctionCategory(item) === group.id).every(item => item.example) && count ? 'exemplos' : count === 1 ? 'carta' : 'cartas'}</span><span class="category-open-label">${openedCategory === group.id ? 'Seção aberta' : 'Abrir seção'} ↗</span></button>`;
  }).join('')}</div><section id="category-auction-panel" class="category-auction-panel ${animateSectionOpen ? 'section-unfold' : ''}" ${category ? '' : 'hidden'} aria-label="${category ? escape(category.name) : 'Cartas da seção'}">${category ? `<div class="category-panel-heading"><div><p class="eyebrow">VOCÊ ESTÁ EM</p><h3>${category.name}</h3><p>${category.subtitle}</p></div>${categoryLogo(items[index])}<button id="close-category" class="add" type="button">Fechar seção ×</button></div>${items.length ? `<div class="card-reveal ${animateCategoryCard ? 'is-revealing' : ''}">${cardBall(index)}<div class="single-auction-stage">${card(items[index])}</div></div><div class="single-auction-controls"><button id="previous-auction-card" class="add" data-card-step="-1" ${index === 0 ? 'disabled' : ''}>← Anterior</button><span role="status" aria-live="polite">Carta <strong>${index + 1}</strong> de ${items.length}</span><button id="next-auction-card" class="add" data-card-step="1" ${index >= items.length - 1 ? 'disabled' : ''}>Próxima →</button></div><div class="auction-thumbnails" aria-label="Miniaturas de ${category.name}">${items.map((item,i) => `<button class="auction-thumbnail" data-thumbnail="${item.id}" aria-label="Ver carta ${i + 1}: ${escape(item.name)}" aria-pressed="${i === index}"><img src="${escape(item.image)}" alt="" loading="lazy"><span>${item.example ? 'Exemplo' : i + 1}</span></button>`).join('')}</div>` : '<div class="shelf-empty">Ainda não há cartas nesta seção com o filtro escolhido. Novos lotes aparecerão por aqui.</div>'}` : ''}</section>${category ? '' : '<p class="category-invitation">Escolha uma seção acima para abrir e explorar as cartas, uma de cada vez.</p>'}`;
  animateCategoryCard = false; animateSectionOpen = false;
}
function showHistory() {
  const item = auctions.find(item => item.id === historyId);
  if (!item) return;
  $('#history-title').textContent = item.name;
  $('#history-content').innerHTML = item.bids.length ? `<ol class="bid-history">${[...item.bids].reverse().map(bid => `<li><div><strong>${escape(bid.bidder)}</strong><small>${date(bid.createdAt)} · Brasília</small></div><strong>${money(bid.amount)}</strong></li>`).join('')}</ol>` : '<p>Ainda não há lances para esta carta.</p>';
}
async function refresh() {
  try { if (!store) return; auctions = await store.list(); render(); if ($('#history-dialog').open) showHistory(); await renderDashboard(); }
  catch (error) { $('#auction-status').textContent = error.message; }
}
document.addEventListener('click', async event => {
  const bid = event.target.closest('[data-bid]');
  if (bid) {
    if (!auth.currentUser()) { setAuthMode('login'); $('#auth-dialog').showModal(); return; }
    if (auth.currentUser().role !== 'user') { $('#auction-status').textContent = 'Administradores gerenciam os lotes. Entre com uma conta de usuário para dar lances.'; return; }
    await refresh(); selectedId = bid.dataset.bid;
    const item = auctions.find(item => item.id === selectedId);
    if (Date.now() >= item.endsAt) return;
    $('#bid-title').textContent = item.name;
    $('#bid-account').textContent = `Lance como ${auth.currentUser().name}`;
    $('#bid-summary').textContent = `Encerramento: ${date(item.endsAt)} (Brasília).`;
    $('#bid-amount').min = (minimumBid(item) / 100).toFixed(2);
    $('#bid-amount').value = (minimumBid(item) / 100).toFixed(2);
    $('#bid-minimum').textContent = `Lance mínimo: ${money(minimumBid(item))}`;
    $('#bid-error').textContent = ''; $('#bid-dialog').showModal();
  }
  const history = event.target.closest('[data-history]');
  if (history) { historyId = history.dataset.history; showHistory(); $('#history-dialog').showModal(); }
});
$('#bid-form').addEventListener('submit', async event => {
  event.preventDefault();
  const submit = event.currentTarget.querySelector('button[type="submit"]'); submit.disabled = true;
  try {
    const decimal = Number($('#bid-amount').value);
    const amount = Math.round(decimal * 100);
    await store.bid(selectedId, { amount });
    await refresh(); $('#bid-dialog').close(); $('#auction-status').textContent = backend ? 'Lance registrado com sucesso.' : 'Lance de demonstração registrado neste navegador.';
  } catch (error) { $('#bid-error').textContent = error.message; refresh(); }
  finally { submit.disabled = false; }
});
$('#close-bid').addEventListener('click', () => $('#bid-dialog').close());
$('#close-history').addEventListener('click', () => $('#history-dialog').close());
$('#auction-filter').addEventListener('change', render);
function stepCategoryCard(step, focusControl) {
  const items = browsingItems().filter(item => auctionCategory(item) === openedCategory);
  const index = Math.max(0,items.findIndex(item => item.id === categoryCards.get(openedCategory)));
  const next = index + step;
  if (next < 0 || next >= items.length) return;
  categoryCards.set(openedCategory,items[next].id); animateCategoryCard = true; render();
  if (focusControl) {
    const control = document.querySelector(`[data-card-step="${step}"]`);
    (control?.disabled ? document.querySelector(`[data-card-step="${-step}"]`) : control)?.focus({preventScroll:true});
  }
}
$('#auction-grid').addEventListener('click', event => {
  const category = event.target.closest('[data-open-category]');
  if (category) {
    openedCategory = category.dataset.openCategory; animateCategoryCard = true; animateSectionOpen = true; render();
    document.querySelector(`[data-open-category="${openedCategory}"]`)?.focus({preventScroll:true});
    $('#category-auction-panel').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block:'start' });
  }
  const step = event.target.closest('[data-card-step]');
  if (step) stepCategoryCard(Number(step.dataset.cardStep),true);
  const thumbnail = event.target.closest('[data-thumbnail]');
  if (thumbnail) {
    if (categoryCards.get(openedCategory) === thumbnail.dataset.thumbnail) return;
    categoryCards.set(openedCategory,thumbnail.dataset.thumbnail); animateCategoryCard = true; render();
    document.querySelector(`[data-thumbnail="${thumbnail.dataset.thumbnail}"]`)?.focus({preventScroll:true});
  }
  if (event.target.closest('#close-category')) {
    const previous = openedCategory; openedCategory = null; render();
    document.querySelector(`[data-open-category="${previous}"]`)?.focus({preventScroll:true});
  }
});
let swipeStart;
$('#auction-grid').addEventListener('pointerdown', event => {
  if (event.pointerType === 'mouse' || !event.target.closest('.single-auction-stage') || event.target.closest('button,a,input,select,textarea')) return;
  swipeStart = {x:event.clientX,y:event.clientY,id:event.pointerId};
});
$('#auction-grid').addEventListener('pointerup', event => {
  if (!swipeStart || swipeStart.id !== event.pointerId) return;
  const dx=event.clientX-swipeStart.x,dy=event.clientY-swipeStart.y; swipeStart=null;
  if (Math.abs(dx)>65 && Math.abs(dx)>Math.abs(dy)*1.5) stepCategoryCard(dx<0 ? 1 : -1,false);
});
$('#auction-grid').addEventListener('pointercancel', () => { swipeStart=null; });
window.addEventListener('storage', event => { if ((event.key === AUCTION_KEY || event.key === ACCOUNTS_KEY) && store) refresh(); });
document.addEventListener('visibilitychange', () => { if (!document.hidden && store) refresh(); });
let lastTick = Date.now();
setInterval(() => {
  let expired = false;
  for (const item of auctions) {
    if (lastTick < item.endsAt && Date.now() >= item.endsAt) expired = true;
    const clock = document.querySelector(`[data-clock="${item.id}"]`);
    if (!clock) continue;
    if (Date.now() >= item.endsAt && clock.textContent !== 'Encerrado') expired = true;
    else if (Date.now() < item.endsAt) clock.textContent = remaining(item.endsAt);
  }
  if (expired) { render(); renderDashboard(); $('#auction-status').textContent = backend ? 'Um leilão foi encerrado. Acompanhe a emissão do ticket no painel.' : 'Um leilão foi encerrado. Confira o resultado demonstrativo.'; }
  lastTick = Date.now();
}, 1000);
let authMode = 'login';
function setAuthMode(mode) {
  authMode = mode; $('#auth-error').textContent = '';
  $('#auth-name-label').hidden = mode === 'login'; $('#auth-name').required = mode !== 'login';
  $('#auth-password').autocomplete = mode === 'login' ? 'current-password' : 'new-password';
  $('#auth-password').minLength = mode === 'login' ? 1 : 8;
  $('#auth-email').type = mode === 'login' ? 'text' : 'email';
  $('#auth-email-label').textContent = mode === 'login' ? 'Usuário ou e-mail' : 'E-mail';
  $('#auth-submit').textContent = mode === 'login' ? 'Entrar' : 'Criar conta de usuário';

  $('#auth-description').textContent = 'Entre com sua conta de cliente para participar dos leilões.';
}
function renderSession() {
  const user = auth.currentUser();
  $('#session-name').textContent = user ? `${user.name} · Usuário` : '';
  $('#open-login').hidden = !!user; $('#logout').hidden = !user;
  $('#welcome-login').textContent = user ? 'Meu acompanhamento ↗' : 'Entrar para participar';

}
$('#open-login').addEventListener('click', () => { setAuthMode('login'); $('#auth-dialog').showModal(); });
$('#close-auth').addEventListener('click', () => $('#auth-dialog').close());
document.querySelectorAll('[data-auth-mode]').forEach(button => button.addEventListener('click', () => setAuthMode(button.dataset.authMode)));
$('#logout').addEventListener('click', async () => { try { await auth.logout(); $('#bid-dialog').close(); selectView('browse'); render(); await renderDashboard(); $('#auction-status').textContent = 'Você saiu da conta.'; } catch(error) { $('#auction-status').textContent = error.message; } });
$('#auth-form').addEventListener('submit', async event => {
  event.preventDefault(); $('#auth-submit').disabled = true; $('#auth-error').textContent = '';
  try {
    if (authMode === 'login') await auth.login($('#auth-email').value, $('#auth-password').value);
    else await auth.register({ name: $('#auth-name').value, email: $('#auth-email').value, password: $('#auth-password').value });
    $('#auth-form').reset(); $('#auth-dialog').close(); refresh(); $('#auction-status').textContent = 'Login realizado. Sua conta está pronta para continuar.';
  } catch (error) { $('#auth-error').textContent = error.message; }
  finally { $('#auth-submit').disabled = false; }
});
function selectView(view) {
  if (!['browse', 'follow'].includes(view)) return;
  activeView = view;
  for (const tab of document.querySelectorAll('[data-auction-view]')) {
    const selected = tab.dataset.auctionView === view;
    tab.setAttribute('aria-selected', String(selected)); tab.tabIndex = selected ? 0 : -1;
  }
  $('#auction-browse').hidden = view !== 'browse'; $('#auction-follow').hidden = view !== 'follow';
  if (view === 'follow') renderDashboard();
}
document.querySelectorAll('[data-auction-view]').forEach(tab => {
  tab.addEventListener('click', () => selectView(tab.dataset.auctionView));
  tab.addEventListener('keydown', event => {
    if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
    event.preventDefault(); const tabs = [...document.querySelectorAll('[data-auction-view]')].filter(item => !item.hidden);
    let index = tabs.indexOf(tab); index = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    tabs[index].focus(); selectView(tabs[index].dataset.auctionView);
  });
});
let dashboardRequest = 0, dashboardTickets = [];
$('#welcome-login').addEventListener('click', () => {
  if (auth.currentUser()) { selectView('follow'); $('#auction-workspace').scrollIntoView({ behavior: 'smooth' }); }
  else { setAuthMode('login'); $('#auth-dialog').showModal(); }
});
$('#overview-follow').addEventListener('click', () => selectView('follow'));
async function renderDashboard() {
  const request = ++dashboardRequest, user = auth.currentUser();
  dashboardTickets = []; $('#dashboard-summary').replaceChildren(); $('#followed-auctions').replaceChildren(); $('#ticket-list').replaceChildren();
  if (!user) { $('#dashboard-status').textContent = 'Entre na sua conta para acompanhar seus lances e tickets.'; return; }
  try {
    const data = backend ? await backend.dashboard() : { tickets: [], myAuctionIds: auctions.filter(lot => lot.bids.some(bid => bid.bidderId === user.id)).map(lot => lot.id) };
    if (request !== dashboardRequest || auth.currentUser()?.id !== user.id) return;
    dashboardTickets = data.tickets;
    const followed = auctions.filter(lot => data.myAuctionIds.includes(lot.id));
    $('#dashboard-status').textContent = backend ? 'Resultados e notificações atualizados pelo Supabase.' : 'Demonstração local. O envio de e-mail e a emissão de tickets reais serão ativados ao conectar o Supabase.';
    const active = followed.filter(lot => Date.now() < lot.endsAt).length;
    $('#dashboard-summary').innerHTML = `<div><strong>${active}</strong><span>em andamento</span></div><div><strong>${followed.length - active}</strong><span>encerrados</span></div><div><strong>${data.tickets.length}</strong><span>tickets recebidos</span></div>`;
    $('#followed-auctions').innerHTML = followed.length ? followed.map(lot => `<article class="followed-lot"><img src="${escape(lot.image)}" alt="Carta ${escape(lot.name)}"><div><h3>${escape(lot.name)}</h3><p>${Date.now() >= lot.endsAt ? 'Encerrado' : 'Em andamento'} · ${date(lot.endsAt)}</p><p>${lot.bids.length ? `Maior lance: ${money(lot.bids.at(-1).amount)} · ${escape(lot.bids.at(-1).bidder)}` : 'Ainda sem lances'}</p></div><button class="add" data-history="${lot.id}">Histórico</button></article>`).join('') : '<p class="catalog-note">Seus leilões aparecerão aqui após o primeiro lance.</p>';
    const states = { pending: 'Na fila', processing: 'Enviando', sent: 'Aceito pelo provedor', failed: 'Falha no envio' };
    $('#ticket-list').innerHTML = data.tickets.length ? data.tickets.map(ticket => `<article class="pickup-ticket"><div><p class="eyebrow">${ticket.redeemedAt ? 'RETIRADA CONFIRMADA' : 'TICKET DE RETIRADA'}</p><h3>${escape(ticket.card)}</h3><p>${escape(ticket.winner)} · ${money(ticket.amount)}</p><p class="catalog-note">E-mail: ${escape(ticket.email)} · ${states[ticket.emailStatus] || 'Pendente'}${ticket.attempts >= 8 && ticket.emailStatus !== 'sent' ? ' — limite de tentativas atingido' : ''}</p><code>${escape(ticket.code)}</code></div><button class="add" data-ticket="${ticket.id}">Baixar ticket ↓</button></article>`).join('') : '<p class="catalog-note">Nenhum ticket emitido. Após o encerramento, o processamento confirma o vencedor e prepara o e-mail.</p>';
  } catch(error) { if (request === dashboardRequest) $('#dashboard-status').textContent = error.message; }
}
$('#refresh-dashboard').addEventListener('click', refresh);
$('#google-login').addEventListener('click', async () => {
  if (!backend) return;
  try { $('#google-login').disabled = true; await backend.auth.googleLogin(); }
  catch { $('#google-status').textContent = 'Não foi possível abrir o login Google. Tente novamente.'; $('#google-login').disabled = false; }
});
document.addEventListener('click', event => {
  const button = event.target.closest('[data-ticket]'); if (!button) return;
  const ticket = dashboardTickets.find(item => item.id === button.dataset.ticket); if (!ticket || !auth.currentUser()) return;
  const text = `FLARE CARDS — TICKET DE RETIRADA\n\nCarta: ${ticket.card}\nGanhador: ${ticket.winner}\nValor: ${money(ticket.amount)}\nCódigo: ${ticket.code}\nStatus: ${ticket.redeemedAt ? 'Retirada confirmada' : 'Aguardando retirada'}\n\nApresente este ticket e um documento na retirada. Confira as instruções no e-mail enviado pela loja. Este ticket não comprova pagamento. Não compartilhe o código.`;
  const link = document.createElement('a'), url = URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));
  link.href = url; link.download = 'flare-ticket-retirada.txt'; link.click(); setTimeout(() => URL.revokeObjectURL(url),1000);
});
if (backend) {
  $('#backend-notice').innerHTML = '<strong>Conta conectada</strong><span>Leilões compartilhados pelo Supabase. Entre com Google para participar e receber seu ticket por e-mail.</span>';
  $('#local-auth-tabs').hidden = true; $('#auth-form').hidden = true; $('#google-login').disabled = false;
  $('#google-status').textContent = 'Use sua conta Google. O e-mail da conta será usado para enviar seu ticket.';
  $('#auth-dialog > .catalog-note').textContent = 'Entre com Google para continuar.';
  $('#bid-form > .catalog-note:not(#bid-minimum):not(#bid-account)').textContent = 'Seu lance será registrado na conta conectada.';
  setInterval(() => { if (!document.hidden && !$('#bid-dialog').open) refresh(); },15000);
} else if (backendError) {
  $('#backend-notice').textContent = backendError; $('#open-login').disabled = true;
}
render(); renderDashboard();







