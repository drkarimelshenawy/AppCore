// Read-only gateway client for authorized administration; not a public device SDK.
export function createGatewayClient({baseUrl,getToken,fetchImpl=(...args)=>globalThis.fetch(...args)}){
 const base=new URL(baseUrl);
 if(base.protocol!=='https:'||base.username||base.password||base.pathname!=='/'||base.search||base.hash)throw Error('Invalid gateway');
 return {async readApp(id){
 const target=Object.hasOwn({exmore:1,'3al-tabloh':1},id)?(id==='exmore'?id:'altabloh'):null;
 if(!target)throw Error('Unsupported application');
 const token=await getToken();
 if(typeof token!=='string'||!token)throw Error('Unauthorized');
 const r=await fetchImpl(new URL('/api/apps/'+target,base).href,{headers:{Authorization:'Bearer '+token},redirect:'error',cache:'no-store',credentials:'omit'});
 if(!r.ok)throw Error('Gateway HTTP '+r.status);
 const data=await r.json();
 if(!data.name?.endsWith('/documents/apps/'+id))throw Error('Unexpected document');
 return data;
 }};
}
