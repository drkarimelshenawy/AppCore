"use strict";
const modules={releases:"إدارة الإصدارات",notifications:"الإشعارات",analytics:"الإحصائيات",crashes:"مراقبة الأعطال",remote:"التحكم عن بُعد",alerts:"تنبيهات الإدارة",web:"مراقبة الموقع",content:"إدارة المحتوى",database:"قواعد البيانات العامة"};
const common=["releases","notifications","analytics","crashes","remote","alerts"];
const profiles={exmore:common,"3al-tabloh":[...common,"web","content","database"]};
const nav=document.querySelector("#nav"),main=document.querySelector("#main");
let apps=[],connected=false,active="overview";
function selected(a){return Array.isArray(a.modules)?a.modules.filter(m=>Object.hasOwn(modules,m)):profiles[a.id]||[];}
function el(tag,text,cls){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;}
function card(title,detail){const n=el('section',undefined,'card');n.append(el('h2',title),el('p',detail));return n;}
const pages=[
 ["overview","الرئيسية","Overview","home"],["apps","التطبيقات","Applications","layers"],["operations","العمليات وسير العمل","Operations","workflow"],["monitor","المراقبة والصحة","Monitoring","pulse"],["analytics","التحليلات والتشخيص","Analytics","chart"],["notifications","الإشعارات والأجهزة","Notifications","bell"],["content","المحتوى والكتالوجات","Content","database"],["logs","السجل والتدقيق","Audit","terminal"],["settings","الإعدادات والتكاملات","Settings","settings"]
];
const glyphs={home:'<path d="M3 11 12 3l9 8v10h-6v-7H9v7H3z"/>',layers:'<path d="m12 3 10 6-10 6L2 9zM2 13l10 6 10-6M2 17l10 6 10-6"/>',workflow:'<rect x="9" y="2" width="6" height="5" rx="1"/><rect x="2" y="17" width="6" height="5" rx="1"/><rect x="16" y="17" width="6" height="5" rx="1"/><path d="M12 7v5M5 17v-5h14v5"/>',pulse:'<path d="M2 12h5l3-8 4 16 3-8h5"/>',chart:'<path d="M4 3v18h17M8 17v-5m5 5V7m5 10V4"/>',bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 8-3 8h18s-3-1-3-8m-8 11a2 2 0 0 0 4 0"/>',database:'<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 4 18 4 18 0V5M3 12c0 4 18 4 18 0"/>',terminal:'<rect x="2" y="3" width="20" height="18" rx="3"/><path d="m6 8 4 4-4 4m7 0h5"/>',settings:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2"/>',shield:'<path d="m12 2 9 4v6c0 5-5 8-9 10-4-2-9-5-9-10V6zM8 12l3 3 5-6"/>',device:'<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M10 18h4"/>',arrow:'<path d="M20 12H4m7-7-7 7 7 7"/>',code:'<path d="m8 6-6 6 6 6m8-12 6 6-6 6m-2-14-4 16"/>'};
function icon(name){const n=el('span',undefined,'ui-icon');n.setAttribute('aria-hidden','true');n.innerHTML='<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">'+(glyphs[name]||glyphs.layers)+'</svg>';return n}
function badge(label,tone='neutral'){return el('span',label,'status-pill '+tone)}
function action(label,fn,primary=false){const b=el('button',label,primary?'primary':undefined);b.type='button';b.onclick=fn;return b}
function heading(title,detail,english){const n=el('div',undefined,'page-heading'),t=el('div');t.append(el('p','APPCORE / '+english.toUpperCase(),'eyebrow'),el('h1',title),el('p',detail));n.append(t);main.append(n);return n}
function grid(cards,cls='card-grid'){const n=el('div',undefined,cls);n.append(...cards.filter(Boolean));return n}
function metric(label,value,ico,detail){const n=el('section',undefined,'card metric-card'),r=el('div',undefined,'metric-icon');r.append(el('p',label),icon(ico));n.append(r,el('div',String(value),'metric'),el('small',detail));return n}
function sectionHeading(label){const n=el('div',undefined,'section-heading');n.append(el('h2',label));main.append(n);return n}
function rawDetails(value){const d=el('details',undefined,'structured-details');d.append(el('summary','عرض البيانات التقنية (JSON)'),el('pre',JSON.stringify(value,null,2),'console-output'));return d}
function empty(text){return el('div',text,'empty')}
function appAvatar(a){const n=el('div',undefined,'app-avatar '+(a.id==='3al-tabloh'?'altabloh':''));if(a.id==='appcore'){const i=el('img');i.src='./brand.svg';i.alt='';n.append(i)}else n.textContent=a.id==='exmore'?'Ex':a.id==='3al-tabloh'?'ع':String(a.name||a.id||'?').slice(0,2);return n}
function applicationCard(a){const c=el('article',undefined,'card app-card'),head=el('div',undefined,'app-heading'),t=el('div',undefined,'app-title');t.append(el('h2',a.name||a.id),el('p',a.projectId||a.id));head.append(appAvatar(a),t,badge(a.connected?'الربط مسجل':'الربط غير مؤكد',a.connected?'good':'neutral'));const meta=el('div',undefined,'meta-line');for(const v of (a.platforms||[]))meta.append(el('span',String(v).toUpperCase(),'tag'));if(a.applicationId)meta.append(el('span',a.applicationId,'tag'));c.append(head,meta,el('p',selected(a).length+' خدمات مخصصة — حالة التشغيل تُفحص بشكل مستقل.'));const row=el('div',undefined,'card-actions');row.append(action('إدارة التطبيق',()=>navigate(a.id),true));if(['exmore','3al-tabloh'].includes(a.id))row.append(action('الإصدارات',()=>navigate(a.id,'releases')));c.append(row);return c}
let scopeApp='',appTab='summary',lastSnapshot=null;
function activeApp(){return apps.find(a=>a.id===scopeApp)||apps[0]}
function supported(a){return a&&['exmore','3al-tabloh'].includes(a.id)}
function permitted(a,k){return a&&selected(a).includes(k)}
function useAppPicker(key,eligible=()=>true){const list=apps.filter(eligible);if(!list.length){main.append(empty('لا توجد تطبيقات متاحة لهذا القسم. سجل الدخول أو راجع الخدمات المخصصة.'));return null}const a=list.find(x=>x.id===scopeApp)||list[0];scopeApp=a.id;const t=el('div',undefined,'toolbar'),l=el('label','التطبيق المحدد'),s=el('select');s.setAttribute('aria-label','التطبيق المحدد');for(const x of list){const o=el('option',x.name||x.id);o.value=x.id;s.append(o)}s.value=a.id;s.onchange=()=>{scopeApp=s.value;show(key)};l.append(s);t.append(l,badge('نطاق التطبيق','info'));main.append(t);return a}
function gatewayPanel(a){const p=card('Cloudflare Gateway','اختبار قراءة سجل التطبيق بحساب الإدارة، لا يثبت اتصال أجهزة المستخدمين.');const r=el('p','لم يتم الاختبار');r.setAttribute('role','status');const b=action('اختبار الاتصال',async()=>{b.disabled=true;try{await window.appcoreCheckGateway(a.id);r.textContent='نجحت القراءة عبر Cloudflare وFirestore'}catch(e){r.textContent='تعذر الاتصال: '+e.message}finally{b.disabled=false}});p.append(b,r);return p}
function modulePanel(a){const form=el('form',undefined,'card'),list=el('div',undefined,'module-grid'),inputs=[];form.append(el('h2','الخدمات المخصصة'),el('p','تغيير الوحدات يحدد وظائف الإدارة؛ لا يعني اكتمال تكاملها.'));for(const [m,label] of Object.entries(modules)){const row=el('label',undefined,'module-option'),i=el('input');i.type='checkbox';i.checked=selected(a).includes(m);inputs.push([m,i]);row.append(i,el('span',label));list.append(row)}const save=el('button','حفظ إعدادات الخدمات','primary'),status=el('p','');save.type='submit';status.setAttribute('role','status');form.append(list,save,status);form.onsubmit=async e=>{e.preventDefault();save.disabled=true;try{await window.appcoreSaveModules(a.id,inputs.filter(x=>x[1].checked).map(x=>x[0]));status.textContent='تم الحفظ'}catch(e){status.textContent='تعذر الحفظ: '+(e.code||e.message)}finally{save.disabled=false}};return form}
function createAppPanel(){const form=el('form',undefined,'card'),id=el('input'),name=el('input'),save=el('button','إضافة تطبيق','primary'),status=el('p','');form.append(el('h2','إضافة تطبيق'),el('p','تسجيل تطبيق جديد في قاعدة الإدارة.'));id.pattern='[a-z0-9][a-z0-9-]{1,49}';id.placeholder='app-id';id.required=true;name.required=true;name.maxLength=100;for(const [title,i] of [['معرف التطبيق',id],['اسم التطبيق',name]]){const l=el('label',title);l.append(i);form.append(l)}status.setAttribute('role','status');form.append(save,status);form.onsubmit=async e=>{e.preventDefault();save.disabled=true;try{await window.appcoreCreateApp(id.value,name.value);status.textContent='تم طلب الإضافة'}catch(e){status.textContent='تعذر الإضافة: '+(e.code||e.message)}finally{save.disabled=false}};return form}
function healthSummary(){const p=card('صحة الخدمات','آخر فحص محفوظ — لا يمثل نسبة التوافر التاريخية.'),out=el('div');const b=action('تحديث الملخص',async()=>{b.disabled=true;out.textContent='جارٍ تحميل آخر فحص...';try{const rows=await window.appcoreHealthRuns('list');lastSnapshot=rows[0]||null;draw()}catch{out.textContent='تعذر تحميل سجل الفحص'}finally{b.disabled=false}});function draw(){out.replaceChildren();if(!lastSnapshot){out.append(empty('لا توجد نتيجة فحص محفوظة بعد.'));return}const r=lastSnapshot,items=Array.isArray(r.results)?r.results:[],ok=items.filter(x=>x.ok).length;out.append(badge(ok+' / '+items.length+' سليمة',ok===items.length&&items.length?'good':'warn'),el('p',r.createdAt?.toDate?.()?.toLocaleString()||'وقت الفحص غير متاح'));const max=Math.max(1,...items.map(x=>Number(x.latencyMs)||0));for(const v of items){const row=el('div',undefined,'service-row'),n=el('strong',String(v.name||'خدمة')),m=el('small',Number.isFinite(v.latencyMs)?v.latencyMs+' ms':'—'),track=el('div',undefined,'bar-track'),fill=el('div',undefined,'bar-fill');fill.style.width=Math.max(0,Math.min(100,(Number(v.latencyMs)||0)/max*100))+'%';track.append(fill);row.append(n,badge(v.ok?'OK':'FAILED',v.ok?'good':'bad'),m,track);out.append(row)}}p.append(out,b);b.disabled=!connected;draw();if(connected)void b.onclick();return p}
function quickActions(){const p=card('إجراءات سريعة','انتقل إلى الأداة المناسبة، دون تنفيذ أو إرسال تلقائي.'),r=el('div',undefined,'quick-grid');for(const [key,label,ico] of [['operations','تشغيل عملية','workflow'],['monitor','فحص الخدمات','pulse'],['notifications','إشعارات الاختبار','bell'],['apps','إدارة التطبيقات','layers']]){const b=action(label,()=>navigate(key));b.prepend(icon(ico));r.append(b)}p.append(r);return p}
function overview(){const h=el('section',undefined,'hero'),t=el('div'),img=el('img');img.src='./brand.svg';img.alt='';t.append(el('p','CONTROL CENTER / OVERVIEW','eyebrow'),el('h1','مركز القيادة الموحد'),el('p','إدارة التطبيقات والعمليات وصحة الخدمات من مكان واحد.'));h.append(t,img);main.append(h,grid([metric('التطبيقات المدارة',connected?apps.length:'—','layers','سجلات Firestore'),metric('الوحدات المخصصة',connected?apps.reduce((n,a)=>n+selected(a).length,0):'—','code','ليست عدد الخدمات العاملة'),metric('الربط المسجل',connected?apps.filter(a=>a.connected===true).length:'—','device','حالة التسجيل فقط'),metric('اتصال الإدارة',connected?'OK':'—','shield','تم التحقق من Firestore')],'grid'),grid([healthSummary(),quickActions()]));sectionHeading('التطبيقات');main.append(apps.length?grid(apps.map(applicationCard)):empty('سجل الدخول بحساب الإدارة لعرض التطبيقات.'))}
function applications(){heading('إدارة التطبيقات','عرض التطبيقات وهويتها وإعدادات خدماتها.','Applications');const search=el('input');search.type='search';search.placeholder='بحث بالاسم أو المعرف...';search.setAttribute('aria-label','بحث التطبيقات');const toolbar=el('div',undefined,'app-filter'),list=el('div',undefined,'card-grid');toolbar.append(search);main.append(toolbar,list);function draw(){const q=search.value.toLocaleLowerCase().trim();const matches=apps.filter(a=>[a.name,a.id,a.projectId,a.applicationId].some(v=>String(v||'').toLocaleLowerCase().includes(q)));list.replaceChildren(...matches.map(applicationCard));if(!matches.length)list.append(empty('لا توجد تطبيقات مطابقة.'))}search.oninput=draw;draw();if(connected)main.append(createAppPanel())}
const tabs=[['summary','نظرة عامة'],['releases','الإصدارات'],['remote','التحكم عن بُعد'],['notifications','الإشعارات'],['devices','الأجهزة'],['analytics','التحليلات'],['content','المحتوى'],['operations','العمليات'],['audit','السجل']];
function appTabs(a){return tabs.filter(([k])=>k==='summary'||k==='audit'||(k==='devices'&&supported(a))||(k==='operations'&&supported(a))||(k==='analytics'&&(permitted(a,'analytics')||permitted(a,'crashes')))||(k==='content'&&(permitted(a,'content')||permitted(a,'database')))||(['releases','remote','notifications'].includes(k)&&permitted(a,k)))}
function appSection(a,k){const s=supported(a);switch(k){case 'summary':return [applicationCard(a),s?gatewayPanel(a):null,modulePanel(a)];case 'releases':return [permitted(a,'releases')?draftPanel(a,'releases'):null,s?pilotReleasePanel(a):null];case 'remote':return [permitted(a,'remote')?configDraftPanel(a):null,s?omegaRenewPanel(a):null,s?bulletinPanel(a):null];case 'notifications':return [permitted(a,'notifications')?draftPanel(a,'notifications'):null,s&&permitted(a,'notifications')?operationsNotificationPanel(a):null,s&&a.id==='3al-tabloh'&&permitted(a,'notifications')?webPushPanel():null,s?bulletinPanel(a):null];case 'devices':return s?[registeredDevicePanel(a),pilotPairPanel(a),deviceRegistryPanel(a)]:[];case 'analytics':return [permitted(a,'analytics')?servicePanel(a,'analytics'):null,permitted(a,'crashes')?servicePanel(a,'crashes'):null,s&&(permitted(a,'crashes')||permitted(a,'analytics'))?diagnosticSnapshotPanel(a):null];case 'content':return [permitted(a,'content')?servicePanel(a,'content'):null,permitted(a,'database')?servicePanel(a,'database'):null,a.id==='3al-tabloh'?catalogPublishPanel():null];case 'operations':return [s?operationsDiagnosticsPanel(a):null,s?externalStatusPanel():null,s?healthHistoryPanel():null,permitted(a,'web')?servicePanel(a,'web'):null];case 'audit':return [s?controlAuditPanel(a):null,servicePanel(a,'audit'),permitted(a,'alerts')?servicePanel(a,'alerts'):null];default:return []}}
function appWorkspace(a){scopeApp=a.id;const h=heading(a.name||a.id,'مساحة إدارة التطبيق • '+(a.projectId||a.id),'Application');const back=action('كل التطبيقات',()=>navigate('apps'));back.prepend(icon('arrow'));h.append(back);const available=appTabs(a);if(!available.some(([k])=>k===appTab))appTab='summary';const t=el('div',undefined,'tabs');t.setAttribute('role','tablist');t.setAttribute('aria-label','أقسام التطبيق');for(const [key,label] of available){const b=action(label,()=>navigate(a.id,key));b.setAttribute('role','tab');b.setAttribute('aria-selected',String(key===appTab));t.append(b)}main.append(t,grid(appSection(a,appTab)))}
function settingsPanel(){const p=card('بيئة العمل والتكاملات','إعدادات العرض فقط؛ لا تتغير صلاحيات الخدمات أو مفاتيحها من هذا القسم.'),r=el('div',undefined,'service-row');r.append(el('strong','المظهر'),action('تبديل فاتح / داكن',()=>toggleTheme()));p.append(r);for(const [name,url] of [['Firebase','https://console.firebase.google.com/project/appcore-2026/overview'],['Cloudflare','https://dash.cloudflare.com/'],['GitHub','https://github.com/drkarimelshenawy/AppCore/actions'],['Google Cloud','https://console.cloud.google.com/'],['Sentry','https://sentry.io/']]){const row=el('div',undefined,'service-row'),a=el('a','فتح '+name);a.href=url;a.target='_blank';a.rel='noopener noreferrer';row.append(el('strong',name),a);p.append(row)}return p}
function closeNav(){document.querySelector('.sidebar').classList.remove('open');document.querySelector('#menu').setAttribute('aria-expanded','false')}
function navigate(key,tab='summary'){appTab=tab;const hash='#'+encodeURIComponent(key)+(pages.some(p=>p[0]===key)?'':'/'+encodeURIComponent(tab));if(location.hash!==hash)history.pushState(null,'',hash);show(key);closeNav();main.focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'})}
function show(key){active=key;main.replaceChildren();for(const b of nav.children)b.setAttribute('aria-current',String(b.dataset.key===key||(b.dataset.key==='apps'&&apps.some(a=>a.id===key))));const page=pages.find(p=>p[0]===key);document.title='AppCore | '+(page?.[1]||apps.find(a=>a.id===key)?.name||'مركز التحكم');if(key==='overview'){overview();return}if(key==='apps'){applications();return}const a=apps.find(a=>a.id===key);if(a){appWorkspace(a);return}if(!page){overview();return}
 const [,,en]=page;const descriptions={operations:'اعتماد عمليات التشغيل الآمنة، وقراءة نتائج GitHub.',monitor:'فحص لحظي وسجل محفوظ؛ لا يعادل قياس التوافر المستمر.',analytics:'إحصائيات Android وWeb منفصلة، ولقطات تشخيص مجمعة.',notifications:'طلبات اختبار، إعلانات، وتسجيلات الأجهزة الاختيارية.',content:'إدارة المسودات والنشر في نطاق الاختبار أو الإنتاج.',logs:'سجلات التحكم والتدقيق والتنبيهات الإدارية.',settings:'هوية المنصة وروابط إعداد الخدمات الخارجية.'};heading(page[1],descriptions[key],en);
 if(key==='monitor'){main.append(grid([publicHealthPanel(),healthSummary(),connected?healthHistoryPanel():null]));return}
 if(key==='settings'){main.append(grid([settingsPanel(),connected?externalStatusPanel():null]));return}
 if(!connected){main.append(empty('سجل الدخول بحساب الإدارة لفتح أدوات هذا القسم.'));return}
 const target=useAppPicker(key,key==='content'?x=>permitted(x,'content')||permitted(x,'database'):key==='analytics'?x=>permitted(x,'analytics')||permitted(x,'crashes'):key==='notifications'?x=>supported(x)||permitted(x,'notifications'):key==='operations'?supported:()=>true);if(!target)return;
 const cards=appSection(target,key==='logs'?'audit':key);if(key==='notifications'&&supported(target))cards.push(...appSection(target,'devices'));main.append(grid(cards))}
for(const [key,label,en,ico] of pages){const b=action(label,()=>navigate(key));b.className='nav-item';b.prepend(icon(ico));b.dataset.key=key;b.title=en;nav.append(b)}
function toggleTheme(){const light=document.body.classList.toggle('light');try{localStorage.setItem('appcore:theme',light?'light':'dark')}catch{}document.querySelector('#theme').setAttribute('aria-pressed',String(light))}
try{if(localStorage.getItem('appcore:theme')==='light')document.body.classList.add('light')}catch{}
document.querySelector('#theme').setAttribute('aria-pressed',String(document.body.classList.contains('light')));document.querySelector('#theme').onclick=toggleTheme;
const menu=document.querySelector('#menu');menu.onclick=()=>{const open=document.querySelector('.sidebar').classList.toggle('open');menu.setAttribute('aria-expanded',String(open))};document.addEventListener('click',e=>{const side=document.querySelector('.sidebar');if(side.classList.contains('open')&&!side.contains(e.target)&&!menu.contains(e.target))closeNav()});document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeNav();document.querySelector('#search-results').hidden=true}});
const search=document.querySelector('#navigation-search'),results=document.querySelector('#search-results');search.oninput=()=>{results.replaceChildren();const q=search.value.trim().toLocaleLowerCase();results.hidden=!q;if(!q)return;for(const [key,label,en] of [...pages,...apps.map(a=>[a.id,a.name||a.id,a.projectId||a.id])])if((label+' '+en).toLocaleLowerCase().includes(q)){results.append(action(label,()=>{search.value='';results.hidden=true;navigate(key)}))}if(!results.children.length)results.append(empty('لا توجد نتائج'))};search.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();results.querySelector('button')?.click()}};
function readLocation(){try{const [key,tab]=location.hash.slice(1).split('/').map(decodeURIComponent);appTab=tab||'summary';return key||'overview'}catch{return 'overview'}}
window.addEventListener('popstate',()=>show(readLocation()));window.addEventListener('hashchange',()=>show(readLocation()));
window.addEventListener('appcore-data',e=>{const was=connected;apps=Array.isArray(e.detail?.apps)?e.detail.apps:[];connected=e.detail?.connected===true;if(!connected)lastSnapshot=null;const c=document.querySelector('#connection');c.className='status-pill '+(connected?'good':'neutral');c.textContent=connected?'متصل بـ Firestore':'غير متحقق';const requested=readLocation();show(pages.some(p=>p[0]===requested)||apps.some(a=>a.id===requested)?requested:was&&!connected?'overview':active)});
show(readLocation());

