#!/usr/bin/env python3
"""Automacao de rascunhos no Gmail com base em e-mails enviados."""

from __future__ import annotations

import argparse
import base64
import json
from dataclasses import dataclass
from email.message import EmailMessage
from pathlib import Path
from typing import Any, Iterable

SCOPES = ["https://www.googleapis.com/auth/gmail.modify"]


@dataclass(frozen=True)
class IncomingEmail:
    """Representa os dados principais de um e-mail recebido."""

    message_id: str
    thread_id: str
    from_email: str
    subject: str
    snippet: str
    internet_message_id: str | None


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Le e-mails da caixa de entrada e cria rascunhos de resposta "
            "com base no historico da pasta Sent."
        )
    )
    parser.add_argument(
        "--credentials",
        default="credentials.json",
        help="Caminho para o arquivo OAuth client credentials.",
    )
    parser.add_argument(
        "--token",
        default="token.json",
        help="Caminho para o arquivo de token OAuth persistido.",
    )
    parser.add_argument(
        "--state-file",
        default=".gmail_auto_draft_state.json",
        help="Arquivo JSON para registrar mensagens processadas.",
    )
    parser.add_argument(
        "--query",
        default="in:inbox is:unread -from:me",
        help="Query Gmail para selecionar e-mails de entrada.",
    )
    parser.add_argument(
        "--max-results",
        type=int,
        default=5,
        help="Quantidade maxima de e-mails de entrada processados por execucao.",
    )
    parser.add_argument(
        "--history-limit",
        type=int,
        default=3,
        help="Quantidade maxima de e-mails enviados usados como contexto.",
    )
    parser.add_argument(
        "--mark-read",
        action="store_true",
        help="Marca e-mails processados como lidos apos criar rascunho.",
    )
    return parser.parse_args()


