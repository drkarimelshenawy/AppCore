const names=['gateway','exmore-config','altabloh-android','altabloh-web','altabloh-site'];
export function validateHealth(report){
 if(!Array.isArray(report?.results)||report.results.length!==5)throw Error('Invalid report');
 return names.map(name=>{
  const matches=report.results.filter(r=>r?.name===name);
  if(matches.length!==1)throw Error('Invalid target');
  const r=matches[0];
  if(typeof r.ok!=='boolean'||!Number.isInteger(r.latencyMs)||r.latencyMs<0||r.latencyMs>60000)throw Error('Invalid result');
  const status=r.status??0;
  if(!Number.isInteger(status)||status<0||status>599||r.ok!==(status>=200&&status<300))throw Error('Invalid status');
  return {name,ok:r.ok,status,latencyMs:r.latencyMs};
 });
}
