import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

test('PostgreSQL: permissões, lances, encerramento, fila e ticket de uso único', async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth; create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb);
      create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      grant usage on schema public,auth to anon,authenticated,service_role;
      insert into auth.users values
        ('00000000-0000-0000-0000-000000000001','admin@example.test',now(),'{}'),
        ('00000000-0000-0000-0000-000000000002','ana@example.test',now(),'{"full_name":"Ana"}'),
        ('00000000-0000-0000-0000-000000000003','bia@example.test',now(),'{"full_name":"Bia"}');`);
    await db.exec(await readFile(new URL('../supabase/migrations/202610230001_auctions.sql',import.meta.url),'utf8'));
    await db.exec(await readFile(new URL('../supabase/migrations/202610230002_auction_categories.sql',import.meta.url),'utf8'));
    await db.exec(await readFile(new URL('../supabase/migrations/202610260001_pokemon_collections.sql',import.meta.url),'utf8'));
    await db.exec(await readFile(new URL('../supabase/migrations/202610280001_winner_review.sql',import.meta.url),'utf8'));
    await db.exec(await readFile(new URL('../supabase/migrations/202610280002_ticket_templates.sql',import.meta.url),'utf8'));
    const rpc = async (name,args=[]) => (await db.query(`select public.${name}(${args.map((_,i)=>`$${i+1}`).join(',')}) as value`,args)).rows[0].value;
    const identity = async (suffix,role='authenticated') => { await db.exec('reset role'); await db.query("select set_config('request.jwt.claim.sub',$1,false)",[suffix ? `00000000-0000-0000-0000-00000000000${suffix}` : '']); await db.exec(`set role ${role}`); };
    await db.exec("insert into public.auction_admins values('00000000-0000-0000-0000-000000000001')");
    const payload = { name:'Carta real',number:'006/165',category:'rare-art',collection:'151',collectionId:'sv03.5',image:'data:image/png;base64,AAAA',opening:1000,increment:100,endsAt:Date.now()+3600000 };
    await identity(2);
    await assert.rejects(rpc('save_auction',[null,payload]),/administradores/);
    await assert.rejects(db.query('select * from public.auction_tickets'),/permission denied/);
    await identity(1);
    const lot = await rpc('save_auction',[null,payload]);
    assert.equal((await rpc('list_auctions'))[0].category,'rare-art');
    assert.equal((await rpc('list_auctions'))[0].collectionId,'sv03.5');
    assert.match((await rpc('list_auctions'))[0].collectionLogo,/assets.tcgdex.net/);
    await assert.rejects(rpc('save_auction',[null,{...payload,collectionId:'invalid'}]),/coleção válida/);
    await assert.rejects(rpc('save_auction',[null,{...payload,category:'invalid'}]),/check constraint/);
    await assert.rejects(rpc('submit_auction_bid',[lot,1000,crypto.randomUUID()]),/usuário/);
    await identity(null,'anon');
    assert.equal((await rpc('list_auctions')).length,1);
    await assert.rejects(rpc('submit_auction_bid',[lot,1000,crypto.randomUUID()]),/permission denied/);
    await identity(2);
    const request = crypto.randomUUID();
    const bid = await rpc('submit_auction_bid',[lot,1000,request]);
    assert.equal(await rpc('submit_auction_bid',[lot,1000,request]),bid);
    await assert.rejects(rpc('submit_auction_bid',[lot,1050,crypto.randomUUID()]),/mínimo/);
    await identity(3); await rpc('submit_auction_bid',[lot,1100,crypto.randomUUID()]);
    await identity(1); await assert.rejects(rpc('save_auction',[lot,payload]),/com lances/);
    await db.exec('reset role'); await db.query("update public.auction_lots set ends_at=now()-interval '1 second' where id=$1",[lot]);
    await identity(2); await assert.rejects(rpc('submit_auction_bid',[lot,1200,crypto.randomUUID()]),/encerrado/);
    await assert.rejects(rpc('finalize_auctions'),/permission denied/);
    await identity(null,'service_role'); assert.equal(await rpc('finalize_auctions'),1); assert.equal(await rpc('finalize_auctions'),0);
    assert.deepEqual(await rpc('claim_auction_notifications'),[]);
    await identity(3);assert.equal((await rpc('auction_dashboard')).tickets.length,0);
    await assert.rejects(rpc('admin_auction_winners'),/administrador/);
    await identity(1);const pending=(await rpc('admin_auction_winners'))[0];assert.equal(pending.status,'review');assert.equal(pending.code,null);
    await identity(3);await assert.rejects(rpc('approve_auction_winner',[pending.id]),/administrador/);
    await identity(1);await assert.rejects(rpc('approve_auction_winner',[pending.id,'invalid']),/modelo/);await rpc('approve_auction_winner',[pending.id,'ouro']);await rpc('approve_auction_winner',[pending.id,'brasa']);
    assert.equal((await rpc('admin_auction_winners'))[0].status,'approved');
    await identity(null,'service_role');
    const jobs = await rpc('claim_auction_notifications'); assert.equal(jobs.length,1); assert.equal(jobs[0].email,'bia@example.test');assert.equal(jobs[0].template,'ouro');assert.equal(jobs[0].number,'006/165');
    assert.deepEqual(await rpc('claim_auction_notifications'),[]);
    await rpc('complete_auction_notification',[jobs[0].id,jobs[0].attempt,true,null]);
    await identity(2); assert.equal((await rpc('auction_dashboard')).tickets.length,0);
    await identity(3); const ticket = (await rpc('auction_dashboard')).tickets[0]; assert.equal(ticket.emailStatus,'sent');
    assert.equal(ticket.code,jobs[0].code);
    await assert.rejects(rpc('redeem_auction_ticket',[ticket.code]),/administrador/);
    await identity(1); await rpc('redeem_auction_ticket',[ticket.code]);
    await assert.rejects(rpc('redeem_auction_ticket',[ticket.code]),/já confirmada/);
  } finally { await db.close(); }
});
