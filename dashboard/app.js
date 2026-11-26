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
if(key==="overview"||key==="apps"){main.append(el("h2","APPLICATIONS","eyebrow"));for(const a of apps){const c=card(a.name,a.connected?"تم تسجيل الربط":"في انتظار ربط التطبيق");c.append(el("p",a.projectId||a.id),el("p",a.applicationId||"Android ID غير محدد"));const btn=el("button","عرض الخدمات");btn.onclick=()=>show(a.id);c.append(btn);main.append(c);}if(!apps.length)main.append(card("لا توجد تطبيقات معروضة","سجل الدخول للتحقق من قاعدة البيانات."));if(key==="apps"&&connected){const form=el("form",undefined,"card");form.append(el("h2","إضافة تطبيق"));const id=el("input"),name=el("input");id.placeholder="app-id";id.pattern="[a-z0-9][a-z0-9-]{1,49}";id.required=true;name.placeholder="اسم التطبيق";name.required=true;name.maxLength=100;for(const [label,input] of [["معرف التطبيق",id],["الاسم",name]]){const l=el("label",label);l.append(input);form.append(l);}const save=el("button","إضافة");const status=el("p","");status.setAttribute("role","status");form.append(save,status);form.onsubmit=async e=>{e.preventDefault();save.disabled=true;try{await window.appcoreCreateApp(id.value,name.value);}catch(err){status.textContent="تعذر الإضافة: "+(err.code||err.message);}finally{save.disabled=false;}};main.append(form);}}
else if(apps.some(a=>a.id===key)){const a=apps.find(a=>a.id===key);main.append(el("h1",a.name));if(["exmore","3al-tabloh"].includes(a.id)){const gateway=card("Cloudflare Gateway","اختبار قراءة سجل التطبيق بحساب الإدارة، وليس اتصال أجهزة المستخدمين.");const check=el("button","اختبار الاتصال"),result=el("p","لم يتم الاختبار");result.setAttribute("role","status");check.onclick=async()=>{check.disabled=true;try{await window.appcoreCheckGateway(a.id);result.textContent="نجحت القراءة عبر Cloudflare وFirestore";}catch(e){result.textContent="تعذر الاتصال: "+e.message;}finally{check.disabled=false;}};gateway.append(check,result);main.append(gateway);}const form=el("form",undefined,"card");const inputs=[];for(const [m,label] of Object.entries(modules)){const row=el("label",undefined,"module-option");const input=el("input");input.type="checkbox";input.checked=selected(a).includes(m);inputs.push([m,input]);row.append(input,el("span",label));form.append(row);}const save=el("button","حفظ إعدادات الخدمات");save.type="submit";const status=el("p","التكامل التشغيلي غير متحقق");status.setAttribute("role","status");form.append(save,status);form.onsubmit=async e=>{e.preventDefault();save.disabled=true;try{await window.appcoreSaveModules(a.id,inputs.filter(x=>x[1].checked).map(x=>x[0]));status.textContent="تم الحفظ";}catch(err){status.textContent="تعذر الحفظ: "+(err.code||err.message);}finally{save.disabled=false;}};main.append(form);if(selected(a).includes("remote"))main.append(configDraftPanel(a));for(const kind of ["releases","notifications"])if(selected(a).includes(kind))main.append(draftPanel(a,kind));for(const kind of selected(a).filter(k=>!["releases","notifications","remote"].includes(k)))main.append(servicePanel(a,kind));
if (["exmore","3al-tabloh"].includes(a.id))
  main.append(deviceRegistryPanel(a));

if(["exmore","3al-tabloh"].includes(a.id)){
  main.append(bulletinPanel(a));
  main.append(controlAuditPanel(a));
  main.append(omegaRenewPanel(a));
  if(a.id==="3al-tabloh")main.append(catalogPublishPanel());
  main.append(pilotPairPanel(a));
  main.append(healthHistoryPanel());
}
main.append(servicePanel(a,"audit"));}
else if(key==="logs"){main.append(el("h1","SYSTEM CONSOLE"),card(connected?"[OK] Firestore connection":"[OFFLINE] Firestore not verified","[PENDING] Application integration / Notification gateway"));}
else {main.append(el("h1",key==="settings"?"الإعدادات":"المراقبة"),card("حالة الخدمات","لا توجد بيانات تشغيلية متحققة بعد."));}}
for(const [key,label] of [["overview","الرئيسية"],["apps","التطبيقات"],["monitor","المراقبة"],["logs","السجل"],["settings","الإعدادات"]]){const b=el("button",label);b.dataset.key=key;b.onclick=()=>show(key);nav.append(b);}
document.querySelector("#theme").onclick=()=>document.body.classList.toggle("light");
window.addEventListener("appcore-data",e=>{apps=e.detail?.apps||[];connected=e.detail?.connected===true;show(!["overview","apps","monitor","logs","settings"].includes(active)&&!apps.some(a=>a.id===active)?"overview":active);});
show("overview");

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
 const panel=card(modules[kind]||"سجل التدقيق","SERVER / "+kind),out=el("pre","لم يتم التحميل","console-output"),load=el("button",kind==="web"?"فحص الموقع":"تحميل البيانات");panel.append(load,out);
 let revision=null;
 const editor=el("textarea");editor.setAttribute("aria-label","JSON");editor.value="{}";
 async function run(name,data){load.disabled=true;try{const result=await window.appcoreCall(name,{...data,appId:a.id});out.textContent=JSON.stringify(result,null,2);return result;}catch(e){out.textContent="ERROR: "+e.message;throw e;}finally{load.disabled=false;}}
 load.onclick=async()=>{try{const result=await run(names[kind],{kind});if(kind==="remote"){revision=result.revision;editor.value=JSON.stringify(result.flags,null,2);}}catch{}};
 if(kind==="remote"||kind==="content"||kind==="database"||kind==="alerts"){
 const save=el("button",kind==="alerts"?"تأكيد الاطلاع":"حفظ");panel.append(editor,save);
 save.onclick=async()=>{if(kind==="remote"&&revision===null){out.textContent="حمّل الإعدادات الحالية أولاً";return;}if(!confirm("تأكيد التعديل؟"))return;save.disabled=true;try{const data=JSON.parse(editor.value);const result=await run(kind==="remote"?"updateRemoteConfig":kind==="alerts"?"acknowledgeAdminAlert":"saveManagedDraft",kind==="remote"?{flags:data,expectedRevision:revision,confirm:true}:{...data,kind});if(kind==="remote")revision=result.revision;}catch(e){out.textContent="ERROR: "+e.message;}finally{save.disabled=false;}};
 }
 return panel;
}

