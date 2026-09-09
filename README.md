# Aither Mail v6

Aither Mail is Aither's webmail client built around the **MailHog-compatible mail engine** and the shared **Aither Account** system, with **Resend** as the production outbound delivery provider.

## v6 architecture

- **Web app:** static HTML/CSS/JavaScript, suitable for GitHub Pages
- **Identity:** AitherBackend session authentication
- **Mail engine:** MailHog-compatible SMTP + HTTP API backend
- **Production sending:** Resend Email API
- **Message API:** Aither Mail `/api/v1` and `/api/v2` endpoints
- **Local persistence:** MailHog Maildir can be enabled for development
- **SMTP:** port `1025` inside the container/network
- **HTTP:** Render exposes the Aither Mail web service on its assigned `$PORT`
- **UI:** Aither-branded, responsive, Gmail-style productivity layer

Resend supports production email delivery through its Email API and also provides inbound email processing through webhook-based receiving, including Resend-provided `.resend.app` inbound addresses. citehttps://resend.com/features/email-api citehttps://resend.com/features/inbound

## Resend configuration

Set these environment variables on the Aither Mail backend — never commit them to GitHub:

```text
RESEND_API_KEY=re_xxxxxxxxx
RESEND_FROM=Aither Mail <your-verified-sender@example.com>
```

`RESEND_API_KEY` enables Resend delivery. `RESEND_FROM` should be a sender/domain verified in your Resend account. The authenticated Aither Account email is used as `Reply-To`, so replies can go back to the user even when the verified sending address is a service address.

If `RESEND_API_KEY` is not configured, Aither Mail automatically falls back to local MailHog SMTP for development.

The backend also exposes `/api/config`, which reports whether Resend is configured without revealing the API key.

## Gmail-style improvements

- Gmail-like inbox / sent / all-mail navigation
- Fast search across sender, recipient, subject, and body text
- Mobile-first message reading and compose behavior
- Keyboard shortcuts: `/` search, `C` compose, and `G` navigation shortcuts
- Better hover, focus, selected-message, and loading states
- Dark-mode-aware controls
- Resend/local provider status in the header
- Local draft saving
- HTML email rendering in a sandboxed iframe
- Raw message/source inspection
- Multi-select and bulk deletion
- Aither Account authentication

## Local development

```bash
docker compose up -d
```

Local development continues to use MailHog SMTP/API when Resend is not configured.

## Deployment

GitHub Pages can host the frontend, but it cannot run an SMTP server. Aither Mail's backend therefore runs separately. The GitHub Pages frontend routes mail API requests to the Aither Mail backend while authentication remains with AitherBackend.

For Render, keep the Resend API key in the service's environment variables. Do not put it in JavaScript, GitHub Pages, `Dockerfile`, or committed `.env` files.

## Important Resend limitation

For production sending, Resend requires an authorized sender. Aither Mail therefore uses the configured `RESEND_FROM` address for delivery and the signed-in Aither Account address as the reply-to address. This keeps the API key server-side and avoids pretending to be an unverified sender.

## MailHog license

MailHog is released under the MIT license. See the upstream project for its license and source.
