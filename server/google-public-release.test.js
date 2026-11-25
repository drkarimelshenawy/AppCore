import test from 'node:test';import assert from 'node:assert/strict';import {checkRelease} from '../sdk/web/release-client.mjs';
const fields={appId:{stringValue:'exmore'},code:{integerValue:'82'},version:{stringValue:'4.5'},url:{stringValue:'https://example.test/app.apk'},mandatory:{booleanValue:false}};
test('optional newer release only',async()=>{const fetchImpl=async(u,o)=>{assert.equal(o.credentials,'omit');return Response.json({fields});};assert.equal((await checkRelease('exmore',81,{fetchImpl})).code,82);assert.equal(await checkRelease('exmore',82,{fetchImpl}),null);});
test('reject forced release and unknown app',async()=>{await assert.rejects(checkRelease('exmore',81,{fetchImpl:async()=>Response.json({fields:{...fields,mandatory:{booleanValue:true}}})}));await assert.rejects(checkRelease('unknown',1));});
test('missing release is not an error',async()=>{assert.equal(await checkRelease('exmore',81,{fetchImpl:async()=>new Response(null,{status:404})}),null);});
