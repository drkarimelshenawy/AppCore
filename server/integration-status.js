// Read-only, bounded summaries. External credentials never leave the worker.
const repos=Object.freeze({appcore:['AppCore','feat/appcore-command-center'],exmore:['todo-shift-android','feat/exmore-official-identity-migration'],altabloh:['3al-Tabloh','feat/official-identity-migration-20261125']});
const validTime=v=>typeof v==='string'&&Number.isFinite(Date.parse(v))?new Date(v).toISOString():null;
const slug=/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/;
async function json(url,token,fetchImpl,extra={}){
 const r=await fetchImpl(url,{headers:{Authorization:'Bearer '+token,Accept:'application/json',...extra},redirect:'error',signal:AbortSignal.timeout(8000)});
 if(!r.ok){await r.body?.cancel();throw Error('Upstream HTTP '+r.status)}
 const raw=await r.text();if(raw.length>1500000)throw Error('Oversized response');return JSON.parse(raw);
}
export async function githubStatus(env,fetchImpl=(...a)=>fetch(...a)){
 if(!env.APPCORE_GITHUB_READ_TOKEN)return {status:'not-configured'};
 const projects=await Promise.all(Object.entries(repos).map(async([id,[repo,branch]])=>{
  try{
   const url='https://api.github.com/repos/drkarimelshenawy/'+repo+'/actions/runs?branch='+encodeURIComponent(branch)+'&per_page=10';
   const r=await json(url,env.APPCORE_GITHUB_READ_TOKEN,fetchImpl,{'X-GitHub-Api-Version':'2022-11-28','User-Agent':'AppCore-status'});
   if(!Array.isArray(r.workflow_runs)||r.workflow_runs.length>10)throw Error('Unexpected runs');
   const runs=r.workflow_runs.map(w=>{
    if(!Number.isSafeInteger(w.id)||w.id<1||w.head_branch!==branch||!/^[0-9a-f]{40}$/.test(w.head_sha??'')||!['queued','in_progress','completed','requested','waiting','pending'].includes(w.status))throw Error('Invalid run');
    return {id:w.id,name:typeof w.name==='string'?w.name.slice(0,100):'Workflow',commit:w.head_sha,status:w.status,conclusion:typeof w.conclusion==='string'?w.conclusion.slice(0,30):null,updatedAt:validTime(w.updated_at),url:'https://github.com/drkarimelshenawy/'+repo+'/actions/runs/'+w.id};
   });
   return {id,branch,status:'available',runs};
  }catch{return {id,branch,status:'unavailable'}}
 }));
 return {status:projects.every(x=>x.status==='available')?'available':projects.some(x=>x.status==='available')?'partial':'unavailable',projects};
}
export async function sentryStatus(env,fetchImpl=(...a)=>fetch(...a)){
 const {APPCORE_SENTRY_TOKEN:token,APPCORE_SENTRY_ORG:org,APPCORE_SENTRY_PROJECT_ID:project,APPCORE_SENTRY_REGION:region}=env;
 if(!token||!slug.test(org??'')||! /^[1-9][0-9]{0,19}$/.test(project??'')||!['us','de'].includes(region))return {status:'not-configured'};
 try{
  const url='https://'+region+'.sentry.io/api/0/organizations/'+encodeURIComponent(org)+'/issues/?project='+project+'&statsPeriod=24h&query='+encodeURIComponent('is:unresolved issue.category:error')+'&limit=30&sort=date';
  const rows=await json(url,token,fetchImpl);
  if(!Array.isArray(rows)||rows.length>30)throw Error('Unexpected issues');
  const issues=rows.map(x=>{
   if(String(x.project?.id)!==project||!/^[1-9][0-9]{0,30}$/.test(String(x.id??'')))throw Error('Unexpected project or issue');
   return {id:String(x.id),lastSeen:validTime(x.lastSeen),level:['fatal','error','warning','info','debug'].includes(x.level)?x.level:'unknown'};
  });
  return {status:'available',scope:'Unresolved error issues, past 24h, sample up to 30; not total events',issues};
 }catch{return {status:'unavailable'}}
}
export async function ownerIntegrationStatus(request,env,authorize,fetchImpl=(...a)=>fetch(...a)){
 const origin=request.headers.get('Origin');
 const allowed=['https://appcore-2026.web.app','https://appcore-2026.firebaseapp.com','https://appcore-2026--gateway-poc-ill315eo.web.app'].includes(origin);
 const headers={'Cache-Control':'no-store','Vary':'Origin',...(allowed?{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'GET, OPTIONS','Access-Control-Allow-Headers':'Authorization'}:{})};
 const respond=(value,status=200)=>Response.json(value,{status,headers});
 if(!allowed)return respond({error:'Forbidden origin'},403);
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(request.method!=='GET')return respond({error:'Method not allowed'},405);
 const auth=await authorize(request,'exmore');if(!auth.ok)return respond({error:'Owner authorization required'},auth.status===401?401:403);await auth.body?.cancel();
 const [github,sentry]=await Promise.all([githubStatus(env,fetchImpl),sentryStatus(env,fetchImpl)]);
 return respond({github,sentry,checkedAt:new Date().toISOString()});
}
