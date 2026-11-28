const {test,before,after}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const {initializeTestEnvironment,assertSucceeds,assertFails}=require('@firebase/rules-unit-testing');const {doc,setDoc,getDoc,deleteDoc,serverTimestamp}=require('firebase/firestore');
const rules=fs.readFileSync('firestore.rules','utf8'),owner=rules.match(/request.auth.uid == '([^']+)'/)[1];let env;
before(async()=>{env=await initializeTestEnvironment({projectId:'demo-appcore',firestore:{rules}})});after(async()=>env?.cleanup());
test('pilot release fixture cannot modify production or be forged by anonymous clients',async()=>{
 const a=env.authenticatedContext(owner).firestore(),g=env.unauthenticatedContext().firestore(),r=db=>doc(db,'pilotReleases','exmore'),v={appId:'exmore',version:'PILOT-ONLY',code:2100000000,url:'https://appcore-2026.web.app/',notes:'Synthetic fixture; not an APK or real release',mandatory:false,publishedAt:serverTimestamp()};
 await assertFails(setDoc(r(g),v));await assertFails(setDoc(r(a),{...v,url:'https://example.org/file.apk'}));await assertSucceeds(setDoc(r(a),v));
 const snap=await assertSucceeds(getDoc(r(g)));assert.equal(snap.data().version,'PILOT-ONLY');
 const prod=await assertSucceeds(getDoc(doc(a,'publishedReleases','exmore')));assert.equal(prod.exists(),false);
 await assertFails(deleteDoc(r(g)));await assertSucceeds(deleteDoc(r(a)));assert.equal((await assertSucceeds(getDoc(r(g)))).exists(),false);
});
