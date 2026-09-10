(() => {
  const backend = (window.AITHER_BACKEND_URL || 'https://aitherbackendnew.onrender.com').replace(/\/$/, '');
  window.AITHER_BACKEND_URL = backend;
  window.AITHER_MAIL_API = backend;
})();
