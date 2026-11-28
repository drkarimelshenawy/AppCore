import {readPublicConfig} from './public-config.js';
import {ownerDispatch,scheduledOperations} from './operation-dispatch.js';
import {ownerIntegrationStatus} from './integration-status.js';
import {checkWebsite} from './website-monitor.js';
import {delegatedProof} from './delegated-proof.js';
import {createOwnerFirestore} from './owner-firestore.js';
const readApp=createOwnerFirestore({projectId:'appcore-2026'});
// Isolated network diagnostics. No credentials, writes or notification delivery.
const endpoints=[
 ['firestore','https://firestore.googleapis.com/v1/projects/appcore-2026/databases/(default)/documents/appcore_poc/connectivity','GET'],
 ['fcm','https://fcm.googleapis.com/v1/projects/appcore-2026/messages:send','POST'],
 ['sts','https://sts.googleapis.com/v1/token','POST']
];
async function probe([service,url,method]){
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),8000);
 try{
  const response=await fetch(url,{method,redirect:'manual',signal:controller.signal,...(method==='POST'?{headers:{'Content-Type':'application/json'},body:'{}'}:{})});
  const status=response.status;
  await response.body?.cancel();
  return {service,status,reachable:true};
 }catch(e){return {service,reachable:false,error:e?.name==='AbortError'?'timeout':String(e?.name||'Error')};}
 finally{clearTimeout(timer);}
}
async function run(){return Promise.all(endpoints.map(probe));}
export default {
 async fetch(request,env){
  const path=new URL(request.url).pathname;
  if(path==='/api/admin/operations')return ownerDispatch(request,env,readApp);
  if(path==='/api/admin/integrations')return ownerIntegrationStatus(request,env,readApp);
  const config=/^\/api\/v1\/apps\/([a-z0-9-]+)\/([a-z]+)\/config$/.exec(path);
  if(config&&request.method==='GET')return readPublicConfig(config[1],config[2]);
  if(path==='/internal/delegated-proof'&&request.method==='POST'&&!request.headers.has('Origin'))return delegatedProof(request);
  const match=/^\/api\/apps\/(exmore|altabloh)(\/website)?$/.exec(path);
  if(match){
   const origin=request.headers.get('Origin');
   const allowed=origin==='https://appcore-2026.web.app'||origin==='https://appcore-2026.firebaseapp.com'||origin==='https://appcore-2026--gateway-poc-ill315eo.web.app';
   const headers=allowed?{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'GET, OPTIONS','Access-Control-Allow-Headers':'Authorization','Vary':'Origin'}:{};
   if(origin&&!allowed)return new Response(null,{status:403});
   if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
   if(request.method==='GET'){
    let result=await readApp(request,match[1]);
    if(match[2]&&result.ok){if(match[1]!=='altabloh')result=new Response(null,{status:404});else{const doc=await result.json();const modules=doc.fields?.modules?.arrayValue?.values;if(modules&&!modules.some(v=>v.stringValue==='web'))result=new Response(null,{status:403});else result=Response.json(await checkWebsite(),{headers:{'Cache-Control':'no-store'}});}}
    const response=new Response(result.body,result);
    for(const [k,v] of Object.entries(headers))response.headers.set(k,v);
    return response;
   }
  }
  if(request.method!=='GET'||path!=='/health')return new Response('Not found',{status:404});
  return Response.json({service:'appcore-poc',status:'ok',secretBinding:env.POC_TEST_SECRET==='synthetic-test-only-not-a-credential'},{headers:{'Cache-Control':'no-store'}});
 },
 async scheduled(controller,env){
  try{const result=await scheduledOperations(controller,env);if(result)console.log(JSON.stringify({event:'operations-cycle',...result}));}catch{console.log(JSON.stringify({event:'operations-cycle',status:'unconfirmed'}));}
  for(const [project,platform] of [['exmore','android'],['altabloh','android'],['altabloh','web']]){
   try{
    const response=await readPublicConfig(project,platform);
    const config=response.ok?await response.json():null;
    const remainingMs=config?config.expiresAt-Date.now():null;
    console.log(JSON.stringify({event:'config-guardian',project,platform,status:response.status,remainingMs,state:!config?'unavailable':remainingMs<=21600000?'renewal-required':'healthy'}));
   }catch{console.log(JSON.stringify({event:'config-guardian',project,platform,state:'unavailable'}));}
  }
  console.log(JSON.stringify({event:'website-monitor',appId:'altabloh',legacyStorageId:'3al-tabloh',...await checkWebsite()}));for(const result of await run())console.log(JSON.stringify({event:'google-connectivity-v2',...result}));}
};
