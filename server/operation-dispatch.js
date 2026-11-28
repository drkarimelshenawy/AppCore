// Fixed-path, owner-authorized bridge to existing push-triggered Actions.
const repo='https://api.github.com/repos/drkarimelshenawy/AppCore';
const branch='feat/appcore-command-center';
const path='.appcore/operation-request.json';
const operations=new Set(['notify','webnotify','health','analytics','diagnostics','cycle']);
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
export function operationRequest(input,invocation=crypto.randomUUID()){
 if(!input||input.confirm!==true||!operations.has(input.operation))throw Error('Invalid operation');
 const notify=['notify','webnotify'].includes(input.operation);
 if(notify&&!uuid.test(input.notificationId??''))throw Error('Invalid job ID');
 if(!notify&&input.notificationId)throw Error('Unexpected job ID');
 return {operation:input.operation,notificationId:notify?input.notificationId:'',confirm:true,invocation};
}
export async function dispatchOperation(input,{token,fetchImpl=(...a)=>fetch(...a),invocation}={}){
 const value=operationRequest(input,invocation);
 if(typeof token!=='string'||!token.trim())throw Error('Operation bridge not activated');
 const headers={Authorization:'Bearer '+token,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'AppCore-operations','Content-Type':'application/json'};
 const url=repo+'/contents/'+path;
 const get=await fetchImpl(url+'?ref='+encodeURIComponent(branch),{headers,redirect:'error',signal:AbortSignal.timeout(10000)});
 if(!get.ok)throw Error('Operation request unavailable: '+get.status);
 const old=await get.json();
 if(old.path!==path||!/^[0-9a-f]{40}$/.test(old.sha??''))throw Error('Unexpected request file');
 if(typeof old.content==='string'&&old.encoding==='base64'){
  let previous;try{previous=JSON.parse(atob(old.content.replace(/\s/g,'')))}catch{}
  if(previous?.invocation===value.invocation)return {status:'already_requested'};
 }
 const put=await fetchImpl(url,{method:'PUT',headers,redirect:'error',signal:AbortSignal.timeout(10000),body:JSON.stringify({branch,sha:old.sha,message:'AppCore: approve '+value.operation+' operation',content:btoa(JSON.stringify(value,null,2)+'\n')})});
 if(!put.ok)throw Error('Operation request not confirmed: '+put.status);
 const result=await put.json();
 if(!/^[0-9a-f]{40}$/.test(result.commit?.sha??''))throw Error('No commit receipt');
 return {status:'requested',commit:result.commit.sha};
}
export async function ownerDispatch(request,env,authorize,dispatch=dispatchOperation){
 const origin=request.headers.get('Origin');
 const allowed=['https://appcore-2026.web.app','https://appcore-2026.firebaseapp.com','https://appcore-2026--gateway-poc-ill315eo.web.app'].includes(origin);
 const headers={'Cache-Control':'no-store','Vary':'Origin',...(allowed?{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Authorization, Content-Type'}:{})};
 const respond=(body,status)=>Response.json(body,{status,headers});
 if(!allowed)return respond({error:'Forbidden origin'},403);
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(request.method!=='POST')return respond({error:'Method not allowed'},405);
 const auth=await authorize(request,'exmore');
 if(!auth.ok)return respond({error:'Owner authorization required'},auth.status===401?401:403);
 await auth.body?.cancel();
 if(env.APPCORE_OPERATION_BRIDGE!=='true'||!env.APPCORE_OPERATION_TOKEN)return respond({error:'Operation bridge not activated'},503);
 if(!/^application\/json(?:;|$)/i.test(request.headers.get('Content-Type')??''))return respond({error:'JSON required'},415);
 let value;
 try{const raw=await request.text();if(raw.length>1024)throw Error();value=operationRequest(JSON.parse(raw));}catch{return respond({error:'Invalid operation'},400)}
 try{return respond(await dispatch(value,{token:env.APPCORE_OPERATION_TOKEN,invocation:value.invocation}),202)}
 catch{return respond({error:'Request not confirmed; inspect job status before retry'},502)}
}
export async function scheduledOperations(controller,env,dispatch=dispatchOperation){
 if(env.APPCORE_OPERATION_BRIDGE!=='true'||env.APPCORE_AUTO_CYCLE!=='true'||!env.APPCORE_OPERATION_TOKEN)return null;
 const t=controller?.scheduledTime;
 if(!Number.isFinite(t)||new Date(t).getUTCMinutes()!==0)return null;
 const invocation='cycle-'+Math.floor(t/3600000);
 return dispatch({operation:'cycle',confirm:true},{token:env.APPCORE_OPERATION_TOKEN,invocation});
}
