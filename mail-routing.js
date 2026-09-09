(() => {
  const backend = (window.AITHER_BACKEND_URL || 'https://aitherbackend.onrender.com').replace(/\/$/, '');
  const renderMail = 'https://aithermail.onrender.com';
  const originalFetch = window.fetch.bind(window);

  // The Render AitherMail service exposes the MailHog-compatible API itself.
  // GitHub Pages needs to call that service directly; the Render-hosted app can
  // use its own origin. Never rewrite /api/v1 or /api/v2 mail calls to AitherBackend.
  window.AITHER_MAIL_API = location.hostname.endsWith('github.io') ? renderMail : location.origin;
  window.AITHER_BACKEND_URL = backend;

  window.fetch = (input, init) => originalFetch(input, init);
})();
