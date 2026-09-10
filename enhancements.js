/* AitherMail Gmail-style UI enhancements. */
(()=>{
  const KEY='aither_mail_preferences';
  let prefs={theme:'system',density:'comfortable',autoRefresh:true};
  try{prefs=Object.assign(prefs,JSON.parse(localStorage.getItem(KEY)||'{}'));}catch{}
  const save=()=>localStorage.setItem(KEY,JSON.stringify(prefs));
  const apply=()=>{document.documentElement.dataset.theme=prefs.theme;document.documentElement.dataset.density=prefs.density};
  apply();
  const settingsIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="m19 13 .1-1-.1-1-2-1.5 1-2-2-2-2 1a8 8 0 0 0-2-.8L11.7 3H9l-.3 3.2a8 8 0 0 0-2 1l-2-1-2 2 1 2a8 8 0 0 0 0 2l-1 2 2 2 2-1a8 8 0 0 0 2 1l.3 3.2h2.7l.3-3.2a8 8 0 0 0 2-.9l2 1 2-2-1-2z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>';
  function settings(){
    if(window.AitherMailSettings?.open){window.AitherMailSettings.open();return;}
    if(document.querySelector('.settings-modal'))return;
    const m=document.createElement('div');m.className='modal settings-modal';
    m.innerHTML=`<section class="settingsbox"><header><div><b>Aither Mail</b><small>Settings</small></div><button class="settings-close" aria-label="Close settings">×</button></header><div class="settingsbody"><label>Appearance<select id="amTheme"><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select></label><label>Message density<select id="amDensity"><option value="comfortable">Comfortable</option><option value="compact">Compact</option></select></label><label class="switchrow"><span>Automatic refresh<small>Refresh the inbox every 5 seconds</small></span><input id="amRefresh" type="checkbox"></label></div><footer><button class="secondary settings-close">Done</button></footer></section>`;
    document.body.appendChild(m);m.querySelector('#amTheme').value=prefs.theme;m.querySelector('#amDensity').value=prefs.density;m.querySelector('#amRefresh').checked=prefs.autoRefresh;
    m.querySelector('#amTheme').onchange=e=>{prefs.theme=e.target.value;save();apply()};m.querySelector('#amDensity').onchange=e=>{prefs.density=e.target.value;save();apply()};m.querySelector('#amRefresh').onchange=e=>{prefs.autoRefresh=e.target.checked;save()};m.querySelectorAll('.settings-close').forEach(b=>b.onclick=()=>m.remove());
  }
  function addButton(){
    const app=document.querySelector('.mailapp');
    if(!app||document.getElementById('aither-gmail-settings'))return;
    const header=document.querySelector('.header')||app.querySelector('header')||app.firstElementChild;
    if(!header)return;
    const b=document.createElement('button');b.id='aither-gmail-settings';b.type='button';b.className='aither-settings-button';b.setAttribute('aria-label','Open AitherMail Settings');b.innerHTML=settingsIcon+'<span>Settings</span>';b.onclick=settings;
    header.appendChild(b);
  }
  function enhance(){
    addButton();
    document.querySelectorAll('button').forEach(b=>{if(/settings/i.test(b.textContent)&&!b.dataset.enhanced){b.dataset.enhanced='1';b.onclick=settings}});
    document.querySelector('.brand')?.setAttribute('title','Aither Mail');
  }
  new MutationObserver(enhance).observe(document.body,{childList:true,subtree:true});
  setInterval(enhance,1000);
  window.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key===','){e.preventDefault();settings()}});
})();
