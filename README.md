# Aither Mail

A Gmail-like webmail client powered by the real Gmail API, with a shared Aither Account backed by AitherBackend.

## v3

Aither Mail v3 focuses on making the app feel like a real mail client instead of a simple API demo.

### Included

- Gmail-style three-pane desktop layout
- Responsive mobile layout with slide-out navigation
- Aither Account registration, login, session, and logout
- Google Gmail OAuth connection
- Inbox, Starred, Sent, Drafts, and Trash
- Gmail search syntax
- Message selection with bulk actions
- Archive, trash, star/unstar, and mark unread
- Real compose and reply
- Reply threading with `threadId`, `In-Reply-To`, and `References`
- Sandboxed HTML email viewer
- Pagination with Load more
- Refresh and retry states
- Settings panel with compact-list option
- No Gmail API key
- No Gmail password stored by Aither Mail
- Backend session kept in an HttpOnly cookie
- Gmail access token kept in memory

## Architecture

- **Frontend:** static HTML/CSS/JavaScript on GitHub Pages
- **Aither Account:** AitherBackend
- **Email provider:** Gmail REST API
- **Google auth:** Google Identity Services OAuth

## Setup

### AitherBackend

Deploy the existing AitherBackend as an HTTPS FastAPI service. The frontend currently uses `https://aither-backend.onrender.com`; if your deployment has another URL, change `BACKEND_URL` at the top of `app.js`.

The frontend uses the backend's session endpoints and sends requests with credentials enabled. Do not put backend secrets in this repository.

### Gmail

1. Enable the Gmail API in Google Cloud.
2. Configure Google OAuth consent.
3. Create a Web application OAuth client.
4. Add your GitHub Pages origin as an Authorized JavaScript origin.
5. Add `http://localhost:8000` for local development if needed.
6. Replace `YOUR_GOOGLE_OAUTH_CLIENT_ID.apps.googleusercontent.com` in `CLIENT_ID` in `app.js`.

The OAuth client ID is public configuration. No Gmail API key is required.

## Run locally

```bash
python -m http.server 8000
```

Open `http://localhost:8000/`. Do not open the app with `file://`.

## GitHub Pages

Use GitHub Settings → Pages → Deploy from a branch → `main` → root.

## Roadmap

The next major features can add conversation/thread view, attachments, draft autosave, labels, filters, contacts, notifications, multiple Gmail accounts, and richer settings.

## Security

Aither Mail does not store passwords or private backend credentials. AitherBackend handles account passwords and server-side sessions. Gmail access tokens are kept in memory. Email HTML is displayed in a sandboxed iframe.
