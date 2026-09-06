# AitherMail

A Gmail-style webmail client for GitHub Pages with an Aither Account layer backed by AitherBackend.

## Architecture

- **Frontend:** static HTML/CSS/JavaScript on GitHub Pages
- **Aither Account:** AitherBackend session authentication
- **Email:** Gmail REST API with Google Identity Services OAuth
- **No Gmail API key:** Google uses a public OAuth Web client ID
- **No secrets in this repository:** private backend credentials remain server-side

## Setup

### AitherBackend

Deploy the existing AitherBackend as an HTTPS FastAPI service. AitherMail is configured for `https://aither-backend.onrender.com` by default; change `BACKEND_URL` at the top of `app.js` if your deployed URL is different.

AitherMail uses the backend's `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/session`, and `POST /api/auth/logout` endpoints with credentialed requests.

### Gmail

1. Enable the Gmail API in Google Cloud.
2. Configure OAuth consent as External → Testing and add your Gmail address as a test user.
3. Create an OAuth client ID for a Web application.
4. Add your GitHub Pages origin as an Authorized JavaScript origin.
5. For local development also add `http://localhost:8000`.
6. Replace `YOUR_GOOGLE_OAUTH_CLIENT_ID.apps.googleusercontent.com` in `CLIENT_ID` in `app.js`.

No Gmail API key is used. The Google OAuth client ID is public configuration; the Gmail access token is kept in memory.

## Run locally

```bash
python -m http.server 8000
```

Open `http://localhost:8000/`. Do not use a `file://` URL.

## GitHub Pages

Use GitHub Settings → Pages → Deploy from a branch → `main` → root.

## Features

- Aither Account registration and login
- Shared AitherBackend session
- Google Gmail connection
- Inbox, Starred, Sent, Drafts, Trash
- Gmail search syntax
- 25-message pagination
- UTF-8-safe Gmail decoding
- Sandboxed HTML email rendering
- Archive, trash, star/unstar, mark unread
- Compose and reply
- Responsive desktop/mobile layout
- Aither Account and Gmail logout

## Security

Passwords are handled by AitherBackend using salted `scrypt` hashing and server-side sessions. AitherMail does not store passwords or backend secrets. The backend session uses an HttpOnly cookie. Gmail access tokens stay in memory and are not stored in localStorage/sessionStorage. Email HTML is rendered inside an empty sandbox iframe.

Never put SMTP passwords, provider/API secrets, or other private backend credentials into this GitHub Pages repository.

## v1 exclusions

Attachments, draft editing, label management, offline cache, multi-account Gmail support, and conversation view remain outside v1.
