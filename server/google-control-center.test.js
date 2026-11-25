import test from 'node:test';
import assert from 'node:assert/strict';
import {createControlCenter,validateTarget} from './control-center.js';
test('rejects unknown application and platform',()=>{
 assert.throws(()=>validateTarget('unknown','web'));
 assert.throws(()=>validateTarget('exmore','unknown'));
});
test('denied requests never reach Google',async()=>{
 let calls=0;
 const api=createControlCenter({authorize:async()=>false,google:{getDocument:async()=>{calls++},validateTestNotification:async()=>{calls++}}});
 await assert.rejects(api.readApp({},'exmore','android'),{status:403});
 await assert.rejects(api.validateNotification({},'altabloh','test','body'),{status:403});
 assert.equal(calls,0);
});
test('authorized operations use fixed application identifiers',async()=>{
 const api=createControlCenter({authorize:async()=>true,google:{getDocument:async(...args)=>args,validateTestNotification:async(...args)=>args}});
 assert.deepEqual(await api.readApp({},'exmore','web'),{target:{appId:'exmore',platform:'web'},document:['apps','exmore']});
 assert.deepEqual(await api.validateNotification({},'altabloh','test','body'),['altabloh','test','body']);
});
