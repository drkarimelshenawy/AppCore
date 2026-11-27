const base='https://appcore-poc.dr-karimelshenawy.workers.dev';
const checks=[
 ['exmore/android','/api/v1/apps/exmore/android/config'],
 ['altabloh/android','/api/v1/apps/altabloh/android/config'],
 ['altabloh/web','/api/v1/apps/altabloh/web/config']
];
export async function checkPublicHealth({fetchImpl=globalThis.fetch,clock=()=>Date.now(),timeoutMs=6000}={}){
 return Promise.all(checks.map(async ([name,path])=>{
  const started=clock(),controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{
   const response=await fetchImpl(base+path,{signal:controller.signal,redirect:'error',cache:'no-store',credentials:'omit'});
   if(!response.ok)return {name,ok:false,status:response.status,latencyMs:clock()-started};
   const raw=await response.text();
   if(raw.length>16384)throw Error('Oversized response');
   const value=JSON.parse(raw),target=name.split('/');
   const flags=value.flags;
   const valid=value.schemaVersion===1&&value.projectId===target[0]&&value.platform===target[1]&&
    Number.isSafeInteger(value.revision)&&value.revision>0&&
    Number.isSafeInteger(value.expiresAt)&&value.expiresAt>clock()&&value.expiresAt<=clock()+86400000&&
    typeof value.maintenance==='boolean'&&flags&&typeof flags==='object'&&!Array.isArray(flags)&&
    Object.keys(flags).length<=50&&Object.entries(flags).every(([key,enabled])=>/^[a-z][a-z0-9_]{0,39}$/.test(key)&&typeof enabled==='boolean');
   return {name,ok:Boolean(valid),status:response.status,latencyMs:clock()-started};
  }catch{return {name,ok:false,status:null,latencyMs:clock()-started};}
  finally{clearTimeout(timer);}
 }));
}
