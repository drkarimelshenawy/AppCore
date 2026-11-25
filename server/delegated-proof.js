import {createGithubWif} from './google-wif.js';
import {createGoogleRest} from './google-rest.js';
export async function delegatedProof(request,{acquire=createGithubWif(),makeApi=createGoogleRest}={}){
 const token=request.headers.get('Authorization')||'';
 if(!/^Bearer [-\w]+\.[-\w]+\.[-\w]+$/.test(token)||token.length>16400)return new Response(null,{status:401});
 try{
 const credential=await acquire(token.slice(7));
 const api=makeApi({projectId:'appcore-2026',credentials:{getAccessToken:async()=>credential.accessToken}});
 await api.getDocument('apps','exmore');
 await api.validateTestNotification('exmore','AppCore proof','Validation only');
 return Response.json({read:true,fcmValidated:true,notificationSent:false},{headers:{'Cache-Control':'no-store'}});
 }catch{return new Response(null,{status:403,headers:{'Cache-Control':'no-store'}});}
}
