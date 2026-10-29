import test from 'node:test';
import assert from 'node:assert/strict';
import { createAuth } from '../auth.js';
import { createAuctionStore, validateAuctionImage } from '../auction-store.js';
function memory() { const map = new Map(); return { getItem: key => map.get(key) ?? null, setItem: (key, value) => map.set(key, value), removeItem: key => map.delete(key) }; }
test('login, senha inválida, sessão e papéis separados', async () => {
  const data = memory(), session = memory(), auth = createAuth(data, session, {allowAdmin:true});
  assert.throws(() => auth.requireUser(), /Entre/);
  await auth.login('usuario_admin', '1234');
  assert.equal(auth.currentUser().role, 'admin');
  assert.throws(() => auth.requireUser('user'), /usuário/);
  await assert.rejects(auth.register({ name: 'Outro', email: 'outro@example.test', password: 'teste12345' }, true), /já foi/);
  auth.logout(); assert.equal(auth.currentUser(), null);
  await assert.rejects(auth.login('admin@example.test', 'incorreta'), /incorretos/);
  await auth.login('usuario_admin', '1234'); assert.equal(auth.currentUser().role, 'admin'); auth.logout();
  await auth.register({ name: 'Ana', email: 'ana@example.test', password: 'teste12345' });
  assert.equal(auth.currentUser().role, 'user'); assert.throws(() => auth.requireUser('admin'), /administradores/);
});
test('somente admin cadastra/configura e somente usuário dá lance com identidade da sessão', async () => {
  const data = memory(), auth = createAuth(data, memory(), {allowAdmin:true});
  const store = createAuctionStore(data, () => 100000, role => auth.requireUser(role));
  const input = { name: '<Carta teste>', collection: 'Teste', collectionId: 'sv03.5', image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==', opening: 1000, increment: 100, endsAt: 200000 };
  assert.throws(() => store.create(input), /Entre/);
  assert.throws(() => store.bid(store.list()[0].id, { amount: 150000 }), /Entre/);
  await auth.login('usuario_admin', '1234');
  const created = store.create(input); assert.equal(store.list().find(item => item.id === created.id).name, input.name);
  assert.equal(store.list().find(item => item.id === created.id).image, input.image);
  assert.equal(store.list().find(item => item.id === created.id).category,'other');
  assert.equal(store.list().find(item => item.id === created.id).collection,'151');
  assert.equal(store.list().find(item => item.id === created.id).collectionId,'sv03.5');
  assert.throws(() => store.create({...input,collectionId:'invalid'}),/coleção válida/);
  store.configure(created.id,{opening:1000,increment:100,endsAt:200000,category:'yellow',collectionId:'xy6'});
  assert.equal(store.list().find(item => item.id === created.id).category,'yellow');
  assert.equal(store.list().find(item => item.id === created.id).collectionId,'xy6');
  assert.equal(store.list().find(item => item.id === created.id).collection,'Céus Estrondosos');
  assert.throws(() => store.create({...input,category:'invalid'}),/seção/);
  assert.throws(() => store.create({ ...input, image: 'assets/charizard.webp' }), /foto/);
  store.configure(created.id, { opening: 1200, increment: 200, endsAt: 250000 });
  assert.equal(store.list().find(item => item.id === created.id).increment, 200);
  const replacement = 'data:image/webp;base64,AAAA';
  store.configure(created.id, { opening: 1200, increment: 200, endsAt: 250000, image: replacement });
  assert.equal(store.list().find(item => item.id === created.id).image, replacement);
  assert.throws(() => store.bid(created.id, { amount: 1200 }), /usuário/);
  auth.logout(); await auth.register({ name: 'Ana', email: 'ana@example.test', password: 'teste12345' });
  assert.throws(() => store.create(input), /administradores/);
  assert.throws(() => store.configure(created.id, input), /administradores/);
  const bid = store.bid(created.id, { amount: 1200, bidder: 'Pessoa falsa' }); assert.equal(bid.bids[0].bidder, 'Ana');
  auth.logout(); await auth.login('usuario_admin', '1234');
  assert.throws(() => store.configure(created.id, input), /receberam lances/);
});
test('fotos rejeitam formatos ativos, referências do catálogo e arquivos muito grandes', () => {
  for (const value of ['javascript:alert(1)', 'data:image/svg+xml;base64,AAAA', 'assets/logo.png', 'data:image/png;base64,' + 'A'.repeat(2800000)]) assert.throws(() => validateAuctionImage(value), /foto/);
});


