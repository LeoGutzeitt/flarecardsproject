-- Catálogo TCGdex pt; logos en quando não disponíveis em pt. Snapshot 2026-10-26.
create table public.pokemon_collections (
 id text primary key, name text not null, logo_url text not null default '', series text not null default '', release_date text, card_count integer not null default 0
);
alter table public.pokemon_collections enable row level security;
create policy collections_public_read on public.pokemon_collections for select to anon, authenticated using (true);
grant select on public.pokemon_collections to anon, authenticated;
grant all on public.pokemon_collections to service_role;
insert into public.pokemon_collections(id,name,logo_url,series,release_date,card_count) values
('30th','Celebração de 30 Anos','','Megaevolução','2026-09-16',128),
('30th-c','Coleção Clássica de 30 Anos','','Megaevolução','2026-09-16',0),
('me05','Escuridão Absoluta','https://assets.tcgdex.net/pt/me/me05/logo.webp','Megaevolução','2026-07-17',84),
('me04','Caos Ascendente','https://assets.tcgdex.net/pt/me/me04/logo.webp','Megaevolução','2026-05-22',86),
('me03','Equilíbrio Perfeito','https://assets.tcgdex.net/pt/me/me03/logo.webp','Megaevolução','2026-03-27',88),
('me02.5','Heróis Excelsos','https://assets.tcgdex.net/pt/me/me02.5/logo.webp','Megaevolução','2026-01-30',217),
('me02','Fogo Fantasmagórico','https://assets.tcgdex.net/pt/me/me02/logo.webp','Megaevolução','2025-11-14',94),
('me01','Megaevolução','https://assets.tcgdex.net/pt/me/me01/logo.webp','Megaevolução','2025-09-26',132),
('mep','MEP Black Star Promos','','Megaevolução','2025-09-26',0),
('mee','Megaevolução Energia','','Megaevolução','2025-09-25',8),
('sv10.5b','Raio Preto','https://assets.tcgdex.net/en/sv/sv10.5b/logo.webp','Escarlate e Violeta','2025-07-17',86),
('sv10.5w','Fogo Branco','https://assets.tcgdex.net/en/sv/sv10.5w/logo.webp','Escarlate e Violeta','2025-07-17',86),
('sv10','Rivais Predestinados','https://assets.tcgdex.net/pt/sv/sv10/logo.webp','Escarlate e Violeta','2025-05-30',182),
('sv09','Amigos de Jornada','https://assets.tcgdex.net/pt/sv/sv09/logo.webp','Escarlate e Violeta','2025-03-28',159),
('sv08.5','Evoluções Prismáticas','https://assets.tcgdex.net/pt/sv/sv08.5/logo.webp','Escarlate e Violeta','2025-01-17',131),
('sv08','Fagulhas Impetuosas','https://assets.tcgdex.net/en/sv/sv08/logo.webp','Escarlate e Violeta','2024-11-08',191),
('sv07','Coroa Estelar','https://assets.tcgdex.net/pt/sv/sv07/logo.webp','Escarlate e Violeta','2024-09-13',142),
('sv06.5','Fábulas Nebulosas','https://assets.tcgdex.net/pt/sv/sv06.5/logo.webp','Escarlate e Violeta','2024-08-02',64),
('sv06','Máscaras do Crepúsculo','https://assets.tcgdex.net/pt/sv/sv06/logo.webp','Escarlate e Violeta','2024-05-24',167),
('sv05','Forças Temporais','https://assets.tcgdex.net/pt/sv/sv05/logo.webp','Escarlate e Violeta','2024-03-22',162),
('sv04.5','Destinos de Paldea','https://assets.tcgdex.net/pt/sv/sv04.5/logo.webp','Escarlate e Violeta','2024-01-26',91),
('sv04','Fenda Paradoxal','https://assets.tcgdex.net/pt/sv/sv04/logo.webp','Escarlate e Violeta','2023-11-03',182),
('sv03.5','151','https://assets.tcgdex.net/pt/sv/sv03.5/logo.webp','Escarlate e Violeta','2023-09-22',165),
('sv03','Obsidiana em Chamas','https://assets.tcgdex.net/pt/sv/sv03/logo.webp','Escarlate e Violeta','2023-08-11',197),
('sv02','Evoluções em Paldea','https://assets.tcgdex.net/pt/sv/sv02/logo.webp','Escarlate e Violeta','2023-06-09',193),
('sv01','Escarlate e Violeta','https://assets.tcgdex.net/pt/sv/sv01/logo.webp','Escarlate e Violeta','2023-03-31',198),
('svp','SVP Black Star Promos','','Escarlate e Violeta','2023-03-31',225),
('sve','Escarlate e Violeta Energia','','Escarlate e Violeta','2023-03-31',24),
('swsh12.5','Realeza Absoluta','https://assets.tcgdex.net/pt/swsh/swsh12.5/logo.webp','Espada e Escudo','2023-01-20',159),
('swsh12.5gg','Realeza Absoluta Galeria de Galar','','Espada e Escudo','2023-01-20',70),
('swsh12tg','Tempestade Prateada Galeria de Treinador','','Espada e Escudo','2022-11-11',30),
('swsh12','Tempestade Prateada','https://assets.tcgdex.net/pt/swsh/swsh12/logo.webp','Espada e Escudo','2022-11-11',195),
('swsh11tg','Origem Perdida Galeria de Treinador','','Espada e Escudo','2022-09-09',30),
('swsh11','Origem Perdida','https://assets.tcgdex.net/pt/swsh/swsh11/logo.webp','Espada e Escudo','2022-09-09',196),
('swsh10.5','Pokémon GO','https://assets.tcgdex.net/pt/swsh/swsh10.5/logo.webp','Espada e Escudo','2022-07-01',78),
('swsh10tg','Estrelas Radiantes Galeria de Treinador','','Espada e Escudo','2022-05-27',30),
('swsh10','Estrelas Radiantes','https://assets.tcgdex.net/pt/swsh/swsh10/logo.webp','Espada e Escudo','2022-05-27',189),
('swsh9','Astros Cintilantes','https://assets.tcgdex.net/pt/swsh/swsh9/logo.webp','Espada e Escudo','2022-02-25',172),
('swsh9tg','Astros Cintilantes Galeria de Treinador','','Espada e Escudo','2022-02-25',30),
('swsh8','Golpe Fusão','https://assets.tcgdex.net/pt/swsh/swsh8/logo.webp','Espada e Escudo','2021-11-12',264),
('cel25','Celebrações','https://assets.tcgdex.net/pt/swsh/cel25/logo.webp','Espada e Escudo','2021-10-08',25),
('cel25cc','Celebrações Coleção Clássica','','Espada e Escudo','2021-10-08',25),
('swsh7','Céus em Evolução','https://assets.tcgdex.net/pt/swsh/swsh7/logo.webp','Espada e Escudo','2021-08-27',203),
('swsh6','Reinado Arrepiante','https://assets.tcgdex.net/pt/swsh/swsh6/logo.webp','Espada e Escudo','2021-06-18',198),
('swsh5','Estilos de Batalha','https://assets.tcgdex.net/pt/swsh/swsh5/logo.webp','Espada e Escudo','2021-03-19',163),
('swsh4.5sv','Destinos Brilhantes Cofre Brilhante','','Espada e Escudo','2021-02-19',122),
('swsh4.5','Destinos Brilhantes ','https://assets.tcgdex.net/pt/swsh/swsh4.5/logo.webp','Espada e Escudo','2021-02-19',72),
('swsh4','Voltagem Vívida','https://assets.tcgdex.net/pt/swsh/swsh4/logo.webp','Espada e Escudo','2020-11-13',185),
('swsh3.5','Caminho do Campeão','https://assets.tcgdex.net/pt/swsh/swsh3.5/logo.webp','Espada e Escudo','2020-09-25',73),
('swsh3','Escuridão Incandescente','https://assets.tcgdex.net/pt/swsh/swsh3/logo.webp','Espada e Escudo','2020-08-14',189),
('swsh2','Rixa Rebelde','https://assets.tcgdex.net/pt/swsh/swsh2/logo.webp','Espada e Escudo','2020-05-01',192),
('swsh1','Espada e Escudo','https://assets.tcgdex.net/pt/swsh/swsh1/logo.webp','Espada e Escudo','2020-02-07',202),
('swshp','ESES Promos','https://assets.tcgdex.net/pt/swsh/swshp/logo.webp','Espada e Escudo','2019-11-15',307),
('sm12','Eclipse Cósmico','https://assets.tcgdex.net/en/sm/sm12/logo.webp','Sol e Lua','2019-11-01',236),
('sm115','Destinos Ocultos','https://assets.tcgdex.net/en/sm/sm115/logo.webp','Sol e Lua','2019-08-23',68),
('sma','Destinos Ocultos Cofre Brilhante','','Sol e Lua','2019-08-23',94),
('sm11','Sintonia Mental ','https://assets.tcgdex.net/en/sm/sm11/logo.webp','Sol e Lua','2019-08-02',236),
('sm10','Elos Inquebráveis','https://assets.tcgdex.net/en/sm/sm10/logo.webp','Sol e Lua','2019-05-03',214),
('det1','Detetive Pikachu','https://assets.tcgdex.net/en/sm/det1/logo.webp','Sol e Lua','2019-03-29',18),
('sm9','União de Aliados','https://assets.tcgdex.net/en/sm/sm9/logo.webp','Sol e Lua','2019-01-31',181),
('sm8','Trovões Perdidos','https://assets.tcgdex.net/en/sm/sm8/logo.webp','Sol e Lua','2018-11-02',214),
('sm7.5','Dragões Soberanos','','Sol e Lua','2018-09-07',70),
('sm7','Tempestade Celestial','https://assets.tcgdex.net/en/sm/sm7/logo.webp','Sol e Lua','2018-08-03',168),
('sm6','Luz Proibida','https://assets.tcgdex.net/en/sm/sm6/logo.webp','Sol e Lua','2018-05-04',131),
('sm5','Ultra Prisma','https://assets.tcgdex.net/en/sm/sm5/logo.webp','Sol e Lua','2018-02-02',156),
('sm4','Invasão Carmim','https://assets.tcgdex.net/en/sm/sm4/logo.webp','Sol e Lua','2017-11-03',111),
('sm3.5','Lendas Luminescentes','','Sol e Lua','2017-10-06',73),
('sm3','Sombras Ardentes','https://assets.tcgdex.net/en/sm/sm3/logo.webp','Sol e Lua','2017-08-04',147),
('sm2','Guardiões Ascendentes','https://assets.tcgdex.net/en/sm/sm2/logo.webp','Sol e Lua','2017-05-05',145),
('sm1','Sol e Lua','https://assets.tcgdex.net/en/sm/sm1/logo.webp','Sol e Lua','2017-02-03',149),
('smp','Sol e Lua Promos','https://assets.tcgdex.net/en/sm/smp/logo.webp','Sol e Lua','2017-02-03',248),
('xy12','Evoluções','https://assets.tcgdex.net/en/xy/xy12/logo.webp','XY','2016-11-02',108),
('xy11','Cerco de Vapor','https://assets.tcgdex.net/en/xy/xy11/logo.webp','XY','2016-08-03',114),
('xy10','Fusão de Destinos','https://assets.tcgdex.net/en/xy/xy10/logo.webp','XY','2016-05-02',124),
('g1','Gerações','https://assets.tcgdex.net/en/xy/g1/logo.webp','XY','2016-02-22',83),
('xy9','Turbo Colisão','https://assets.tcgdex.net/en/xy/xy9/logo.webp','XY','2016-02-03',122),
('xy8','Turbo Revolução','https://assets.tcgdex.net/en/xy/xy8/logo.webp','XY','2015-11-04',162),
('xy7','Origens Ancestrais','https://assets.tcgdex.net/en/xy/xy7/logo.webp','XY','2015-08-12',98),
('xy6','Céus Estrondosos','https://assets.tcgdex.net/en/xy/xy6/logo.webp','XY','2015-05-06',108),
('dc1','Crise Dupla','https://assets.tcgdex.net/en/xy/dc1/logo.webp','XY','2015-03-25',34),
('xy5','Conflito Primitivo','https://assets.tcgdex.net/en/xy/xy5/logo.webp','XY','2015-02-04',160),
('xy4','Força Fantasma','https://assets.tcgdex.net/en/xy/xy4/logo.webp','XY','2014-11-05',119),
('xy3','Punhos Furiosos','https://assets.tcgdex.net/en/xy/xy3/logo.webp','XY','2014-08-13',111),
('xy2','Flash de Fogo','https://assets.tcgdex.net/en/xy/xy2/logo.webp','XY','2014-05-07',106),
('xy1','XY','https://assets.tcgdex.net/en/xy/xy1/logo.webp','XY','2014-02-05',146),
('xy0','Conjunto para Iniciantes Kalos','https://assets.tcgdex.net/en/xy/xy0/logo.webp','XY','2013-11-08',39),
('bw11','Tesouros Lendários','https://assets.tcgdex.net/en/bw/bw11/logo.webp','Black & White','2013-11-06',113),
('bw10','Explosão de Plasma','https://assets.tcgdex.net/en/bw/bw10/logo.webp','Black & White','2013-08-14',101),
('bw9','Congelamento de Plasma','https://assets.tcgdex.net/en/bw/bw9/logo.webp','Black & White','2013-05-08',116),
('bw8','Tempestade de Plasma','https://assets.tcgdex.net/en/bw/bw8/logo.webp','Black & White','2013-02-06',135),
('bw7','Fronteiras Cruzadas','https://assets.tcgdex.net/en/bw/bw7/logo.webp','Black & White','2012-11-07',149),
('dv1','Cofre do Dragão','https://assets.tcgdex.net/en/bw/dv1/logo.webp','Black & White','2012-10-05',20),
('bw6','Dragões Enaltecidos','https://assets.tcgdex.net/en/bw/bw6/logo.webp','Black & White','2012-08-15',124),
('bw5','Exploradores da Escuridão','https://assets.tcgdex.net/en/bw/bw5/logo.webp','Black & White','2012-05-09',108),
('bw4','Próximos Destinos','https://assets.tcgdex.net/en/bw/bw4/logo.webp','Black & White','2012-02-08',99),
('bw3','Vitórias Nobres','https://assets.tcgdex.net/en/bw/bw3/logo.webp','Black & White','2011-11-16',101),
('bw2','Poderes Emergentes','https://assets.tcgdex.net/en/bw/bw2/logo.webp','Black & White','2011-08-31',98),
('bw1','Black & White','https://assets.tcgdex.net/en/bw/bw1/logo.webp','Black & White','2011-04-25',114),
('col1','Chamado das Lendas','https://assets.tcgdex.net/en/col/col1/logo.webp','Chamado das Lendas','2011-02-09',95),
('hgss4','Triunfante','https://assets.tcgdex.net/en/hgss/hgss4/logo.webp','HeartGold SoulSilver','2010-11-03',102),
('hgss3','Destemido','https://assets.tcgdex.net/en/hgss/hgss3/logo.webp','HeartGold SoulSilver','2010-08-18',90),
('hgss2','Revelado','https://assets.tcgdex.net/en/hgss/hgss2/logo.webp','HeartGold SoulSilver','2010-05-12',95),
('hgss1','HeartGold SoulSilver','https://assets.tcgdex.net/en/hgss/hgss1/logo.webp','HeartGold SoulSilver','2010-02-10',123),
('dp3','Maravilhas Secretas','https://assets.tcgdex.net/en/dp/dp3/logo.webp','Diamante & Pérola','2007-11-01',132),
('dp2','Tesouros Misteriosos','https://assets.tcgdex.net/en/dp/dp2/logo.webp','Diamante & Pérola','2007-08-01',123),
('dp1','Diamante & Pérola','https://assets.tcgdex.net/en/dp/dp1/logo.webp','Diamante & Pérola','2007-05-01',130),
('ex10','EX Forças Ocultas','https://assets.tcgdex.net/en/ex/ex10/logo.webp','EX','2005-08-22',115),
('ex9','EX Esmeralda','https://assets.tcgdex.net/en/ex/ex9/logo.webp','EX','2005-05-09',106),
('ex8','EX Deoxys','https://assets.tcgdex.net/en/ex/ex8/logo.webp','EX','2005-02-01',107),
('ex7','EX O Retorno da Equipe Rocket ','https://assets.tcgdex.net/en/ex/ex7/logo.webp','EX','2004-11-01',109),
('ex1','EX Rubi e Safira','https://assets.tcgdex.net/en/ex/ex1/logo.webp','EX','2003-07-01',109),
('base3','Fóssil','https://assets.tcgdex.net/en/base/base3/logo.webp','Coleção Básica','1999-10-10',62),
('base2','Selva','https://assets.tcgdex.net/en/base/base2/logo.webp','Coleção Básica','1999-06-16',64),
('base1','Coleção Básica','https://assets.tcgdex.net/en/base/base1/logo.webp','Coleção Básica','1999-01-09',102);
alter table public.auction_lots add column collection_id text references public.pokemon_collections(id);
update public.auction_lots l set collection_id=c.id from public.pokemon_collections c where l.collection=c.name or l.collection like c.name || ' ·%';
create or replace function public.list_auctions() returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', l.id, 'name', l.name, 'collection', l.collection, 'collectionId', l.collection_id, 'collectionLogo', (select c.logo_url from public.pokemon_collections c where c.id=l.collection_id), 'category', l.category, 'image', l.image,
    'opening', l.opening, 'increment', l.increment, 'endsAt', (extract(epoch from l.ends_at)*1000)::bigint,
    'bids', coalesce((select jsonb_agg(jsonb_build_object('id', b.id, 'amount', b.amount, 'bidder', b.bidder,
      'createdAt', (extract(epoch from b.created_at)*1000)::bigint) order by b.amount) from public.auction_bids b where b.auction_id=l.id), '[]'::jsonb)) order by l.created_at), '[]'::jsonb)
  from public.auction_lots l;
