"use strict";
const modules={releases:"إدارة الإصدارات",notifications:"الإشعارات",analytics:"الإحصائيات",crashes:"مراقبة الأعطال",remote:"التحكم عن بُعد",alerts:"تنبيهات الإدارة",web:"مراقبة الموقع",content:"إدارة المحتوى",database:"قواعد البيانات العامة"};
const common=["releases","notifications","analytics","crashes","remote","alerts"];
const profiles={exmore:common,"3al-tabloh":[...common,"web","content","database"]};
const nav=document.querySelector("#nav"),main=document.querySelector("#main");
let apps=[],connected=false,active="overview";
function el(tag,text,cls){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;}
function card(title,detail){const n=el("section",undefined,"card");n.append(el("h2",title),el("p",detail));return n;}
function show(key){active=key;main.replaceChildren();for(const b of nav.children)b.setAttribute("aria-current",String(b.dataset.key===key));
if(key==="overview"){main.append(el("p","WORKSPACE / OVERVIEW","eyebrow"),el("h1","مركز القيادة"));const grid=el("div",undefined,"grid");for(const [label,value] of [["Applications",connected?String(apps.length):"—"],["Assigned modules",connected?String(apps.reduce((n,a)=>n+(profiles[a.id]?.length||0),0)):"—"],["Active devices","—"],["Crash-free users","—"]]){const c=el("section",undefined,"card");c.append(el("div",value,"metric"),el("p",label));grid.append(c);}main.append(grid);}
if(key==="overview"||key==="apps"){main.append(el("h2","APPLICATIONS","eyebrow"));for(const a of apps){const c=card(a.name,a.connected?"تم تسجيل الربط":"في انتظار ربط التطبيق");const btn=el("button","عرض الخدمات");btn.onclick=()=>show(a.id);c.append(btn);main.append(c);}if(!apps.length)main.append(card("لا توجد تطبيقات معروضة","سجل الدخول للتحقق من قاعدة البيانات."));}
else if(apps.some(a=>a.id===key)){const a=apps.find(a=>a.id===key);main.append(el("h1",a.name));for(const m of profiles[key]||[]){main.append(card(modules[m],"معتمدة — التكامل التشغيلي غير متحقق"));}}
else if(key==="logs"){main.append(el("h1","SYSTEM CONSOLE"),card(connected?"[OK] Firestore connection":"[OFFLINE] Firestore not verified","[PENDING] Application integration / Notification gateway"));}
else {main.append(el("h1",key==="settings"?"الإعدادات":"المراقبة"),card("حالة الخدمات","لا توجد بيانات تشغيلية متحققة بعد."));}}
for(const [key,label] of [["overview","الرئيسية"],["apps","التطبيقات"],["monitor","المراقبة"],["logs","السجل"],["settings","الإعدادات"]]){const b=el("button",label);b.dataset.key=key;b.onclick=()=>show(key);nav.append(b);}
document.querySelector("#theme").onclick=()=>document.body.classList.toggle("light");
window.addEventListener("appcore-data",e=>{apps=Array.isArray(e.detail)?e.detail:[];connected=apps.length>0;show(profiles[active]&&!apps.some(a=>a.id===active)?"overview":active);});
show("overview");
