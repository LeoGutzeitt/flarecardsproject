# Ativar Google, leilões compartilhados e tickets por e-mail

O código da integração está preparado, mas nenhum projeto, credencial, domínio ou envio externo foi criado. Sem configuração, a loja continua no modo local, incluindo o administrador de demonstração `usuario_admin` / `1234`. No modo Supabase essa conta **não funciona**: a identidade e o papel vêm do servidor.

## 1. Projeto e banco

1. Crie seu projeto no Supabase. Guarde a senha do banco e as chaves secretas fora deste repositório.
2. Em SQL Editor, execute `supabase/migrations/202610230001_auctions.sql` e depois `supabase/migrations/202610230002_auction_categories.sql` em um projeto novo, ou revise a migração antes de aplicar a um projeto existente. Ela cria tabelas, permissões e funções próprias para a Flare Cards. Não importa os leilões/contas locais automaticamente.
3. Preencha apenas os valores públicos em `.env`, usando `.env.example` como modelo:

```dotenv
SUPABASE_URL=https://SEU-PROJETO.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_SUA_CHAVE_PUBLICA
```

Reinicie `npm run dev` após configurar. O navegador recebe apenas esses dois valores pelo endpoint `/api/config`. A chave legada `anon` também é aceita. A chave `service_role` e a chave de envio de e-mail nunca podem estar no frontend.

Para hospedagem estática de `dist/`, preencha os mesmos valores públicos em `public-config.js` antes do build; sem servidor Node, não há leitura de `.env`. Leilões/tickets continuam hospedados no Supabase. O servidor de desenvolvimento não serve `.env`, SQL, código de funções nem arquivos privados.

## 2. Login Google

1. No Google Cloud, crie um OAuth Client do tipo aplicação web e configure a tela de consentimento. Em testes, cadastre os usuários de teste.
2. Cadastre as origens da loja. No ambiente local, `http://127.0.0.1:5173`; em produção, seu domínio HTTPS.
3. Use o callback exibido pelo Supabase na configuração Google, normalmente `https://SEU-PROJETO.supabase.co/auth/v1/callback`, como URI de redirecionamento autorizada no Google.
4. Em Supabase → Authentication → Sign In / Providers → Google, habilite o provedor e informe Client ID e Client Secret do Google. Esses dados ficam no Supabase, não no site.
5. Em URL Configuration, configure Site URL e permita o callback da loja `http://127.0.0.1:5173/auctions.html` (e a URL HTTPS de produção).
6. Acesse a loja e entre com Google. O cliente usa PKCE e consulta o usuário no Supabase. Contas com e-mail confirmado podem dar lances. O e-mail da conta é utilizado para o ticket.

O cliente Supabase JS v2 é carregado via CDN apenas no modo conectado. Não há envio de senha Google pela loja.

### Conceder administração

Após o primeiro login Google do proprietário, encontre seu UUID em Authentication → Users. No SQL Editor, conceda o papel explicitamente:

```sql
insert into public.auction_admins(user_id)
values ('UUID-DO-PROPRIETARIO') on conflict do nothing;
```

Saia e entre novamente. Só contas nessa tabela podem adicionar/configurar lotes, processar resultados e confirmar retiradas. Não há promoção de papel via cadastro público ou metadados do usuário.

## 3. E-mail do ganhador

A implementação utiliza Resend através de uma Edge Function. Crie sua conta no provedor, valide seu domínio de envio e gere uma chave de API. Configure os segredos da função no Dashboard do Supabase (ou pelo CLI sem versionar arquivos com valores reais):

- `RESEND_API_KEY`: chave privada do provedor.
- `EMAIL_FROM`: remetente no domínio validado, por exemplo `Flare Cards <leiloes@seudominio.com.br>`.
- `PICKUP_INSTRUCTIONS`: endereço, horários e instruções reais para retirada. Não foi inventado nenhum endereço.
- `SITE_ORIGIN`: origem autorizada da loja, sem caminho nem barra final.
- `AUCTION_CRON_SECRET`: segredo aleatório longo e exclusivo do agendador.

`SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` são fornecidos pelo ambiente hospedado das Edge Functions. Essa chave é usada somente no servidor para processar a fila.

Vincule o CLI ao projeto e publique a função usando a configuração incluída:

```sh
supabase link --project-ref SEU-PROJECT-REF
supabase functions deploy process-auctions
```

A configuração `verify_jwt = false` permite a chamada pelo agendador com segredo próprio. **Não significa função pública sem autorização:** o código exige o segredo correto ou verifica o usuário e seu papel administrativo antes de processar qualquer dado. Confirme essa configuração no Dashboard após publicar.

Um admin conectado pode executar **Acompanhar → Processar encerrados e enviar e-mails**. O servidor decide o vencedor com o horário do banco, cria um único ticket por lote e coloca o envio na fila. O cliente não fornece o destinatário nem o código do ticket. Sem provedor/instruções configurados, o ticket é emitido e o e-mail permanece pendente.

O e-mail contém carta, lance vencedor, código, instruções e a indicação de que o ticket não comprova pagamento. O painel mostra “Aceito pelo provedor” após sucesso da API, não “Entregue”. Confirmação de entrega/bounce por webhook não está implementada.

## 4. Envio automático com a página fechada

Ative Cron e pg_net no Supabase. No Vault, crie:

