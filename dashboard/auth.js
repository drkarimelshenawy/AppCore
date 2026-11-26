import {identityMetadata,canonicalProjectId} from './identity.mjs';
import {normalizeConfig,configId} from './config-contract.mjs';
import {createGatewayClient} from './gateway-client.mjs';
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
const app = initializeApp({apiKey:"AIzaSyBWiaz4dP6aaJFlFxD7mj3J3CPaFaYJyM0",authDomain:"appcore-2026.web.app",projectId:"appcore-2026",storageBucket:"appcore-2026.firebasestorage.app",messagingSenderId:"316863421809",appId:"1:316863421809:web:a57802628c500a9a4f2ad0"});
import { getFirestore, collection, getDocs, doc, setDoc, serverTimestamp, runTransaction, query, where, orderBy, limit, documentId } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import {getFunctions,httpsCallable} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-functions.js";
const functions=getFunctions(app);
window.appcoreCall=async(name,data)=>appcoreOperations(name,data);
const auth = getAuth(app);
const db = getFirestore(app);
const owner = "bnPCGBPKIcT0zbMlOcd6Z6ttGr22";
let generation = 0;
let ready = false;
const allowedModules = new Set(['releases','notifications','analytics','crashes','remote','alerts','web','content','database']);
window.appcoreCreateApp = async (id,name) => {
 if (!ready || auth.currentUser?.uid !== owner) throw new Error('Unauthorized');
 if (!/^[a-z0-9][a-z0-9-]{1,49}$/.test(id) || typeof name !== 'string' || !name.trim() || name.length>100) throw new Error('Invalid app');
 if (canonicalProjectId(id)!==id || ['exmore','altabloh','appcore'].includes(id)) throw new Error('Reserved project identity');
 const ticket=generation;
 await runTransaction(db,async tx=>{const ref=doc(db,'apps',id);if((await tx.get(ref)).exists()) throw new Error('App already exists');tx.set(ref,{...identityMetadata(id),name:name.trim(),connected:false,modules:[],createdAt:serverTimestamp()});});
 if(ticket===generation) await connect(auth.currentUser,ticket);
};
window.appcoreSaveModules = async (id, modules) => {
 if (!ready || auth.currentUser?.uid !== owner) throw new Error('Unauthorized');
 if (!/^[a-z0-9][a-z0-9-]{1,49}$/.test(id) || !Array.isArray(modules) || modules.some(m=>!allowedModules.has(m))) throw new Error('Invalid configuration');
 const ticket = generation;
 await runTransaction(db,async tx=>{const ref=doc(db,'apps',id);if(!(await tx.get(ref)).exists())throw new Error('App missing');tx.update(ref,{modules:[...new Set(modules)],updatedAt:serverTimestamp()});});
 if(ticket===generation) await connect(auth.currentUser,ticket);
};
async function connect(user, ticket) {
 if (!user || user.uid !== owner) return;
 const ref = collection(db,"apps");
 let snapshot = await getDocs(ref);
 if (ticket !== generation) return;
 const missing=[["exmore","ExMore"],["3al-tabloh","ع التابلوه"]].filter(([id])=>!snapshot.docs.some(d=>d.id===id));
 for(const [id,name] of missing){
  if(ticket!==generation)return;
  await runTransaction(db,async tx=>{const target=doc(ref,id);if(!(await tx.get(target)).exists())tx.set(target,{...identityMetadata(id),name,connected:false,createdAt:serverTimestamp()});});
 }
 if(missing.length)snapshot=await getDocs(ref);
 for(const d of snapshot.docs){
  if(ticket!==generation)return;
  const meta=identityMetadata(d.id);
  if(Object.entries(meta).some(([k,v])=>JSON.stringify(d.data()[k])!==JSON.stringify(v))){
   await runTransaction(db,async tx=>{const current=await tx.get(d.ref);if(ticket!==generation||auth.currentUser?.uid!==owner||!current.exists())throw Error('Session or app unavailable');tx.update(d.ref,meta);});
  }
 }
 snapshot=await getDocs(ref);
 if(ticket !== generation) return;
 ready = true;
 document.querySelector("#notice").textContent = "متصل بقاعدة البيانات — نشر التحديثات وإرسال الإشعارات غير مفعّلين بعد.";
 status.textContent = "تم التحقق من صلاحيات الإدارة والاتصال بقاعدة البيانات.";
 window.dispatchEvent(new CustomEvent("appcore-data",{detail:{connected:true,apps:snapshot.docs.map(d=>({...d.data(),...identityMetadata(d.id),id:d.id}))}}));
}

