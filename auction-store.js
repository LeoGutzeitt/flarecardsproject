import {validateCardLanguage} from './card-languages.js';
import { findCollection } from './pokemon-collections.js';
// Valores monetários em centavos. Adaptador local substituível por uma API.
import { auctionCategories, auctionCategory } from './auction-categories.js';
export const AUCTION_KEY = 'flare-cards:auctions:v1';
export function validateAuctionImage(image) {
  if (typeof image !== 'string' || image.length > 2800000 || !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(image)) throw new Error('Envie uma foto da carta em JPG, PNG ou WebP, de até 2 MB.');
  return image;
}
export const auctionCatalog = [
  { id: 'charizard-001', name: 'Charizard ex', collectionId: 'sv03.5', collection: '151 · Rara Dupla', image: 'assets/charizard.webp', opening: 150000, increment: 2500, duration: 2 * 3600000 },
  { id: 'rayquaza-001', name: 'M-Rayquaza EX', collectionId: 'xy6', collection: 'Céus Estrondosos · Ultra Rara', image: 'assets/rayquaza.webp', opening: 200000, increment: 5000, duration: 24 * 3600000 },
  { id: 'umbreon-001', name: 'Umbreon ex', collectionId: 'sv08.5', collection: 'Evoluções Prismáticas · Rara Dupla', image: 'assets/umbreon.webp', opening: 100000, increment: 2500, duration: 48 * 3600000 },
];
export function minimumBid(auction) { return auction.bids.length ? auction.bids.at(-1).amount + auction.increment : auction.opening; }
export function placeBid(auction, { amount, bidder, bidderId }, now = Date.now()) {
  if (auction.draft) throw new Error('Este leilão ainda não foi iniciado.');
  if (now >= auction.endsAt) throw new Error('Este leilão já foi encerrado.');
  if (!Number.isSafeInteger(amount) || amount < minimumBid(auction) || amount > 100000000) throw new Error('Informe um valor válido, igual ou superior ao lance mínimo e até R$ 1.000.000,00.');
  if (typeof bidder !== 'string' || !bidder.trim() || bidder.trim().length > 40) throw new Error('Informe um apelido de até 40 caracteres.');
  return { ...auction, bids: [...auction.bids, { id: crypto.randomUUID(), amount, bidder: bidder.trim(), ...(bidderId ? { bidderId } : {}), createdAt: now }] };
}
export function createAuctionStore(storage, now = () => Date.now(), authorize = () => { throw new Error('Entre na sua conta para continuar.'); }) {
  function load() {
    let saved;
    try { saved = JSON.parse(storage.getItem(AUCTION_KEY) || 'null'); } catch { /* Recupera dados inválidos. */ }
    const custom = Array.isArray(saved) ? saved.filter(item => item?.custom === true) : [];
    return [...auctionCatalog, ...custom].map(item => {
      const previous = Array.isArray(saved) && saved.find(entry => entry?.id === item.id);
      const valid = previous && Number.isSafeInteger(previous.endsAt) && previous.endsAt > 0 && Array.isArray(previous.bids);
      const auction = { ...item, ...(valid ? { opening: previous.opening, increment: previous.increment, image: previous.image, collectionId: previous.collectionId || item.collectionId, collection: previous.collection || item.collection, number:previous.number??item.number??'', language:previous.language??item.language??'', draft:previous.draft===true, moderation:previous.moderation||[], closedAt:previous.closedAt } : {}), endsAt: valid ? previous.endsAt : now() + item.duration, bids: [] };
      auction.category = auctionCategory(valid ? { ...auction, category: previous.category } : auction);
      if (valid) for (const bid of previous.bids) {
        if (!Number.isSafeInteger(bid?.createdAt) || bid.createdAt >= auction.endsAt || typeof bid.id !== 'string') break;
        try { auction.bids = placeBid(auction, bid, bid.createdAt).bids; auction.bids.at(-1).id = bid.id; } catch { break; }
      }
      return auction;
    });
  }
  function save(auctions) {
    try { const serialized=JSON.stringify(auctions); if(storage.getItem(AUCTION_KEY)!==serialized)storage.setItem(AUCTION_KEY, serialized); }
    catch { throw new Error('Não foi possível salvar o lance neste navegador. Verifique o armazenamento local.'); }
  }
  return {
    create(input) {
      authorize('admin');
      if (input.category !== undefined && !auctionCategories.some(item => item.id === input.category)) throw new Error('Escolha uma seção válida para o leilão.');
      if (typeof input.name !== 'string' || !input.name.trim() || input.name.length > 80 || typeof input.collection !== 'string' || input.collection.length > 100) throw new Error('Informe o nome da carta e a coleção.');
      if (input.collectionId && !findCollection(input.collectionId)) throw new Error('Escolha uma coleção válida.');
      const language=validateCardLanguage(input.language);
      const number=String(input.number??'').trim();
      if(number&&!/^[0-9]{3}\/[0-9]{3}$/.test(number))throw Error('Informe o número no formato xxx/xxx.');
      validateAuctionImage(input.image);
      if (![input.opening, input.increment].every(value => Number.isSafeInteger(value) && value > 0 && value <= 100000000)) throw new Error('Valores devem ser positivos e até R$ 1.000.000,00.');
      if (!Number.isSafeInteger(input.endsAt) || input.endsAt <= now()) throw new Error('Defina um encerramento no futuro.');
      const auctions = load();
      const auction = { id: crypto.randomUUID(), name: input.name.trim(), number, language, collectionId: input.collectionId || null, collection: findCollection(input.collectionId)?.name || input.collection.trim(), image: input.image, opening: input.opening, increment: input.increment, endsAt: input.endsAt, custom: true, draft:input.draft===true, bids: [] };
      auction.category = input.category || 'other';
      save([...auctions, auction]); return auction;
    },
    configure(id, input) {
      authorize('admin');
      const auctions = load(); const item = auctions.find(item => item.id === id);
      if (!item) throw new Error('Leilão não encontrado.');
      if (item.bids.length || now() >= item.endsAt) throw new Error('Só é possível configurar leilões abertos que ainda não receberam lances.');
      if (![input.opening, input.increment].every(value => Number.isSafeInteger(value) && value > 0 && value <= 100000000) || !Number.isSafeInteger(input.endsAt) || input.endsAt <= now()) throw new Error('Informe valores positivos e encerramento no futuro.');
      if (input.language !== undefined) item.language=validateCardLanguage(input.language);
      if (input.number !== undefined) {const number=String(input.number).trim();if(number&&!/^[0-9]{3}\/[0-9]{3}$/.test(number))throw Error('Informe o número no formato xxx/xxx.');item.number=number;}
      if (input.image !== undefined) validateAuctionImage(input.image);
      if (input.category !== undefined && !auctionCategories.some(category => category.id === input.category)) throw new Error('Escolha uma seção válida para o leilão.');
      if (input.collectionId !== undefined) { const set = findCollection(input.collectionId); if (!set) throw new Error('Escolha uma coleção válida.'); item.collectionId = set.id; item.collection = set.name; }
      if (input.category !== undefined) item.category = input.category;
      Object.assign(item, { opening: input.opening, increment: input.increment, endsAt: input.endsAt, ...(input.image !== undefined ? { image: input.image } : {}) }); save(auctions); return item;
    },
    list() { const auctions = load(); save(auctions); return auctions.filter(item=>!item.draft); },
    adminList() { authorize('admin'); const items=load();save(items);return items; },
    start(id,endsAt){authorize('admin');const items=load(),item=items.find(a=>a.id===id);if(!item?.draft||!Number.isSafeInteger(endsAt)||endsAt<=now())throw Error('Escolha um rascunho e uma data futura.');item.draft=false;item.endsAt=endsAt;save(items);return item;},
    close(id,reason){authorize('admin');if(!reason?.trim())throw Error('Informe o motivo do encerramento.');const items=load(),item=items.find(a=>a.id===id);if(!item||item.draft||item.endsAt<=now())throw Error('Este leilão não está ativo.');item.endsAt=now();item.closedAt=now();item.moderation=[...(item.moderation||[]),{action:'Encerrado',reason,at:now()}];save(items);return item;},
    moderateBid(id,bidId,reason){authorize('admin');if(!reason?.trim())throw Error('Informe o motivo da anulação.');const items=load(),item=items.find(a=>a.id===id);if(!item||item.endsAt<=now())throw Error('Só é possível moderar lances de leilões ativos.');const bid=item.bids.find(b=>b.id===bidId);if(!bid)throw Error('Lance não encontrado.');item.moderation=[...(item.moderation||[]),{action:'Lance anulado',bid,reason,at:now()}];item.bids=item.bids.filter(b=>b.id!==bidId);save(items);return item;},
    bid(id, input) {
      const user = authorize('user');
      const auctions = load(); const index = auctions.findIndex(item => item.id === id);
      if (index < 0) throw new Error('Leilão não encontrado.');
      auctions[index] = placeBid(auctions[index], { amount: input.amount, bidder: user.name, bidderId: user.id }, now()); save(auctions); return auctions[index];
    },
  };
}

