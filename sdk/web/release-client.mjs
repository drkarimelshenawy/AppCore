// Public optional release lookup; no administrator credentials or user data.
export async function checkRelease(appId,currentCode,{fetchImpl=(...a)=>globalThis.fetch(...a)}={}){
 if(!['exmore','3al-tabloh'].includes(appId)||!Number.isSafeInteger(currentCode)||currentCode<0)throw Error('Invalid client');
 const url='https://firestore.googleapis.com/v1/projects/appcore-2026/databases/(default)/documents/publishedReleases/'+appId;
 const r=await fetchImpl(url,{redirect:'error',credentials:'omit',cache:'no-store'});
 if(r.status===404)return null;
 if(!r.ok)throw Error('Release lookup unavailable');
 const f=(await r.json()).fields||{},code=Number(f.code?.integerValue),version=f.version?.stringValue;
 if(f.appId?.stringValue!==appId||!Number.isSafeInteger(code)||code<1||code>2100000000||typeof version!=='string'||f.mandatory?.booleanValue!==false)throw Error('Invalid release');
 const link=new URL(f.url?.stringValue);
 if(link.protocol!=='https:'||link.username||link.password)throw Error('Invalid release URL');
 return code>currentCode?{code,version,url:link.href,notes:f.notes?.stringValue||'',mandatory:false}:null;
}