$$;
create or replace function public.save_auction(lot_id uuid, payload jsonb) returns uuid language plpgsql security definer set search_path = '' as $$
declare lot public.auction_lots; result uuid; chosen public.pokemon_collections;
begin
  if not public.is_auction_admin() then raise exception 'Apenas administradores podem gerenciar leilões.'; end if;
  select * into chosen from public.pokemon_collections where id=payload->>'collectionId';
  if not found then raise exception 'Escolha uma coleção válida do catálogo.'; end if;
  if (payload->>'endsAt')::bigint <= extract(epoch from clock_timestamp())*1000 then raise exception 'Defina um encerramento no futuro.'; end if;
  if lot_id is null then
    insert into public.auction_lots(name,collection,collection_id,category,image,opening,increment,ends_at) values
      (trim(payload->>'name'),chosen.name,chosen.id,coalesce(payload->>'category','other'),payload->>'image',(payload->>'opening')::bigint,(payload->>'increment')::bigint,to_timestamp((payload->>'endsAt')::double precision/1000)) returning id into result;
  else
    select * into lot from public.auction_lots where id=lot_id for update;
    if not found then raise exception 'Leilão não encontrado.'; end if;
    if lot.ends_at <= clock_timestamp() or exists(select 1 from public.auction_bids where auction_id=lot_id) then raise exception 'Lotes encerrados ou com lances não podem ser alterados.'; end if;
    update public.auction_lots set collection=chosen.name, collection_id=chosen.id, opening=(payload->>'opening')::bigint, increment=(payload->>'increment')::bigint,
      category=coalesce(payload->>'category',category), image=coalesce(payload->>'image',image), ends_at=to_timestamp((payload->>'endsAt')::double precision/1000) where id=lot_id;
    result := lot_id;
  end if;
  return result;
end;
$$;

