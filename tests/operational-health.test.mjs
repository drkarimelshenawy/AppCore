import test from 'node:test';
import assert from 'node:assert/strict';
import {validPublicConfig,checkPublicHealth} from '../dashboard/public-health.mjs';
const now=1700000000000;
const cfg={schemaVersion:1,projectId:'exmore',platform:'android',revision:1,expiresAt:now+60000,maintenance:false,flags:{optional:true}};
test('same strict schema as ExMore',()=>{
 assert.equal(validPublicConfig(cfg,'exmore/android',now),true);
 for(const change of [{extra:true},{flags:{constructor:true}},{flags:{prototype:false}},{expiresAt:now},{expiresAt:now+86400001},{revision:0},{platform:'web'}])assert.equal(Boolean(validPublicConfig({...cfg,...change},'exmore/android',now)),false);
});
test('oversized UTF-8 responses are rejected even with HTTP 200',async()=>{
 const results=await checkPublicHealth({clock:()=>now,fetchImpl:async()=>new Response('ض'.repeat(9000),{status:200})});
 assert.equal(results.length,3);assert.ok(results.every(r=>!r.ok&&r.status===200));
});
test('HTTP status does not prove app configuration is usable',async()=>{
 const results=await checkPublicHealth({clock:()=>now,fetchImpl:async()=>new Response('{}',{status:200})});assert.ok(results.every(r=>!r.ok));
});
