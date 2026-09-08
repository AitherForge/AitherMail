(() => {
  const backend = (window.AITHER_BACKEND_URL || 'https://aitherbackend.onrender.com').replace(/\/$/, '');
  const originalFetch = window.fetch.bind(window);
  window.AITHER_MAIL_API = backend;
  window.fetch = (input, init) => {
    let url = typeof input === 'string' ? input : input?.url;
    if (url) {
      try {
        const u = new URL(url, location.href);
        if (u.origin === location.origin && (u.pathname.startsWith('/api/v1/') || u.pathname.startsWith('/api/v2/'))) {
          const path = u.pathname.replace('/api/v1/', '/api/mail/').replace('/api/v2/', '/api/mail/');
          u.pathname = path;
          url = u.toString();
          input = typeof input === 'string' ? url : new Request(url, input);
        }
      } catch (_) {}
    }
    return originalFetch(input, init);
  };
})();
