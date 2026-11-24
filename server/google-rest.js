export function createGoogleRest({projectId, credentials, fetchImpl=fetch}) {
  if (!/^[a-z][a-z0-9-]{4,29}$/.test(projectId)) throw new Error("Invalid project ID");
  async function request(url, method, body) {
    const token=await credentials.getAccessToken();
    const response=await fetchImpl(url,{method,redirect:"error",headers:{Authorization:"Bearer "+token,"Content-Type":"application/json"},...(body===undefined?{}:{body:JSON.stringify(body)})});
    if(!response.ok) throw Object.assign(new Error("Google API request failed"),{status:response.status});
    return response.json();
  }
  const base="https://firestore.googleapis.com/v1/projects/"+projectId+"/databases/(default)/documents";
  return {
    getDocument(collection,id) {
      if(![collection,id].every(x=>typeof x==="string" && /^[A-Za-z0-9_-]{1,150}$/.test(x))) throw new Error("Invalid document path");
      return request(base+"/"+collection+"/"+id,"GET");
    },
    validateTestNotification(appId,title,body) {
      if(!["exmore","altabloh"].includes(appId)||typeof title!=="string"||!title.trim()||title.length>100||typeof body!=="string"||!body.trim()||body.length>1000) throw new Error("Invalid test notification");
      return request("https://fcm.googleapis.com/v1/projects/"+projectId+"/messages:send","POST",{validate_only:true,message:{topic:appId+"_test",notification:{title,body}}});
    }
  };
}
