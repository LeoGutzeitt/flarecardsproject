-- Modelos visuais aprovados são imutáveis; a imagem é gerada a partir dos dados do servidor.
alter table public.auction_lots add column card_number text not null default '' check(card_number='' or card_number ~ '^[0-9]{3}/[0-9]{3}$');
alter table public.auction_tickets add column template_id text not null default 'brasa' check(template_id in ('brasa','ouro'));
create or replace function public.admin_auction_winners() returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if not public.is_auction_admin() then raise exception 'Acesso restrito ao administrador.'; end if;
 return coalesce((select jsonb_agg(jsonb_build_object('id',t.id,'auctionId',l.id,'card',l.name,'image',l.image,'collection',l.collection,'number',l.card_number,'template',t.template_id,'winner',t.winner_name,'email',t.winner_email,'amount',t.amount,'endsAt',extract(epoch from l.ends_at)*1000,'reviewedAt',t.reviewed_at,'reviewedBy',t.reviewed_by,'code',case when t.reviewed_at is not null then t.code else null end,'status',case when t.reviewed_at is null then 'review' else 'approved' end,'emailStatus',case when t.reviewed_at is null then 'not-approved' else n.status end,'attempts',n.attempts,'sentAt',n.sent_at,'lastError',n.last_error) order by l.ends_at desc)
 from public.auction_tickets t join public.auction_lots l on l.id=t.auction_id left join public.auction_notifications n on n.ticket_id=t.id),'[]'::jsonb);
end; $$;
drop function public.approve_auction_winner(uuid);
create function public.approve_auction_winner(ticket_id uuid,template_id text default 'brasa') returns void language plpgsql security definer set search_path='' as $$
declare ticket public.auction_tickets; account_email text;
begin
 if not public.is_auction_admin() then raise exception 'Acesso restrito ao administrador.'; end if;
 select * into ticket from public.auction_tickets where id=ticket_id for update;
 if not found then raise exception 'Resultado não encontrado.'; end if;
 if template_id is null or template_id not in ('brasa','ouro') then raise exception 'Escolha um modelo de ticket válido.'; end if;
 if ticket.reviewed_at is not null then return; end if;
 select email into account_email from auth.users where id=ticket.winner_id and email_confirmed_at is not null;
 if account_email is null or account_email<>ticket.winner_email then raise exception 'O e-mail do ganhador precisa ser confirmado e revisado.'; end if;
 update public.auction_tickets set reviewed_at=clock_timestamp(),reviewed_by=auth.uid(),template_id=approve_auction_winner.template_id where id=ticket_id;
end; $$;
create or replace function public.claim_auction_notifications() returns jsonb language plpgsql security definer set search_path='' as $$
declare batch jsonb;
begin
 update public.auction_notifications set status='failed' where attempts>=8 and status='processing' and lease_until<clock_timestamp();
 with chosen as (
  select n.id from public.auction_notifications n join public.auction_tickets t on t.id=n.ticket_id
  where t.reviewed_at is not null and n.attempts<8 and ((n.status in ('pending','failed') and n.next_attempt_at<=clock_timestamp()) or (n.status='processing' and n.lease_until<clock_timestamp()))
  order by n.next_attempt_at limit 10 for update of n skip locked
 ), claimed as (update public.auction_notifications n set status='processing',attempts=n.attempts+1,lease_until=clock_timestamp()+interval '5 minutes' from chosen where n.id=chosen.id returning n.*)
 select coalesce(jsonb_agg(jsonb_build_object('id',n.id,'ticketId',t.id,'code',t.code,'email',t.winner_email,'name',t.winner_name,'card',l.name,'number',l.card_number,'template',t.template_id,'amount',t.amount,'attempt',n.attempts)),'[]'::jsonb) into batch
 from claimed n join public.auction_tickets t on t.id=n.ticket_id join public.auction_lots l on l.id=t.auction_id;
 return batch;
end; $$;
create or replace function public.save_auction(lot_id uuid, payload jsonb) returns uuid language plpgsql security definer set search_path = '' as $$
declare lot public.auction_lots; result uuid; chosen public.pokemon_collections;
begin
  if not public.is_auction_admin() then raise exception 'Apenas administradores podem gerenciar leilões.'; end if;
  select * into chosen from public.pokemon_collections where id=payload->>'collectionId';
  if not found then raise exception 'Escolha uma coleção válida do catálogo.'; end if;
  if (payload->>'endsAt')::bigint <= extract(epoch from clock_timestamp())*1000 then raise exception 'Defina um encerramento no futuro.'; end if;
  if lot_id is null then
    insert into public.auction_lots(name,collection,collection_id,category,image,opening,increment,ends_at,card_number) values
      (trim(payload->>'name'),chosen.name,chosen.id,coalesce(payload->>'category','other'),payload->>'image',(payload->>'opening')::bigint,(payload->>'increment')::bigint,to_timestamp((payload->>'endsAt')::double precision/1000),coalesce(trim(payload->>'number'),'')) returning id into result;
  else
    select * into lot from public.auction_lots where id=lot_id for update;
    if not found then raise exception 'Leilão não encontrado.'; end if;
    if lot.ends_at <= clock_timestamp() or exists(select 1 from public.auction_bids where auction_id=lot_id) then raise exception 'Lotes encerrados ou com lances não podem ser alterados.'; end if;
    update public.auction_lots set collection=chosen.name, collection_id=chosen.id, opening=(payload->>'opening')::bigint, increment=(payload->>'increment')::bigint,
      card_number=case when payload ? 'number' then trim(payload->>'number') else card_number end, category=coalesce(payload->>'category',category), image=coalesce(payload->>'image',image), ends_at=to_timestamp((payload->>'endsAt')::double precision/1000) where id=lot_id;
    result := lot_id;
  end if;
  return result;
end;
$$;


revoke all on function public.approve_auction_winner(uuid,text) from public,anon,authenticated;
grant execute on function public.approve_auction_winner(uuid,text) to authenticated;

create or replace function public.list_auctions() returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', l.id, 'name', l.name, 'number',l.card_number, 'collection', l.collection, 'collectionId', l.collection_id, 'collectionLogo', (select c.logo_url from public.pokemon_collections c where c.id=l.collection_id), 'category', l.category, 'image', l.image,
    'opening', l.opening, 'increment', l.increment, 'endsAt', (extract(epoch from l.ends_at)*1000)::bigint,
    'bids', coalesce((select jsonb_agg(jsonb_build_object('id', b.id, 'amount', b.amount, 'bidder', b.bidder,
      'createdAt', (extract(epoch from b.created_at)*1000)::bigint) order by b.amount) from public.auction_bids b where b.auction_id=l.id), '[]'::jsonb)) order by l.created_at), '[]'::jsonb)
  from public.auction_lots l;
$$;
