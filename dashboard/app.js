"use strict";
const modules={releases:"إدارة الإصدارات",notifications:"الإشعارات",analytics:"الإحصائيات",crashes:"مراقبة الأعطال",remote:"التحكم عن بُعد",alerts:"تنبيهات الإدارة",web:"مراقبة الموقع",content:"إدارة المحتوى",database:"قواعد البيانات العامة"};
const common=["releases","notifications","analytics","crashes","remote","alerts"];
const profiles={exmore:common,"3al-tabloh":[...common,"web","content","database"]};
const nav=document.querySelector("#nav"),main=document.querySelector("#main");
let apps=[],connected=false,active="overview";
function selected(a){return Array.isArray(a.modules)?a.modules.filter(m=>Object.hasOwn(modules,m)):profiles[a.id]||[];}
function el(tag,text,cls){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;}
function card(title,detail){const n=el("section",undefined,"card");n.append(el("h2",title),el("p",detail));return n;}
function show(key){active=key;main.replaceChildren();for(const b of nav.children)b.setAttribute("aria-current",String(b.dataset.key===key));
if(key==="overview"){main.append(el("p","WORKSPACE / OVERVIEW","eyebrow"),el("h1","مركز القيادة"));const grid=el("div",undefined,"grid");for(const [label,value] of [["Applications",connected?String(apps.length):"—"],["Assigned modules",connected?String(apps.reduce((n,a)=>n+selected(a).length,0)):"—"],["Active devices","—"],["Crash-free users","—"]]){const c=el("section",undefined,"card");c.append(el("div",value,"metric"),el("p",label));grid.append(c);}main.append(grid);}
if(key==="overview"||key==="apps"){main.append(el("h2","APPLICATIONS","eyebrow"));for(const a of apps){const c=card(a.name,a.connected?"تم تسجيل الربط":"في انتظار ربط التطبيق");const btn=el("button","عرض الخدمات");btn.onclick=()=>show(a.id);c.append(btn);main.append(c);}if(!apps.length)main.append(card("لا توجد تطبيقات معروضة","سجل الدخول للتحقق من قاعدة البيانات."));}
else if(apps.some(a=>a.id===key)){const a=apps.find(a=>a.id===key);main.append(el("h1",a.name));const form=el("form",undefined,"card");const inputs=[];for(const [m,label] of Object.entries(modules)){const row=el("label",undefined,"module-option");const input=el("input");input.type="checkbox";input.checked=selected(a).includes(m);inputs.push([m,input]);row.append(input,el("span",label));form.append(row);}const save=el("button","حفظ إعدادات الخدمات");save.type="submit";const status=el("p","التكامل التشغيلي غير متحقق");status.setAttribute("role","status");form.append(save,status);form.onsubmit=async e=>{e.preventDefault();save.disabled=true;try{await window.appcoreSaveModules(a.id,inputs.filter(x=>x[1].checked).map(x=>x[0]));status.textContent="تم الحفظ";}catch(err){status.textContent="تعذر الحفظ: "+(err.code||err.message);}finally{save.disabled=false;}};main.append(form);}
else if(key==="logs"){main.append(el("h1","SYSTEM CONSOLE"),card(connected?"[OK] Firestore connection":"[OFFLINE] Firestore not verified","[PENDING] Application integration / Notification gateway"));}
else {main.append(el("h1",key==="settings"?"الإعدادات":"المراقبة"),card("حالة الخدمات","لا توجد بيانات تشغيلية متحققة بعد."));}}
for(const [key,label] of [["overview","الرئيسية"],["apps","التطبيقات"],["monitor","المراقبة"],["logs","السجل"],["settings","الإعدادات"]]){const b=el("button",label);b.dataset.key=key;b.onclick=()=>show(key);nav.append(b);}
document.querySelector("#theme").onclick=()=>document.body.classList.toggle("light");
window.addEventListener("appcore-data",e=>{apps=Array.isArray(e.detail)?e.detail:[];connected=apps.length>0;show(profiles[active]&&!apps.some(a=>a.id===active)?"overview":active);});
show("overview");
