// Official identity is independent of historical Firestore routing.
export const PROJECTS=Object.freeze({
 exmore:Object.freeze({projectId:'exmore',name:'ExMore',applicationId:'com.exmore.app',storageId:'exmore',androidStatus:'unverified'}),
 altabloh:Object.freeze({projectId:'altabloh',name:'ع التابلوه',applicationId:'com.altabloh.app',legacyApplicationIds:Object.freeze(['com.drkarimelshenawy.altabloh']),platforms:Object.freeze(['android','web']),storageId:'3al-tabloh',androidStatus:'verified'}),
 appcore:Object.freeze({projectId:'appcore',name:'AppCore',applicationId:'com.appcore.admin',storageId:'appcore',androidStatus:'future'})
});
export function canonicalProjectId(id){return id==='3al-tabloh'?'altabloh':id;}
export function identityFor(id){const key=canonicalProjectId(id);return Object.hasOwn(PROJECTS,key)?PROJECTS[key]:null;}
export function storageIdFor(id){return identityFor(id)?.storageId??id;}
export function identityMetadata(id){const p=identityFor(id);return p?{projectId:p.projectId,applicationId:p.applicationId,legacyApplicationIds:p.legacyApplicationIds??[],platforms:p.platforms??[],androidStatus:p.androidStatus}: {projectId:id};}
