"use strict";
const pages=["الرئيسية","التطبيقات","الإصدارات","الإشعارات","الإحصائيات","الإعدادات"];
const nav=document.querySelector("#nav"), main=document.querySelector("#main");
let apps='<div class="card"><h2>ExMore</h2><p>في انتظار الربط</p></div><div class="card"><h2>ع التابلوه</h2><p>في انتظار الربط</p></div>';
const picker='<label>التطبيق<select><option>ExMore</option><option>ع التابلوه</option></select></label>';
const views=[
'<h1>نظرة عامة</h1><div class="grid">'+["التطبيقات","المستخدمون","الإشعارات","التحديثات"].map((x,i)=>'<div class="card"><div class="metric">'+(i===0?'2':'—')+'</div>'+x+'</div>').join('')+'</div><h2>تطبيقاتي</h2>'+apps,
'<h1>التطبيقات</h1>'+apps,
'<h1>نشر تحديث</h1><div class="card">'+picker+'<label>الإصدار<input placeholder="1.0.0"></label><label>Version code<input type="number" min="1"></label><label>رابط APK<input type="url"></label><label>التغييرات<textarea></textarea></label><button disabled>نشر — يتطلب ربط الخادم</button></div>',
'<h1>إرسال إشعار</h1><div class="card">'+picker+'<label>العنوان<input maxlength="100"></label><label>المحتوى<textarea maxlength="1000"></textarea></label><label>الجمهور<select><option>أجهزة الاختبار</option><option>جميع المستخدمين</option></select></label><button disabled>إرسال — يتطلب ربط الخادم</button></div>',
'<h1>الإحصائيات</h1><div class="card">لا توجد بيانات متصلة.</div>',
'<h1>الإعدادات</h1><div class="card">صلاحيات الإدارة مقيدة بحساب المالك. حالة الاتصال تظهر أعلى الصفحة.</div>'];
let active=0;
function show(i){active=i;main.innerHTML=views[i]; if(i===0 || i===1){const old=main.querySelectorAll(".card h2");old.forEach(h=>h.parentElement.remove());const wrap=document.createElement("div");wrap.innerHTML=apps;main.append(wrap);}[...nav.children].forEach((b,j)=>b.setAttribute("aria-current",String(i===j)));}
pages.forEach((p,i)=>{const b=document.createElement("button");b.textContent=p;b.onclick=()=>show(i);nav.append(b);});
document.querySelector("#theme").onclick=()=>document.body.classList.toggle("light");show(0);

window.addEventListener("appcore-data",e=>{const wrap=document.createElement("div");for(const app of e.detail){const card=document.createElement("div");card.className="card";const h=document.createElement("h2");h.textContent=app.name;const p=document.createElement("p");p.textContent=app.connected?"متصل":"في انتظار ربط التطبيق";card.append(h,p);wrap.append(card);}apps=wrap.innerHTML;show(active);});
