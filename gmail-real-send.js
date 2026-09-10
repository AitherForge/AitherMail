(()=>{
  const EMAIL_RE=/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/ig;
  const values=(root)=>[...root.querySelectorAll('input,textarea,[contenteditable="true"]')].map(el=>({el,value:('value' in el?el.value:el.textContent)||''}));
  const recipientValue=(root)=>{
    const direct=root.querySelector('#cto,[name="to"],[name="recipient"],[data-recipient-input]');
    const directValue=direct?(('value' in direct?direct.value:direct.textContent)||'').trim():'';
    if(directValue)return directValue;
    const candidates=values(root)
      .filter(x=>x.el.id!=='cc'&&x.el.id!=='cbcc'&&x.el.id!=='csubject'&&x.el.id!=='cbody')
      .map(x=>x.value.trim())
      .filter(Boolean);
    const emails=candidates.flatMap(v=>v.match(EMAIL_RE)||[]);
    if(emails.length)return [...new Set(emails)].join(', ');
    const chips=[...root.querySelectorAll('[data-email],[data-recipient],.recipient,.recipient-chip,.email-chip,.to-chip')]
      .map(el=>el.getAttribute('data-email')||el.textContent||'')
      .flatMap(v=>v.match(EMAIL_RE)||[]);
    if(chips.length)return [...new Set(chips)].join(', ');
    return '';
  };
  const sendReal=async(btn)=>{
    if(!btn||btn.dataset.sending==='1')return;
    btn.dataset.sending='1';btn.disabled=true;
    const modal=btn.closest('.modal')||document;
    const to=recipientValue(modal);
    const cc=modal.querySelector('#cc')?.value.trim()||'';
    const bcc=modal.querySelector('#cbcc')?.value.trim()||'';
    const subject=modal.querySelector('#csubject')?.value.trim()||'';
    const body=modal.querySelector('#cbody')?.value||'';
    if(!to){toast('Add a recipient');btn.disabled=false;delete btn.dataset.sending;return}
    try{
      if(!window.AitherGmail?.send)throw Error('Gmail connection is still loading. Try again.');
      await window.AitherGmail.send({to,cc,bcc,subject,body});
      localStorage.removeItem('aitherMailDraft');
      modal.remove();
      toast('Email sent from your real Gmail account');
      if(typeof refresh==='function')await refresh();
    }catch(e){
      toast('Gmail send failed: '+(e?.message||e));
      btn.disabled=false;delete btn.dataset.sending;
    }
  };
  const install=()=>{
    if(typeof window.sendMessage==='function'&&!window.sendMessage.__realGmail){
      const fn=sendReal;fn.__realGmail=true;window.sendMessage=fn;
    }
  };
  install();
  window.addEventListener('load',install,{once:true});
})();
