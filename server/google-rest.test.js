import {test} from "node:test";
import assert from "node:assert/strict";
import {createGoogleRest} from "./google-rest.js";
function fixture(status=200){
 const calls=[];
 const api=createGoogleRest({projectId:"appcore-2026",credentials:{getAccessToken:async()=>"synthetic"},fetchImpl:async(url,options)=>{calls.push({url,options});return new Response(JSON.stringify({ok:true}),{status});}});
 return {api,calls};
}
test("Firestore uses fixed Google endpoint and bearer authorization",async()=>{
 const {api,calls}=fixture();
 await api.getDocument("apps","exmore");
 assert.equal(calls[0].url,"https://firestore.googleapis.com/v1/projects/appcore-2026/databases/(default)/documents/apps/exmore");
 assert.equal(calls[0].options.headers.Authorization,"Bearer synthetic");
 assert.equal(calls[0].options.redirect,"manual");
 assert.throws(()=>api.getDocument("apps","../secret"));
});
test("FCM validation cannot send a real notification",async()=>{
 const {api,calls}=fixture();
 await api.validateTestNotification("exmore","Test","Test body");
 assert.deepEqual(JSON.parse(calls[0].options.body),{validate_only:true,message:{topic:"exmore_test",notification:{title:"Test",body:"Test body"}}});
 assert.throws(()=>api.validateTestNotification("unknown","Test","Body"));
});
test("Google errors fail closed",async()=>{
 const {api}=fixture(403);
 await assert.rejects(api.getDocument("apps","exmore"),{status:403});
});
