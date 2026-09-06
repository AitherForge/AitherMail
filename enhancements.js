/* AitherMail UI enhancements — no API keys, no backend changes. */
(()=>{
  const KEY='aither_mail_preferences';
  const prefs=Object.assign({theme:'system',density:'comfortable',autoRefresh:true},JSON.parse(localStorage.getItem(KEY)||'{}'));
  const save=()=>localStorage.setItem(KEY,JSON.stringify(prefs));
  const apply=()=>{
    document.documentElement.dataset.theme=prefs.theme;
    document.documentElement.dataset.density=prefs.density;
  };
  apply();

  function settings(){
    if(document.querySelector('.settings-modal')) return;
    const m=document.createElement('div');m.className='modal settings-modal';
    m.innerHTML=`<section class="settingsbox"><header><div><b>Aither Mail</b><small>Settings</small></div><button class="settings-close">×</button></header>
      <div class="settingsbody">
        <label>Appearance<select id="amTheme"><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select></label>
        <label>Message density<select id="amDensity"><option value="comfortable">Comfortable</option><option value="compact">Compact</option></select></label>
        <label class="switchrow"><span>Automatic refresh <small>Refresh the inbox every 5 seconds</small></span><input id="amRefresh" type="checkbox"></label>
        <div class="settingsabout"><strong>Aither Mail</strong><span>Webmail workspace · v5</span><span>Google OAuth/API integration can be connected without putting a secret key in this website.</span></div>
      </div><footer><button class="secondary settings-close">Done</button></footer></section>`;
    document.body.appendChild(m);
    m.querySelector('#amTheme').value=prefs.theme;m.querySelector('#amDensity').value=prefs.density;m.querySelector('#amRefresh').checked=prefs.autoRefresh;
    m.querySelector('#amTheme').onchange=e=>{prefs.theme=e.target.value;save();apply()};
    m.querySelector('#amDensity').onchange=e=>{prefs.density=e.target.value;save();apply()};
    m.querySelector('#amRefresh').onchange=e=>{prefs.autoRefresh=e.target.checked;save();window.dispatchEvent(new CustomEvent('aither:refresh-setting'))};
    m.querySelectorAll('.settings-close').forEach(b=>b.onclick=()=>m.remove());
  }

  function enhance(){
    const settingsBtn=[...document.querySelectorAll('button')].find(b=>b.textContent.trim().includes('Settings'));
    if(settingsBtn && !settingsBtn.dataset.enhanced){settingsBtn.dataset.enhanced='1';settingsBtn.onclick=settings}
    if(!document.querySelector('.mailapp')) return;
    document.querySelector('.brand')?.setAttribute('title','Aither Mail');
    if(!document.querySelector('.help-chip')){
      const h=document.createElement('button');h.className='help-chip';h.textContent='⌘ /';h.title='Keyboard shortcuts';
      h.onclick=()=>{if(window.toast)toast('Shortcuts: C = compose · / = search · Esc = close')};
      document.querySelector('.header')?.appendChild(h);
    }
  }
  new MutationObserver(enhance).observe(document.body,{childList:true,subtree:true});
  setInterval(enhance,1000);
  window.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key===','){e.preventDefault();settings()}});
})();
