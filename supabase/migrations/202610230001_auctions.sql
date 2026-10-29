-- Executar em um projeto Supabase novo. Valores em centavos; relógio do banco.
create table public.auction_admins (user_id uuid primary key references auth.users(id));
alter table public.auction_admins enable row level security;
create function public.is_auction_admin() returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.auction_admins where user_id = auth.uid());
$$;
create table public.auction_lots (
  id uuid primary key default gen_random_uuid(), name text not null check(length(name) between 1 and 80),
  collection text not null check(length(collection) between 1 and 100), image text not null check(length(image) <= 2800000 and image ~ '^data:image/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$'),
  opening bigint not null check(opening between 1 and 100000000), increment bigint not null check(increment between 1 and 100000000),
  ends_at timestamptz not null, finalized_at timestamptz, created_at timestamptz not null default now()
);
create table public.auction_bids (
  id uuid primary key default gen_random_uuid(), auction_id uuid not null references public.auction_lots(id),
  user_id uuid not null references auth.users(id), bidder text not null, amount bigint not null check(amount between 1 and 100000000),
  created_at timestamptz not null default clock_timestamp(), request_id uuid not null, unique(user_id,request_id)
);
create index on public.auction_bids(auction_id, amount desc);
create table public.auction_tickets (
  id uuid primary key default gen_random_uuid(), auction_id uuid unique not null references public.auction_lots(id),
  winner_id uuid not null references auth.users(id), winner_name text not null, winner_email text not null,
  amount bigint not null, code uuid unique not null default gen_random_uuid(), created_at timestamptz not null default now(), redeemed_at timestamptz
);
create table public.auction_notifications (
  id uuid primary key default gen_random_uuid(), ticket_id uuid unique not null references public.auction_tickets(id),
  status text not null default 'pending' check(status in ('pending','processing','sent','failed')),
  attempts integer not null default 0, lease_until timestamptz, next_attempt_at timestamptz not null default now(),
  sent_at timestamptz, last_error text
);
alter table public.auction_lots enable row level security;
alter table public.auction_bids enable row level security;
alter table public.auction_tickets enable row level security;
alter table public.auction_notifications enable row level security;
-- O acesso ocorre somente pelas funções, sem escrita direta do navegador.
revoke all on public.auction_admins, public.auction_lots, public.auction_bids, public.auction_tickets, public.auction_notifications from anon, authenticated;
grant all on public.auction_admins, public.auction_lots, public.auction_bids, public.auction_tickets, public.auction_notifications to service_role;

create function public.list_auctions() returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', l.id, 'name', l.name, 'collection', l.collection, 'image', l.image,
    'opening', l.opening, 'increment', l.increment, 'endsAt', (extract(epoch from l.ends_at)*1000)::bigint,
    'bids', coalesce((select jsonb_agg(jsonb_build_object('id', b.id, 'amount', b.amount, 'bidder', b.bidder,
      'createdAt', (extract(epoch from b.created_at)*1000)::bigint) order by b.amount) from public.auction_bids b where b.auction_id=l.id), '[]'::jsonb)) order by l.created_at), '[]'::jsonb)
  from public.auction_lots l;
$$;
create function public.save_auction(lot_id uuid, payload jsonb) returns uuid language plpgsql security definer set search_path = '' as $$
declare lot public.auction_lots; result uuid;
begin
  if not public.is_auction_admin() then raise exception 'Apenas administradores podem gerenciar leilões.'; end if;
  if (payload->>'endsAt')::bigint <= extract(epoch from clock_timestamp())*1000 then raise exception 'Defina um encerramento no futuro.'; end if;
  if lot_id is null then
    insert into public.auction_lots(name,collection,image,opening,increment,ends_at) values
      (trim(payload->>'name'),trim(payload->>'collection'),payload->>'image',(payload->>'opening')::bigint,(payload->>'increment')::bigint,to_timestamp((payload->>'endsAt')::double precision/1000)) returning id into result;
  else
    select * into lot from public.auction_lots where id=lot_id for update;
    if not found then raise exception 'Leilão não encontrado.'; end if;
    if lot.ends_at <= clock_timestamp() or exists(select 1 from public.auction_bids where auction_id=lot_id) then raise exception 'Lotes encerrados ou com lances não podem ser alterados.'; end if;
    update public.auction_lots set opening=(payload->>'opening')::bigint, increment=(payload->>'increment')::bigint,
      image=coalesce(payload->>'image',image), ends_at=to_timestamp((payload->>'endsAt')::double precision/1000) where id=lot_id;
    result := lot_id;
  end if;
  return result;
