import {targetFor,publicConfig} from '../dashboard/integration-v1.mjs';
export async function readPublicConfig(project,platform,fetchImpl=(...args)=>globalThis.fetch(...args),scope='production'){
 if(!['pilot','production'].includes(scope))return new Response(null,{status:404});
 let target;try{target=targetFor(project,platform);}catch{return new Response(null,{status:404});}
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),5000);
 let stage='fetch';
 try{
  const url='https://firestore.googleapis.com/v1/projects/appcore-2026/databases/(default)/documents/'+(scope==='pilot'?'pilotConfigs':'publicConfigs')+'/'+target.projectId+'_'+platform;
  const r=await fetchImpl(url,{redirect:'manual',signal:controller.signal});
  if(r.status===404)return new Response(null,{status:404});
  if(!r.ok){
   console.warn('RemoteConfig upstream status:',r.status);
   return new Response(null,{status:503});
  }
  stage='decode';
  const f=(await r.json()).fields;
  stage='validate';
  const config=publicConfig({schemaVersion:Number(f.schemaVersion.integerValue),projectId:f.projectId.stringValue,platform:f.platform.stringValue,revision:Number(f.revision.integerValue),expiresAt:Number(f.expiresAt.integerValue),maintenance:f.maintenance.booleanValue,flags:Object.fromEntries(Object.entries(f.flags.mapValue.fields||{}).map(([k,v])=>[k,v.booleanValue]))},target);
  return Response.json(config,{headers:{'Cache-Control':'no-store','Access-Control-Allow-Origin':'*'}});
 }catch(error){
  console.error('RemoteConfig failure:',stage,error?.name,String(error?.message||'').slice(0,200));
  return new Response(null,{status:503});
 }finally{clearTimeout(timer);}
}
