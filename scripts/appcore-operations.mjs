// Explicitly owner-controlled operations; no automatic or bulk sends.
import {pathToFileURL} from 'node:url';
import {randomUUID} from 'node:crypto';
import {healthFields} from './appcore-health-record.mjs';
import {checkPublicHealth} from '../dashboard/public-health.mjs';
const project='appcore-2026';
const root=`projects/${project}/databases/(default)/documents`;
const fsBase=`https://firestore.googleapis.com/v1/${root}`;
export const apps=Object.freeze({exmore:'exmore',altabloh:'3al-tabloh'});
const analyticsApps=Object.freeze({...apps,'altabloh-web':'3al-tabloh-web'});
const idPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const s=stringValue=>({stringValue}), n=x=>({integerValue:String(x)}), ts=timestampValue=>({timestampValue});
const text=(f,k)=>f?.[k]?.stringValue;
export function notification(f,now=Date.now()){
 const app=text(f,'appId'),title=text(f,'title'),body=text(f,'body');
 const created=Date.parse(f?.createdAt?.timestampValue);
 if(!Object.hasOwn(apps,app)||text(f,'status')!=='queued'||text(f,'audience')!=='test'||typeof title!=='string'||!title.trim()||title.length>100||typeof body!=='string'||!body.trim()||body.length>1000||!Number.isFinite(created)||created>now||now-created>86400000)throw Error('Invalid, expired or already processed request');
 return {app,title,body};
}
export function reportBody(stream){
 if(!/^\d{1,20}$/.test(stream))throw Error('Missing/invalid GA stream ID');
 return {dateRanges:[{startDate:'7daysAgo',endDate:'yesterday'}],dimensions:[{name:'date'}],metrics:[{name:'activeUsers'},{name:'sessions'},{name:'eventCount'}],dimensionFilter:{filter:{fieldName:'streamId',stringFilter:{matchType:'EXACT',value:stream}}},limit:'7'};
}
export function analyticsRows(result){
 if(!result||result.rowCount>7||!Array.isArray(result.rows??[])||result.rows?.length>7||JSON.stringify(result.dimensionHeaders?.map(x=>x.name))!==JSON.stringify(['date'])||JSON.stringify(result.metricHeaders?.map(x=>x.name))!==JSON.stringify(['activeUsers','sessions','eventCount']))throw Error('Unexpected GA report');
 const seen=new Set();return (result.rows??[]).map(row=>{
  const raw=row.dimensionValues?.[0]?.value;
  if(!/^\d{8}$/.test(raw??''))throw Error('Invalid report date');
  const day=raw.slice(0,4)+'-'+raw.slice(4,6)+'-'+raw.slice(6);
  if(seen.has(day)||!Number.isFinite(Date.parse(day))||new Date(day).toISOString().slice(0,10)!==day)throw Error('Duplicate/invalid date');seen.add(day);
  const values=row.metricValues?.map(v=>/^\d+$/.test(v.value??'')?Number(v.value):NaN);
  if(!values||values.length!==3||values.some(v=>!Number.isSafeInteger(v)||v<0))throw Error('Invalid metric');
  return {day,activeUsers:values[0],sessions:values[1],eventCount:values[2]};
 });
}
export function createOperations({token,fetchImpl=globalThis.fetch,clock=()=>Date.now()}){
 if(typeof token!=='string'||!token)throw Error('Google access token required');
 async function request(url,{method='GET',body}={}){
  const r=await fetchImpl(url,{method,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),redirect:'error',signal:AbortSignal.timeout(20000)});
  if(!r.ok){await r.body?.cancel();const e=Error('Google API HTTP '+r.status);e.status=r.status;throw e;}
  return r.json();
 }
 const commit=writes=>request(fsBase+':commit',{method:'POST',body:{writes}});
 const update=(name,fields,currentDocument)=>({update:{name,fields},updateMask:{fieldPaths:Object.keys(fields)},...(currentDocument?{currentDocument}:{})});
 async function send(id){
  if(!idPattern.test(id))throw Error('Invalid request ID');
  const path='operationsNotifications/'+id,name=root+'/'+path,doc=await request(fsBase+'/'+path);
  if(doc.name!==name||!doc.updateTime)throw Error('Unexpected request document');
  const {app,title,body}=notification(doc.fields,clock());
  const appDoc=await request(fsBase+'/apps/'+apps[app]);
  const modules=appDoc.fields?.modules?.arrayValue?.values;
  if(appDoc.name!==root+'/apps/'+apps[app]||(modules&&!modules.some(v=>v.stringValue==='notifications')))throw Error('Notifications disabled');
  // Atomic claim before send. No retry of a claimed request, including ambiguous network failures.
  await commit([update(name,{status:s('sending'),claimedAt:ts(new Date(clock()).toISOString())},{updateTime:doc.updateTime})]);
  let receipt;
  try{
   receipt=await request(`https://fcm.googleapis.com/v1/projects/${project}/messages:send`,{method:'POST',body:{message:{topic:app+'_test',notification:{title,body}}}});
   if(typeof receipt.name!=='string'||!receipt.name.startsWith(`projects/${project}/messages/`))throw Error('Missing FCM receipt');
  }catch{
   await commit([update(name,{status:s('unknown_or_failed'),finishedAt:ts(new Date(clock()).toISOString())},{exists:true})]).catch(()=>{});
   throw Error('FCM result not confirmed; never retry this request automatically');
  }
  await commit([update(name,{status:s('accepted_by_fcm'),messageId:s(receipt.name),finishedAt:ts(new Date(clock()).toISOString())},{exists:true})]);
  return {status:'accepted_by_fcm',app};
 }
 async function analytics(app,property,stream){
  if(!Object.hasOwn(analyticsApps,app)||!/^\d{1,20}$/.test(property??''))throw Error('Missing/invalid GA property');
  const rows=analyticsRows(await request(`https://analyticsdata.googleapis.com/v1beta/properties/${property}:runReport`,{method:'POST',body:reportBody(stream)}));
  if(rows.length){await commit(rows.map(({day,activeUsers,sessions,eventCount})=>update(root+'/analyticsDaily/'+analyticsApps[app]+'/days/'+day,{activeUsers:n(activeUsers),sessions:n(sessions),eventCount:n(eventCount),source:s('GA4 stream report'),updatedAt:ts(new Date(clock()).toISOString())})));}
  return {app,rows:rows.length,status:rows.length?'imported':'no-data-returned'};
 }
 async function health(){
  const gateway='https://appcore-poc.dr-karimelshenawy.workers.dev';
  const targets=[['exmore','gateway',gateway+'/health'],['altabloh','website','https://al-tabloh.web.app/']];
  const rows=[];
  for(const [app,key,url] of targets){
   const start=clock();let status=0,ok=false;
   try{const r=await fetchImpl(url,{redirect:'error',signal:AbortSignal.timeout(8000)});status=r.status;ok=r.ok;await r.body?.cancel();}catch{}
   rows.push({app,key,status,ok,latencyMs:Math.max(0,clock()-start)});
  }
  for(const v of await checkPublicHealth({fetchImpl,clock})){
   const [app,platform]=v.name.split('/');rows.push({app,key:platform+'-config',status:v.status??0,ok:v.ok,latencyMs:Math.max(0,v.latencyMs)});
  }
  for(const {app,key,status,ok} of rows){
   if(!ok){
    const day=new Date(clock()).toISOString().slice(0,10),name=root+'/adminAlerts/'+apps[app]+'/items/health-'+key+'-'+day;
    try{await commit([{update:{name,fields:{title:s('Service health failure'),body:s(key+' HTTP '+status+' or invalid response'),source:s('appcore-operations'),createdAt:ts(new Date(clock()).toISOString()),acknowledged:{booleanValue:false}}},currentDocument:{exists:false}}]);}
    catch(e){if(e.status!==409)throw e;}
   }
  }
  return rows;
 }
 async function recordHealth(rows){const name=root+'/healthRuns/'+randomUUID();await commit([{update:{name,fields:healthFields(rows,clock())},currentDocument:{exists:false}}]);}
 return {send,analytics,health,recordHealth};
}
export function analyticsTargets(env){
 const targets=[['exmore',env.GA_EXMORE_PROPERTY,env.GA_EXMORE_STREAM],['altabloh',env.GA_ALTABLOH_PROPERTY,env.GA_ALTABLOH_STREAM]];
 if(env.GA_ALTABLOH_WEB_PROPERTY||env.GA_ALTABLOH_WEB_STREAM)targets.push(['altabloh-web',env.GA_ALTABLOH_WEB_PROPERTY,env.GA_ALTABLOH_WEB_STREAM]);
 if(targets.some(([,p,s])=>!/^\d{1,20}$/.test(p??'')||!/^\d{1,20}$/.test(s??''))||new Set(targets.map(([,p,s])=>p+':'+s)).size!==targets.length)throw Error('Configure distinct verified GA property/stream pairs');
 return targets;
}
async function main(){
 const mode=process.argv[2],api=createOperations({token:process.env.GOOGLE_ACCESS_TOKEN});
 if(process.env.OPERATIONS_CONFIRM!=='true')throw Error('Explicit confirmation required');
 if(mode==='notify'){console.log(JSON.stringify(await api.send(process.env.NOTIFICATION_ID??'')));return;}
 if(mode==='analytics'){
  for(const args of analyticsTargets(process.env))console.log(JSON.stringify(await api.analytics(...args)));return;
 }
 if(mode==='health'){const rows=await api.health();await api.recordHealth(rows);console.log(JSON.stringify(rows));if(rows.some(x=>!x.ok))process.exitCode=1;return;}
 throw Error('Unknown operation');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)main().catch(e=>{console.error(e.message);process.exitCode=1});
