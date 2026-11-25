import {canonicalProjectId} from '../dashboard/identity.mjs';
// Shared read-only control-center contract; authentication is supplied by the host.
export const APP_IDS=Object.freeze(['exmore','altabloh']);
export const PLATFORMS=Object.freeze(['android','web']);
export function validateTarget(appId,platform){
 appId=canonicalProjectId(appId);
 if(!APP_IDS.includes(appId)||!PLATFORMS.includes(platform))throw new Error('Invalid application target');
 return {appId,platform};
}
export function createControlCenter({google,authorize}){
 if(typeof authorize!=='function'||typeof google?.getDocument!=='function')throw new TypeError('Dependencies required');
 return {
 async readApp(request,appId,platform){
  const target=validateTarget(appId,platform);
  if(await authorize(request)!==true)throw Object.assign(new Error('Forbidden'),{status:403});
  return {target,document:await google.getDocument('apps',target.appId)};
 },
 async validateNotification(request,appId,title,body){
  appId=canonicalProjectId(appId);
  if(!APP_IDS.includes(appId))throw new Error('Invalid application');
  if(await authorize(request)!==true)throw Object.assign(new Error('Forbidden'),{status:403});
  return google.validateTestNotification(appId,title,body);
 }
 };
}
