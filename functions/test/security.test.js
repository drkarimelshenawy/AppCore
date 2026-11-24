const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const path=require("node:path");
const endpoints={};
class HttpsError extends Error{constructor(code,message){super(message);this.code=code;}}
let reads=0;
const db={collection(){reads++;throw new Error("Unexpected database access");}};
const sandbox={exports:endpoints,require(name){
 if(name==="firebase-functions/v2/https")return {onCall:f=>f,HttpsError};
 if(name==="firebase-admin/app")return {initializeApp(){}};
 if(name==="firebase-admin/firestore")return {getFirestore:()=>db,FieldValue:{}};
 if(name==="firebase-admin/messaging")return {getMessaging(){throw new Error("Unexpected messaging");}};
 throw new Error(name);
},URL};
const source=fs.readFileSync(path.join(__dirname,"../index.js"),"utf8");
vm.runInNewContext(source,sandbox);
const owner=source.match(/const owner="([^"]+)"/)[1];
for(const [name,fn] of Object.entries(endpoints)){
 test(name+" rejects unauthenticated callers",async()=>{await assert.rejects(fn({data:{}}),{code:"permission-denied"});});
 test(name+" rejects non-owner callers",async()=>{await assert.rejects(fn({auth:{uid:"other"},data:{}}),{code:"permission-denied"});});
 test(name+" rejects malformed owner request",async()=>{await assert.rejects(fn({auth:{uid:owner},data:{}}),{code:"invalid-argument"});});
}
test("rejected requests never access database",()=>assert.equal(reads,0));