function publicHealthPanel(){
 const panel=card('فحص الخدمات العامة','فحص مباشر؛ يوضح استجابة الخدمة ولا يثبت تسليم الإشعارات أو وصول الإعدادات إلى الأجهزة.');
 const button=el('button','فحص الآن'),status=el('p','لم يبدأ الفحص'),list=el('div');
 status.setAttribute('role','status');panel.append(button,status,list);
 button.onclick=async()=>{button.disabled=true;status.textContent='جارٍ الفحص';list.replaceChildren();
  try{const {checkPublicHealth}=await import('./public-health.mjs');const rows=await checkPublicHealth();
   for(const row of rows){const item=card(row.name,row.ok?'متاح — '+row.latencyMs+' ms':'غير متاح أو استجابة غير صالحة');if(row.status!==null)item.append(el('p','HTTP '+row.status));list.append(item)}
   status.textContent='اكتمل الفحص: '+rows.filter(row=>row.ok).length+' / '+rows.length;
  }catch{status.textContent='تعذر إجراء الفحص'}finally{button.disabled=false}}
 return panel;
}

function draftPanel(a,kind){
 const release=kind==="releases",panel=card(modules[kind],"مسودات — التشغيل يتطلب نشر الخادم"),form=el("form"),fields={};
 for(const [key,label,type] of release?[["version","الإصدار","text"],["code","Version code","number"],["url","رابط APK","url"],["notes","التغييرات","textarea"],["mandatory","تحديث إجباري","checkbox"]]:[["title","العنوان","text"],["body","المحتوى","textarea"]]){
 const l=el("label",label),input=el(type==="textarea"?"textarea":"input");if(type!=="textarea")input.type=type;input.required=!["notes","mandatory"].includes(key);if(type==="number"){input.min="1";input.max="2100000000";input.step="1";}fields[key]=input;l.append(input);form.append(l);}
 let editing;const save=el("button","حفظ المسودة"),status=el("p",""),list=el("div");const cancel=el("button","إلغاء التعديل");cancel.type="button";cancel.hidden=true;function reset(){editing=undefined;form.reset();save.textContent="حفظ المسودة";cancel.hidden=true;}cancel.onclick=reset;status.setAttribute("role","status");form.append(save,cancel,status);panel.append(form,list);
 async function refresh(){const rows=await window.appcoreDrafts(a.id,kind);list.replaceChildren();for(const d of rows){const c=card(release?d.version:d.title,d.status||"");if(d.status==="draft"){const edit=el("button","تعديل"),del=el("button","حذف");edit.onclick=()=>{editing=d.id;for(const [k,v] of Object.entries(fields)){if(v.type==="checkbox")v.checked=d[k]===true;else v.value=d[k]??"";}save.textContent="حفظ التعديل";cancel.hidden=false;};del.onclick=async()=>{if(!confirm("حذف المسودة نهائيًا؟"))return;del.disabled=true;try{await window.appcoreDrafts(a.id,kind,null,d.id);if(editing===d.id)reset();await refresh();}catch(err){status.textContent="تعذر الحذف: "+(err.code||err.message);}finally{del.disabled=false;}};const publish=el("button",release?"اعتماد سجل إصدار اختياري":"إرسال اختبار (غير مفعّل)");publish.disabled=!release;publish.onclick=async()=>{if(!confirm("اعتماد سجل الإصدار فقط؟ لا يتم توزيع APK تلقائيًا."))return;publish.disabled=true;try{await window.appcoreCall(release?"publishRelease":"sendTestNotification",{appId:a.id,draftId:d.id,confirm:true});status.textContent="تم اعتماد سجل الإصدار";await refresh();}catch(e){status.textContent=e.message;}finally{publish.disabled=false;}};c.append(edit,del,publish);}list.append(c);}if(!rows.length)list.append(el("p","لا توجد مسودات"));}
 form.onsubmit=async e=>{e.preventDefault();save.disabled=true;try{await window.appcoreDrafts(a.id,kind,Object.fromEntries(Object.entries(fields).map(([k,v])=>[k,v.type==="checkbox"?v.checked:v.value])),editing);reset();status.textContent="تم حفظ المسودة";await refresh();}catch(err){status.textContent="تعذر إكمال العملية: "+(err.code||err.message);}finally{save.disabled=false;}};
 refresh().catch(err=>{status.textContent="تعذر تحميل المسودات: "+(err.code||err.message);});return panel;
}

