# Integração de leilões

**Atualização:** a implementação opcional do Supabase está em `supabase/`, com o cliente em `auction-backend.js`. Consulte [supabase-setup.md](supabase-setup.md) para ativar Google, tickets e e-mails. As seções abaixo descrevem a demonstração local e o contrato conceitual; o modo conectado usa as funções RPC da migração, não as rotas `/api/auctions` sugeridas aqui.

## Estado atual

`auctions.html` é a aba de leilões. `auctions.js` controla a apresentação. `auction-store.js` concentra catálogo, regras e persistência local, sem dependência da interface. Os valores iniciais e durações são exemplos; não representam leilões comerciais anunciados no site original.

O primeiro acesso cria três prazos absolutos e os salva na chave `flare-cards:auctions:v1`. Recarregar não reinicia o tempo. Abas do mesmo navegador recebem mudanças pelo evento `storage`; dispositivos diferentes não compartilham os dados. O relógio e o armazenamento locais podem ser alterados pelo visitante e não servem como autoridade para leilões reais. O resultado não cria pedido nem cobrança.

## Contas e administração locais

Em **Entrar**, acesse o administrador padrão com usuário `usuario_admin` e senha `1234`. A criação pública de outros administradores está desativada. Essa credencial é exclusiva da demonstração local. O cadastro comum sempre gera uma conta `user`; não existe seletor de papel nem promoção para admin no cadastro público. O login usa e-mail e senha e recupera o papel da conta cadastrada.

O administrador cadastra lotes com nome, coleção, foto real enviada pelo administrador (JPG, PNG ou WebP de até 2 MB), lance inicial, incremento e encerramento. Pode configurar valores e prazo apenas em lotes abertos sem lances. Administradores não dão lances; usuários não cadastram nem configuram lotes. Visitantes podem consultar lotes e histórico e precisam entrar para participar. Lances usam nome e ID da sessão, sem aceitar identidade digitada no formulário. Lances legados anteriores ao login conservam seus apelidos.

`auth.js` mantém contas no localStorage e a sessão no sessionStorage de cada aba; senhas de teste são derivadas com PBKDF2-SHA256, salt individual e 210.000 iterações. Ao sair, a sessão é removida e as operações revalidam o acesso. Esta solução serve **somente para demonstração**: quem controla o navegador pode alterar os dados, os papéis e a sessão. Não usar senhas reais. A configuração inicial do admin também é local e não verifica propriedade real da loja.

Na integração real, remover a configuração pública do primeiro admin, provisionar o administrador por canal privado e verificar autenticação e permissões no servidor em toda escrita. Utilizar sessão segura e provedor de identidade; não migrar hashes ou sessões desta demonstração para produção. As verificações de `authorize` em `auction-store.js` ilustram o contrato de permissões, não constituem barreira de segurança remota.

## Adaptador futuro

Substituir `createAuctionStore` por um serviço remoto e adaptar as chamadas na interface para `async/await`, com estados de carregamento e bloqueio durante o envio.

- `GET /api/auctions`: lista lotes, estado atual, horário do servidor e prazo absoluto em UTC.
- `GET /api/auctions/:id/bids`: histórico paginado com apelido público.
- `POST /api/auctions/:id/bids`: recebe `{ amount, idempotencyKey }`. `amount` é inteiro em centavos; a identidade vem da sessão autenticada, nunca de um apelido enviado pelo cliente.
- Canal de atualizações por lote, usando WebSocket, SSE ou assinatura do provedor escolhido: publicar lance confirmado e encerramento; revalidar ao reconectar.

## Dados sugeridos

- `auctions`: `id`, `card_id`, `starts_at`, `ends_at`, `opening_amount`, `min_increment`, `current_amount`, `leader_user_id`, `version`, `status`.
- `bids`: `id`, `auction_id`, `user_id`, `amount`, `created_at`, `idempotency_key`.
- `users`: identidade autenticada e apelido público; dados privados não entram no histórico público.

Salvar valores em centavos e timestamps em UTC; apresentar horários em `America/Sao_Paulo`.

## Consistência exigida no servidor

A validação do prazo, lance mínimo e atualização da liderança deve acontecer na mesma transação, com bloqueio de linha ou controle otimista de versão. Usar o relógio do servidor, rejeitar lance a partir de `ends_at`, impedir repetição pela chave de idempotência e rejeitar valores fora do limite comercial. Se dois participantes enviarem o mesmo valor, apenas o primeiro lance válido confirmado deve vencer; retornar conflito com o novo mínimo ao outro cliente.

Encerrar o lote de forma idempotente no servidor, persistindo o resultado e emitindo a atualização aos clientes. Não confiar na contagem regressiva do frontend para definir o vencedor. Autenticação, permissões de escrita, limitação de requisições e regras comerciais precisam estar implementadas antes de habilitar lances reais. Definir previamente política de extensão de prazo e regras de pagamento; a prévia usa prazo fixo sem extensão.

## Verificação

`npm test` valida lance inicial, incremento, rejeição de valores inválidos, persistência do prazo e histórico, bloqueio no instante de encerramento e falha de gravação. `npm run check` verifica sintaxe e `npm run build` inclui os módulos e a nova página em `dist/`.


As fotos dos lotes são enviadas pelo admin com prévia e validação de formato/tamanho. A demonstração salva a imagem como data URL no localStorage junto com o lote: há limite de espaço do navegador, e falhas de gravação não confirmam o cadastro. Na integração real, enviar os arquivos para armazenamento de objetos, validar/decodificar no servidor e persistir somente a referência. A foto pode ser substituída apenas antes do primeiro lance, preservando o item anunciado durante a disputa. Os três lotes iniciais permanecem exemplos do catálogo; novos lotes exigem foto própria.

