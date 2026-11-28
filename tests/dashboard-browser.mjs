import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import assert from 'node:assert/strict';
const root=resolve('dashboard'),server=createServer(async(req,res)=>{
 try{const p=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname==='/'
 ?'/index.html':new URL(req.url,'http://localhost').pathname));if(!p.startsWith(root+sep))throw Error('path');const body=await readFile(p);res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml'})[extname(p)]||'application/octet-stream');res.end(body)}catch{res.writeHead(404);res.end()}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({headless:true});const failures=[];
const fixture=`
window.__calls=[];
const stamp={toDate:()=>new Date('2026-11-28T02:12:00Z')};
window.appcoreHealthRuns=async()=>[{createdAt:stamp,failed:0,results:[{name:'gateway',ok:true,latencyMs:136},{name:'web',ok:true,latencyMs:300}]}];
window.appcoreDrafts=async()=>[];window.appcoreDevices=async()=>[];
window.appcoreBulletin=async(id,mode,v)=>{window.__calls.push([mode,v?.scope]);return {revision:0,active:false}};
window.appcoreConfigDraft=async()=>({revision:1,config:{maintenance:false,flags:{}}});
window.appcorePublishConfig=async(...x)=>{window.__calls.push(['publishConfig',...x]);return {revision:2}};
window.appcoreOperationalQueue=async()=>[];window.appcoreDiagnosticSnapshot=async()=>null;
window.appcoreCall=async(name)=>name==='getAnalyticsSummary'?{status:'available',rows:[{id:'2026-11-27',activeUsers:3,sessions:4,eventCount:8}],web:{status:'no-data',rows:[]}}:{items:[],entries:[],alerts:[],issues:[]};
window.appcoreExternalStatus=async()=>({github:{status:'not-configured'},sentry:{status:'not-configured'}});
window.appcoreDispatchOperation=async(op)=>{window.__calls.push(['dispatch',op]);return 'a'.repeat(40)};
window.appcoreRegisteredDevices=async()=>({active24h:1,sampled:1,rows:[]});
window.__session=(connected=true)=>window.dispatchEvent(new CustomEvent('appcore-data',{detail:{connected,apps:connected?[{id:'exmore',name:'ExMore',projectId:'exmore',applicationId:'com.exmore.app',platforms:['android'],connected:true},{id:'3al-tabloh',name:'ع التابلوه',projectId:'altabloh',platforms:['android','web'],connected:true}]:[]}}));
document.querySelector('#login').disabled=false;
`;
async function run(width,height){
 const page=await browser.newPage({viewport:{width,height}});page.on('pageerror',e=>failures.push(e.message));
 await page.route('**/auth.js?*',route=>route.fulfill({status:200,contentType:'text/javascript',body:fixture}));
 await page.route(url=>!url.href.startsWith(base),route=>route.abort());
 await page.goto(base);await page.waitForFunction(()=>typeof window.__session==='function');
 assert.equal(await page.locator('#nav button').count(),9);
 assert.equal(await page.locator('img[src="./brand.svg"]').first().evaluate(x=>x.complete&&x.naturalWidth>0),true);
 await page.evaluate(()=>window.__session());await page.locator('.service-row').first().waitFor();
 assert.match(await page.locator('main').innerText(),/2 \/ 2 سليمة/);
 async function go(key){if(width<=850)await page.locator('#menu').click();await page.locator('#nav button[data-key="'+key+'"]').click();await page.waitForFunction(k=>location.hash==='#'+k,key);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,'horizontal overflow '+key+' '+width)}
 await go('apps');await page.getByRole('button',{name:'إدارة التطبيق',exact:true}).first().click();
 await page.getByRole('tab',{name:'التحكم عن بُعد',exact:true}).click();
 await page.getByRole('button',{name:'تحميل المسودة',exact:true}).click();
 assert.equal(await page.locator('select').first().inputValue(),'pilot');
 page.once('dialog',d=>d.dismiss());await page.getByRole('button',{name:'نشر المسودة المحفوظة'}).click();assert.equal(await page.evaluate(()=>window.__calls.some(c=>c[0]==='publishConfig')),false);
 page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'نشر المسودة المحفوظة'}).click();assert.equal(await page.evaluate(()=>window.__calls.find(c=>c[0]==='publishConfig')?.at(-1)),'pilot');
 await go('operations');page.once('dialog',d=>d.dismiss());await page.getByRole('button',{name:'مزامنة الإحصائيات',exact:true}).click();assert.equal(await page.evaluate(()=>window.__calls.some(c=>c[0]==='dispatch')),false);
 await page.getByRole('button',{name:'تحميل حالة التكاملات'}).click();assert.match(await page.locator('main').innerText(),/غير مهيأ/);
 await go('analytics');await page.getByRole('button',{name:'تحميل البيانات',exact:true}).first().click();assert.equal(await page.locator('.chart-row').count(),1);assert.match(await page.locator('main').innerText(),/لا تجمع القيم/);
 for(const key of ['notifications','content','monitor','logs','settings','overview'])await go(key);
 await page.locator('#theme').click();assert.equal(await page.locator('body').evaluate(e=>e.classList.contains('light')),true);
 await page.reload();assert.equal(await page.locator('body').evaluate(e=>e.classList.contains('light')),true);
 await page.evaluate(()=>window.__session());await page.locator('#navigation-search').fill('الإشعارات');await page.locator('#search-results button').first().click();assert.equal(await page.evaluate(()=>location.hash),'#notifications');
 await page.evaluate(()=>window.__session(false));assert.match(await page.locator('main').innerText(),/سجل الدخول/);assert.equal(await page.getByRole('button',{name:'إنشاء طلب اختبار'}).count(),0);
 await page.close();console.log('PASS browser '+width+'x'+height+': layout, navigation, data cards, theme, search, pilot default, confirmation and sign-out');
}
try{await run(1440,900);await run(360,800);assert.deepEqual(failures,[])}finally{await browser.close();server.close()}
