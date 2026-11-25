const {test,before,after}=require('node:test');
const fs=require('node:fs');
const {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails
}=require('@firebase/rules-unit-testing');

const {
  doc,setDoc,getDoc,serverTimestamp
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

const id='12345678-1234-1234-1234-123456789abc';

function ref(db,app='exmore'){
  return doc(db,'deviceRegistry',app,'devices',id);
}

function data(extra={}){
  return {
    projectId:'exmore',
    platform:'android',
    versionCode:81,
    source:'manual-test',
    lastSeen:serverTimestamp(),
    ...extra
  };
}

test('owner can register and read device',async()=>{
  const db=env.authenticatedContext(owner).firestore();
  await assertSucceeds(setDoc(ref(db),data()));
  await assertSucceeds(getDoc(ref(db)));
});

test('anonymous registration denied',async()=>{
  const db=env.unauthenticatedContext().firestore();
  await assertFails(setDoc(ref(db),data()));
});

test('non-owner registration denied',async()=>{
  const db=env.authenticatedContext('other').firestore();
  await assertFails(setDoc(ref(db),data()));
});

test('non-owner reading denied',async()=>{
  const db=env.authenticatedContext('other').firestore();
  await assertFails(getDoc(ref(db)));
});

test('cross-project registration denied',async()=>{
  const db=env.authenticatedContext(owner).firestore();
  await assertFails(setDoc(ref(db,'altabloh'),data()));
});

test('invalid version denied',async()=>{
  const db=env.authenticatedContext(owner).firestore();
  await assertFails(setDoc(ref(db),data({versionCode:-1})));
});

test('unexpected personal data denied',async()=>{
  const db=env.authenticatedContext(owner).firestore();
  await assertFails(setDoc(ref(db),data({phone:'test'})));
});
