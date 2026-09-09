(() => {
  const api = () => (window.AITHER_MAIL_API || location.origin).replace(/\/$/, '');
  const token = () => localStorage.getItem('aither_session_token') || '';
  const headers = () => token() ? { Authorization: `Bearer ${token()}` } : {};

  async function providerStatus() {
    const el = document.getElementById('aitherProviderStatus');
    if (!el) return;
    try {
      const r = await fetch(api() + '/api/config', { headers: headers() });
      const d = await r.json();
      el.textContent = d.resend_configured ? '● Resend' : '● Local mail';
      el.className = 'provider-status ' + (d.resend_configured ? 'resend' : 'local');
      el.title = d.resend_configured ? 'Outgoing mail is delivered through Resend' : 'Resend is not configured; local MailHog delivery is active';
    } catch (_) {
      el.textContent = '● Offline';
      el.className = 'provider-status offline';
    }
  }

  function enhanceHeader() {
    const header = document.querySelector('.header');
    if (!header || document.getElementById('aitherProviderStatus')) return;
    const status = document.createElement('span');
    status.id = 'aitherProviderStatus';
    status.className = 'provider-status';
    header.appendChild(status);
    providerStatus();
  }

  function enhanceToolbar() {
    const toolbar = document.querySelector('.toolbar');
    if (!toolbar || toolbar.querySelector('.gmail-tools')) return;
    const tools = document.createElement('div');
    tools.className = 'gmail-tools';
    tools.innerHTML = '<button type="button" title="Keyboard shortcuts" onclick="alert(\'Shortcuts: / search • C compose • R reply • G then I inbox • G then S sent • G then A all mail • Esc close\')">?</button>';
    toolbar.appendChild(tools);
  }

  let gPending = false;
  document.addEventListener('keydown', (e) => {
    if (/input|textarea|select/i.test(e.target.tagName) || e.metaKey || e.ctrlKey || e.altKey) return;
    const key = e.key.toLowerCase();
    if (key === 'g') { gPending = true; setTimeout(() => gPending = false, 900); return; }
    if (gPending) {
      gPending = false;
      if (key === 'i' && window.setBox) window.setBox('inbox');
      if (key === 's' && window.setBox) window.setBox('sent');
      if (key === 'a' && window.setBox) window.setBox('all');
      return;
    }
    if (key === 'r' && window.selected && window.messages) {
      const m = window.messages.find(x => x.id === window.selected);
      if (m && window.compose) window.compose(m.from, 'Re: ' + m.subject, window.replyBody ? window.replyBody(m) : '');
    }
  });

  const observer = new MutationObserver(() => {
    if (document.querySelector('.mailapp')) {
      enhanceHeader();
      enhanceToolbar();
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  setInterval(providerStatus, 30000);
})();
