import test from 'node:test';
import assert from 'node:assert/strict';
import {createWinnerReviews} from '../auction-winners.js';
import {ACCOUNTS_KEY} from '../auth.js';
test('revisão exige admin, resultado encerrado, conta e e-mail; aprovação é idempotente',()=>{
 const map=new Map(),storage={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};let allowed=false;
 const lots=[{id:'active',endsAt:2000,bids:[{id:'a'}]},{id:'empty',endsAt:500,bids:[]},{id:'draft',endsAt:500,draft:true,bids:[]},{id:'win',name:'Carta real',endsAt:500,bids:[{id:'bid',bidder:'Ana',bidderId:'ana',amount:1000}]}];
 const store=createWinnerReviews(storage,{adminList:()=>lots},()=>{if(!allowed)throw Error('Sem acesso');return {name:'Admin'};},()=>1000);
 assert.throws(()=>store.list(),/acesso/);allowed=true;
 assert.equal(store.list().length,2);assert.throws(()=>store.approve('active'),/ganhador/);assert.throws(()=>store.approve('empty'),/ganhador/);
 assert.throws(()=>store.approve('win'),/E-mail/);
 storage.setItem(ACCOUNTS_KEY,JSON.stringify([{id:'ana',email:'ana@example.test',disabled:true}]));assert.throws(()=>store.approve('win'),/suspensa/);
 storage.setItem(ACCOUNTS_KEY,JSON.stringify([{id:'ana',email:'ana@example.test'}]));
 assert.throws(()=>store.approve('win','invalid'),/modelo/);
 const approved=store.approve('win','ouro');assert.equal(approved.template,'ouro');assert.equal(approved.status,'approved');assert.equal(approved.emailStatus,'pending-configuration');assert.ok(approved.code);assert.equal(store.approve('win').code,approved.code);assert.equal(store.approve('win','brasa').template,'ouro');
 storage.setItem(ACCOUNTS_KEY,JSON.stringify([{id:'ana',email:'novo@example.test'}]));assert.equal(store.list().find(w=>w.auctionId==='win').status,'review');
});
