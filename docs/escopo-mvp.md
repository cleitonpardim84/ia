# Escopo MVP do sistema de gestao

## Principios do fluxo

- Fluxo limpo: cada modulo mostra apenas o que o departamento precisa executar.
- Permissao por trabalho: o administrador libera secoes conforme a funcao do
  funcionario.
- Dados reaproveitados: produtos, fornecedores, presets e custos alimentam os
  orcamentos e a producao.
- Producao visual: o trabalho aprovado segue para kanban e roteiro produtivo.
- Financeiro rastreavel: documentos, contas e caixa ficam ligados a cliente,
  fornecedor, orcamento ou fatura.

## 01P - Modulo Administrador

Responsavel por manter a base do sistema.

- Criar usuarios.
- Definir departamento, cargo e modulos permitidos.
- Liberar permissoes especificas por trabalho.
- Acompanhar notificacoes e chat entre modulos.
- Permitir envio de ficheiros no chat.

## 02P - Modulo Comercial Publicidade

Responsavel pelo relacionamento com cliente e orcamento.

- Funil de vendas.
- Link de aprovacao automatica pelo cliente.
- Simulador de impressao.
- Custeio RKW.
- Agenda de tarefas e orcamentos.
- Cadastro de produto, fornecedor, tamanho, cor e quantidade no orcamento.
- Presets de orcamento guardados e editaveis.
- Preco de custo, preco de venda e IVA de 23%.
- Envio da folha de obra para producao sem expor valores ao setor produtivo.

## 03P - Modulo Produtos Publicidade

Responsavel pela base comercial e tecnica dos materiais.

- Produtos, categorias e subcategorias.
- Cor, marca, fabricante e tipo de material.
- Quantidades, medidas, espessura e metros.
- Fornecedores, preco de custo e preco de venda.
- Calculos automaticos com ou sem IVA de 23%.

## 04P - Modulo Producao Publicidade

Responsavel pela execucao do pedido aprovado.

- Painel kanban:
  1. Em aprovacao.
  2. Design.
  3. Impressao.
  4. Laminadora.
  5. Pronto/Montagem.
- Receber folha de obra do modulo comercial.
- Visualizar, imprimir e mover card.
- Design com envio de ficheiros e informacoes do servico.
- Cadastro de maquinas.
- Planjobs como linha de producao virtual.
- Previsto x realizado.
- Terminal de apontamento.
- Calculo automatico da data de entrega CTT.
- Roteiro produtivo.
- Estatisticas de producao.

## 05P - Financeiro

Responsavel por documentos e caixa.

- Contas a pagar.
- Contas a receber.
- Integracao futura com IA Gemini para leitura de faturas anexadas.
- Fluxo de caixa.
- Controle de creditos.
- Emissao de fatura e orcamento com logotipo e informacoes da empresa.
- Cotacoes.

## Modelo de permissao sugerido

| Perfil | Acesso |
| --- | --- |
| Administrador | Todos os modulos, usuarios, permissoes e configuracoes |
| Comercial | Comercial, Produtos em leitura, chat e envio para Producao |
| Designer | Producao em Design, folha de obra sem valores e ficheiros |
| Operador | Producao em Impressao, Laminadora, apontamentos e maquinas |
| Financeiro | Financeiro, documentos, contas, fluxo de caixa e cotacoes |

## Fluxo principal

1. Administrador cria usuario e libera modulos.
2. Comercial cadastra cliente, produto, fornecedor e orcamento.
3. Cliente aprova pelo link.
4. Sistema cria folha de obra sem valores para producao.
5. Producao move o card pelo kanban e registra previsto x realizado.
6. Comercial recebe notificacao de pronto/montagem.
7. Financeiro emite fatura, controla recebimento e atualiza caixa.

## Itens fora do MVP visual

- Autenticacao real.
- Persistencia real no MySQL.
- Upload real de ficheiros.
- Integracao Gemini.
- Envio automatico de email, WhatsApp ou SMS.
- Faturacao fiscal certificada.