def build_gmail_service(credentials_path: str, token_path: str) -> Any:
    """Autentica via OAuth e retorna o client da API Gmail."""
    try:
        from google.auth.transport.requests import Request
        from google.oauth2.credentials import Credentials
        from google_auth_oauthlib.flow import InstalledAppFlow
        from googleapiclient.discovery import build
    except ImportError as exc:
        raise RuntimeError(
            "Dependencias do Google nao encontradas. "
            "Instale com: pip install -r requirements.txt"
        ) from exc

    token_file = Path(token_path)
    creds = None
    if token_file.exists():
        creds = Credentials.from_authorized_user_file(str(token_file), SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(credentials_path, SCOPES)
            creds = flow.run_local_server(port=0)
        token_file.write_text(creds.to_json(), encoding="utf-8")

    return build("gmail", "v1", credentials=creds)


def load_state(state_file: Path) -> set[str]:
    if not state_file.exists():
        return set()
    data = json.loads(state_file.read_text(encoding="utf-8"))
    processed = data.get("processed_message_ids", [])
    return {str(item) for item in processed}


def save_state(state_file: Path, processed_ids: Iterable[str]) -> None:
    state_file.write_text(
        json.dumps({"processed_message_ids": sorted(set(processed_ids))}, indent=2),
        encoding="utf-8",
    )


def extract_header(headers: list[dict[str, str]], name: str) -> str | None:
    for header in headers:
        if header.get("name", "").lower() == name.lower():
            return header.get("value")
    return None


def parse_from_email(raw_from: str) -> str:
    if "<" in raw_from and ">" in raw_from:
        return raw_from.split("<", maxsplit=1)[1].split(">", maxsplit=1)[0].strip()
    return raw_from.strip()


def normalize_reply_subject(subject: str) -> str:
    clean = subject.strip()
    if clean.lower().startswith("re:"):
        return clean
    return f"Re: {clean}"


def fetch_incoming_emails(service: Any, query: str, max_results: int) -> list[IncomingEmail]:
    response = (
        service.users()
        .messages()
        .list(userId="me", q=query, maxResults=max_results)
        .execute()
    )
    messages = response.get("messages", [])
    emails: list[IncomingEmail] = []

    for item in messages:
        message_id = item["id"]
        payload = (
            service.users()
            .messages()
            .get(userId="me", id=message_id, format="metadata")
            .execute()
        )
        headers = payload.get("payload", {}).get("headers", [])
        raw_from = extract_header(headers, "From") or ""
        subject = extract_header(headers, "Subject") or "(sem assunto)"
        internet_message_id = extract_header(headers, "Message-Id")
        emails.append(
            IncomingEmail(
                message_id=message_id,
                thread_id=payload.get("threadId", ""),
                from_email=parse_from_email(raw_from),
                subject=subject,
                snippet=payload.get("snippet", ""),
                internet_message_id=internet_message_id,
            )
        )
    return emails


def fetch_recent_sent_context(service: Any, recipient: str, limit: int) -> list[str]:
    query = f"in:sent to:{recipient}"
    response = (
        service.users()
        .messages()
        .list(userId="me", q=query, maxResults=limit)
        .execute()
    )
    messages = response.get("messages", [])
    contexts: list[str] = []
    for item in messages:
        payload = (
            service.users()
            .messages()
            .get(userId="me", id=item["id"], format="metadata")
            .execute()
        )
        snippet = payload.get("snippet", "").strip()
        if snippet:
            contexts.append(snippet)
    return contexts


def compose_reply_body(email: IncomingEmail, sent_context: list[str]) -> str:
    history_line = (
        sent_context[0]
        if sent_context
        else "nao encontrei mensagens enviadas recentes para esse contato."
    )
    return (
        f"Oi {email.from_email},\n\n"
        "Obrigado pelo seu e-mail.\n"
        f"Resumo rapido do que voce enviou: {email.snippet or '(sem resumo)'}\n\n"
        "Contexto de mensagens enviadas anteriormente:\n"
        f"- {history_line}\n\n"
        "Se fizer sentido, posso ajustar este rascunho antes de voce enviar.\n\n"
        "Abracos,\n"
        "[Seu nome]"
    )


def build_reply_raw_message(email: IncomingEmail, body: str) -> str:
    msg = EmailMessage()
    msg["To"] = email.from_email
    msg["Subject"] = normalize_reply_subject(email.subject)
    if email.internet_message_id:
        msg["In-Reply-To"] = email.internet_message_id
        msg["References"] = email.internet_message_id
    msg.set_content(body)
    encoded = base64.urlsafe_b64encode(msg.as_bytes()).decode("utf-8")
    return encoded


def create_draft_for_email(service: Any, email: IncomingEmail, body: str) -> str:
    message_raw = build_reply_raw_message(email, body)
    draft_body = {"message": {"threadId": email.thread_id, "raw": message_raw}}
    draft = service.users().drafts().create(userId="me", body=draft_body).execute()
    return draft.get("id", "")


def mark_email_as_read(service: Any, message_id: str) -> None:
    body = {"removeLabelIds": ["UNREAD"]}
    service.users().messages().modify(userId="me", id=message_id, body=body).execute()


def main() -> None:
    args = parse_args()
    state_path = Path(args.state_file)
    processed_ids = load_state(state_path)

    service = build_gmail_service(args.credentials, args.token)
    incoming_emails = fetch_incoming_emails(service, args.query, args.max_results)

    if not incoming_emails:
        print("Nenhum e-mail encontrado para a query informada.")
        return

    for email in incoming_emails:
        if email.message_id in processed_ids:
            print(f"- Ignorado (ja processado): {email.message_id}")
            continue
        history = fetch_recent_sent_context(service, email.from_email, args.history_limit)
        body = compose_reply_body(email, history)
        draft_id = create_draft_for_email(service, email, body)
        processed_ids.add(email.message_id)
        print(f"- Rascunho criado para {email.from_email}: draft_id={draft_id}")
        if args.mark_read:
            mark_email_as_read(service, email.message_id)
            print("  Marcado como lido.")

    save_state(state_path, processed_ids)


if __name__ == "__main__":
    main()
