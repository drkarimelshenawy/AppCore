import {writeFile} from 'node:fs/promises';
const base='https://appcore-poc.dr-karimelshenawy.workers.dev';
const targets=[['gateway',base+'/health'],['exmore-config',base+'/api/v1/apps/exmore/android/config'],['altabloh-android',base+'/api/v1/apps/altabloh/android/config'],['altabloh-web',base+'/api/v1/apps/altabloh/web/config'],['altabloh-site','https://al-tabloh.web.app/']];
const results=await Promise.all(targets.map(async ([name,url])=>{const start=Date.now();try{const r=await fetch(url,{redirect:'manual',signal:AbortSignal.timeout(8000)});await r.body?.cancel();return {name,status:r.status,ok:r.ok,latencyMs:Date.now()-start}}catch(e){return {name,ok:false,error:e.name,latencyMs:Date.now()-start}}}));
const report={checkedAt:new Date().toISOString(),results};console.log(JSON.stringify(report,null,2));if(process.argv[2])await writeFile(process.argv[2],JSON.stringify(report,null,2));if(results.some(r=>!r.ok))process.exitCode=1;
