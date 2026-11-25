export async function checkWebsite({fetchImpl=(...a)=>globalThis.fetch(...a),now=Date.now}={}){
 const start=now(),controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
 try{const response=await fetchImpl('https://al-tabloh.web.app/',{redirect:'manual',signal:controller.signal});const status=response.status;await response.body?.cancel();return {status,healthy:status>=200&&status<300,latencyMs:Math.max(0,now()-start),checkedAt:new Date(now()).toISOString()};}
 catch{return {status:null,healthy:false,latencyMs:Math.max(0,now()-start),checkedAt:new Date(now()).toISOString()};}finally{clearTimeout(timer);}
}
