// Isolated proof of connectivity; never accepts credentials or sends notifications.
export default {
 async fetch(request, env) {
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.pathname !== '/health') return new Response('Not found',{status:404});
  return Response.json({service:'appcore-poc',status:'ok',secretBinding:env.POC_TEST_SECRET==='synthetic-test-only-not-a-credential'},{headers:{'Cache-Control':'no-store'}});
 },
 async scheduled(controller, env) {
  const endpoints = [
   ['firestore','https://firestore.googleapis.com/v1/projects/appcore-2026/databases/(default)/documents/apps/exmore'],
   ['fcm','https://fcm.googleapis.com/v1/projects/appcore-2026/messages:send']
  ];
  for (const [service,url] of endpoints) {
   try {
    const response=await fetch(url,{method:'GET',redirect:'error',signal:AbortSignal.timeout(5000)});
    console.log(JSON.stringify({event:'google-connectivity',service,status:response.status}));
    await response.body?.cancel();
   } catch {
    console.log(JSON.stringify({event:'google-connectivity',service,status:'unreachable'}));
   }
  }
 }
};
