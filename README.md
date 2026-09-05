# AitherMail

A Gmail-style webmail client designed for GitHub Pages. It runs entirely in the browser and uses Google Identity Services plus the Gmail REST API.

## Setup

1. Create a Google Cloud project.
2. Enable the Gmail API.
3. Configure OAuth consent as External and Testing.
4. Add your own Gmail address as a test user.
5. Create an OAuth client ID for a Web application.
6. Add your GitHub Pages domain as an Authorized JavaScript origin, for example `https://username.github.io`.
7. For local development also add `http://localhost:8000`.
8. In `index.html`, replace `YOUR_GOOGLE_OAUTH_CLIENT_ID.apps.googleusercontent.com` in `CLIENT_ID` with your client ID.

Google may show an unverified-app warning because Gmail modify is a restricted scope. In Testing mode, use Advanced and Continue if you trust your own app.

## Run locally

```bash
python -m http.server 8000
```

Open `http://localhost:8000/`. Do not use a `file://` URL.

## GitHub Pages

Use GitHub Settings → Pages → Deploy from a branch → `main` → root.

The repository path does not change the OAuth origin. Register the GitHub Pages domain itself.

## Features

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
- In-memory access token only

## Security

There is no backend. Tokens are never stored in localStorage or sessionStorage. A 401 causes one fresh-token retry. Email HTML is rendered in an empty sandbox iframe rather than injected into the main DOM.

## v1 exclusions

Attachments, draft editing, label management, offline cache, multi-account support, and conversation view are intentionally outside v1. A future internal Aither messaging layer can be added behind the same UI without coupling it to Gmail.