function configDraftPanel(a){const p=card("إعدادات التحكم عن بُعد","النشر اختياري ومؤقت ولا يعطل الوظائف المحلية.");const platform=el("select"),editor=el("textarea"),load=el("button","تحميل المسودة"),save=el("button","حفظ المسودة"),publish=el("button","نشر المسودة المحفوظة"),status=el("p","");for(const k of (a.id==="exmore"?["android"]:["android","web"])){const o=el("option",k);o.value=k;platform.append(o);}let revision=null,busy=false;function refresh(){load.disabled=busy;platform.disabled=busy;save.disabled=busy||revision===null;publish.disabled=busy||!revision||!["exmore","3al-tabloh"].includes(a.id);}function reset(){revision=null;editor.value="{}";refresh();}platform.onchange=reset;reset();async function act(fn){if(busy)return;busy=true;refresh();try{await fn();}catch(e){status.textContent=e.message;}finally{busy=false;refresh();}}load.onclick=()=>act(async()=>{const d=await window.appcoreConfigDraft(a.id,platform.value);revision=d.revision;editor.value=JSON.stringify(d.config,null,2);status.textContent="تم التحميل";});save.onclick=()=>act(async()=>{const d=await window.appcoreConfigDraft(a.id,platform.value,JSON.parse(editor.value),revision);revision=d.revision;editor.value=JSON.stringify(d.config,null,2);status.textContent="تم حفظ المسودة";});publish.onclick=()=>{if(!confirm("نشر المسودة المحفوظة لهذه المنصة؟ التعديلات غير المحفوظة لن تنشر."))return;return act(async()=>{const d=await window.appcorePublishConfig(a.id,platform.value,revision,true);status.textContent="تم حفظ الإعداد المنشور — الإصدار "+d.revision+"؛ وصوله للأجهزة غير متحقق بعد.";});};p.append(platform,load,editor,save,publish,status);return p;}


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
    const d=await window.appcoreBulletin(a.id,'read');

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
    load.disabled=publish.disabled=revoke.disabled=true;

    try{
      await fn();
      await refresh();
    }catch(e){
      status.textContent=e.message;
    }finally{
      busy=false;
      load.disabled=false;
      publish.disabled=revoke.disabled=revision===null;
    }
  }

  load.onclick=()=>act(async()=>{});

  publish.onclick=()=>{
    if(!confirm("نشر الإعلان؟"))return;

    return act(()=>window.appcoreBulletin(
      a.id,'publish',{
        title:title.value,
        body:body.value,
        revision,
        confirm:true
      }
    ));
  };

  revoke.onclick=()=>{
    if(!confirm("إلغاء الإعلان المنشور؟"))return;

    return act(()=>window.appcoreBulletin(
      a.id,'revoke',{revision,confirm:true}
    ));
  };

  publish.disabled=revoke.disabled=true;

  panel.append(title,body,load,publish,revoke,status);

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
 const p=card('نشر المحتوى العام','انشر مسودة موجودة بمعرفها؛ المحتوى المنشور عام');const kind=el('select');for(const v of ['content','database']){const o=el('option',v);o.value=v;kind.append(o)}const key=el('input');key.placeholder='Draft ID';const out=el('p');
 for(const active of [true,false]){const b=el('button',active?'نشر':'إلغاء النشر');b.onclick=async()=>{if(!confirm('تأكيد العملية؟'))return;b.disabled=true;try{await window.appcoreCatalogPublish(kind.value,key.value,active,true);out.textContent='تم حفظ حالة النشر'}catch(e){out.textContent=e.message}finally{b.disabled=false}};p.append(b)}p.append(kind,key,out);return p;
}

function omegaRenewPanel(a){
 const p=card('تجديد صلاحية الإعدادات','تجديد الإعدادات المنشورة دون تغيير قيمها');
 const out=el('p');for(const platform of (a.id==='exmore'?['android']:['android','web'])){
 const b=el('button','Renew '+platform);b.onclick=async()=>{if(!confirm('تجديد الإعدادات الحالية؟'))return;b.disabled=true;try{out.textContent='Revision '+await window.appcoreOmegaRenew(a.id,platform)}catch(e){out.textContent=e.message}finally{b.disabled=false}};p.append(b)}p.append(out);return p;
}
