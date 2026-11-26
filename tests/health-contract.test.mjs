import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateHealth} from '../dashboard/health-contract.mjs';
const report=()=>({results:['gateway','exmore-config','altabloh-android','altabloh-web','altabloh-site'].map(name=>({name,ok:true,status:200,latencyMs:500}))});
test('valid report',()=>assert.equal(validateHealth(report()).length,5));
test('duplicate rejected',()=>{const r=report();r.results[1]=r.results[0];assert.throws(()=>validateHealth(r))});
test('false success rejected',()=>{const r=report();r.results[0].status=503;assert.throws(()=>validateHealth(r))});
test('failed request accepted',()=>{const r=report();r.results[0]={name:'gateway',ok:false,latencyMs:8000};assert.equal(validateHealth(r)[0].status,0)});
