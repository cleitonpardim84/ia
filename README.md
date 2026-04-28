# Sistema de Gestao - Estamparia Lisboa

Aplicacao web simples para gerir uma estamparia em Lisboa, com login por perfil e fluxo de trabalho entre atendimento, producao e administracao.

## Perfis e logins de demo

- Admin: `admin` / `admin123`
- Atendente: `atendente` / `atendente123`
- Producao: `producao` / `producao123`

## Funcionalidades principais

- Formulario online de pedido preenchido pela atendente e enviado para producao.
- Status de pedidos: `Em producao`, `Aguardando pagamento 50%`, `Pagamento 100%`.
- Gestao de tamanhos, cores e fornecedores (menu Admin).
- Gerenciamento de stock com entradas, saidas, alerta de nivel minimo e abatimento automatico ao criar pedido.
- Menu de producao para atualizar estado e notas de oficina.
- Menu de perdas e despesas no Admin.
- Painel financeiro de lucros e despesas com valores agregados.

## Executar localmente

Como o projeto e estatico, abra `index.html` no browser ou rode um servidor local:

- `python3 -m http.server 4173`

Depois aceda a `http://localhost:4173`.