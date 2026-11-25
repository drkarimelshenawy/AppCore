import {identityFor,canonicalProjectId} from './identity.mjs';
export const API_VERSION=1;
export function targetFor(projectId,platform){
 const p=identityFor(projectId);
 if(!p||p.androidStatus==='future'||!p.platforms?.includes(platform))throw Error('Unsupported target');
 return {projectId:canonicalProjectId(projectId),platform};
}
export function publicConfig(input,target,now=Date.now()){
 if(!input||Object.keys(input).sort().join(',')!=='expiresAt,flags,maintenance,projectId,revision,schemaVersion,platform'.split(',').sort().join(','))throw Error('Invalid configuration fields');
 if(input.schemaVersion!==API_VERSION||input.projectId!==target.projectId||input.platform!==target.platform||!Number.isSafeInteger(input.revision)||input.revision<1||!Number.isSafeInteger(input.expiresAt)||input.expiresAt<=now||input.expiresAt>now+86400000||typeof input.maintenance!=='boolean'||!input.flags||typeof input.flags!=='object'||Array.isArray(input.flags)||Object.keys(input.flags).length>50)throw Error('Invalid configuration');
 for(const [key,value] of Object.entries(input.flags))if(!/^[a-z][a-z0-9_]{0,39}$/.test(key)||typeof value!=='boolean'||['constructor','prototype'].includes(key))throw Error('Invalid flag');
 return {...input,flags:{...input.flags}};
}
export function localDefaults(){return {maintenance:false,flags:{},revision:0};}
