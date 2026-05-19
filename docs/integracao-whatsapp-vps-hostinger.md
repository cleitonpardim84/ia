# Integracao WhatsApp Business com VPS Hostinger (Hermes)

Este guia descreve como ligar por SSH a uma VPS na Hostinger (ex.: nome interno Hermes) e o que preparar para a integracao oficial com a **WhatsApp Business Platform** (Meta Cloud API). Nao inclui segredos: guarde tokens e chaves fora do Git.

## 1. Dados que precisa reunir

- **IP publico ou hostname** da VPS (painel Hostinger > VPS).
- **Utilizador SSH** (muitas vezes `root` ou o utilizador criado na instalacao).
- **Chave SSH** (recomendado) ou palavra-passe temporaria; na Hostinger pode gerir chaves no painel.
- **Dominio** (opcional mas recomendado) apontando A/AAAA para o IP da VPS, para HTTPS no webhook.

## 2. Ligar por SSH a partir do seu computador

Substitua os valores pelos seus.

```bash
ssh -i /caminho/para/sua_chave_privada usuario@IP_OU_HOSTNAME
```

Primeira ligacao: confirme a impressao digital do host (`yes`) se for confiavel.

### Problemas comuns

- **Porta 22 bloqueada**: no painel Hostinger ou firewall da VPS, confirme que SSH (22) esta permitido para o seu IP.
- **Permissao da chave**: `chmod 600 sua_chave_privada`
- **Root desativado**: use o utilizador nao-root indicado pela Hostinger e `sudo` quando precisar.

## 3. O que a Meta exige para WhatsApp Cloud API

1. Conta **Meta for Developers**: https://developers.facebook.com/
2. **App** do tipo adequado (negocio), com produto **WhatsApp** ativado.
3. **WhatsApp Business Account (WABA)** e numero de telefone de teste ou verificado para producao.
4. **Token de acesso** (temporario no painel; em producao use token de longa duracao ou fluxo OAuth conforme documentacao atual).
5. **Webhook HTTPS** publico: URL que a Meta possa chamar (GET para verificacao, POST para eventos).

Documentacao oficial (sempre confirme versoes e fluxos atuais):

- https://developers.facebook.com/docs/whatsapp/cloud-api

## 4. Na VPS Hermes (resumo tecnico)

Objetivo tipico: uma aplicacao (Node, Python, PHP, etc.) que:

- recebe **POST** no endpoint do webhook com o corpo assinado/validado conforme a Meta;
- responde ao **challenge** do GET na configuracao do webhook;
- usa o **token** e o **Phone Number ID** para enviar mensagens via API REST da Meta.

Infraestrutura habitual:

- **Nginx** (ou Caddy) como reverse proxy com **TLS** (Let's Encrypt com `certbot`).
- Firewall (`ufw` ou equivalente): abrir 80/443 para o mundo; SSH apenas do seu IP se possivel.
- Process manager (**systemd**, PM2, etc.) para manter a app em execucao.

Nao exponha `.env` com `WHATSAPP_TOKEN` no repositorio; use variaveis de ambiente no servidor.

## 5. Ligacao deste ambiente (Cursor / agente) a uma VPS

Agentes automaticos **nao** devem receber palavras-passe SSH em chat. Para trabalho remoto seguro:

- Use **chave SSH** dedicada, **sem** passphrase em maquinas nao confiaveis apenas se aceitar o risco; preferivel chave com passphrase e agent.
- Restrinja em `~/.ssh/authorized_keys` na VPS o que essa chave pode fazer (opcional: `command=` / restricoes).
- Ou execute os passos localmente na sua maquina e mantenha no repositorio apenas codigo e documentacao, nao credenciais.

## 6. Checklist rapido

- [ ] SSH funciona do seu IP para a VPS Hermes
- [ ] Dominio com HTTPS valido (se usar webhook)
- [ ] App Meta + WhatsApp configurados; Phone Number ID e token disponiveis
- [ ] Webhook verificado na Meta com URL e `verify_token` corretos
- [ ] App na VPS a correr por systemd/PM2 e logs monitorizados

---

Se precisar de um esqueleto de aplicacao (ex.: webhook em Node ou Python) no mesmo repositorio, pode pedir explicitamente a stack preferida.
