# Sistema de gestao empresarial

Base inicial para um sistema leve de gestao de uma empresa com dois departamentos:
Publicidade e Estamparia DTF.

## Objetivo

Centralizar administracao, comercial, produtos, producao e financeiro em um fluxo
simples, com permissao por usuario, comunicacao interna, orcamentos, kanban de
producao e preparacao para banco de dados MySQL.

## Modulos incluidos no MVP

- Administrador: usuarios, permissoes por modulo e chat interno.
- Comercial Publicidade: funil de vendas, aprovacao do cliente, simulador de
  impressao, custeio RKW, orcamentos e envio para producao.
- Produtos Publicidade: cadastro de produtos, categorias, fornecedores, medidas,
  cores, custos e preco com ou sem IVA de 23%.
- Producao Publicidade: painel kanban com etapas de aprovacao, design,
  impressao, laminadora e pronto/montagem.
- Financeiro: contas a pagar, contas a receber, fluxo de caixa, creditos,
  cotacoes e emissao de faturas/orcamentos.

## Como visualizar

Abra `public/index.html` no navegador ou execute um servidor local:

```bash
python3 -m http.server 8000 --directory public
```

Depois acesse `http://localhost:8000`.

## Estrutura

- `public/`: prototipo navegavel do sistema.
- `public/assets/`: CSS e JavaScript da interface.
- `database/schema.sql`: modelo MySQL inicial.
- `docs/escopo-mvp.md`: organizacao dos modulos e fluxo de trabalho.

## Proximos passos recomendados

1. Confirmar campos obrigatorios de clientes, fornecedores, produtos e faturas.
2. Escolher tecnologia de backend para ligar a interface ao MySQL.
3. Definir hospedagem e apontamento do dominio.
4. Integrar autenticacao real, upload de ficheiros e leitura de faturas por IA.

## Importacao na Hostinger

Consulte `docs/importacao-hostinger.md` para publicar os ficheiros no
`public_html` e importar `database/schema.sql` no MySQL pelo phpMyAdmin.