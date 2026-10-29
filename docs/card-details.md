# Detalhes das cartas e referências de mercado

A vitrine abre um painel com giro de 360° e deslocamento da carta. Os dados atuais ficam em `card-inventory.js`; o preço Flare continua no catálogo `store-catalog.js`. Estoque e condição desconhecidos ficam `null`, apresentados como “a confirmar”. As prévias não podem ser compradas.

Para conectar estoque, preencha `stock` (inteiro >= 0) e `condition` com a condição efetivamente verificada da peça. Não derive condição ou estoque da imagem de catálogo. O verso exibido durante o giro é ilustrativo, não uma fotografia da peça.

`history` recebe observações verificadas em centavos: `{source:'liga'|'mypcards',date:'YYYY-MM-DD',amount:1234,condition:'NM',language:'Português',sourceUrl:'https://...'}`. O painel mostra as fontes separadas e períodos de 30, 90 e 180 dias. Os dados da carta devem corresponder à mesma coleção, número e impressão, sem misturar variantes. Datas, preços e condições aparecem na tabela acessível do gráfico. `sales` recebe apenas vendas Flare concluídas, nunca anúncios: `{date:'YYYY-MM-DD',amount:1234,condition:'NM',quantity:1}`. Não publicar dados pessoais dos compradores.

Sem uma API ou exportação autorizada, ambas as séries ficam vazias. A consulta da Liga retornou HTTP 403, e a página histórica MyPCards consultada redirecionou para login. Não existe integração automática ativa e não há chaves configuradas. Não contornar login, CAPTCHA ou restrições. Para conectar um fornecedor, coletar e validar os dados no servidor, com credenciais privadas, e substituir o adaptador local; atualizar os preços apenas com identificação exata da impressão. Nenhum segredo deve entrar neste módulo público.

Os links MyPCards de Rayquaza e Umbreon correspondem às impressões ROS 076/108 e PRE 060/131. A carta Charizard 151 006/165 ainda precisa de vínculo exato; o link abre o catálogo geral para evitar associar preços de variantes japonesas ou Full Art ao item errado. Os preços da loja são demonstrativos e não são cotações desses sites.
