-- Nenhum novo ticket pode ser entregue ou resgatado antes da revisão administrativa.
alter table public.auction_tickets add column reviewed_at timestamptz;
alter table public.auction_tickets add column reviewed_by uuid references auth.users(id);
create function public.admin_auction_winners() returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if not public.is_auction_admin() then raise exception 'Acesso restrito ao administrador.'; end if;
 return coalesce((select jsonb_agg(jsonb_build_object('id',t.id,'auctionId',l.id,'card',l.name,'image',l.image,'collection',l.collection,'winner',t.winner_name,'email',t.winner_email,'amount',t.amount,'endsAt',extract(epoch from l.ends_at)*1000,'reviewedAt',t.reviewed_at,'reviewedBy',t.reviewed_by,'code',case when t.reviewed_at is not null then t.code else null end,'status',case when t.reviewed_at is null then 'review' else 'approved' end,'emailStatus',case when t.reviewed_at is null then 'not-approved' else n.status end,'attempts',n.attempts,'sentAt',n.sent_at,'lastError',n.last_error) order by l.ends_at desc)
 from public.auction_tickets t join public.auction_lots l on l.id=t.auction_id left join public.auction_notifications n on n.ticket_id=t.id),'[]'::jsonb);
end; $$;
create function public.approve_auction_winner(ticket_id uuid) returns void language plpgsql security definer set search_path='' as $$
declare ticket public.auction_tickets; account_email text;
begin
 if not public.is_auction_admin() then raise exception 'Acesso restrito ao administrador.'; end if;
 select * into ticket from public.auction_tickets where id=ticket_id for update;
 if not found then raise exception 'Resultado não encontrado.'; end if;
 if ticket.reviewed_at is not null then return; end if;
 select email into account_email from auth.users where id=ticket.winner_id and email_confirmed_at is not null;
 if account_email is null or account_email<>ticket.winner_email then raise exception 'O e-mail do ganhador precisa ser confirmado e revisado.'; end if;
 update public.auction_tickets set reviewed_at=clock_timestamp(),reviewed_by=auth.uid() where id=ticket_id;
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
 select coalesce(jsonb_agg(jsonb_build_object('id',n.id,'ticketId',t.id,'code',t.code,'email',t.winner_email,'name',t.winner_name,'card',l.name,'amount',t.amount,'attempt',n.attempts)),'[]'::jsonb) into batch
 from claimed n join public.auction_tickets t on t.id=n.ticket_id join public.auction_lots l on l.id=t.auction_id;
 return batch;
end; $$;
create or replace function public.auction_dashboard() returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('tickets',coalesce((select jsonb_agg(jsonb_build_object('id',t.id,'auctionId',t.auction_id,'card',l.name,'winner',t.winner_name,'email',t.winner_email,'amount',t.amount,'code',t.code,'redeemedAt',t.redeemed_at,'emailStatus',n.status,'attempts',n.attempts,'sentAt',n.sent_at) order by t.created_at desc)
 from public.auction_tickets t join public.auction_lots l on l.id=t.auction_id left join public.auction_notifications n on n.ticket_id=t.id
 where t.reviewed_at is not null and (t.winner_id=auth.uid() or public.is_auction_admin())),'[]'::jsonb),
 'myAuctionIds',coalesce((select jsonb_agg(distinct auction_id) from public.auction_bids where user_id=auth.uid()),'[]'::jsonb));
$$;
create or replace function public.redeem_auction_ticket(ticket_code text) returns void language plpgsql security definer set search_path='' as $$
begin
 if not public.is_auction_admin() then raise exception 'Acesso restrito ao administrador.'; end if;
 update public.auction_tickets set redeemed_at=clock_timestamp() where code=ticket_code::uuid and reviewed_at is not null and redeemed_at is null;
 if not found then raise exception 'Ticket inválido, não aprovado ou retirada já confirmada.'; end if;
end; $$;
revoke all on function public.admin_auction_winners(),public.approve_auction_winner(uuid) from public,anon,authenticated;
grant execute on function public.admin_auction_winners(),public.approve_auction_winner(uuid) to authenticated;