end;
$$;
create function public.submit_auction_bid(lot_id uuid, bid_amount bigint, request_id uuid) returns uuid language plpgsql security definer set search_path = '' as $$
declare lot public.auction_lots; person auth.users; minimum bigint; result uuid;
begin
  if auth.uid() is null or public.is_auction_admin() then raise exception 'Entre com uma conta de usuário para dar lances.'; end if;
  select * into person from auth.users where id=auth.uid();
  if person.email_confirmed_at is null then raise exception 'Confirme seu e-mail para participar.'; end if;
  select * into lot from public.auction_lots where id=lot_id for update;
  if not found then raise exception 'Leilão não encontrado.'; end if;
  select id into result from public.auction_bids b where b.user_id=auth.uid() and b.request_id=submit_auction_bid.request_id and b.auction_id=lot_id;
  if result is not null then return result; end if;
  if lot.ends_at <= clock_timestamp() or lot.finalized_at is not null then raise exception 'Este leilão já foi encerrado.'; end if;
  select coalesce(max(amount)+lot.increment,lot.opening) into minimum from public.auction_bids where auction_id=lot_id;
  if bid_amount is null or bid_amount < minimum or bid_amount > 100000000 then raise exception 'Lance abaixo do mínimo ou acima do limite. Atualize os valores.'; end if;
  insert into public.auction_bids(auction_id,user_id,bidder,amount,request_id) values(lot_id, auth.uid(), left(coalesce(person.raw_user_meta_data->>'full_name',split_part(person.email,'@',1),'Colecionador'),40),bid_amount,request_id) returning id into result;
  return result;
end;
$$;
create function public.finalize_auctions() returns integer language plpgsql security definer set search_path = '' as $$
declare lot public.auction_lots; winner public.auction_bids; ticket uuid; total integer:=0;
begin
  for lot in select * from public.auction_lots where finalized_at is null and ends_at <= clock_timestamp() order by ends_at limit 100 for update skip locked loop
    select * into winner from public.auction_bids where auction_id=lot.id order by amount desc limit 1;
    if found then
      insert into public.auction_tickets(auction_id,winner_id,winner_name,winner_email,amount)
      select lot.id,u.id,winner.bidder,u.email,winner.amount from auth.users u where u.id=winner.user_id returning id into ticket;
      insert into public.auction_notifications(ticket_id) values(ticket);
    end if;
    update public.auction_lots set finalized_at=clock_timestamp() where id=lot.id;
    total:=total+1;
  end loop;
  return total;
end;
$$;
create function public.claim_auction_notifications() returns jsonb language plpgsql security definer set search_path = '' as $$
declare batch jsonb;
begin
  update public.auction_notifications set status='failed' where attempts>=8 and status='processing' and lease_until<clock_timestamp();
  with chosen as (select id from public.auction_notifications where attempts<8 and ((status in ('pending','failed') and next_attempt_at<=clock_timestamp()) or (status='processing' and lease_until<clock_timestamp())) order by next_attempt_at limit 10 for update skip locked),
  claimed as (update public.auction_notifications n set status='processing',attempts=n.attempts+1,lease_until=clock_timestamp()+interval '5 minutes' from chosen where n.id=chosen.id returning n.*)
  select coalesce(jsonb_agg(jsonb_build_object('id',n.id,'ticketId',t.id,'code',t.code,'email',t.winner_email,'name',t.winner_name,'card',l.name,'amount',t.amount,'attempt',n.attempts)),'[]'::jsonb) into batch
  from claimed n join public.auction_tickets t on t.id=n.ticket_id join public.auction_lots l on l.id=t.auction_id;
  return batch;
end;
$$;
create function public.complete_auction_notification(notification_id uuid, attempt_number integer, success boolean, error_message text default null) returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.auction_notifications set status=case when success then 'sent' else 'failed' end,
    sent_at=case when success then clock_timestamp() else null end, lease_until=null,
    next_attempt_at=clock_timestamp()+make_interval(mins=>power(2,least(attempts,8))::integer),last_error=left(error_message,200)
  where id=notification_id and status='processing' and attempts=attempt_number;
end;
$$;
create function public.auction_dashboard() returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('tickets',coalesce((select jsonb_agg(jsonb_build_object('id',t.id,'auctionId',t.auction_id,'card',l.name,'winner',t.winner_name,'email',t.winner_email,'amount',t.amount,'code',t.code,'redeemedAt',t.redeemed_at,'emailStatus',n.status,'attempts',n.attempts,'sentAt',n.sent_at) order by t.created_at desc)
  from public.auction_tickets t join public.auction_lots l on l.id=t.auction_id left join public.auction_notifications n on n.ticket_id=t.id
  where t.winner_id=auth.uid() or public.is_auction_admin()),'[]'::jsonb),
  'myAuctionIds',coalesce((select jsonb_agg(distinct auction_id) from public.auction_bids where user_id=auth.uid()),'[]'::jsonb));
$$;
create function public.redeem_auction_ticket(ticket_code text) returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_auction_admin() then raise exception 'Acesso restrito ao administrador.'; end if;
  update public.auction_tickets set redeemed_at=clock_timestamp() where code=ticket_code::uuid and redeemed_at is null;
  if not found then raise exception 'Ticket inválido ou retirada já confirmada.'; end if;
end;
$$;
revoke execute on function public.is_auction_admin(),public.list_auctions(),public.save_auction(uuid,jsonb),public.submit_auction_bid(uuid,bigint,uuid),public.finalize_auctions(),public.claim_auction_notifications(),public.complete_auction_notification(uuid,integer,boolean,text),public.auction_dashboard(),public.redeem_auction_ticket(text) from public,anon,authenticated;
grant execute on function public.list_auctions() to anon,authenticated;
grant execute on function public.is_auction_admin(),public.save_auction(uuid,jsonb),public.submit_auction_bid(uuid,bigint,uuid),public.auction_dashboard(),public.redeem_auction_ticket(text) to authenticated;
grant execute on function public.finalize_auctions(),public.claim_auction_notifications(),public.complete_auction_notification(uuid,integer,boolean,text) to service_role;
