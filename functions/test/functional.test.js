const test=require("node:test");
const assert=require("node:assert/strict");
const vm=require("node:vm");
const fs=require("node:fs");
const source=fs.readFileSync(require("node:path").join(__dirname,"../index.js"),"utf8");
const owner=source.match(/const owner="([^"]+)"/)[1];
function setup(seed){
 const records=new Map(Object.entries(seed)), endpoints={};
 const ref=key=>({key,get:async()=>snapshot(key),collection:name=>({doc:id=>ref(key+"/"+name+"/"+id)})});
 const snapshot=key=>({exists:records.has(key),data:()=>records.get(key)});
 const db={collection:name=>({doc:(id="audit")=>ref(name+"/"+id)}),runTransaction:async fn=>{
 const writes=[];const result=await fn({get:async r=>snapshot(r.key),set:(r,d)=>writes.push(()=>records.set(r.key,d)),update:(r,d)=>writes.push(()=>records.set(r.key,{...records.get(r.key),...d}))});writes.forEach(f=>f());return result;}};
 class HttpsError extends Error{constructor(code,message){super(message);this.code=code;}}
 vm.runInNewContext(source,{exports:endpoints,URL,require:n=>({
 "firebase-functions/v2/https":{onCall:f=>f,HttpsError},"firebase-admin/app":{initializeApp(){}},
 "firebase-admin/firestore":{getFirestore:()=>db,FieldValue:{serverTimestamp:()=>123}},
 "firebase-admin/messaging":{getMessaging(){throw Error("Unexpected messaging");}}
 })[n]});
 return {records,call:(name,data)=>endpoints[name]({auth:{uid:owner},data})};
}
const id="abcdefghijklmnopqrst", appId="exmore";
const draft={appId,status:"draft",version:"1.0",code:2,url:"https://example.com/app.apk",mandatory:false};
const request={appId,draftId:id,confirm:true};
test("release publishes once and records audit",async()=>{
 const s=setup({"apps/exmore":{} ,["releaseDrafts/"+id]:draft});
 assert.equal((await s.call("publishRelease",request)).published,true);
 assert.equal(s.records.get("publishedReleases/exmore").code,2);
 assert.equal(s.records.get("releaseDrafts/"+id).status,"published");
 assert.equal(s.records.get("auditLogs/audit").action,"release.publish");
 await assert.rejects(s.call("publishRelease",request),{code:"failed-precondition"});
});
test("release rejects cross-app draft",async()=>{
 const s=setup({"apps/exmore":{},["releaseDrafts/"+id]:{...draft,appId:"3al-tabloh"}});
 await assert.rejects(s.call("publishRelease",request),{code:"failed-precondition"});
 assert.equal(s.records.has("publishedReleases/exmore"),false);
});
test("release rejects non-increasing version",async()=>{
 const s=setup({"apps/exmore":{},["releaseDrafts/"+id]:draft,"publishedReleases/exmore":{code:2}});
 await assert.rejects(s.call("publishRelease",request),{code:"failed-precondition"});
});
test("release rejects insecure URL",async()=>{
 const s=setup({"apps/exmore":{},["releaseDrafts/"+id]:{...draft,url:"http://example.com"}});
 await assert.rejects(s.call("publishRelease",request),{code:"invalid-argument"});
});
test("remote flags enforce revision and boolean values",async()=>{
 const s=setup({"apps/exmore":{}});
 const data={appId,flags:{feature_test:true},expectedRevision:0,confirm:true};
 assert.equal((await s.call("updateRemoteConfig",data)).revision,1);
 await assert.rejects(s.call("updateRemoteConfig",data),{code:"aborted"});
 await assert.rejects(s.call("updateRemoteConfig",{...data,expectedRevision:1,flags:{feature_test:"true"}}),{code:"invalid-argument"});
 assert.equal(s.records.get("remoteConfigs/exmore").revision,1);
});
test("disabled release module blocks publishing",async()=>{
 const s=setup({"apps/exmore":{modules:[]},["releaseDrafts/"+id]:draft});
 await assert.rejects(s.call("publishRelease",request),{code:"failed-precondition"});
});

test("catalog rejects missing provenance",async()=>{
 const s=setup({"apps/3al-tabloh":{}});
 await assert.rejects(s.call("saveManagedDraft",{appId:"3al-tabloh",kind:"database",id:"car",title:"Car",body:'{"type":"vehicle"}',expectedRevision:0}),{code:"invalid-argument"});
});
test("catalog saves provenance and rejects stale edits",async()=>{
 const s=setup({"apps/3al-tabloh":{}});
 const data={appId:"3al-tabloh",kind:"database",id:"car",title:"Car",body:JSON.stringify({type:"vehicle",source:"Manufacturer manual",verification:"verified"}),expectedRevision:0};
 assert.equal((await s.call("saveManagedDraft",data)).revision,1);
 await assert.rejects(s.call("saveManagedDraft",data),{code:"aborted"});
});
test("ExMore cannot access vehicle catalog",async()=>{
 const s=setup({"apps/exmore":{}});
 await assert.rejects(s.call("listManagedDrafts",{appId:"exmore",kind:"database"}),{code:"invalid-argument"});
});
test("notification without registered test target is blocked",async()=>{
 const s=setup({"apps/exmore":{},["notificationDrafts/"+id]:{appId,status:"draft",audience:"test",title:"Test",body:"Test"}});
 await assert.rejects(s.call("sendTestNotification",request),{code:"failed-precondition"});
 assert.equal(s.records.get("notificationDrafts/"+id).status,"draft");
});
test("content module disabled blocks editing",async()=>{
 const s=setup({"apps/3al-tabloh":{modules:[]}});
 await assert.rejects(s.call("saveManagedDraft",{appId:"3al-tabloh",kind:"content"}),{code:"failed-precondition"});
});

test("disabled remote module blocks reading",async()=>{const s=setup({"apps/exmore":{modules:[]}});await assert.rejects(s.call("getRemoteConfig",{appId:"exmore"}),{code:"failed-precondition"});});
test("remote read returns initial revision",async()=>{const s=setup({"apps/exmore":{}});const result=await s.call("getRemoteConfig",{appId:"exmore"});assert.equal(result.revision,0);assert.equal(Object.keys(result.flags).length,0);});
