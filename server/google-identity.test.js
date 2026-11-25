import test from 'node:test';
import assert from 'node:assert/strict';
import {PROJECTS,canonicalProjectId,identityFor,storageIdFor,identityMetadata} from '../dashboard/identity.mjs';
test('official identities and historical routing',()=>{
 assert.equal(PROJECTS.exmore.applicationId,'com.exmore.app');
 assert.equal(identityFor('3al-tabloh'),PROJECTS.altabloh);
 assert.equal(canonicalProjectId('3al-tabloh'),'altabloh');
 assert.equal(storageIdFor('altabloh'),'3al-tabloh');
 assert.equal(PROJECTS.appcore.applicationId,'com.appcore.admin');
 assert.equal(PROJECTS.appcore.androidStatus,'future');
 assert.equal(identityFor('constructor'),null);
 assert.deepEqual(identityMetadata('new-app'),{projectId:'new-app'});
});

import {createGatewayClient} from '../dashboard/gateway-client.mjs';
import {checkRelease} from '../sdk/web/release-client.mjs';
test('canonical and legacy gateway aliases preserve storage',async()=>{for(const id of ['altabloh','3al-tabloh']){const c=createGatewayClient({baseUrl:'https://example.com',getToken:async()=> 'token',fetchImpl:async url=>{assert.equal(url,'https://example.com/api/apps/altabloh');return Response.json({name:'projects/p/databases/d/documents/apps/3al-tabloh'});}});await c.readApp(id);}});
test('canonical public release lookup preserves legacy records',async()=>{assert.equal(await checkRelease('altabloh',1,{fetchImpl:async url=>{assert.ok(url.endsWith('/publishedReleases/3al-tabloh'));return new Response(null,{status:404});}}),null);});

import {createControlCenter} from './control-center.js';
test('owner API resolves canonical identity to historical storage',async()=>{const api=createControlCenter({authorize:async()=>true,google:{getDocument:async(...args)=>args}});for(const id of ['altabloh','3al-tabloh'])assert.deepEqual(await api.readApp({},id,'android'),{target:{appId:'altabloh',platform:'android'},document:['apps','3al-tabloh']});});

test('ExMore retains verified source package alias',()=>{assert.deepEqual(PROJECTS.exmore.legacyApplicationIds,['com.todoshift.app']);assert.equal(PROJECTS.exmore.androidStatus,'unverified');});
