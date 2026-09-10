(()=>{
  const API='https://gmail.googleapis.com/gmail/v1/users/me';
  const state={messages:[],pageToken:'',cache:new Map(),loading:false};
  const $=s=>document.querySelector(s);
  const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const strip=s=>String(s||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
  const fmtDate=d=>{const x=new Date(d);if(Number.isNaN(x.getTime()))return '';const now=new Date();return x.toDateString()===now.toDateString()?x.toLocaleTimeString([], {hour:'numeric',minute:'2-digit'}):x.toLocaleDateString([], {month:'short',day:'numeric',year:x.getFullYear()===now.getFullYear()?undefined:'numeric'});};
  function headers(){return window.AitherGmail?.authHeaders?.()||null}
  async function gmail(path,opts={}){
    const h=headers();if(!h)throw Error('Connect your Gmail account first.');
    const r=await fetch(API+path,{...opts,headers:{Authorization:h.Authorization}});
    const t=await r.text();let d={};try{d=t?JSON.parse(t):{}}catch{}if(!r.ok)throw Error(d.error?.message||`Gmail error ${r.status}`);return d;
  }
  function dec(s){try{let x=s.replace(/-/g,'+').replace(/_/g,'/');while(x.length%4)x+='=';return decodeURIComponent(escape(atob(x)))}catch{return ''}}
  function partBody(p){if(!p)return '';if(p.body?.data)return dec(p.body.data);for(const c of (p.parts||[])){const v=partBody(c);if(v)return v}return ''}
  function findPart(p,mime){if(!p)return null;if(p.mimeType===mime&&p.body?.data)return p;for(const c of (p.parts||[])){const v=findPart(c,mime);if(v)return v}return null}
  function header(m,n){return (m.payload?.headers||[]).find(x=>x.name.toLowerCase()===n.toLowerCase())?.value||''}
  function normalize(m){const payload=m.payload||{};const html=partBody(findPart(payload,'text/html'));const plain=partBody(findPart(payload,'text/plain'))||(!html?partBody(payload):'');const labels=m.labelIds||[];return {id:m.id,threadId:m.threadId,from:header(m,'From'),to:header(m,'To'),cc:header(m,'Cc'),subject:header(m,'Subject')||'(no subject)',date:header(m,'Date')||new Date(Number(m.internalDate||Date.now())).toISOString(),text:plain,html,read:!labels.includes('UNREAD'),labels,snippet:m.snippet||strip(plain).slice(0,180),raw:m};}
  async function ensure(){if(!window.AitherGmail?.connect)throw Error('Gmail connection is still loading.');await window.AitherGmail.connect();}
  async function refreshGmail(){if(state.loading)return;state.loading=true;try{await ensure();const box=window.box||'inbox';const label=box==='sent'?'SENT':box==='trash'?'TRASH':box==='all'?null:'INBOX';let q='';if(window.search)q=window.search;let path=`/messages?maxResults=100${label?`&labelIds=${label}`:''}${q?`&q=${encodeURIComponent(q)}`:''}`;const d=await gmail(path);state.messages=[];for(const item of (d.messages||[])){let m=state.cache.get(item.id);if(!m){m=normalize(await gmail('/messages/'+encodeURIComponent(item.id)+'?format=full'));state.cache.set(item.id,m)}state.messages.push(m)}window.messages=state.messages;window.selected=null;if(typeof window.renderList==='function')window.renderList();const count=$('#inboxCount');if(count)count.textContent=box==='inbox'?(state.messages.filter(m=>!m.read).length||''):'';if(typeof window.setStatus==='function')window.setStatus(`${state.messages.length} message${state.messages.length===1?'':'s'}`)}catch(e){if(typeof window.renderListError==='function')window.renderListError(e)}finally{state.loading=false}}
  async function openGmail(id){let m=state.cache.get(id);if(!m)m=normalize(await gmail('/messages/'+encodeURIComponent(id)+'?format=full'));state.cache.set(id,m);window.selected=id;if(typeof window.renderList==='function')window.renderList();const view=$('#messageView');if(!view)return;const body=m.html||('<pre style="white-space:pre-wrap;font:inherit">'+esc(m.text)+'</pre>');view.classList.add('open');view.innerHTML=`<div class="viewhead"><button class="mobile" onclick="closeMessage()">${window.icon?window.icon('back'):''}</button><div class="subjectwrap"><h1>${esc(m.subject)}</h1><p>${esc(m.from)} → ${esc(m.to)}</p><small>${esc(m.date)}</small></div><div class="viewactions"><button title="Delete" onclick="gmailTrash('${esc(id)}')">${window.icon?window.icon('trash'):''}</button><button title="Reply" onclick="compose('${esc(m.from)}','Re: ${esc(m.subject)}',${JSON.stringify(m.text)})">${window.icon?window.icon('reply'):''}</button></div></div><div class="emailbody"><iframe sandbox class="email-frame" title="Email content"></iframe></div>`;const frame=view.querySelector('iframe');frame.srcdoc=body;frame.onload=()=>{try{frame.style.height=Math.min(1200,Math.max(350,frame.contentDocument.body.scrollHeight+40))+'px'}catch{}}}
  window.gmailTrash=async id=>{try{await gmail('/messages/'+encodeURIComponent(id)+'/trash',{method:'POST'});state.cache.delete(id);window.closeMessage?.();await refreshGmail()}catch(e){window.toast?.(e.message)}};
  window.loadMoreGmail=async()=>{};
  window.refresh=refreshGmail;
  window.openMessage=openGmail;
  window.addEventListener('aither:gmail-connected',refreshGmail);
  document.addEventListener('DOMContentLoaded',()=>setTimeout(()=>refreshGmail(),250));
})();
