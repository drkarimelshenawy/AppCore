// Map the five known probes to dashboard history; preserve HTTP 200 invalid-contract failures.
const keys={'exmore/gateway':'gateway','exmore/android-config':'exmore-config','altabloh/android-config':'altabloh-android','altabloh/web-config':'altabloh-web','altabloh/website':'altabloh-site'};
export function healthFields(rows,now){
 if(!Array.isArray(rows)||rows.length!==5||!Number.isFinite(now))throw Error('Invalid health sample');
 const seen=new Set();const mapped=rows.map(r=>{const name=keys[r.app+'/'+r.key];if(!name||seen.has(name)||typeof r.ok!=='boolean'||!Number.isSafeInteger(r.status)||r.status<0||r.status>599||!Number.isSafeInteger(r.latencyMs)||r.latencyMs<0||r.latencyMs>60000||r.ok&&!(r.status>=200&&r.status<300))throw Error('Invalid probe');seen.add(name);return {mapValue:{fields:{name:{stringValue:name},ok:{booleanValue:r.ok},status:{integerValue:String(r.status)},latencyMs:{integerValue:String(r.latencyMs)}}}}});
 return {createdAt:{timestampValue:new Date(now).toISOString()},results:{arrayValue:{values:mapped}},failed:{integerValue:String(rows.filter(r=>!r.ok).length)}};
}
