/* Keep the signed-in account profile locally for fast Settings rendering. Never store passwords. */
(function () {
  const KEY = 'aither_mail_user';
  function save() {
    try {
      const u = window.aitherUser;
      if (!u) return;
      localStorage.setItem(KEY, JSON.stringify({ id: u.id ?? null, name: u.name ?? '', email: u.email ?? '', email_verified: !!u.email_verified }));
    } catch {}
  }
  setInterval(save, 750);
  document.addEventListener('visibilitychange', save);
})();
