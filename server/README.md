# Aither Mail

Aither Mail is the Aither-branded SMTP mail catcher/testing server. It follows the same core workflow as MailHog: point an application's SMTP output at Aither Mail, capture the messages, and inspect them in a web UI or through the HTTP API instead of delivering them to real recipients.

MailHog is MIT licensed, and its documented core model includes an SMTP listener, web interface, JSON APIs, message inspection, and message deletion. Aither Mail implements those ideas independently with Aither branding rather than copying MailHog's source or branding.

## Run

```bash
go run .
```

Defaults:

- SMTP: `localhost:1025`
- Web UI/API: `http://localhost:8025`

Override with `AITHER_MAIL_SMTP` and `AITHER_MAIL_HTTP`, or the `-smtp` and `-http` flags.

## Docker

Build from this directory:

```bash
docker build -t aither-mail .
docker run --rm -p 1025:1025 -p 8025:8025 aither-mail
```

## SMTP example

Configure a development application to send SMTP to `localhost:1025`. Messages are held in memory and appear in the Aither Mail UI at `http://localhost:8025`.

## API

- `GET /api/v2/messages` — list captured messages
- `GET /api/v1/messages/:id` — retrieve one message
- `DELETE /api/v1/messages/:id` — delete one message
- `DELETE /api/v2/messages` — delete all messages
- `GET /health` — health check

This capture server is intended for development/testing. It is not a production mail relay and should not be exposed directly to the public internet without appropriate access controls.
