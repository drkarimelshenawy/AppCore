const {test,before,after}=require("node:test");
const fs=require("node:fs");
const {initializeTestEnvironment,assertSucceeds,assertFails}=require("@firebase/rules-unit-testing");
const {doc,getDoc,setDoc}=require("firebase/firestore");
let env;
const rules=fs.readFileSync("firestore.rules","utf8");
const owner=rules.match(/request.auth.uid == '([^']+)'/)[1];
before(async()=>{env=await initializeTestEnvironment({projectId:"demo-appcore",firestore:{rules}});});
after(async()=>{await env?.cleanup();});
for(const collection of ["apps","releaseDrafts","notificationDrafts"]){
 test(collection+" rejects anonymous and other accounts",async()=>{
 for(const ctx of [env.unauthenticatedContext(),env.authenticatedContext("other")]){
 const ref=doc(ctx.firestore(),collection,"sample");
 await assertFails(getDoc(ref));await assertFails(setDoc(ref,{status:"draft"}));
 }
 });
 test(collection+" permits owner draft access",async()=>{
 const ref=doc(env.authenticatedContext(owner).firestore(),collection,"sample");
 await assertSucceeds(setDoc(ref,{status:"draft",appId:"exmore",audience:"test"}));
 await assertSucceeds(getDoc(ref));
 });
}
for(const collection of ["publishedReleases","auditLogs","remoteConfigs","notificationTestTargets","managedDrafts"]){
 test(collection+" denies direct owner client writes",async()=>{
 await assertFails(setDoc(doc(env.authenticatedContext(owner).firestore(),collection,"sample"),{status:"published"}));
 });
}
