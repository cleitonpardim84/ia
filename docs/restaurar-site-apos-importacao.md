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

## Passo a passo tipico (reposicao / rollback)

### A) Restaurar backup da hospedagem (o mais fiavel)

1. Entra no **painel da Hostinger** (hPanel) > **Websites** > o teu dominio **estamparia.pt**.  
2. Abre **Backups** (ou **Ficheiros e base de dados** > **Backups** -- o nome varia ligeiramente).  
3. Escolhe uma **copia automatica ou manual** de **antes** da importacao (data e hora).  
4. Usa **Restaurar** para **base de dados**, **ficheiros**, ou **ambos**, conforme o que o painel permitir e o que queiras reverter.  
5. Espera a conclusuicao e verifica o site em janela anonima (cache pode mostrar versao antiga).

Isto repoe **todo o WordPress** desse momento (produtos, encomendas recentes nao incluidas no backup, etc.). Confirma o que o backup inclui antes de confirmar.

### B) So catalogo WooCommerce (sem restaurar o site inteiro)

So e praticavel se **exportaste** os produtos antes ou tens um CSV "bom" guardado.

1. **Produtos > Exportar** (num backup preventivo futuro) ou usa o CSV antigo.  
2. Para **repor precos/nomes**, podes **importar** de novo o CSV correcto, marcando **atualizar produtos existentes por SKU** (se o importador mostrar essa opcao).  
3. Cuidado: importacoes mal feitas podem **duplicar** produtos se o SKU nao bater certo. Por isso **A)** e preferivel para "voltar tudo como estava".

### C) Plugin de backup (UpdraftPlus, WPvivid, Jetpack VaultPress, etc.)

Se usas um destes e criaste uma copia **antes** da importacao:

1. **WordPress >** menu do plugin > **Restaurar** / **Restore**.  
2. Escolhe o conjunto de ficheiros + base de dados da data pretendida.  
3. Segue o assistente ate concluir.

---

## Resumo

- **Sim**, podes voltar atras **se tiveres backup** ou **exportacao fiavel** antes da mudanca.  
- **Nao** contes com "um codigo magico" sem backup.  
- **Regra de ouro:** backup + (idealmente) **staging** antes de importar em massa.
