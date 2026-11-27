import test from 'node:test';
import assert from 'node:assert/strict';
import {checkPublicHealth} from '../dashboard/public-health.mjs';
const now=Date.now();
test('health view validates three CORS-enabled public config endpoints',async()=>{
 const rows=await checkPublicHealth({clock:()=>now,fetchImpl:async url=>({ok:true,status:200,text:async()=>JSON.stringify({schemaVersion:1,projectId:url.includes('/exmore/')?'exmore':'altabloh',platform:url.endsWith('/web/config')?'web':'android',revision:1,expiresAt:now+60000,maintenance:false,flags:{}})})});
 assert.equal(rows.length,3);assert.ok(rows.every(row=>row.ok));
});
test('malformed config and upstream failure are reported as failures',async()=>{
 const rows=await checkPublicHealth({clock:()=>now,fetchImpl:async url=>url.includes('/altabloh/web/')?{ok:false,status:503}:{ok:true,status:200,text:async()=>JSON.stringify({schemaVersion:1,projectId:'wrong',platform:'android',revision:1,expiresAt:now+60000,maintenance:false,flags:{}})}});
 assert.equal(rows.filter(row=>row.ok).length,0);
 assert.equal(rows.find(row=>row.name==='altabloh/web').status,503);
});
