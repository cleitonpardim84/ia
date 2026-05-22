# Restaurar o site (estamparia.pt) se a importacao correr mal

## Resposta curta

**Codigo sozinho** (um script no WordPress) **nao** substitui um **backup completo**. Para voltar atras de forma segura, o que funciona e:

1. **Restaurar backup** feito **antes** da importacao (base de dados + ficheiros, conforme o teu hosting), ou  
2. **Importar de novo** um CSV de **exportacao anterior** dos produtos (se guardaste um export WooCommerce antes de mudar), com cuidado para **nao duplicar** produtos (depende das opcoes do importador).

## O que fazer **antes** de importar

| Passo | Porque |
|-------|--------|
| **Backup** na Hostinger / painel (base de dados + ficheiros) ou plugin (UpdraftPlus, WPvivid, etc.) | Permite **voltar o site inteiro** ao estado anterior com um clique ou restauracao manual. |
| **Exportar produtos** em **WooCommerce > Produtos > Exportar** (CSV) e guardar o ficheiro | Tens uma copia dos produtos **antes** da mudanca; podes comparar ou reimportar com planeamento. |
| **Testar em staging** (copia do site) | Evita estragar a loja em producao. |

## Se ja importaste e algo correu mal

- **Melhor opcao:** **restaurar o backup** da data/hora anterior a importacao (painel da hospedagem ou plugin de backup).  
- **Sem backup:** fica **dificil** voltar ao estado exacto; podes corrigir com novo CSV, apagar produtos duplicados manualmente ou com ajuda tecnica -- **arriscado** e demorado.

## O que o Git **nao** faz

O repositorio `ia` (documentacao) **nao** contem a base de dados da loja nem os produtos WooCommerce. **Git** guarda codigo e docs; **produtos e precos** estao na **base de dados MySQL** do WordPress. Por isso "restaurar com codigo" no sentido de `git revert` **nao** aplica ao catalogo da loja.

## Resumo

- **Sim**, podes voltar atras **se tiveres backup** ou **exportacao fiavel** antes da mudanca.  
- **Nao** contes com "um codigo magico" sem backup.  
- **Regra de ouro:** backup + (idealmente) **staging** antes de importar em massa.
