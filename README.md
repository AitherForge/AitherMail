# AitherMail

A Gmail-style webmail client designed for GitHub Pages. AitherMail uses the shared AitherBackend for Aither Account authentication and Google Identity Services plus the Gmail REST API for Gmail access.

## Architecture

- **Frontend:** GitHub Pages (`index.html`, `style.css`, `app.js`)
- **Aither Account backend:** [`OGAitherTech/AitherBackend`](https://github.com/OGAitherTech/AitherBackend), deployed separately as a FastAPI service
- **Gmail:** Google OAuth + Gmail REST API
- **No Gmail API key:** the frontend uses a public Google OAuth Web client ID; the Gmail access token is kept in memory only
- **Backend sessions:** AitherBackend uses an HttpOnly `aither_session` cookie and server-side sessions

## Setup

### 1. Deploy AitherBackend

Deploy [`AitherBackend`](https://github.com/OGAitherTech/AitherBackend) to Render (or another HTTPS FastAPI host). The backend repository already contains a `render.yaml` Blueprint and the required authentication API.

Set the backend's production environment variables as documented in its README. For production, use HTTPS, persistent storage for its SQLite database, `SECURE_COOKIES=true`, and `SameSite=None` for cross-site GitHub Pages sessions.

### 2. Connect AitherMail to the backend

At the top of `app.js`, set:

```js
const BACKEND_URL='https://aither-backend.onrender.com';
```

If your deployed backend has a different URL, use that URL instead.

AitherMail uses these backend endpoints:

- `POST /api/auth/register` — create an Aither Account
- `POST /api/auth/login` — sign in
- `GET /api/auth/session` — restore the account session
- `POST /api/auth/logout` — sign out

Requests use `credentials: 'include'` so the backend's HttpOnly session cookie works from GitHub Pages.

### 3. Configure Gmail OAuth

1. Create a Google Cloud project.
2. Enable the Gmail API.
3. Configure OAuth consent as External and Testing.
4. Add your own Gmail address as a test user.
5. Create an OAuth client ID for a Web application.
6. Add your GitHub Pages origin as an Authorized JavaScript origin.
7. For local development also add `http://localhost:8000`.
8. Put the public OAuth client ID in `CLIENT_ID` in `app.js`.

Google may show an unverified-app warning because Gmail modify is a restricted scope. In Testing mode, use Advanced and Continue if you trust your own app.

## Run locally

```bash
python -m http.server 8000
```

Open `http://localhost:8000/`. Do not use a `file://` URL.

For local AitherBackend development, follow the backend repository's FastAPI setup instructions and change `BACKEND_URL` to `http://127.0.0.1:8000` (or the backend port you use).

## GitHub Pages

Use GitHub Settings → Pages → Deploy from a branch → `main` → root.

The repository path does not change the OAuth origin. Register the GitHub Pages domain itself.

## Features

- Aither Account registration and sign-in
- Persistent backend sessions through an HttpOnly cookie
- Google Identity Services OAuth token flow
- Gmail modify and send scopes only
- Inbox, Starred, Sent, Drafts, Trash
- Gmail search syntax
- 25-message pagination with parallel metadata hydration
- UTF-8-safe Gmail base64url decoding
- Sandboxed iframe rendering for HTML email
- Archive, trash, star/unstar, mark unread
- Compose and reply
- Responsive desktop/mobile layout
- In-memory Gmail access token only

## Security

Aither Account passwords are handled by AitherBackend using salted `scrypt` password hashing and server-side opaque sessions. The browser does not store the Aither session in localStorage. The backend session is an HttpOnly cookie. Gmail access tokens are held in memory and are not stored in localStorage or sessionStorage. A Gmail 401 causes one fresh-token retry. Email HTML is rendered in an empty sandbox iframe rather than injected into the main DOM.

Never put SMTP passwords, provider/API secrets, or other private backend credentials into this GitHub Pages repository.

## v1 exclusions

Attachments, draft editing, label management, offline cache, multi-account support, and conversation view are intentionally outside v1. A future internal Aither messaging layer can use AitherBackend's authenticated data APIs without coupling the Gmail UI to Gmail-specific storage.