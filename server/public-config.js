import {targetFor,publicConfig} from '../dashboard/integration-v1.mjs';
export async function readPublicConfig(project,platform,fetchImpl=globalThis.fetch){
 let target;try{target=targetFor(project,platform);}catch{return new Response(null,{status:404});}
 try{
  const url='https://firestore.googleapis.com/v1/projects/appcore-2026/databases/(default)/documents/publicConfigs/'+target.projectId+'_'+platform;
  const r=await fetchImpl(url,{redirect:'error',signal:AbortSignal.timeout(5000)});
  if(r.status===404)return new Response(null,{status:404});
  if(!r.ok)return new Response(null,{status:503});
  const f=(await r.json()).fields;
  const config=publicConfig({schemaVersion:Number(f.schemaVersion.integerValue),projectId:f.projectId.stringValue,platform:f.platform.stringValue,revision:Number(f.revision.integerValue),expiresAt:Number(f.expiresAt.integerValue),maintenance:f.maintenance.booleanValue,flags:Object.fromEntries(Object.entries(f.flags.mapValue.fields||{}).map(([k,v])=>[k,v.booleanValue]))},target);
  return Response.json(config,{headers:{'Cache-Control':'no-store','Access-Control-Allow-Origin':'*'}});
 }catch{return new Response(null,{status:503});}
}