- `flare_supabase_url`: URL do projeto.
- `flare_auction_cron_secret`: o mesmo segredo de `AUCTION_CRON_SECRET`.

Execute `supabase/schedule.sql` uma vez. O job chama a função a cada minuto; o relógio da página não determina o encerramento. Verifique os resultados em Cron → Job runs e nos logs da função. Não cadastre jobs duplicados.

A fila usa bloqueios com lease de cinco minutos, até oito tentativas com espera crescente e chave de idempotência por ticket no Resend. O código nunca registra sucesso antes de o provedor aceitar. A idempotência do provedor tem prazo próprio: em falhas prolongadas de confirmação, confira o histórico de envio antes de reiniciar manualmente a fila. Após oito falhas, a intervenção é administrativa. Não há reenvio ilimitado pelo visitante.

## 5. Retirada

O ganhador vê e pode baixar seu ticket em **Acompanhar**; o admin vê os tickets de todos os vencedores e o estado dos e-mails. Outros usuários não têm acesso a eles. Para confirmar a retirada, o admin confere pagamento/identidade, informa o código e confirma. O banco rejeita uma segunda utilização.

Esta entrega usa um código único em texto, sem QR Code e sem gateway de pagamento. A foto real é salva no banco em data URL, até 2 MB por imagem; migrar para Supabase Storage é indicado ao expandir o catálogo. O frontend atualiza leilões em intervalos de 15 segundos e revalida o lance no banco; não usa Realtime nesta etapa.

## Verificação

`npm test` executa testes de regras locais, permissões e PostgreSQL em memória (PGlite com um esquema de autenticação de teste), além de testes do e-mail com transporte simulado. Inclui lance mínimo, encerramento, idempotência, emissão única de ticket, privacidade e retirada única. `npm run check` verifica a sintaxe JS/TS; não substitui o type-check/runtime Deno.

Google OAuth, regras do ambiente Supabase hospedado, entrega externa de e-mail e execução do cron só podem ser verificados após a configuração real. Faça um leilão de teste com duas contas Google, confira a recusa de lances atrasados, o ticket privado, o e-mail e a recusa de reutilização antes do lançamento.

Referências oficiais: [Google no Supabase](https://supabase.com/docs/guides/auth/social-sign-in/auth-google), [envio por Edge Functions](https://supabase.com/docs/guides/functions/examples/send-emails), [agendamento de funções](https://supabase.com/docs/guides/functions/schedule-functions).


## Seções e slides

O catálogo de leilões é organizado em EX, Borda cinza, Borda amarela, Artes raras e Outros achados. O admin escolhe a seção principal no cadastro e pode alterá-la enquanto o lote está aberto e sem lances. Para bases já criadas, aplicar a migração `202610230002_auction_categories.sql`; ela preserva dados e classifica EX legadas pelo nome, deixando as demais em Outros achados para revisão do admin.

As categorias aparecem como botões. Ao escolher uma, somente aquela seção abre, com uma carta por vez. Anterior/Próxima, contador de posição e gesto de deslizar no celular controlam a navegação, sem avanço automático. O lote atual é preservado durante atualizações. Seções vazias mostram uma mensagem, sem cartas fictícias.

## Exemplos, logos e apresentação das cartas

As seções vazias da prévia local, no filtro Todos, usam exemplos ilustrativos do catálogo TCGdex (`auction-examples.js`). Esses exemplos não entram no banco, não criam tickets e não aceitam lances. Eles deixam de ocupar a seção quando existem lotes reais nela; no modo conectado não são adicionados. Os exemplos Base Set estão em inglês, identificados no texto. As cartas de 151 estão em português.

As logos de coleção são arquivos originais distribuídos pelo TCGdex (Pokémon 151 e Base Set), exibidos conforme a coleção da carta selecionada; categorias genéricas como Borda cinza não recebem uma logo oficial inventada. A marca Flare permanece no cabeçalho. Imagens em assets/example-* e assets/set-*-logo.webp vieram dos metadados da API TCGdex para sv03.5 e base1.

Miniaturas selecionam diretamente cada carta. A abertura de seção e a troca usam animações leves, com Pokébola, Great Ball, Ultra Ball ou Master Ball em CSS conforme seção/posição. São representações animadas, não arquivos de logos oficiais das Pokébolas. A preferência de movimento reduzido desativa esses efeitos. A apresentação principal usa o mesmo fundo da página, sem caixas ao redor da foto e das informações.

## Catálogo de coleções Pokémon

Execute também a migração `supabase/migrations/202610260001_pokemon_collections.sql` após as duas anteriores. Ela cria `pokemon_collections`, importa 114 coleções físicas em português e vincula os lotes por `collection_id`. Há 98 logos disponíveis; coleções sem logo usam a marca Flare Cards na apresentação. Os dados são um snapshot de 26/10/2026 do [TCGdex](https://tcgdex.dev/rest/sets), com logos em inglês como alternativa quando necessário.

O catálogo local fica em `pokemon-collections.js`. Ao atualizar coleções, mantenha os mesmos IDs no catálogo local e no Supabase. A função `save_auction` exige uma coleção cadastrada e deriva seu nome do banco. Leitura do catálogo é pública; alterações exigem acesso administrativo ao banco. A migração preserva lotes antigos sem correspondência; escolha sua coleção ao editá-los antes do primeiro lance.
