/* AitherMail Firebase sync
 * Requires a Firebase web config in window.AITHER_FIREBASE_CONFIG.
 * Firestore is used for drafts/preferences and the Aither verification state.
 * The verification state is informational only; the AitherBackend remains the
 * source of truth for authentication and email verification.
 */
(function(){
  const CONFIG=window.AITHER_FIREBASE_CONFIG;
  let db=null, userKey='';
  const sdk='https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js';
  const fsdk='https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';
  async function load(){
    if(!CONFIG) return false;
    const [{initializeApp}, firestore]=await Promise.all([import(sdk),import(fsdk)]);
    const app=initializeApp(CONFIG,'aither-mail');
    db=firestore.getFirestore(app);
    return true;
  }
  function key(){return String(window.aitherUser?.email||'').trim().toLowerCase().replace(/[^a-z0-9._%+-]/g,'_').slice(0,160)}
  async function setUser(){userKey=key();if(!db)await load();return !!(db&&userKey)}
  async function save(path,data){
    if(!(await setUser()))return false;
    const {doc,setDoc}=await import(fsdk);
    await setDoc(doc(db,'aitherMailUsers',userKey,path),data,{merge:true});
    return true;
  }
  async function get(path){
    if(!(await setUser()))return null;
    const {doc,getDoc}=await import(fsdk);
    const s=await getDoc(doc(db,'aitherMailUsers',userKey,path));
    return s.exists()?s.data():null;
  }
  window.AitherFirebase={
    ready:()=>!!db,
    saveDraft:async d=>save('drafts/default', {...d,updatedAt:Date.now()}),
    loadDraft:async()=>get('drafts/default'),
    clearDraft:async()=>{if(!(await setUser()))return false;const {doc,deleteDoc}=await import(fsdk);await deleteDoc(doc(db,'aitherMailUsers',userKey,'drafts','default'));return true},
    saveSettings:async p=>save('settings/preferences',{...p,updatedAt:Date.now()}),
    loadSettings:async()=>get('settings/preferences'),
    saveVerified:async verified=>save('account/status',{verified:!!verified,updatedAt:Date.now()})
  };
})();
