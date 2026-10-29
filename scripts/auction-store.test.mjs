import test from 'node:test';
import assert from 'node:assert/strict';
import { createAuctionStore, minimumBid, placeBid } from '../auction-store.js';
function fixture() { const data = new Map(); let time = 100000; const storage = { getItem: key => data.get(key), setItem: (key, value) => data.set(key, value) }; return { store: createAuctionStore(storage, () => time, () => ({ id: 'user-1', name: 'Ana', role: 'user' })), storage, setTime: value => time = value }; }
test('aceita lance inicial e exige incremento em centavos', () => {
  const { store } = fixture(); const auction = store.list()[0];
  assert.throws(() => store.bid(auction.id, { amount: auction.opening - 1, bidder: 'Ana' }));
  const updated = store.bid(auction.id, { amount: auction.opening, bidder: 'Ana' });
  assert.equal(minimumBid(updated), auction.opening + auction.increment);
  assert.throws(() => store.bid(auction.id, { amount: auction.opening, bidder: 'Bia' }));
  assert.throws(() => placeBid(auction, { amount: NaN, bidder: 'Ana' }, 100000));
  assert.throws(() => placeBid(auction, { amount: auction.opening, bidder: ' ' }, 100000));
});
test('mantém prazo e histórico ao recarregar e encerra no instante limite', () => {
  const { store, storage, setTime } = fixture(); const auction = store.list()[0];
  store.bid(auction.id, { amount: auction.opening, bidder: 'Ana' });
  const reloaded = createAuctionStore(storage, () => auction.endsAt - 1).list()[0];
  assert.equal(reloaded.endsAt, auction.endsAt); assert.equal(reloaded.bids.length, 1);
  setTime(auction.endsAt);
  assert.throws(() => store.bid(auction.id, { amount: minimumBid(reloaded), bidder: 'Bia' }), /encerrado/);
});
test('adapta erro de gravação sem confirmar lance', () => {
  const store = createAuctionStore({ getItem: () => null, setItem: () => { throw new Error('quota'); } });
  assert.throws(() => store.list(), /salvar/);
});