const button = document.querySelector("#login"), status = document.querySelector("#auth-status");
const report = (stage, e) => { console.error("AppCore auth", stage, e); status.textContent = "تعذر تسجيل الدخول (" + stage + "): " + (e.code || e.message || "unknown"); };
onAuthStateChanged(auth, user => {
 ready = false;
 const ticket = ++generation;
 window.dispatchEvent(new CustomEvent("appcore-data",{detail:{connected:false,apps:[]}}));
 document.querySelector("#notice").textContent = "غير متصل بقاعدة البيانات — الإرسال والنشر غير مفعّلين.";
 button.disabled = false;
 button.textContent = user ? "تسجيل الخروج" : "الدخول بحساب Google";
 status.textContent = user ? (user.uid === owner ? "جارٍ التحقق من قاعدة البيانات..." : "هذا الحساب غير مصرح له بالإدارة.") : "سجل الدخول لبدء إعداد حساب الإدارة.";
 if(user?.uid === owner) connect(user,ticket).catch(e=>{if(ticket===generation) report("Firestore",e);});
 button.onclick = async () => { try { if(user) await signOut(auth); else await signInWithPopup(auth,new GoogleAuthProvider()); } catch(e){report("Google", e); } };
}, e => report("initialization", e));

window.appcoreDrafts = async (id,kind,data,draftId) => {
 if(!ready || auth.currentUser?.uid!==owner) throw new Error("Unauthorized");
 const types={releases:"releaseDrafts",notifications:"notificationDrafts"};
 if(!Object.hasOwn(types,kind)||!/^[a-z0-9][a-z0-9-]{1,49}$/.test(id)) throw new Error("Invalid request");
 if(draftId!==undefined && !/^[A-Za-z0-9]{20}$/.test(draftId)) throw new Error("Invalid draft ID");
 if(data===null){await runTransaction(db,async tx=>{const ref=doc(db,types[kind],draftId);const old=await tx.get(ref);if(!old.exists()||old.data().appId!==id||old.data().status!=="draft")throw new Error("Draft unavailable");tx.delete(ref);});return;}
 const snap=await getDocs(collection(db,types[kind]));
 if(data===undefined) return snap.docs.filter(d=>d.data().appId===id).map(d=>({id:d.id,...d.data()}));
 const a=await getDocs(collection(db,"apps"));
 const app=a.docs.find(d=>d.id===id);
 const defaults=["releases","notifications","analytics","crashes","remote","alerts"];
 if(!app || !(app.data().modules ?? (["exmore","3al-tabloh"].includes(id)?defaults:[])).includes(kind)) throw new Error("Module disabled");
 let payload;
 if(kind==="releases"){
 const version=String(data.version||"").trim(),code=Number(data.code),url=new URL(data.url);
 if(!version||version.length>50||!Number.isSafeInteger(code)||code<1||code>2100000000||url.protocol!=="https:"||url.username||url.password) throw new Error("Invalid release");
 payload={version,code,url:url.href,notes:String(data.notes||"").slice(0,4000),mandatory:data.mandatory===true};
 }else{
 const title=String(data.title||"").trim(),body=String(data.body||"").trim();
 if(!title||title.length>100||!body||body.length>1000) throw new Error("Invalid notification");
 payload={title,body,audience:"test"};
 }
 if(!ready||auth.currentUser?.uid!==owner) throw new Error("Unauthorized");
 if(draftId){await runTransaction(db,async tx=>{const ref=doc(db,types[kind],draftId);const old=await tx.get(ref);if(!old.exists()||old.data().appId!==id||old.data().status!=="draft")throw new Error("Draft unavailable");tx.update(ref,{...payload,updatedAt:serverTimestamp()});});}else await setDoc(doc(collection(db,types[kind])),{...payload,appId:id,status:"draft",createdAt:serverTimestamp()});
};

 // Explicit diagnostic: never marks an application connected merely because its document exists.
window.appcoreCheckGateway=async(id)=>{
 const user=auth.currentUser,ticket=generation;
 if(!ready||user?.uid!==owner)throw new Error("Unauthorized");
 const client=createGatewayClient({baseUrl:"https://appcore-poc.dr-karimelshenawy.workers.dev",getToken:async()=>{const token=await user.getIdToken();if(ticket!==generation||auth.currentUser!==user)throw new Error("Session changed");return token;}});
 await client.readApp(id);
 if(ticket!==generation||auth.currentUser!==user)throw new Error("Session changed");
 return {ok:true,appId:id};
};

