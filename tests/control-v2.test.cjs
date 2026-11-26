const {test,before,after}=require('node:test');
const fs=require('node:fs');

const {
 initializeTestEnvironment,
 assertSucceeds,
 assertFails
}=require('@firebase/rules-unit-testing');

const {
 doc,setDoc,getDoc,deleteDoc,serverTimestamp
}=require('firebase/firestore');

const rules=fs.readFileSync('firestore.rules','utf8');
const owner=rules.match(/request.auth.uid == '([^']+)'/)[1];

let env;

before(async()=>{
 env=await initializeTestEnvironment({
  projectId:'demo-appcore',
  firestore:{rules}
 });
});

after(async()=>await env?.cleanup());

const admin=()=>env.authenticatedContext(owner).firestore();
const guest=()=>env.unauthenticatedContext().firestore();

const bulletin=db=>doc(db,'publicBulletins','exmore');
const audit=db=>doc(db,'controlAudit','test-operation');

function payload(extra={}){
 return {
  appId:'exmore',
  title:'Test bulletin',
  body:'Test message',
  active:true,
  revision:1,
  updatedAt:serverTimestamp(),
  ...extra
 };
}

test('owner publishes bulletin',async()=>{
 await assertSucceeds(setDoc(bulletin(admin()),payload()));
});

test('public bulletin readable',async()=>{
 await assertSucceeds(getDoc(bulletin(guest())));
});

test('public publication denied',async()=>{
 await assertFails(setDoc(
  bulletin(guest()),payload({revision:2})
 ));
});

test('rollback denied',async()=>{
 await assertFails(setDoc(bulletin(admin()),payload()));
});

test('cross app publication denied',async()=>{
 await assertFails(setDoc(
  bulletin(admin()),
  payload({appId:'3al-tabloh',revision:2})
 ));
});

test('oversized bulletin denied',async()=>{
 await assertFails(setDoc(
  bulletin(admin()),
  payload({body:'x'.repeat(1001),revision:2})
 ));
});

test('owner revokes bulletin',async()=>{
 await assertSucceeds(setDoc(
  bulletin(admin()),
  payload({active:false,revision:2})
 ));
});

test('owner writes audit entry',async()=>{
 await assertSucceeds(setDoc(audit(admin()),{
  appId:'exmore',
  action:'bulletin.publish',
  createdAt:serverTimestamp()
 }));
});

test('public audit access denied',async()=>{
 await assertFails(getDoc(audit(guest())));
});

test('audit deletion denied',async()=>{
 await assertFails(deleteDoc(audit(admin())));
});

test('audit modification denied',async()=>{
 await assertFails(setDoc(audit(admin()),{
  appId:'exmore',
  action:'bulletin.revoke',
  createdAt:serverTimestamp()
 }));
});
