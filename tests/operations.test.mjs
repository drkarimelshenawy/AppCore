import test from 'node:test';
import assert from 'node:assert/strict';
import {createOperations,notification,reportBody,analyticsRows,analyticsTargets} from '../scripts/appcore-operations.mjs';
const root='projects/appcore-2026/databases/(default)/documents';
const id='aabbccdd-1111-2222-3333-eeeeeeeeeeee';
const now=Date.parse('2026-11-27T20:00:00Z');
const f={appId:{stringValue:'exmore'},title:{stringValue:'test'},body:{stringValue:'test only'},status:{stringValue:'queued'},audience:{stringValue:'test'},createdAt:{timestampValue:new Date(now-1000).toISOString()}};
const report={dimensionHeaders:[{name:'date'}],metricHeaders:['activeUsers','sessions','eventCount'].map(name=>({name})),rowCount:1,rows:[{dimensionValues:[{value:'20261126'}],metricValues:['2','3','5'].map(value=>({value}))}]};
const resp=(data,status=200)=>new Response(JSON.stringify(data),{status});
function fixture({failClaim=false,failFCM=false}={}){
 let calls=[],claimed=false;const api=createOperations({token:'synthetic',clock:()=>now,fetchImpl:async(url,opts)=>{
  const body=opts.body?JSON.parse(opts.body):undefined;calls.push({url,body});
  if(url.includes('/operationsNotifications/'))return resp({name:root+'/operationsNotifications/'+id,updateTime:'2026-11-27T19:59:00Z',fields:{...f,status:{stringValue:claimed?'sending':'queued'}}});
  if(url.endsWith('/apps/exmore'))return resp({name:root+'/apps/exmore',fields:{modules:{arrayValue:{values:[{stringValue:'notifications'}]}}}});
  if(url.endsWith(':commit')){if(body.writes[0].update.fields.status?.stringValue==='sending'){if(failClaim)return resp({},409);claimed=true;}return resp({});}
  if(url.includes('fcm.googleapis.com'))return failFCM?resp({},503):resp({name:'projects/appcore-2026/messages/1'});
  if(url.includes('analyticsdata.googleapis.com'))return resp(report);
  throw Error('Unexpected URL');
 }});return {api,calls};
}
test('queued test requests validate and expire',()=>{assert.equal(notification(f,now).app,'exmore');assert.throws(()=>notification({...f,status:{stringValue:'cancelled'}},now));assert.throws(()=>notification(f,now+86400000));assert.throws(()=>notification({...f,audience:{stringValue:'all'}},now));});
test('claim before FCM and never resend the same request',async()=>{const {api,calls}=fixture();assert.equal((await api.send(id)).status,'accepted_by_fcm');assert.equal(calls[2].body.writes[0].currentDocument.updateTime,'2026-11-27T19:59:00Z');assert.equal(calls[3].body.message.topic,'exmore_test');assert.equal(calls[4].body.writes[0].update.fields.status.stringValue,'accepted_by_fcm');await assert.rejects(api.send(id));assert.equal(calls.filter(c=>c.url.includes('fcm.googleapis.com')).length,1)});
test('failed claim prevents FCM',async()=>{const {api,calls}=fixture({failClaim:true});await assert.rejects(api.send(id));assert.equal(calls.filter(c=>c.url.includes('fcm.googleapis.com')).length,0)});
test('unknown FCM failure is recorded, no automatic retry',async()=>{const {api,calls}=fixture({failFCM:true});await assert.rejects(api.send(id));assert.equal(calls.at(-1).body.writes[0].update.fields.status.stringValue,'unknown_or_failed');await assert.rejects(api.send(id));assert.equal(calls.filter(c=>c.url.includes('fcm.googleapis.com')).length,1)});
test('stream filter and exact daily aggregate destination',async()=>{assert.equal(reportBody('1234').dimensionFilter.filter.stringFilter.value,'1234');assert.throws(()=>reportBody('bad'));const {api,calls}=fixture();assert.equal((await api.analytics('altabloh','12','34')).rows,1);assert.equal(calls[1].body.writes[0].update.name,root+'/analyticsDaily/3al-tabloh/days/2026-11-26');assert.equal(calls[1].body.writes[0].update.fields.activeUsers.integerValue,'2');});
test('GA no-data, duplicate dates, invalid metric rejected',()=>{assert.deepEqual(analyticsRows({...report,rows:[],rowCount:0}),[]);assert.throws(()=>analyticsRows({...report,rows:[...report.rows,...report.rows]}));assert.throws(()=>analyticsRows({...report,rows:[{...report.rows[0],metricValues:[{value:'-1'}]}]}));});
test('health failure creates only a deterministic alert and never forwards authorization',async()=>{const calls=[];const api=createOperations({token:'synthetic',clock:()=>now,fetchImpl:async(url,opts)=>{calls.push({url,opts});if(url.endsWith(':commit'))return resp({});if(url.endsWith('/config'))return resp({schemaVersion:1,projectId:url.includes('/exmore/')?'exmore':'altabloh',platform:url.includes('/web/')?'web':'android',revision:1,expiresAt:now+60000,maintenance:false,flags:{}});return resp({},url.endsWith('/health')?503:200)}});const rows=await api.health();assert.equal(rows.filter(x=>!x.ok).length,1);const writes=calls.filter(c=>c.url.endsWith(':commit'));assert.equal(writes.length,1);assert.equal(JSON.parse(writes[0].opts.body).writes[0].currentDocument.exists,false);assert.ok(calls.filter(c=>!c.url.endsWith(':commit')).every(c=>!c.opts.headers));});

test('optional Web analytics never overwrites Android or permits notification targeting',async()=>{const env={GA_EXMORE_PROPERTY:'12',GA_EXMORE_STREAM:'34',GA_ALTABLOH_PROPERTY:'12',GA_ALTABLOH_STREAM:'56'};assert.equal(analyticsTargets(env).length,2);assert.throws(()=>analyticsTargets({...env,GA_ALTABLOH_WEB_PROPERTY:'12'}));assert.throws(()=>analyticsTargets({...env,GA_ALTABLOH_WEB_PROPERTY:'12',GA_ALTABLOH_WEB_STREAM:'56'}));assert.equal(analyticsTargets({...env,GA_ALTABLOH_WEB_PROPERTY:'12',GA_ALTABLOH_WEB_STREAM:'78'}).length,3);const {api,calls}=fixture();await api.analytics('altabloh-web','12','78');assert.equal(calls[1].body.writes[0].update.name,root+'/analyticsDaily/3al-tabloh-web/days/2026-11-26');assert.throws(()=>notification({...f,appId:{stringValue:'altabloh-web'}},now));});
