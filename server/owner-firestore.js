// Owner-scoped Firebase REST access. Firebase enforces deployed security rules.
export function createOwnerFirestore({projectId,fetchImpl=fetch}){
 if(!/^[a-z][a-z0-9-]{4,29}$/.test(projectId))throw new Error('Invalid project');
 const base='https://firestore.googleapis.com/v1/projects/'+projectId+'/databases/(default)/documents/apps/';
 return async function readApp(request,appId){
  if(!['exmore','altabloh'].includes(appId))return new Response(null,{status:404});
  const auth=request.headers.get('Authorization')||'';
  if(!/^Bearer [A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(auth)||auth.length>8192)return new Response(null,{status:401});
  try{
   const result=await fetchImpl(base+(appId==='altabloh'?'3al-tabloh':appId),{headers:{Authorization:auth},redirect:'error'});
   if(!result.ok)return new Response(null,{status:[401,403,404].includes(result.status)?result.status:502});
   return Response.json(await result.json(),{headers:{'Cache-Control':'no-store'}});
  }catch{return new Response(null,{status:502});}
 };
}
