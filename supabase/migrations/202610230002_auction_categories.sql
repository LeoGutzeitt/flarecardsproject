-- Migração aditiva: preserva lotes, lances e tickets existentes.
alter table public.auction_lots add column category text not null default 'other'
  check(category in ('ex','silver','yellow','rare-art','other'));
update public.auction_lots set category='ex' where name ~* '\mex\M';
create or replace function public.list_auctions() returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', l.id, 'name', l.name, 'collection', l.collection, 'category', l.category, 'image', l.image,
    'opening', l.opening, 'increment', l.increment, 'endsAt', (extract(epoch from l.ends_at)*1000)::bigint,
    'bids', coalesce((select jsonb_agg(jsonb_build_object('id', b.id, 'amount', b.amount, 'bidder', b.bidder,
      'createdAt', (extract(epoch from b.created_at)*1000)::bigint) order by b.amount) from public.auction_bids b where b.auction_id=l.id), '[]'::jsonb)) order by l.created_at), '[]'::jsonb)
  from public.auction_lots l;
$$;
create or replace function public.save_auction(lot_id uuid, payload jsonb) returns uuid language plpgsql security definer set search_path = '' as $$
declare lot public.auction_lots; result uuid;
begin
  if not public.is_auction_admin() then raise exception 'Apenas administradores podem gerenciar leilões.'; end if;
  if (payload->>'endsAt')::bigint <= extract(epoch from clock_timestamp())*1000 then raise exception 'Defina um encerramento no futuro.'; end if;
  if lot_id is null then
    insert into public.auction_lots(name,collection,category,image,opening,increment,ends_at) values
      (trim(payload->>'name'),trim(payload->>'collection'),coalesce(payload->>'category','other'),payload->>'image',(payload->>'opening')::bigint,(payload->>'increment')::bigint,to_timestamp((payload->>'endsAt')::double precision/1000)) returning id into result;
  else
    select * into lot from public.auction_lots where id=lot_id for update;
    if not found then raise exception 'Leilão não encontrado.'; end if;
    if lot.ends_at <= clock_timestamp() or exists(select 1 from public.auction_bids where auction_id=lot_id) then raise exception 'Lotes encerrados ou com lances não podem ser alterados.'; end if;
    update public.auction_lots set opening=(payload->>'opening')::bigint, increment=(payload->>'increment')::bigint,
      category=coalesce(payload->>'category',category), image=coalesce(payload->>'image',image), ends_at=to_timestamp((payload->>'endsAt')::double precision/1000) where id=lot_id;
    result := lot_id;
  end if;
  return result;
end;
$$;

