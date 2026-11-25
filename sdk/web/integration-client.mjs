import {targetFor,publicConfig,localDefaults} from '../../dashboard/integration-v1.mjs';
export async function readConfig(projectId,platform,{fetchImpl=globalThis.fetch,cache,now=Date.now()}={}){
 const target=targetFor(projectId,platform),key='appcore:v1:'+target.projectId+':'+platform;
 let previous;
 try{previous=publicConfig(await cache?.get(key),target,now);}catch{}
 try{
  const response=await fetchImpl('https://appcore-poc.dr-karimelshenawy.workers.dev/api/v1/apps/'+target.projectId+'/'+platform+'/config',{credentials:'omit',redirect:'error',cache:'no-store',signal:AbortSignal.timeout(5000)});
  if(!response.ok)throw Error('Unavailable');
  const value=publicConfig(await response.json(),target,now);
  if(previous&&value.revision<previous.revision)throw Error('Stale revision');
  try{await cache?.set(key,value);}catch{}
  return {...value,source:'network'};
 }catch{return previous?{...previous,source:'cache'}:{...localDefaults(),source:'local'};}
}
