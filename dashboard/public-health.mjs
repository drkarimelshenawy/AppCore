const base='https://appcore-poc.dr-karimelshenawy.workers.dev';
const checks=[['exmore/android','/api/v1/apps/exmore/android/config'],['altabloh/android','/api/v1/apps/altabloh/android/config'],['altabloh/web','/api/v1/apps/altabloh/web/config']];
const keys=['schemaVersion','projectId','platform','revision','expiresAt','maintenance','flags'];
export function validPublicConfig(value,name,now){
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).length!==keys.length||!keys.every(k=>Object.hasOwn(value,k)))return false;
 const [projectId,platform]=name.split('/'),flags=value.flags;
 return value.schemaVersion===1&&value.projectId===projectId&&value.platform===platform&&Number.isSafeInteger(value.revision)&&value.revision>0&&Number.isSafeInteger(value.expiresAt)&&value.expiresAt>now&&value.expiresAt<=now+86400000&&typeof value.maintenance==='boolean'&&Boolean(flags)&&typeof flags==='object'&&!Array.isArray(flags)&&Object.keys(flags).length<=50&&Object.entries(flags).every(([k,v])=>/^[a-z][a-z0-9_]{0,39}$/.test(k)&&!['constructor','prototype'].includes(k)&&typeof v==='boolean');
}
async function boundedText(response){
 if(!response.body?.getReader){const raw=await response.text();if(new TextEncoder().encode(raw).length>16384)throw Error('Oversized response');return raw;}
 const reader=response.body.getReader(),decoder=new TextDecoder('utf-8',{fatal:true});let size=0,text='';
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>16384)throw Error('Oversized response');text+=decoder.decode(value,{stream:true});}return text+decoder.decode();}
 finally{try{await reader.cancel()}catch{}reader.releaseLock();}
}
export async function checkPublicHealth({fetchImpl=globalThis.fetch,clock=()=>Date.now(),timeoutMs=6000}={}){
 return Promise.all(checks.map(async ([name,path])=>{
  const started=clock(),controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
  let status=null;
  try{
   const response=await fetchImpl(base+path,{signal:controller.signal,redirect:'error',cache:'no-store',credentials:'omit'});status=response.status;
   if(!response.ok){await response.body?.cancel?.();return {name,ok:false,status,latencyMs:clock()-started};}
   const raw=await boundedText(response),value=JSON.parse(raw);
   return {name,ok:Boolean(validPublicConfig(value,name,clock())),status,latencyMs:clock()-started};
  }catch{return {name,ok:false,status,latencyMs:clock()-started};}
  finally{clearTimeout(timer);}
 }));
}
