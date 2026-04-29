import base64
import unittest

from gmail_auto_draft import (
    IncomingEmail,
    build_reply_raw_message,
    compose_reply_body,
    normalize_reply_subject,
    parse_from_email,
)


class GmailAutoDraftTests(unittest.TestCase):
    def test_parse_from_email_with_display_name(self) -> None:
        self.assertEqual(
            parse_from_email("Maria Silva <maria@example.com>"),
            "maria@example.com",
        )

    def test_parse_from_email_plain_address(self) -> None:
        self.assertEqual(parse_from_email("joao@example.com"), "joao@example.com")

    def test_normalize_reply_subject_adds_prefix(self) -> None:
        self.assertEqual(normalize_reply_subject("Orcamento"), "Re: Orcamento")

    def test_normalize_reply_subject_keeps_existing_prefix(self) -> None:
        self.assertEqual(normalize_reply_subject("Re: Orcamento"), "Re: Orcamento")

    def test_compose_reply_body_uses_sent_context(self) -> None:
        email = IncomingEmail(
            message_id="123",
            thread_id="abc",
            from_email="ana@example.com",
            subject="Duvida",
            snippet="Gostaria de detalhes do servico.",
            internet_message_id="<msg-1@example.com>",
        )
        body = compose_reply_body(email, ["No ultimo contato, combinamos envio na segunda."])
        self.assertIn("No ultimo contato, combinamos envio na segunda.", body)
        self.assertIn("Gostaria de detalhes do servico.", body)

    def test_compose_reply_body_fallback_without_context(self) -> None:
        email = IncomingEmail(
            message_id="123",
            thread_id="abc",
            from_email="ana@example.com",
            subject="Duvida",
            snippet="",
            internet_message_id=None,
        )
        body = compose_reply_body(email, [])
        self.assertIn("nao encontrei mensagens enviadas recentes para esse contato.", body)

    def test_build_reply_raw_message_contains_subject(self) -> None:
        email = IncomingEmail(
            message_id="123",
            thread_id="abc",
            from_email="ana@example.com",
            subject="Duvida",
            snippet="",
            internet_message_id="<msg-1@example.com>",
        )
        raw = build_reply_raw_message(email, "Resposta teste")
        decoded = base64.urlsafe_b64decode(raw.encode("utf-8")).decode("utf-8")
        self.assertIn("Subject: Re: Duvida", decoded)
        self.assertIn("In-Reply-To: <msg-1@example.com>", decoded)


if __name__ == "__main__":
    unittest.main()