function servicePanel(a,kind){
 const names={analytics:"getAnalyticsSummary",crashes:"getCrashSummary",remote:"getRemoteConfig",alerts:"getAdminAlerts",web:"checkWebsite",content:"listManagedDrafts",database:"listManagedDrafts",audit:"getAuditLog"};
 const panel=card(modules[kind]||"سجل التدقيق","SERVER / "+kind),out=el("div","لم يتم التحميل"),load=el("button",kind==="web"?"فحص الموقع":"تحميل البيانات");panel.append(load,out);
 let revision=null;
 const editor=el("textarea");editor.setAttribute("aria-label","JSON");editor.value="{}";
 async function run(name,data){load.disabled=true;try{const result=await window.appcoreCall(name,{...data,appId:a.id});out.replaceChildren();out.append(renderServiceResult(kind,result));return result;}catch(e){out.textContent="ERROR: "+e.message;throw e;}finally{load.disabled=false;}}
 load.onclick=async()=>{try{const result=await run(names[kind],{kind});if(kind==="remote"){revision=result.revision;editor.value=JSON.stringify(result.flags,null,2);}}catch{}};
 if(kind==="remote"||kind==="content"||kind==="database"||kind==="alerts"){
 const save=el("button",kind==="alerts"?"تأكيد الاطلاع":"حفظ");panel.append(editor,save);
 save.onclick=async()=>{if(kind==="remote"&&revision===null){out.textContent="حمّل الإعدادات الحالية أولاً";return;}if(!confirm("تأكيد التعديل؟"))return;save.disabled=true;try{const data=JSON.parse(editor.value);const result=await run(kind==="remote"?"updateRemoteConfig":kind==="alerts"?"acknowledgeAdminAlert":"saveManagedDraft",kind==="remote"?{flags:data,expectedRevision:revision,confirm:true}:{...data,kind});if(kind==="remote")revision=result.revision;}catch(e){out.textContent="ERROR: "+e.message;}finally{save.disabled=false;}};
 }
 return panel;
}

