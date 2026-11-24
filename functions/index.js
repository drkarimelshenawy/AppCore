"use strict";
const {onCall,HttpsError}=require("firebase-functions/v2/https");
const {initializeApp}=require("firebase-admin/app");
const {getFirestore,FieldValue}=require("firebase-admin/firestore");
initializeApp();
const db=getFirestore();
const owner="bnPCGBPKIcT0zbMlOcd6Z6ttGr22";
exports.publishRelease=onCall(async request=>{
 if(request.auth?.uid!==owner)throw new HttpsError("permission-denied","Owner required");
 const {appId,draftId,confirm}=request.data||{};
 if(typeof appId!=="string"||!/^[a-z0-9][a-z0-9-]{1,49}$/.test(appId)||typeof draftId!=="string"||!/^[A-Za-z0-9]{20}$/.test(draftId)||confirm!==true)throw new HttpsError("invalid-argument","Invalid publication request");
 return db.runTransaction(async tx=>{
 const appRef=db.collection("apps").doc(appId),draftRef=db.collection("releaseDrafts").doc(draftId),latestRef=db.collection("publishedReleases").doc(appId);
 const [app,draft,latest]=await Promise.all([tx.get(appRef),tx.get(draftRef),tx.get(latestRef)]);
 if(!app.exists||!draft.exists)throw new HttpsError("not-found","App or draft missing");
 const a=app.data(),d=draft.data();
 if(!(a.modules??(["exmore","3al-tabloh"].includes(appId)?["releases"]:[])).includes("releases"))throw new HttpsError("failed-precondition","Module disabled");
 if(d.appId!==appId||d.status!=="draft")throw new HttpsError("failed-precondition","Draft unavailable");
 let url;try{url=new URL(d.url);}catch{throw new HttpsError("invalid-argument","Invalid URL");}
 if(url.protocol!=="https:"||url.username||url.password||typeof d.version!=="string"||!d.version.trim()||d.version.length>50||!Number.isSafeInteger(d.code)||d.code<1||d.code>2100000000||typeof d.mandatory!=="boolean")throw new HttpsError("invalid-argument","Invalid release");
 if(latest.exists&&latest.data().code>=d.code)throw new HttpsError("failed-precondition","Version code must increase");
 const publishedAt=FieldValue.serverTimestamp();
 tx.set(latestRef,{appId,version:d.version,code:d.code,url:url.href,notes:String(d.notes||"").slice(0,4000),mandatory:d.mandatory,publishedAt});
 tx.update(draftRef,{status:"published",publishedAt});
 tx.set(db.collection("auditLogs").doc(),{appId,action:"release.publish",draftId,actor:request.auth.uid,createdAt:publishedAt});
 return {published:true,code:d.code};
 });
});

const {getMessaging}=require("firebase-admin/messaging");
exports.sendTestNotification=onCall(async request=>{
 if(request.auth?.uid!==owner)throw new HttpsError("permission-denied","Owner required");
 const {appId,draftId,confirm}=request.data||{};
 if(typeof appId!=="string"||!/^[a-z0-9][a-z0-9-]{1,49}$/.test(appId)||typeof draftId!=="string"||!/^[A-Za-z0-9]{20}$/.test(draftId)||confirm!==true)throw new HttpsError("invalid-argument","Invalid request");
 const ref=db.collection("notificationDrafts").doc(draftId);
 const audit=db.collection("auditLogs").doc();
 const payload=await db.runTransaction(async tx=>{
 const [app,draft,target]=await Promise.all([tx.get(db.collection("apps").doc(appId)),tx.get(ref),tx.get(db.collection("notificationTestTargets").doc(appId))]);
 if(!app.exists||!draft.exists||!target.exists)throw new HttpsError("failed-precondition","Missing app, draft or registered test device");
 const d=draft.data(),a=app.data(),t=target.data();
 if(!(a.modules??(["exmore","3al-tabloh"].includes(appId)?["notifications"]:[])).includes("notifications")||d.appId!==appId||d.status!=="draft"||d.audience!=="test"||t.enabled!==true||typeof t.token!=="string"||!t.token)throw new HttpsError("failed-precondition","Test dispatch unavailable");
 if(typeof d.title!=="string"||!d.title.trim()||d.title.length>100||typeof d.body!=="string"||!d.body.trim()||d.body.length>1000)throw new HttpsError("invalid-argument","Invalid notification");
 tx.update(ref,{status:"dispatching",dispatchStartedAt:FieldValue.serverTimestamp()});
 tx.set(audit,{appId,draftId,action:"notification.test",actor:request.auth.uid,status:"dispatching",createdAt:FieldValue.serverTimestamp()});
 return {token:t.token,notification:{title:d.title,body:d.body},data:{appId,draftId}};
 });
 let messageId;
 try{messageId=await getMessaging().send(payload);}catch(e){
 const batch=db.batch();batch.update(ref,{status:"deliveryUnknown"});batch.update(audit,{status:"deliveryUnknown"});await batch.commit();
 throw new HttpsError("unknown","Delivery uncertain; automatic retry disabled");
 }
 const batch=db.batch();batch.update(ref,{status:"sent",messageId,sentAt:FieldValue.serverTimestamp()});batch.update(audit,{status:"sent",messageId});await batch.commit();
 return {sent:true,messageId};
});

