// Delegated GitHub OIDC exchange; no persistent service-account key.
export function createGithubWif({fetchImpl=(...args)=>globalThis.fetch(...args)}={}){
 const audience='//iam.googleapis.com/projects/316863421809/locations/global/workloadIdentityPools/appcore-github/providers/github';
 async function post(url,body,token){
 const r=await fetchImpl(url,{method:'POST',redirect:'manual',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(body)});
 if(!r.ok)throw Error('Google identity exchange failed: '+r.status);
 return r.json();
 }
 return async function acquire(subjectToken){
 if(typeof subjectToken!=='string'||subjectToken.length>16384||!/^[-\w]+\.[-\w]+\.[-\w]+$/.test(subjectToken))throw Error('Invalid subject token');
 const sts=await post('https://sts.googleapis.com/v1/token',{audience,grant_type:'urn:ietf:params:oauth:grant-type:token-exchange',requested_token_type:'urn:ietf:params:oauth:token-type:access_token',subject_token_type:'urn:ietf:params:oauth:token-type:jwt',subject_token:subjectToken,scope:'https://www.googleapis.com/auth/cloud-platform'});
 if(!sts.access_token)throw Error('Missing federated token');
 const result=await post('https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/appcore-worker@appcore-2026.iam.gserviceaccount.com:generateAccessToken',{scope:['https://www.googleapis.com/auth/cloud-platform'],lifetime:'600s'},sts.access_token);
 const expiresAt=Date.parse(result.expireTime);
 if(!result.accessToken||!Number.isFinite(expiresAt)||expiresAt<=Date.now())throw Error('Invalid service credential');
 return {accessToken:result.accessToken,expiresAt};
 };
}