window.appcoreConfigDraft=async(id,platform,input,revision)=>{
 if(!ready||auth.currentUser?.uid!==owner)throw Error('Unauthorized');
 const ticket=generation,ref=doc(db,'configDrafts',configId(id,platform));
 if(input===undefined){return runTransaction(db,async tx=>{const d=await tx.get(ref);return d.exists()?d.data():{revision:0,config:normalizeConfig({})};});}
 const config=normalizeConfig(input);
 return runTransaction(db,async tx=>{const app=await tx.get(doc(db,'apps',id)),old=await tx.get(ref);if(ticket!==generation||!ready||auth.currentUser?.uid!==owner||!app.exists())throw Error('Session or app unavailable');const current=old.exists()?old.data().revision:0;if(current!==revision)throw Error('Revision conflict');tx.set(ref,{appId:id,platform,revision:current+1,config,updatedAt:serverTimestamp()});return {revision:current+1,config};});
};

async function appcoreOperations(name,data){
 const user=auth.currentUser,ticket=generation,id=data?.appId;
 if(!ready||user?.uid!==owner||!/^[a-z0-9][a-z0-9-]{1,49}$/.test(id))throw Error('Unauthorized or invalid app');
 const app=await runTransaction(db,tx=>tx.get(doc(db,'apps',id)));
 if(!app.exists()||ticket!==generation)throw Error('App unavailable');
 const defaults=['releases','notifications','analytics','crashes','remote','alerts',...(id==='3al-tabloh'?['web','content','database']:[])];
 const modules=app.data().modules??defaults;
 if(name==='publishRelease'){
  if(data.confirm!==true||!/^[A-Za-z0-9]{20}$/.test(data.draftId)||!(app.data().modules??defaults).includes('releases'))throw Error('Invalid publication');
  return runTransaction(db,async tx=>{const draft=await tx.get(doc(db,'releaseDrafts',data.draftId)),latest=await tx.get(doc(db,'publishedReleases',id));if(ticket!==generation||!draft.exists())throw Error('Unavailable');const d=draft.data();if(d.appId!==id||d.status!=='draft'||d.mandatory===true||!Number.isSafeInteger(d.code)||d.code<1||d.code>2100000000||typeof d.version!=='string'||!d.version.trim()||d.version.length>50||(latest.exists()&&latest.data().code>=d.code))throw Error('Invalid or stale release');const url=new URL(d.url);if(url.protocol!=='https:'||url.username||url.password)throw Error('Invalid URL');tx.set(doc(db,'publishedReleases',id),{appId:id,version:d.version,code:d.code,url:url.href,notes:String(d.notes||'').slice(0,4000),mandatory:false,publishedAt:serverTimestamp()});
tx.set(doc(collection(db,'controlAudit')),{
  appId:id,
  action:'release.publish',
  createdAt:serverTimestamp()
});
return {published:true,code:d.code};});
 }
 const kind=({getAnalyticsSummary:'analytics',getCrashSummary:'crashes',getAdminAlerts:'alerts',acknowledgeAdminAlert:'alerts',checkWebsite:'web',listManagedDrafts:data.kind,saveManagedDraft:data.kind})[name];
 if(name!=='getAuditLog'&&(!kind||!modules.includes(kind)))throw Error('Service disabled or not deployed');
 const rows=async q=>(await getDocs(q)).docs.map(d=>({id:d.id,...d.data()}));
 let result;
 if(name==='getAnalyticsSummary'){const end=new Date(),start=new Date(end.getTime()-29*86400000);const items=await rows(query(collection(db,'analyticsDaily',id,'days'),where(documentId(),'>=',start.toISOString().slice(0,10)),where(documentId(),'<=',end.toISOString().slice(0,10)),orderBy(documentId()),limit(30)));result={status:items.length?'available':'no-data',rows:items};}
 else if(name==='getCrashSummary'){const items=await rows(query(collection(db,'crashSummaries',id,'issues'),orderBy('lastSeen','desc'),limit(100)));result={status:items.length?'available':'no-data',issues:items};}
 else if(name==='getAuditLog')result={entries:await rows(query(collection(db,'auditLogs'),where('appId','==',id),limit(100)))};
 else if(name==='getAdminAlerts')result={alerts:await rows(query(collection(db,'adminAlerts',id,'items'),orderBy('createdAt','desc'),limit(100)))};
 else if(name==='acknowledgeAdminAlert'){if(!/^[A-Za-z0-9_-]{1,100}$/.test(data.alertId))throw Error('Invalid alert');await runTransaction(db,async tx=>{const ref=doc(db,'adminAlerts',id,'items',data.alertId),old=await tx.get(ref);if(!old.exists()||ticket!==generation)throw Error('Unavailable');if(!old.data().acknowledged)tx.update(ref,{acknowledged:true,acknowledgedAt:serverTimestamp()});});result={acknowledged:true};}
 else if(name==='checkWebsite'){if(id!=='3al-tabloh')throw Error('Website not configured');const token=await user.getIdToken();if(ticket!==generation)throw Error('Session changed');const response=await fetch('https://appcore-poc.dr-karimelshenawy.workers.dev/api/apps/altabloh/website',{headers:{Authorization:'Bearer '+token},redirect:'error',cache:'no-store'});if(!response.ok)throw Error('Gateway HTTP '+response.status);result=await response.json();}
 else if(['listManagedDrafts','saveManagedDraft'].includes(name)){if(id!=='3al-tabloh'||!['content','database'].includes(data.kind))throw Error('Unsupported service');const col=collection(db,'managedDrafts',id,data.kind);if(name==='listManagedDrafts')result={items:await rows(query(col,orderBy('updatedAt','desc'),limit(100)))};else{const {id:key,title,body,expectedRevision}=data;if(!/^[a-z0-9][a-z0-9_-]{0,79}$/.test(key)||typeof title!=='string'||!title.trim()||title.length>200||typeof body!=='string'||body.length>30000||!Number.isSafeInteger(expectedRevision)||expectedRevision<0)throw Error('Invalid draft');if(data.kind==='database'){const c=JSON.parse(body);if(!c||!['vehicle','maintenance'].includes(c.type)||typeof c.source!=='string'||!c.source.trim()||!['verified','estimated','unverified'].includes(c.verification))throw Error('Invalid catalog');}result=await runTransaction(db,async tx=>{const ref=doc(col,key),old=await tx.get(ref);if(ticket!==generation||(old.exists()?old.data().revision:0)!==expectedRevision)throw Error('Revision conflict');tx.set(ref,{title:title.trim(),body,revision:expectedRevision+1,status:'draft',updatedAt:serverTimestamp()});return {revision:expectedRevision+1,status:'draft'};});}}
 else throw Error('Operation not deployed');
 if(ticket!==generation||auth.currentUser!==user)throw Error('Session changed');return result;
}