function configDraftPanel(a){const p=card("إعدادات التحكم عن بُعد","النشر اختياري ومؤقت ولا يعطل الوظائف المحلية.");const scope=el("select");for(const [v,t] of [["pilot","اختبار — منفصل"],["production","إنتاج — للمستخدمين"]]){const o=el("option",t);o.value=v;scope.append(o)}const platform=el("select"),editor=el("textarea"),load=el("button","تحميل المسودة"),save=el("button","حفظ المسودة"),publish=el("button","نشر المسودة المحفوظة"),status=el("p","");for(const k of (a.id==="exmore"?["android"]:["android","web"])){const o=el("option",k);o.value=k;platform.append(o);}let revision=null,busy=false;function refresh(){load.disabled=busy;platform.disabled=scope.disabled=busy;save.disabled=busy||revision===null;publish.disabled=busy||!revision||!["exmore","3al-tabloh"].includes(a.id);}function reset(){revision=null;editor.value="{}";refresh();}platform.onchange=scope.onchange=reset;reset();async function act(fn){if(busy)return;busy=true;refresh();try{await fn();}catch(e){status.textContent=e.message;}finally{busy=false;refresh();}}load.onclick=()=>act(async()=>{const d=await window.appcoreConfigDraft(a.id,platform.value,undefined,undefined,scope.value);revision=d.revision;editor.value=JSON.stringify(d.config,null,2);status.textContent="تم التحميل";});save.onclick=()=>act(async()=>{const d=await window.appcoreConfigDraft(a.id,platform.value,JSON.parse(editor.value),revision,scope.value);revision=d.revision;editor.value=JSON.stringify(d.config,null,2);status.textContent="تم حفظ المسودة";});publish.onclick=()=>{if(!confirm(scope.value==="production"?"تأكيد تغيير إعدادات الإنتاج للمستخدمين؟":"نشر إعدادات الاختبار المعزولة؟"))return;return act(async()=>{const d=await window.appcorePublishConfig(a.id,platform.value,revision,true,scope.value);status.textContent="تم حفظ الإعداد المنشور — الإصدار "+d.revision+"؛ وصوله للأجهزة غير متحقق بعد.";});};p.append(scope,platform,load,editor,save,publish,status);return p;}


