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