// Explicit owner publication; local functionality is never gated by this record.
window.appcorePublishConfig=async(id,platform,expectedRevision,confirm)=>{
 if(!ready||auth.currentUser?.uid!==owner||confirm!==true)throw Error('Unauthorized or unconfirmed');
 const {targetFor,publicConfig}=await import('./integration-v1.mjs');
 const target=targetFor(id,platform),ticket=generation;
 return runTransaction(db,async tx=>{
  const app=await tx.get(doc(db,'apps',id));
  const draft=await tx.get(doc(db,'configDrafts',configId(id,platform)));
  const ref=doc(db,'publicConfigs',target.projectId+'_'+platform),old=await tx.get(ref);
  if(ticket!==generation||auth.currentUser?.uid!==owner||!app.exists()||!(app.data().modules??['remote']).includes('remote')||!draft.exists()||draft.data().revision!==expectedRevision)throw Error('Draft changed');
  const config=normalizeConfig(draft.data().config);
  const value=publicConfig({schemaVersion:1,...target,revision:(old.exists()?old.data().revision:0)+1,expiresAt:Date.now()+23*3600000,maintenance:config.maintenance,flags:config.flags},target);

tx.set(ref,value);
tx.set(doc(collection(db,'controlAudit')),{
  appId:id,
  action:'config.publish',
  createdAt:serverTimestamp()
});
return value;

 });
};


