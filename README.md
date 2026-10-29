# Flare Cards

Base de vitrine e loja de cartas Pokémon, em português, criada a partir do conteúdo de https://flare-card-trade.lovable.app/.

## Executar

Requer Node.js 24 ou superior. Execute `npm install` para instalar as dependências de teste.

```sh
npm run dev
```

Acesse http://127.0.0.1:5173. `npm run check` verifica a sintaxe. `npm run build` gera os arquivos estáticos em `dist/`.

## Estrutura

- `index.html`: página, navegação, avaliação e carrinho acessível.
- `styles.css`: identidade preto/vermelho, layout responsivo e movimento reduzido.
- `app.js`: catálogo inicial, busca, carrinho com localStorage e exportação de pedidos.
- `assets/`: logo, mascote e imagens públicas das cartas da referência.
- `scripts/`: servidor local e build estático.

## Conteúdo e limites

Os três produtos, preços, packs, etapas de intermediação e números institucionais foram transcritos do site indicado em 20/10/2026. Confirme valores, estoque, garantias e números antes do lançamento. Logo e mascote foram obtidos do site indicado; imagens de cartas são do TCGdex. A tipografia utiliza Google Fonts com fontes locais alternativas.

Esta é uma base de frontend. O carrinho persiste apenas neste navegador e exporta um resumo; não realiza compras, reserva estoque ou calcula frete. O formulário valida os campos e baixa um pedido de avaliação, sem enviar dados nem simular recebimento. Não foram configurados contatos fictícios.

Para operação real: integrar catálogo/estoque e pedidos a um backend, checkout com provedor de pagamento, frete e canal de recebimento das avaliações. Definir política de privacidade, termos e regras de intermediação antes de coletar dados de clientes. Não colocar segredos no JavaScript público.

## Leilões

A aba `auctions.html` inclui contagem regressiva, lances com incremento mínimo, liderança, histórico, filtros e encerramento automático na interface. Funciona como demonstração local com persistência no navegador. Os valores e prazos dos lotes são exemplos. Execute `npm test` para verificar as regras. A integração futura com usuários e banco de dados está descrita em [docs/auctions-integration.md](docs/auctions-integration.md).

Acesse **/flareadmin** diretamente e use **usuario_admin** com a senha **1234** para acessar o **administrador local** para cadastrar lotes e definir lance inicial, incremento e prazo. Crie uma **conta de usuário** para dar lances; visitantes e administradores não podem participar dos lances. A demonstração de login é exclusiva do navegador e exige senhas de teste; autenticação e autorização reais precisam ser executadas no servidor antes do lançamento.

O servidor incluído é somente para desenvolvimento local. Para publicar, hospede o conteúdo de `dist/` em uma plataforma de hospedagem estática com HTTPS.

## Supabase, Google e notificações

A integração opcional inclui Google OAuth via Supabase, funções PostgreSQL para lances, tickets privados de retirada, fila de e-mails via Resend e agendamento no servidor. A aba **Acompanhar** mostra participações, resultados e tickets. A gestão administrativa foi movida para **/flareadmin**, sem atalho ou cadastro de admin nas páginas públicas.

Sem configuração, o modo local continua disponível. Para ativar os serviços, siga [docs/supabase-setup.md](docs/supabase-setup.md). Não basta preencher o botão Google: é necessário criar o projeto, aplicar a migração, configurar o provedor Google, o remetente de e-mail e o cron. Nenhum e-mail real foi enviado nesta implementação.


## Central administrativa /flareadmin

Página única com atalhos fixos para visão geral, marketplace, leilões, pedidos e moderação. A sessão usa uma chave separada da sessão de cliente; o login público rejeita contas administrativas.

- Marketplace: foto real (PNG/JPG/WebP, até 2 MB), coleção, raridade, condição, preço, estoque, edição e retirada/restauração da publicação. Alterações atualizam abas da loja abertas no mesmo navegador.
- Leilões: criar rascunho, editar antes dos lances, iniciar, encerrar antecipadamente e anular lance com motivo registrado. A moderação mantém autor, valor e motivo no histórico local. Rascunhos ficam fora da listagem pública.
- Pedidos: clientes locais autenticados podem solicitar pedidos pelo carrinho, sem cobrança. Fluxo solicitado → confirmado → pagamento conferido manualmente → pronto para retirada → concluído. Cancelamento permitido antes da conferência do pagamento. **Estoque é controlado manualmente no cadastro, sem reserva ou baixa automática.**
- Moderação: suspender/reativar clientes locais com motivo; contas suspensas deixam de conseguir dar lances ou solicitar pedidos. O registro mostra ações e responsáveis.

Todos os dados desta central são demonstrativos e ficam no localStorage do navegador. Ocultar a rota e separar sessões não são segurança para produção. Não há pagamentos, tickets ou e-mails reais gerados pelo painel local. Antes de publicar, conectar os módulos administrativos ao Supabase com autorização no servidor, RLS, armazenamento privado de fotos e políticas para pedidos, estoque e auditoria. Se Supabase estiver configurado, o login local é desativado. A central usa Google com sessão administrativa separada, verifica o papel no servidor e disponibiliza a gestão remota de ganhadores/tickets; os outros módulos locais ficam ocultos até receberem adaptadores remotos.

O servidor de desenvolvimento atende /flareadmin e /flareadmin/. Em hospedagem estática, o build também gera flareadmin/index.html; todos os recursos dessa página usam caminhos absolutos.

## Ganhadores, revisão e e-mails

Em /flareadmin → Ganhadores, resultados encerrados mostram carta, ganhador, valor e e-mail da conta. A aprovação é individual e exige conferência explícita. Leilões sem lances não emitem ticket. A prévia local bloqueia aprovação sem e-mail ou para conta suspensa, preserva a aprovação e permite baixar um ticket identificado como demonstração, sem validade de retirada; nunca registra um e-mail como enviado.

Para envio real, aplicar também a migração **202610280001_winner_review.sql**, configurar Google/Supabase e um administrador em auction_admins, e implantar a Edge Function process-auctions com RESEND_API_KEY, EMAIL_FROM e PICKUP_INSTRUCTIONS. Essas credenciais ficam apenas no servidor. Não usar usuario_admin/1234 em produção. O Google deve permitir o retorno para /flareadmin. O painel usa uma sessão separada do login dos clientes.

A migração coloca tickets novos e existentes sem revisão em espera: o worker só pode reivindicar notificações depois de reviewed_at ser preenchido por approve_auction_winner, com verificação de administrador e e-mail confirmado. Tickets não revisados não aparecem no dashboard do ganhador e não podem ser resgatados. O cron pode finalizar resultados automaticamente, mas apenas tickets aprovados seguem para envio. Atualizar resultados também executa o processamento; pode enviar itens já aprovados. O botão Enviar tickets aprovados mostra configuração pendente, aceitações do provedor e falhas. Aceitação do provedor não comprova entrega na caixa de entrada. Os retries e a chave de idempotência existentes são preservados.

Validação inclui revisão local, aprovação idempotente e teste PostgreSQL de bloqueio antes da aprovação, acesso exclusivo do administrador e envio após aprovação. As migrações e funções foram preparadas/testadas localmente, não implantadas em uma conta Supabase.
