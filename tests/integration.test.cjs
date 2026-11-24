const {test}=require("node:test");
const assert=require("node:assert/strict");
const {initializeApp,deleteApp}=require("firebase/app");
const {getFunctions,connectFunctionsEmulator,httpsCallable}=require("firebase/functions");
test("real callable transport rejects unauthenticated requests",async()=>{
 const app=initializeApp({projectId:"demo-appcore",apiKey:"demo-key",appId:"demo"},"integration");
 try{
 const f=getFunctions(app);connectFunctionsEmulator(f,"127.0.0.1",5001);
 for(const name of ["publishRelease","sendTestNotification","getRemoteConfig","updateRemoteConfig","getAnalyticsSummary","getCrashSummary","getAuditLog","getAdminAlerts","acknowledgeAdminAlert","checkWebsite","listManagedDrafts","saveManagedDraft"]){
 await assert.rejects(httpsCallable(f,name)({appId:"exmore"}),e=>e.code==="functions/permission-denied");
 }
 }finally{await deleteApp(app);}
});