// APPCORE_DEVICE_REGISTRY_V1
function deviceRegistryPanel(a) {
  const panel = card(
    "إدارة الأجهزة",
    "سجل الأجهزة التجريبية — التسجيل اليدوي"
  );

  const platform = el("select");

  for (const p of (
    a.id === "exmore" ? ["android"] : ["android","web"]
  )) {
    const option = el("option",p);
    option.value = p;
    platform.append(option);
  }

  const version = el("input");
  version.type = "number";
  version.min = "1";
  version.max = "2100000000";
  version.placeholder = "Version Code";

  const register = el("button","تسجيل جهاز تجريبي");
  const refresh = el("button","تحديث القائمة");
  const status = el("p","");
  const list = el("div");

  status.setAttribute("role","status");

  panel.append(
    platform,version,register,refresh,status,list
  );

  let busy = false;

  async function load() {
    const rows = await window.appcoreDevices(
      a.id,"list"
    );

    list.replaceChildren();

    status.textContent =
      "السجلات المعروضة: " + rows.length;

    for (const d of rows) {
      const seen = d.lastSeen?.toDate?.();

      const c = card(
        d.platform + " — " + d.versionCode,
        d.id
      );

      c.append(el("p",
        "آخر تحديث يدوي: " +
        (seen ? seen.toLocaleString() : "غير متاح")
      ));

      const touch = el("button","تحديث النشاط يدويًا");
      const remove = el("button","حذف التسجيل");

      touch.onclick = () => act(async () => {
        await window.appcoreDevices(
          a.id,"touch",{id:d.id}
        );
      });

      remove.onclick = () => {
        if (!confirm("حذف تسجيل الجهاز؟")) return;

        return act(async () => {
          await window.appcoreDevices(
            a.id,"delete",{id:d.id}
          );
        });
      };

      c.append(touch,remove);
      list.append(c);
    }
  }

  async function act(fn) {
    if (busy) return;

    busy = true;
    register.disabled = true;
    refresh.disabled = true;

    try {
      await fn();
      await load();
    } catch(e) {
      status.textContent =
        "تعذر التنفيذ: " + e.message;
    } finally {
      busy = false;
      register.disabled = false;
      refresh.disabled = false;
    }
  }

  register.onclick = () => act(async () => {
    await window.appcoreDevices(
      a.id,"register",{
        platform:platform.value,
        versionCode:version.value
      }
    );
  });

  refresh.onclick = () => act(async () => {});

  refresh.onclick();

  return panel;
}


// APPCORE_CONTROL_V2

function bulletinPanel(a){
  const panel=card(
    "الإعلانات المركزية",
    "نشر إعلان قابل للقراءة من التطبيق"
  );

  const scope=el("select");for(const [v,t] of [["pilot","اختبار — منفصل"],["production","إنتاج — للمستخدمين"]]){const o=el("option",t);o.value=v;scope.append(o)}
  const title=el("input");
  title.placeholder="عنوان الإعلان";
  title.maxLength=100;

  const body=el("textarea");
  body.placeholder="محتوى الإعلان";
  body.maxLength=1000;

  const load=el("button","تحميل الإعلان");
  const publish=el("button","نشر الإعلان");
  const revoke=el("button","إلغاء الإعلان");
  const status=el("p","");

  let revision=null,busy=false;

  async function refresh(){
    const d=await window.appcoreBulletin(a.id,'read',{scope:scope.value});

    revision=d?.revision||0;
    title.value=d?.title||"";
    body.value=d?.body||"";

    status.textContent=d?.active
      ?"إعلان منشور — "+revision
      :"لا يوجد إعلان نشط";
  }

  async function act(fn){
    if(busy)return;

    busy=true;
    scope.disabled=load.disabled=publish.disabled=revoke.disabled=true;

    try{
      await fn();
      await refresh();
    }catch(e){
      status.textContent=e.message;
    }finally{
      busy=false;
      scope.disabled=load.disabled=false;
      publish.disabled=revoke.disabled=revision===null;
    }
  }

  load.onclick=()=>act(async()=>{});
  scope.onchange=()=>{revision=null;title.value=body.value='';publish.disabled=revoke.disabled=true;load.onclick()};

  publish.onclick=()=>{
    if(!confirm(scope.value==="production"?"نشر إعلان للمستخدمين؟":"نشر إعلان اختبار معزول؟"))return;

    return act(()=>window.appcoreBulletin(
      a.id,'publish',{
        title:title.value,
        body:body.value,
        revision,
        scope:scope.value,
        confirm:true
      }
    ));
  };

  revoke.onclick=()=>{
    if(!confirm(scope.value==="production"?"إلغاء إعلان الإنتاج؟":"إلغاء إعلان الاختبار؟"))return;

    return act(()=>window.appcoreBulletin(
      a.id,'revoke',{revision,scope:scope.value,confirm:true}
    ));
  };

  publish.disabled=revoke.disabled=true;

  panel.append(scope,title,body,load,publish,revoke,status);

  load.onclick();

  return panel;
}

