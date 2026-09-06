# Aither Mail v4

Aither Mail is Aither's webmail interface built around the **MailHog SMTP/API architecture** and authenticated with the shared Aither Account system.

## v4 architecture

- **Web app:** static HTML/CSS/JavaScript, suitable for GitHub Pages
- **Identity:** AitherBackend session authentication
- **Mail engine:** MailHog-compatible SMTP + HTTP API backend
- **Message API:** MailHog API v1/v2 style endpoints
- **Storage:** MailHog Maildir storage can be enabled for persistence
- **SMTP:** port `1025` by default
- **HTTP API/UI:** port `8025` by default
- **No Gmail API key:** v4 no longer requires Gmail OAuth just to operate the Aither Mail UI

MailHog provides an RFC5321 SMTP server, HTTP APIs for listing/retrieving/deleting messages, real-time web updates, MIME handling, and optional persistent storage. Aither Mail v4 uses that model while providing its own Aither-branded interface and account layer. citehttps://github.com/mailhog/MailHog

## Local mail backend

Docker is the easiest way to run the MailHog-compatible mail engine locally:

```bash
docker compose up -d
```

The local mail server exposes:

- SMTP: `localhost:1025`
- MailHog HTTP/API: `localhost:8025`

MailHog supports configurable CORS and Maildir storage through environment variables; the included compose file enables Maildir persistence. citehttps://github.com/mailhog/MailHog/blob/master/docs/CONFIG.md

For the browser frontend, set `window.AITHER_MAIL_API` before `app.js` loads when your API is hosted somewhere other than the default configured backend.

Example:

```html
<script>
  window.AITHER_MAIL_API = 'https://your-aither-mail-api.example.com';
</script>
<script src="app.js" defer></script>
```

## Aither Account

Aither Mail still uses the central AitherBackend for account registration, login, sessions, and logout. Mail storage and SMTP are deliberately kept separate from the browser so private backend credentials never belong in the GitHub Pages repository.

## v4 features

- Aither Account sign-in and registration
- MailHog-style inbox
- MailHog API v2 message listing
- Message detail view
- HTML email rendering inside a sandboxed iframe
- Raw message/source inspection
- Search
- Inbox / Sent / All Mail views
- Multi-select and bulk delete
- Compose/reply interface
- Automatic inbox refresh
- Responsive mobile layout
- Persistent local Maildir option
- SMTP-compatible development workflow

## Important deployment note

GitHub Pages can host the frontend, but it cannot run an SMTP server. Aither Mail v4 therefore requires the mail backend to run separately (for example on a server/container platform). The frontend's `MAIL_API` endpoint must point at that backend.

Do **not** put SMTP passwords or other private provider credentials into this repository.

## MailHog license

MailHog is released under the MIT license. See the upstream project for its license and source. citehttps://github.com/mailhog/MailHog
