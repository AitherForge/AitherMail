/* AitherMail Firebase sync. Configure window.AITHER_FIREBASE_CONFIG in index.html. */
(function(){
  const CONFIG=window.AITHER_FIREBASE_CONFIG; let db=null,userKey='';
  const sdk='https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js',fsdk='https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';
  async function load(){if(!CONFIG?.apiKey||!CONFIG?.projectId)return false;const[{initializeApp},f]=await Promise.all([import(sdk),import(fsdk)]);const app=initializeApp(CONFIG,'aither-mail');db=f.getFirestore(app);return true}
  function key(email){return String(email||'').trim().toLowerCase().replace(/[^a-z0-9._%+-]/g,'_').slice(0,160)}
  async function setUser(email){userKey=key(email);if(!db)await load();return !!(db&&userKey)}
  async function save(path,data,email){if(!(await setUser(email||window.aitherUser?.email)))return false;const{doc,setDoc}=await import(fsdk);await setDoc(doc(db,'aitherMailUsers',userKey,path),data,{merge:true});return true}
  async function get(path,email){if(!(await setUser(email||window.aitherUser?.email)))return null;const{doc,getDoc}=await import(fsdk);const s=await getDoc(doc(db,'aitherMailUsers',userKey,path));return s.exists()?s.data():null}
  window.AitherFirebase={ready:()=>!!db,setUser,saveDraft:d=>save('drafts/default',{...d,updatedAt:Date.now()}),loadDraft:()=>get('drafts/default'),clearDraft:async()=>{if(!(await setUser(window.aitherUser?.email)))return false;const{doc,deleteDoc}=await import(fsdk);await deleteDoc(doc(db,'aitherMailUsers',userKey,'drafts','default'));return true},saveSettings:p=>save('settings/preferences',{...p,updatedAt:Date.now()}),loadSettings:()=>get('settings/preferences'),saveVerified:v=>save('account/status',{verified:!!v,updatedAt:Date.now()})};
})();