function controlAuditPanel(a){
  const panel=card(
    "سجل عمليات التحكم",
    "آخر عمليات النشر والإلغاء"
  );

  const load=el("button","تحديث السجل");
  const list=el("div");

  load.onclick=async()=>{
    load.disabled=true;

    try{
      const rows=await window.appcoreControlAudit(a.id);

      list.replaceChildren();

      if(!rows.length)
        list.append(el("p","لا توجد عمليات مسجلة"));

      for(const d of rows){
        list.append(el("p",
          d.action+" — "+
          (d.createdAt?.toDate?.()?.toLocaleString()||"")
        ));
      }
    }catch(e){
      list.textContent=e.message;
    }finally{
      load.disabled=false;
    }
  };

  panel.append(load,list);

  return panel;
}

function healthHistoryPanel(){
 const panel=card('مراقبة الخدمات','استيراد تقرير الفحص وعرض سجل الأعطال');
 const file=el('input');file.type='file';file.accept='.json,application/json';
 const save=el('button','حفظ تقرير الفحص');
 const load=el('button','تحديث سجل الخدمات');
 const out=el('div');
 async function refresh(){
  const rows=await window.appcoreHealthRuns('list');
  out.replaceChildren();
  for(const r of rows){
   out.append(el('h3',(r.createdAt?.toDate?.()?.toLocaleString()||'')+' — '+(r.failed?'تنبيه: '+r.failed+' خدمات متعثرة':'جميع الخدمات سليمة')));
   for(const v of r.results)out.append(el('p',v.name+' — '+(v.ok?'OK':'FAILED')+' — '+v.latencyMs+' ms'));
  }
 }
 async function act(fn){save.disabled=load.disabled=true;try{await fn();await refresh()}catch(e){out.textContent=e.message}finally{save.disabled=load.disabled=false}}
 save.onclick=()=>act(async()=>{const f=file.files[0];if(!f||f.size>16384)throw Error('Invalid report');await window.appcoreHealthRuns('save',JSON.parse(await f.text()))});
 load.onclick=()=>act(async()=>{});
 const pilot=el('button','حالة الأجهزة المرتبطة');const summary=el('p','');pilot.onclick=async()=>{pilot.disabled=true;try{summary.textContent=(await window.appcoreTitanSummary()).map(v=>v.id+': '+v.active+' active / '+v.sampled+' sampled / '+v.pending+' pending').join(' | ')}catch(e){summary.textContent=e.message}finally{pilot.disabled=false}};
 panel.append(file,save,load,out,pilot,summary);return panel;
}

function pilotPairPanel(a){
 const p=card('ربط أجهزة الاختبار','رمز خاص لكل جهاز؛ لا تشاركه علنًا');
 const platform=el('select');for(const v of (a.id==='exmore'?['android']:['android','web'])){const o=el('option',v);o.value=v;platform.append(o)}
 const create=el('button','إنشاء رمز ربط');const load=el('button','عرض الأجهزة');const out=el('div');
 async function act(fn){create.disabled=load.disabled=true;try{await fn()}catch(e){out.textContent=e.message}finally{create.disabled=load.disabled=false}}
 create.onclick=()=>act(async()=>{if(!confirm('إنشاء رمز خاص؟'))return;const token=await window.appcorePairPilot(a.id,'create',{platform:platform.value,confirm:true});out.textContent=token});
 load.onclick=()=>act(async()=>{const rows=await window.appcorePairPilot(a.id,'list');out.replaceChildren();for(const r of rows){const line=el('div');line.append(el('p',r.token.slice(0,8)+' — '+r.platform+' — '+r.versionCode+' — '+r.lastSeen?.toDate?.().toLocaleString()));const b=el('button','إلغاء الربط');b.onclick=()=>act(async()=>{if(confirm('إلغاء الربط؟')){await window.appcorePairPilot(a.id,'revoke',{token:r.token,confirm:true});out.textContent='تم الإلغاء'}});line.append(b);out.append(line)}});
 p.append(platform,create,load,out);return p;
}

function catalogPublishPanel(){
 const p=card('نشر المحتوى العام','الاختبار معزول عن كتالوج الإنتاج؛ المحتوى في النطاقين عام، لا تضع بيانات خاصة.');const scope=el('select');for(const [v,t] of [['pilot','اختبار — منفصل'],['production','إنتاج — للمستخدمين']]){const o=el('option',t);o.value=v;scope.append(o)}const kind=el('select');for(const v of ['content','database']){const o=el('option',v);o.value=v;kind.append(o)}const key=el('input');key.placeholder='Draft ID';const out=el('p');
 for(const active of [true,false]){const b=el('button',active?'نشر':'إلغاء النشر');b.onclick=async()=>{if(!confirm(scope.value==='production'?'تأكيد تعديل محتوى الإنتاج للمستخدمين؟':'تأكيد العملية في نطاق الاختبار المنفصل؟'))return;b.disabled=true;try{await window.appcoreCatalogPublish(kind.value,key.value,active,true,scope.value);out.textContent='تم حفظ حالة النشر — '+scope.value}catch(e){out.textContent=e.message}finally{b.disabled=false}};p.append(b)}p.append(scope,kind,key,out);return p;
}

function omegaRenewPanel(a){
 const p=card('تجديد صلاحية الإعدادات','تجديد الإعدادات المنشورة دون تغيير قيمها');
 const out=el('p');for(const platform of (a.id==='exmore'?['android']:['android','web'])){
 const b=el('button','Renew '+platform);b.onclick=async()=>{if(!confirm('تجديد الإعدادات الحالية؟'))return;b.disabled=true;try{out.textContent='Revision '+await window.appcoreOmegaRenew(a.id,platform)}catch(e){out.textContent=e.message}finally{b.disabled=false}};p.append(b)}p.append(out);return p;
}