exports.updateRemoteConfig=onCall(async request=>{
 if(request.auth?.uid!==owner)throw new HttpsError("permission-denied","Owner required");
 const {appId,flags,expectedRevision,confirm}=request.data||{};
 if(typeof appId!=="string"||!/^[a-z0-9][a-z0-9-]{1,49}$/.test(appId)||confirm!==true||!Number.isSafeInteger(expectedRevision)||expectedRevision<0||!flags||typeof flags!=="object"||Array.isArray(flags))throw new HttpsError("invalid-argument","Invalid configuration");
 const entries=Object.entries(flags);
 if(entries.length>50||entries.some(([k,v])=>!/^feature_[a-z][a-z0-9_]{0,48}$/.test(k)||typeof v!=="boolean"))throw new HttpsError("invalid-argument","Only boolean feature flags allowed");
 return db.runTransaction(async tx=>{
 const appRef=db.collection("apps").doc(appId),ref=db.collection("remoteConfigs").doc(appId);
 const [app,current]=await Promise.all([tx.get(appRef),tx.get(ref)]);
 if(!app.exists||!(app.data().modules??(["exmore","3al-tabloh"].includes(appId)?["remote"]:[])).includes("remote"))throw new HttpsError("failed-precondition","Remote control disabled");
 const previous=current.exists?current.data():{revision:0,flags:{}};
 if(previous.revision!==expectedRevision)throw new HttpsError("aborted","Configuration changed; reload first");
 const revision=expectedRevision+1,updatedAt=FieldValue.serverTimestamp();
 tx.set(ref,{appId,revision,flags:Object.fromEntries(entries),updatedAt});
 tx.set(db.collection("auditLogs").doc(),{appId,action:"remote.update",actor:request.auth.uid,revision,previousFlags:previous.flags,flags:Object.fromEntries(entries),createdAt:updatedAt});
 return {revision};
 });
});
exports.getRemoteConfig=onCall(async request=>{
 if(request.auth?.uid!==owner)throw new HttpsError("permission-denied","Owner required");
 const {appId}=request.data||{};
 if(typeof appId!=="string"||!/^[a-z0-9][a-z0-9-]{1,49}$/.test(appId))throw new HttpsError("invalid-argument","Invalid app");
 const app=await db.collection("apps").doc(appId).get();
 if(!app.exists)throw new HttpsError("not-found","App missing");
 const snap=await db.collection("remoteConfigs").doc(appId).get();
 return snap.exists?{revision:snap.data().revision,flags:snap.data().flags}:{revision:0,flags:{}};
});

exports.getAnalyticsSummary=onCall(async request=>{
 if(request.auth?.uid!==owner)throw new HttpsError("permission-denied","Owner required");
 const {appId,days=30}=request.data||{};
 if(typeof appId!=="string"||!/^[a-z0-9][a-z0-9-]{1,49}$/.test(appId)||!Number.isInteger(days)||days<1||days>90)throw new HttpsError("invalid-argument","Invalid analytics query");
 const app=await db.collection("apps").doc(appId).get();
 if(!app.exists||!(app.data().modules??(["exmore","3al-tabloh"].includes(appId)?["analytics"]:[])).includes("analytics"))throw new HttpsError("failed-precondition","Analytics disabled");
 const end=new Date();end.setUTCHours(0,0,0,0);
 const start=new Date(end.getTime()-(days-1)*86400000);
 const dateKey=d=>d.toISOString().slice(0,10);
 const snap=await db.collection("analyticsDaily").doc(appId).collection("days").where("__name__",">=",dateKey(start)).where("__name__","<=",dateKey(end)).orderBy("__name__").get();
 const count=v=>Number.isSafeInteger(v)&&v>=0?v:null;
 const rows=snap.docs.map(doc=>{const d=doc.data();return {date:doc.id,activeDevices:count(d.activeDevices),sessions:count(d.sessions),crashes:count(d.crashes)};});
 return {appId,from:dateKey(start),to:dateKey(end),timezone:"UTC",status:rows.length?"partial-or-available":"no-data",daysReported:rows.length,rows};
});

exports.getCrashSummary=onCall(async request=>{
 if(request.auth?.uid!==owner)throw new HttpsError("permission-denied","Owner required");
 const {appId}=request.data||{};
 if(typeof appId!=="string"||!/^[a-z0-9][a-z0-9-]{1,49}$/.test(appId))throw new HttpsError("invalid-argument","Invalid app");
 const app=await db.collection("apps").doc(appId).get();
 if(!app.exists||!(app.data().modules??(["exmore","3al-tabloh"].includes(appId)?["crashes"]:[])).includes("crashes"))throw new HttpsError("failed-precondition","Crash monitoring disabled");
 const snap=await db.collection("crashSummaries").doc(appId).collection("issues").orderBy("lastSeen","desc").limit(100).get();
 return {appId,status:snap.empty?"no-data":"available",issues:snap.docs.map(s=>{const d=s.data();return {id:s.id,version:typeof d.version==="string"?d.version.slice(0,50):null,category:["fatal","nonfatal","anr"].includes(d.category)?d.category:"unknown",count:Number.isSafeInteger(d.count)&&d.count>=0?d.count:null,lastSeen:d.lastSeen?.toMillis?.()??null};})};
});
exports.getAuditLog=onCall(async request=>{
 if(request.auth?.uid!==owner)throw new HttpsError("permission-denied","Owner required");
 const {appId}=request.data||{};
 if(typeof appId!=="string"||!/^[a-z0-9][a-z0-9-]{1,49}$/.test(appId))throw new HttpsError("invalid-argument","Invalid app");
 const snap=await db.collection("auditLogs").where("appId","==",appId).orderBy("createdAt","desc").limit(100).get();
 return {entries:snap.docs.map(s=>{const d=s.data();return {id:s.id,action:d.action,status:d.status??null,revision:d.revision??null,createdAt:d.createdAt?.toMillis?.()??null};})};
});
