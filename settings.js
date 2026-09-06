/* AitherMail settings — non-blocking settings panel with local account cache and Force Reset. */
(function () {
  const USER_KEY = 'aither_mail_user';
  const DRAFT_KEY = 'aitherMailDraft';
  const SESSION_KEY = 'aither_session_token';

  function safeUser(user) {
    if (!user) return null;
    return { id: user.id ?? null, name: user.name ?? '', email: user.email ?? '', email_verified: !!user.email_verified };
  }

  function cacheUser(user) {
    const clean = safeUser(user);
    if (clean) localStorage.setItem(USER_KEY, JSON.stringify(clean));
    return clean;
  }

  function readUser() {
    try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); } catch { return null; }
  }

  function escapeHtml(v) {
    return String(v ?? '').replace(/[&<>\"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '\"':'&quot;', "'":'&#39;' }[c]));
  }

  function panel() {
    let p = document.getElementById('aitherMailSettings');
    if (p) return p;
    p = document.createElement('aside');
    p.id = 'aitherMailSettings';
    p.setAttribute('aria-hidden', 'true');
    p.innerHTML = `
      <div class="ams-backdrop" data-close-settings></div>
      <section class="ams-panel" role="dialog" aria-label="AitherMail Settings">
        <header><div><strong>Settings</strong><small>AitherMail</small></div><button class="ams-close" data-close-settings aria-label="Close settings">×</button></header>
        <div class="ams-content">
          <section class="ams-card"><h3>Account</h3><div id="amsAccount"></div><button id="amsSignOut" class="ams-secondary">Sign out</button></section>
          <section class="ams-card ams-danger"><h3>Reset</h3><p>Clear this app's saved local data and reload. Your server account is not deleted.</p><button id="amsReset" class="ams-reset">Force Reset</button></section>
        </div>
      </section>`;
    document.body.appendChild(p);
    p.querySelectorAll('[data-close-settings]').forEach(x => x.addEventListener('click', close));
    p.querySelector('#amsReset').addEventListener('click', forceReset);
    p.querySelector('#amsSignOut').addEventListener('click', () => window.logout?.());
    return p;
  }

  function open() {
    const p = panel();
    const user = readUser() || window.aitherUser;
    const a = p.querySelector('#amsAccount');
    a.innerHTML = user
      ? `<strong>${escapeHtml(user.name || 'Aither User')}</strong><span>${escapeHtml(user.email || '')}</span><small>${user.email_verified ? 'Email verified' : 'Account'}</small>`
      : '<span>No cached account information.</span>';
    p.classList.add('open'); p.setAttribute('aria-hidden', 'false');
  }

  function close() {
    const p = document.getElementById('aitherMailSettings');
    if (p) { p.classList.remove('open'); p.setAttribute('aria-hidden', 'true'); }
  }

  function forceReset() {
    if (!confirm('Force Reset AitherMail? This clears saved local app data, including drafts, and reloads the app. Your server account will not be deleted.')) return;
    const remove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k === USER_KEY || k === DRAFT_KEY || k === SESSION_KEY || k.startsWith('aitherMail'))) remove.push(k);
    }
    remove.forEach(k => localStorage.removeItem(k));
    sessionStorage.clear();
    location.reload();
  }

  window.AitherMailSettings = { open, close, forceReset, cacheUser };
  window.showSettings = open;
})();
