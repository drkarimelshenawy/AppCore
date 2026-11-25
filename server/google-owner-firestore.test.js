import test from 'node:test';
import assert from 'node:assert/strict';
import {createOwnerFirestore} from './owner-firestore.js';
const req=(token)=>new Request('https://example.invalid',{headers:token?{Authorization:token}:{}});
test('reject missing credentials and unknown apps before network',async()=>{
 const read=createOwnerFirestore({projectId:'appcore-2026',fetchImpl:()=>{throw Error('unexpected network')}});
 assert.equal((await read(req(),'exmore')).status,401);
 assert.equal((await read(req('Bearer a.b.c'),'other')).status,404);
});
test('forward token only to fixed Google endpoint and disable caching',async()=>{
 const read=createOwnerFirestore({projectId:'appcore-2026',fetchImpl:async(url,opts)=>{
 assert.equal(url,'https://firestore.googleapis.com/v1/projects/appcore-2026/databases/(default)/documents/apps/exmore');
 assert.equal(opts.headers.Authorization,'Bearer a.b.c');
 assert.equal(opts.redirect,'error');
 return Response.json({fields:{}});
 }});
 const result=await read(req('Bearer a.b.c'),'exmore');
 assert.equal(result.status,200);
 assert.equal(result.headers.get('Cache-Control'),'no-store');
});
test('preserve permission errors and sanitize upstream failures',async()=>{
 for(const status of [401,403,404,500]){
 const read=createOwnerFirestore({projectId:'appcore-2026',fetchImpl:async()=>new Response('private upstream detail',{status})});
 const result=await read(req('Bearer a.b.c'),'altabloh');
 assert.equal(result.status,status===500?502:status);
 assert.equal(await result.text(),'');
 }
});
