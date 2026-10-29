import test from 'node:test';
import assert from 'node:assert/strict';
import { buildWinnerEmail, deliverWinnerEmail } from '../supabase/functions/_shared/winner-email.mjs';
const job = { name:'<Ana>',card:'Carta & rara',amount:2500,code:'ticket-123',email:'ana@example.test',ticketId:'test-id' };
const config = { from:'Flare <teste@example.test>',key:'fake-test-key',instructions:'Retirada no endereço de teste.' };
test('ticket contém valor, código, orientações e texto escapado', () => {
  const email = buildWinnerEmail(job,config.from,config.instructions);
  assert.deepEqual(email.to,['ana@example.test']); assert.match(email.text,/ticket-123/); assert.match(email.text,/25,00/);
  assert.match(email.html,/&lt;Ana&gt;/); assert.doesNotMatch(email.html,/<Ana>/); assert.match(email.text,/não comprova pagamento/);
});
test('envio usa chave idempotente e rejeita falha do provedor', async () => {
  let call;
  await deliverWinnerEmail(job,config,async (url,options) => { call={url,options}; return {ok:true}; });
  assert.equal(call.options.headers['Idempotency-Key'],'auction-ticket-test-id');
  assert.equal(JSON.parse(call.options.body).to[0],job.email);
  await assert.rejects(deliverWinnerEmail(job,config,async () => ({ok:false,status:429})),/HTTP 429/);
  assert.throws(() => buildWinnerEmail(job,config.from,''),/retirada/);
});
test('modelo escolhido gera anexo PNG e falha na imagem impede envio incompleto',async()=>{
 let calls=0,payload;
 await deliverWinnerEmail({...job,number:'006/165',template:'ouro'},{...config,renderTicket:async input=>{assert.equal(input.template,'ouro');assert.equal(input.number,'006/165');return 'iVBORw0KGgo=';}},async(url,options)=>{calls++;payload=JSON.parse(options.body);return {ok:true};});
 assert.equal(calls,1);assert.equal(payload.attachments[0].filename,'flare-ticket.png');assert.equal(payload.attachments[0].content_type,'image/png');assert.match(payload.text,/006\/165/);
 await assert.rejects(deliverWinnerEmail(job,{...config,renderTicket:async()=>{throw Error('Falha no renderizador');}},async()=>{calls++;return {ok:true};}),/renderizador/);assert.equal(calls,1);
});
