# Automacao Gmail para respostas em rascunho

Este repositorio contem uma automacao em Python que:

- le e-mails recebidos no Gmail;
- consulta o historico de e-mails enviados para o mesmo contato;
- cria um rascunho de resposta para revisao manual do usuario.

## Requisitos

- Python 3.10+.
- Projeto Google Cloud com Gmail API habilitada.
- Credencial OAuth Desktop (`credentials.json`) baixada no diretorio raiz.

Instalacao das dependencias:

`pip install -r requirements.txt`

## Configuracao OAuth (primeira execucao)

1. No Google Cloud Console, habilite a Gmail API.
2. Crie credenciais OAuth Client ID do tipo Desktop.
3. Baixe o arquivo e salve como `credentials.json` na raiz do projeto.
4. Execute o script uma vez para concluir login no navegador e gerar `token.json`.

## Como usar

Comando padrao:

`python gmail_auto_draft.py`

Opcoes uteis:

- `--max-results 10`: quantidade de e-mails recebidos por execucao.
- `--history-limit 5`: quantidade de e-mails enviados usados no contexto.
- `--query "in:inbox is:unread -from:me"`: filtro customizado Gmail.
- `--mark-read`: marca o e-mail recebido como lido apos criar rascunho.

## Fluxo esperado

1. O script busca e-mails da caixa de entrada.
2. Para cada e-mail, busca mensagens recentes na pasta Sent para o remetente.
3. Gera corpo de resposta com base no resumo recebido + contexto enviado.
4. Cria rascunho na thread correspondente.
5. Salva estado local (`.gmail_auto_draft_state.json`) para evitar duplicidade.

## Testes

Execute:

`python -m unittest discover -s tests`