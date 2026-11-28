import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {setTimeout as delay} from 'node:timers/promises';
const gateway='https://appcore-poc.dr-karimelshenawy.workers.dev';
const admin='https://appcore-2026.web.app';
async function get(url,options={}){
 return fetch(url,{...options,redirect:'error',signal:AbortSignal.timeout(15000)});
}
async function gatewayCheck(){
 const r=await get(gateway+'/health');assert.equal(r.status,200);const health=await r.json();assert.equal(health.status,'ok');assert.equal(health.secretBinding,true);console.log('gateway health and inherited binding: PASS');
 for(const [app,platform] of [['exmore','android'],['altabloh','android'],['altabloh','web']]){
  const r=await get(gateway+'/api/v1/apps/'+app+'/'+platform+'/config');assert.equal(r.status,200);const v=await r.json();assert.equal(v.projectId,app);assert.equal(v.platform,platform);assert.ok(v.expiresAt>Date.now());console.log('production configuration '+app+'/'+platform+': PASS');
  const p=await get(gateway+'/api/v1/pilot/apps/'+app+'/'+platform+'/config');assert.ok([200,404].includes(p.status),'pilot config HTTP '+p.status);if(p.ok){const q=await p.json();assert.equal(q.projectId,app);assert.equal(q.platform,platform)}console.log('pilot config '+app+'/'+platform+': HTTP '+p.status);
 }
 for(const [path,method] of [['/api/admin/operations','POST'],['/api/admin/integrations','GET']]){
  const options={method,headers:{Origin:admin,...(method==='POST'?{'Content-Type':'application/json'}:{})},...(method==='POST'?{body:'{"operation":"health","confirm":true}'}:{})};
  const r=await get(gateway+path,options);assert.equal(r.status,401);assert.equal(r.headers.get('access-control-allow-origin'),admin);
  const bad=await get(gateway+path,{...options,headers:{...options.headers,Origin:'https://example.invalid'}});assert.equal(bad.status,403);
  const pre=await get(gateway+path,{method:'OPTIONS',headers:{Origin:admin}});assert.equal(pre.status,204);console.log(path+' anonymous denial, cross-origin denial and CORS: PASS');
 }
}
async function hosting(mode){
 const base=mode==='preview'?'https://appcore-2026--gateway-poc-ill315eo.web.app':admin;
 for(const file of ['index.html','app.js','auth.js','style.css','gateway-client.mjs','config-contract.mjs','identity.mjs','integration-v1.mjs']){
  const expected=await fs.readFile('dashboard/'+file);let ok=false;
  for(let i=0;i<8&&!ok;i++){
   try{const r=await get(base+'/'+file+'?activation='+process.env.GITHUB_SHA+'&try='+i,{headers:{'Cache-Control':'no-cache'}});ok=r.ok&&expected.equals(Buffer.from(await r.arrayBuffer()));}catch{}
   if(!ok)await delay(3000);
  }
  assert.ok(ok,mode+' asset mismatch '+file);
  console.log(mode+' '+file+': exact match');
 }
}
async function metadata(){
 const token=process.env.GOOGLE_ACCESS_TOKEN;if(!token)throw Error('Missing delegated Google token');
 const headers={Authorization:'Bearer '+token};
 const base='https://bigquery.googleapis.com/bigquery/v2/projects/appcore-2026/datasets/';
 for(const dataset of ['firebase_crashlytics','firebase_performance']){
  const r=await get(base+dataset,{headers});console.log('BigQuery '+dataset+' metadata: HTTP '+r.status);
  if(!r.ok){await r.body?.cancel();continue}
  const d=await r.json();console.log('BigQuery '+dataset+' location: '+String(d.location??'unknown'));
  const t=await get(base+dataset+'/tables?maxResults=100',{headers});console.log('BigQuery '+dataset+' tables: HTTP '+t.status);
  if(!t.ok){await t.body?.cancel();continue}
  const v=await t.json();const tables=(v.tables??[]).map(x=>x.tableReference?.tableId).filter(x=>typeof x==='string'&&/^[A-Za-z0-9_]{1,150}$/.test(x));console.log('BigQuery '+dataset+' table names: '+JSON.stringify(tables));if(v.nextPageToken)console.log('Additional tables exist; listing truncated');
 }
 const p=await get('https://analyticsadmin.googleapis.com/v1beta/properties/565755286/dataStreams?pageSize=100',{headers});console.log('GA4 stream metadata: HTTP '+p.status);if(p.ok){const v=await p.json();console.log('GA4 streams: '+JSON.stringify((v.dataStreams??[]).map(x=>({id:x.name?.split('/').at(-1),type:x.type,measurementId:x.webStreamData?.measurementId,packageName:x.androidAppStreamData?.packageName}))))}else await p.body?.cancel();
}
const mode=process.argv[2];if(mode==='preview'||mode==='live')await hosting(mode);else if(mode==='metadata')await metadata();else await gatewayCheck();
