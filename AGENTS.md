# AGENTS.md

## Objetivo

Este documento define orientacoes para agentes automatizados que trabalham neste repositorio.

## Contexto do projeto

- Repositorio inicial e enxuto.
- Arquivo principal atual: `README.md`.
- Mantenha as mudancas simples, objetivas e faceis de revisar.

## Regras de contribuicao para agentes

1. Sempre trabalhe em uma branch propria para a tarefa.
2. Faca alteracoes pequenas e focadas em um unico objetivo.
3. Atualize documentacao quando houver impacto no comportamento esperado.
4. Nao remova ou reverta mudancas do usuario sem pedido explicito.

## Qualidade minima

- Validar sintaxe e consistencia dos arquivos alterados.
- Garantir que nomes de arquivos e secoes sejam claros.
- Preferir texto ASCII para manter compatibilidade ampla.

## Fluxo recomendado

1. Ler contexto do repositorio.
2. Implementar a mudanca solicitada.
3. Revisar o diff final.
4. Commit com mensagem descritiva.
5. Push da branch para o remoto.

## Formato de commits

Use mensagens curtas e diretas, por exemplo:

- `docs: cria AGENTS.md com diretrizes para agentes`
- `docs: atualiza instrucoes de contribuicao no AGENTS.md`

## Cursor Cloud specific instructions

- This is currently a blank repository (no application code, no dependencies, no services).
- No update script is needed; there are no dependencies to install.
- No lint, test, or build commands exist yet. When application code is added, update this section with the relevant commands.
- To clone and work locally: `git clone <repo-url> && cd ia`.
- The `AGENTS.md` file contains contribution guidelines in Portuguese (pt-BR) that all agents must follow.