function approvedOperationButton(operation,id,out){
 const b=el('button','اعتماد التشغيل من AppCore');b.type='button';b.onclick=async()=>{if(!confirm('اعتماد الطلب؟ النجاح يعني طلب التشغيل فقط، وليس التسليم.'))return;b.disabled=true;try{const sha=await window.appcoreDispatchOperation(operation,id);out.textContent='طُلب التشغيل: '+sha.slice(0,8)+' — راجع الحالة لاحقًا'}catch(e){out.textContent=e.message}finally{b.disabled=false}};return b;
}
function operationsNotificationPanel(a){
 const p=card('إشعارات FCM — اختبار حقيقي','إنشاء طلب لا يرسل شيئاً. الإرسال إلى موضوع الاختبار فقط بعد اعتماد طلب التشغيل من AppCore؛ يتطلب تفعيل جسر العمليات. لا تستخدم بيانات خاصة.');
 const form=el('form'),title=el('input'),body=el('textarea'),button=el('button','إنشاء طلب اختبار'),out=el('p',''),list=el('div'),load=el('button','عرض الطلبات');
 title.required=body.required=true;title.maxLength=100;body.maxLength=1000;title.placeholder='العنوان';body.placeholder='الرسالة';out.setAttribute('role','status');
 const link=el('a','فتح GitHub Actions لاعتماد الطلب');link.href='https://github.com/drkarimelshenawy/AppCore/actions/workflows/appcore-operations.yml';link.target='_blank';link.rel='noopener noreferrer';
 form.append(title,body,button);p.append(form,out,link,load,list);
 form.onsubmit=async e=>{e.preventDefault();if(!confirm('إنشاء طلب لإشعارات الاختبار فقط؟'))return;button.disabled=true;try{const id=await window.appcoreOperationalQueue(a.id,'queue',{title:title.value,body:body.value,confirm:true});out.textContent='معرف الطلب: '+id+' — لم يُرسل بعد';form.reset()}catch{out.textContent='تعذر إنشاء الطلب'}finally{button.disabled=false}};
 load.onclick=async()=>{load.disabled=true;try{const rows=await window.appcoreOperationalQueue(a.id,'list');list.replaceChildren();for(const r of rows){const line=el('div');line.append(el('p',r.id+' — '+r.status+' — '+(r.createdAt?.toDate?.()?.toLocaleString()||'')));if(r.status==='queued'){const cancel=el('button','إلغاء الطلب');cancel.onclick=async()=>{if(!confirm('إلغاء الطلب؟'))return;cancel.disabled=true;try{await window.appcoreOperationalQueue(a.id,'cancel',{id:r.id,confirm:true});line.textContent='تم إلغاء الطلب'}catch{line.append(el('p','تعذر الإلغاء؛ قد يكون الإرسال بدأ'))}finally{cancel.disabled=false}};line.append(cancel,approvedOperationButton('notify',r.id,out))}list.append(line)}if(!rows.length)list.append(el('p','لا توجد طلبات'))}catch{list.textContent='تعذر تحميل الطلبات'}finally{load.disabled=false}};
 return p;
}

function operationsDiagnosticsPanel(a){
 const p=card('التشخيص والأداء','جمع اختياري على Android. استيراد GA4 إلى إحصائيات AppCore يحتاج إعداد Property وStream. استيراد الأعطال والأداء يعتمد على جداول BigQuery المفعّلة والمتحقق منها.');
 const link=el('a','فتح مشروع Firebase لعرض Crashlytics وPerformance');link.href='https://console.firebase.google.com/project/appcore-2026/overview';link.target='_blank';link.rel='noopener noreferrer';p.append(link);const out=el('p','');out.setAttribute('role','status');for(const [operation,label] of [['health','فحص الخدمات'],['analytics','مزامنة الإحصائيات'],['diagnostics','مزامنة التشخيص'],['cycle','دورة المراقبة']]){const b=approvedOperationButton(operation,'',out);b.textContent=label;p.append(b)}p.append(out);return p;
}

function registeredDevicePanel(a){
 const p=card('التثبيتات المسجلة اختيارياً','Android فقط — أحدث 100 سجل، ليست إجمالي المستخدمين أو أجهزة موثقة الهوية. لا تعرض معرفات Firebase.');
 const btn=el('button','تحميل التسجيلات'),out=el('div');out.setAttribute('role','status');p.append(btn,out);
 btn.onclick=async()=>{btn.disabled=true;try{const v=await window.appcoreRegisteredDevices(a.id);out.replaceChildren(el('p',v.active24h+' نشط خلال 24 ساعة من '+v.sampled+' في العينة'));for(const r of v.rows)out.append(el('p',r.platform+' — '+r.versionCode+' — '+(r.lastSeen?.toDate?.()?.toLocaleString()||'—')))}catch{out.textContent='تعذر تحميل التسجيلات'}finally{btn.disabled=false}};
 return p;
}

