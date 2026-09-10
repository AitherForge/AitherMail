(()=>{
  const sendReal=async(btn)=>{
    btn.disabled=true;
    const to=document.querySelector('#cto')?.value.trim()||'';
    const cc=document.querySelector('#cc')?.value.trim()||'';
    const bcc=document.querySelector('#cbcc')?.value.trim()||'';
    const subject=document.querySelector('#csubject')?.value.trim()||'';
    const body=document.querySelector('#cbody')?.value||'';
    if(!to){toast('Add a recipient');btn.disabled=false;return}
    try{
      if(!window.AitherGmail?.send)throw Error('Gmail connection is still loading. Try again.');
      await window.AitherGmail.send({to,cc,bcc,subject,body});
      localStorage.removeItem('aitherMailDraft');
      btn.closest('.modal')?.remove();
      toast('Email sent from your real Gmail account');
      if(typeof refresh==='function')await refresh();
    }catch(e){
      toast('Gmail send failed: '+(e?.message||e));
      btn.disabled=false;
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