// APPCORE_DEVICE_REGISTRY_V1
window.appcoreDevices = async (id, action, input = {}) => {
  const user = auth.currentUser;
  const ticket = generation;

  if (!ready || user?.uid !== owner)
    throw Error('Unauthorized');

  const projectId = canonicalProjectId(id);

  if (!['exmore','altabloh'].includes(projectId))
    throw Error('Unsupported application');

  const col = collection(
    db,'deviceRegistry',projectId,'devices'
  );

  function verifySession() {
    if (!ready || generation !== ticket ||
        auth.currentUser !== user)
      throw Error('Session changed');
  }

  if (action === 'list') {
    const snap = await getDocs(
      query(col,orderBy('lastSeen','desc'),limit(100))
    );

    verifySession();

    return snap.docs.map(d => ({
      id:d.id,
      ...d.data()
    }));
  }

  if (action === 'register') {
    const platform = input.platform;
    const versionCode = Number(input.versionCode);

    if (!['android','web'].includes(platform) ||
        (projectId === 'exmore' && platform !== 'android') ||
        !Number.isSafeInteger(versionCode) ||
        versionCode < 1 || versionCode > 2100000000)
      throw Error('Invalid device');

    const deviceId = crypto.randomUUID();

    verifySession();

    await setDoc(doc(col,deviceId),{
      projectId,
      platform,
      versionCode,
      source:'manual-test',
      lastSeen:serverTimestamp()
    });

    return {deviceId};
  }

  if (!/^[a-f0-9-]{36}$/.test(input.id || ''))
    throw Error('Invalid device ID');

  if (!['touch','delete'].includes(action))
    throw Error('Unsupported operation');

  return runTransaction(db,async tx => {
    const ref = doc(col,input.id);
    const old = await tx.get(ref);

    verifySession();

    if (!old.exists())
      throw Error('Device not found');

    if (action === 'touch') {
      tx.update(ref,{
        lastSeen:serverTimestamp()
      });
    } else {
      tx.delete(ref);
    }
  });
};


// APPCORE_CONTROL_V2

window.appcoreBulletin = async (id, action, input={}) => {
  const user=auth.currentUser;
  const ticket=generation;

  if(!ready || user?.uid!==owner ||
     !['exmore','3al-tabloh'].includes(id))
    throw Error('Unauthorized');

  const ref=doc(db,'publicBulletins',id);

  return runTransaction(db,async tx=>{
    const old=await tx.get(ref);
    const application=await tx.get(doc(db,'apps',id));

    if(ticket!==generation ||
       auth.currentUser!==user ||
       !application.exists())
      throw Error('Session or app unavailable');

    const previous=old.exists()?old.data():null;

    if(action==='read')return previous;

    if(input.confirm!==true)
      throw Error('Confirmation required');

    if(!['publish','revoke'].includes(action))
      throw Error('Invalid action');

    const modules=application.data().modules;

    if(action==='publish' &&
       Array.isArray(modules) &&
       !modules.includes('notifications'))
      throw Error('Notifications disabled');

    if(action==='revoke' && !previous)
      throw Error('No bulletin');

    if(input.revision!==(previous?.revision||0))
      throw Error('Revision conflict');

    const title=action==='publish'
      ?String(input.title||'').trim()
      :previous.title;

    const body=action==='publish'
      ?String(input.body||'').trim()
      :previous.body;

    if(!title || title.length>100 ||
       !body || body.length>1000)
      throw Error('Invalid bulletin');

    const value={
      appId:id,
      title,
      body,
      active:action==='publish',
      revision:(previous?.revision||0)+1,
      updatedAt:serverTimestamp()
    };

    tx.set(ref,value);

    tx.set(doc(collection(db,'controlAudit')),{
      appId:id,
      action:'bulletin.'+action,
      createdAt:serverTimestamp()
    });

    return {revision:value.revision,active:value.active};
  });
};

window.appcoreControlAudit=async(id)=>{
  const user=auth.currentUser;
  const ticket=generation;

  if(!ready || user?.uid!==owner)
    throw Error('Unauthorized');

  const snap=await getDocs(query(
    collection(db,'controlAudit'),
    orderBy('createdAt','desc'),
    limit(100)
  ));

  if(ticket!==generation || auth.currentUser!==user)
    throw Error('Session changed');

  return snap.docs.map(d=>d.data())
    .filter(d=>d.appId===id);
};

window.appcoreHealthRuns=async(action,report)=>{
 const user=auth.currentUser,ticket=generation;
 if(!ready||user?.uid!==owner)throw Error('Unauthorized');
 if(action==='save'){
  const {validateHealth}=await import('./health-contract.mjs');
  const results=validateHealth(report);
  if(ticket!==generation||auth.currentUser!==user)throw Error('Session changed');
  await setDoc(doc(collection(db,'healthRuns')),{
   createdAt:serverTimestamp(),results,failed:results.filter(r=>!r.ok).length
  });
  return;
 }
 if(action!=='list')throw Error('Invalid action');
 const snap=await getDocs(query(collection(db,'healthRuns'),orderBy('createdAt','desc'),limit(30)));
 if(ticket!==generation||auth.currentUser!==user)throw Error('Session changed');
 return snap.docs.map(d=>d.data());
};