function webPushPanel(){
 const p=card('إشعارات Web — اختبار لجهاز واحد','اختر اشتراكاً؛ إنشاء الطلب لا يرسل الإشعار. اعتمد التشغيل من AppCore بعد تفعيل جسر العمليات. لا تضع بيانات خاصة.');
 const select=el('select'),title=el('input'),body=el('textarea'),load=el('button','تحميل الاشتراكات'),send=el('button','إنشاء طلب'),jobs=el('button','عرض الطلبات'),out=el('p'),list=el('div');title.placeholder='العنوان';body.placeholder='الرسالة';title.maxLength=100;body.maxLength=1000;send.disabled=true;
 load.onclick=async()=>{load.disabled=true;send.disabled=true;try{select.replaceChildren();for(const r of await window.appcoreWebPush('list')){const o=el('option',r.id.slice(0,8)+'… — '+r.updatedAt?.toDate?.()?.toLocaleString());o.value=r.id;select.append(o)}send.disabled=!select.options.length;out.textContent=select.options.length+' اشتراك في العينة'}catch{out.textContent='تعذر التحميل'}finally{load.disabled=false}};
 send.onclick=async()=>{if(!confirm('إنشاء اختبار لاشتراك واحد؟'))return;send.disabled=true;try{out.textContent='معرف الطلب: '+await window.appcoreWebPush('queue',{uid:select.value,title:title.value,body:body.value,confirm:true})+' — لم يرسل بعد'}catch{out.textContent='تعذر إنشاء الطلب'}finally{send.disabled=!select.options.length}};
 jobs.onclick=async()=>{jobs.disabled=true;try{list.replaceChildren();for(const r of await window.appcoreWebPush('jobs')){const line=el('div');line.append(el('p',r.id+' — '+r.status));if(r.status==='queued'){const b=el('button','إلغاء');b.onclick=async()=>{if(!confirm('إلغاء الطلب؟'))return;b.disabled=true;try{await window.appcoreWebPush('cancel',{id:r.id,confirm:true});line.textContent='أُلغي الطلب'}catch{line.append(el('p','تعذر الإلغاء'))}};line.append(b,approvedOperationButton('webnotify',r.id,out))}list.append(line)}}catch{list.textContent='تعذر التحميل'}finally{jobs.disabled=false}};
 p.append(load,select,title,body,send,out,jobs,list);return p;
}
function diagnosticSnapshotPanel(a){
 const p=card('Crashlytics / Performance — BigQuery','آخر 7 أيام مكتملة (UTC)، بيانات مجمعة وليست لحظية.'),out=el('div');
 const b=action('تحميل آخر استيراد',async()=>{b.disabled=true;try{const v=await window.appcoreDiagnosticSnapshot(a.id);out.replaceChildren();if(!v){out.append(empty('لا يوجد استيراد مؤكد بعد.'));return}const crashes=Array.isArray(v.crashes)?v.crashes:[],perf=Array.isArray(v.performance)?v.performance:[];out.append(el('p','وقت الاستيراد: '+(v.importedAt?.toDate?.()?.toLocaleString()||'—')));const metrics=el('div',undefined,'inline-metrics');for(const [n,t] of [[crashes.length,'مشكلات الأعطال في العينة'],[perf.length,'أيام الأداء المستوردة']]){const item=el('div');item.append(el('strong',String(n)),el('small',t));metrics.append(item)}out.append(metrics);if(!crashes.length)out.append(empty('لا توجد مشكلات أعطال في اللقطة؛ لا يعادل ذلك ضمان خلو التطبيق من الأعطال.'));for(const c of crashes){const row=el('div',undefined,'service-row');row.append(el('strong','Issue '+c.issueId),badge(c.events+' أحداث','warn'));out.append(row)}if(perf.length){out.append(el('h3','زمن بدء التطبيق P90'));const max=Math.max(1,...perf.map(x=>Number(x.p90Ms)||0));for(const r of perf){const row=el('div',undefined,'service-row'),track=el('div',undefined,'bar-track'),fill=el('div',undefined,'bar-fill');fill.style.width=Math.max(0,Math.min(100,(Number(r.p90Ms)||0)/max*100))+'%';track.append(fill);row.append(el('strong',String(r.day)),el('small',r.p90Ms+' ms · '+r.samples+' samples'),track);out.append(row)}}out.append(rawDetails(v))}catch{out.textContent='تعذر التحميل'}finally{b.disabled=false}});out.append(empty('لم يتم التحميل'));p.append(b,out);return p;
}
function externalStatusPanel(){
 const p=card('GitHub Actions / Sentry','سير العمل والأعطال من الخدمات الخارجية بعد تفعيل صلاحيات القراءة. النتائج عينات محدودة.'),out=el('div');
 const statusNames={'not-configured':'غير مهيأ',unavailable:'غير متاح',partial:'اتصال جزئي',available:'تمت القراءة',success:'نجح',failure:'فشل',cancelled:'أُلغي',in_progress:'قيد التنفيذ',queued:'في الانتظار',pending:'معلق',completed:'مكتمل'};
 const tone=s=>['available','success'].includes(s)?'good':['unavailable','failure'].includes(s)?'bad':['partial','in_progress','queued','pending'].includes(s)?'warn':'neutral';
 function status(s){return badge(statusNames[s]||s||'غير متحقق',tone(s))}
 const b=action('تحميل حالة التكاملات',async()=>{b.disabled=true;try{const v=await window.appcoreExternalStatus();out.replaceChildren();const gh=el('div',undefined,'service-row');gh.append(el('strong','GitHub Actions'),status(v.github?.status));out.append(gh);for(const project of v.github?.projects||[]){const c=card(project.id,project.branch),r=el('div',undefined,'service-row');r.append(status(project.status));c.append(r);if(!project.runs?.length)c.append(empty('لا توجد نتائج معروضة لهذا الفرع.'));for(const run of project.runs||[]){const row=el('div',undefined,'run-row'),title=el('div',undefined,'service-row');title.append(el('strong',run.name),status(run.conclusion||run.status));row.append(title,el('p',(run.commit||'').slice(0,8)+' · '+(run.updatedAt?new Date(run.updatedAt).toLocaleString():'—')));if(/^https:\/\/github\.com\/drkarimelshenawy\/(AppCore|todo-shift-android|3al-Tabloh)\/actions\/runs\/\d+$/.test(run.url||'')){const link=el('a','عرض سجل التشغيل');link.href=run.url;link.target='_blank';link.rel='noopener noreferrer';row.append(link)}c.append(row)}out.append(c)}const sr=el('div',undefined,'service-row');sr.append(el('strong','Sentry Web'),status(v.sentry?.status));out.append(sr);if(v.sentry?.status==='available'){out.append(el('p',(v.sentry.issues?.length||0)+' مشكلات في العينة — آخر 24 ساعة، ليست عدد الأحداث.'));for(const issue of v.sentry.issues||[]){const r=el('div',undefined,'service-row');r.append(el('strong','Issue '+issue.id),badge(issue.level,'warn'),el('small',issue.lastSeen?new Date(issue.lastSeen).toLocaleString():'—'));out.append(r)}}out.append(el('p','آخر طلب قراءة: '+(v.checkedAt?new Date(v.checkedAt).toLocaleString():'—')),rawDetails(v))}catch(e){out.textContent='تعذر التحميل: '+e.message}finally{b.disabled=false}});
 out.append(empty('لم يتم التحميل'));p.append(b,out);return p;
}
function pilotReleasePanel(a){
 const p=card('اختبار التحديثات المعزول','سجل اصطناعي منفصل لا يصل إلى مسار تحديث الإنتاج، ولا يشير إلى ملف APK.'),out=el('p','');
 out.setAttribute('role','status');
 for(const active of [true,false]){const b=el('button',active?'إنشاء سجل اختبار':'إزالة سجل الاختبار');b.onclick=async()=>{if(!confirm('تأكيد العملية في نطاق الاختبار فقط؟'))return;b.disabled=true;try{await window.appcorePilotReleaseFixture(a.id,active,true);out.textContent=active?'تم إنشاء PILOT-ONLY':'تم إزالة سجل الاختبار'}catch(e){out.textContent=e.message}finally{b.disabled=false}};p.append(b)}
 p.append(out);return p;
}

function renderServiceResult(kind,result){
 const box=el('div');
 function analyticsGroup(label,group){const p=el('section');p.append(el('h3',label));const rows=Array.isArray(group?.rows)?group.rows:[];if(!rows.length){p.append(empty('لا توجد بيانات مستوردة مؤكدة لهذه المنصة.'));return p}const metrics=el('div',undefined,'inline-metrics');for(const [key,title] of [['sessions','الجلسات'],['eventCount','الأحداث']]){const values=rows.map(r=>r[key]);const n=el('div');n.append(el('strong',values.every(v=>Number.isSafeInteger(v)&&v>=0)?String(values.reduce((s,v)=>s+v,0)):'—'),el('small',title+' / الأيام المستوردة'));metrics.append(n)}p.append(metrics,el('p','المستخدمون النشطون يوميًا — لا تجمع القيم لاحتساب مستخدمين فريدين.'));const data=rows.filter(r=>Number.isSafeInteger(r.activeUsers)&&r.activeUsers>=0),max=Math.max(1,...data.map(r=>r.activeUsers));const chart=el('div',undefined,'chart');for(const r of data){const row=el('div',undefined,'chart-row'),track=el('div',undefined,'bar-track'),fill=el('div',undefined,'bar-fill');fill.style.width=r.activeUsers/max*100+'%';track.append(fill);row.append(el('span',String(r.id||r.day||'—')),track,el('span',String(r.activeUsers)));chart.append(row)}p.append(chart);return p}
 if(kind==='analytics'){box.append(analyticsGroup('Android',result));if(result?.web)box.append(analyticsGroup('Web',result.web))}
 else if(kind==='crashes'){const rows=result?.issues||[];box.append(rows.length?badge(rows.length+' سجلات في العينة','info'):empty('لا توجد سجلات أعطال مستوردة مؤكدة. لا يعني ذلك عدم وجود أعطال.'))}
 else if(kind==='web'){box.append(el('p','نتيجة الفحص المباشر — راجع الاستجابة أدناه.'))}
 else if(kind==='audit'||kind==='alerts'||kind==='content'||kind==='database'){const rows=result?.entries||result?.alerts||result?.rows||result?.items||result?.drafts||[];if(Array.isArray(rows)){box.append(el('p',rows.length+' سجلات في الاستجابة'));for(const r of rows){const c=card(String(r.title||r.action||r.id||'سجل'),String(r.id||''));if(r.status)c.append(badge(r.status,'neutral'));if(r.revision!==undefined)c.append(el('span','Revision '+r.revision,'tag'));if(r.body)c.append(el('p',String(r.body).slice(0,600)));if(r.createdAt?.toDate)c.append(el('small',r.createdAt.toDate().toLocaleString()));box.append(c)}}}
 box.append(rawDetails(result));return box
}
