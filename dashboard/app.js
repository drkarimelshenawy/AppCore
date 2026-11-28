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
  main.append(registeredDevicePanel(a));
  if(selected(a).includes("notifications")&&a.id==="3al-tabloh")main.append(webPushPanel());
  if(selected(a).includes("crashes")||selected(a).includes("analytics"))main.append(diagnosticSnapshotPanel(a));
  if(selected(a).includes("notifications"))main.append(operationsNotificationPanel(a));
  main.append(operationsDiagnosticsPanel(a));
  main.append(pilotReleasePanel(a));
  main.append(externalStatusPanel());
  main.append(healthHistoryPanel());
}
main.append(servicePanel(a,"audit"));}
else if(key==="logs"){main.append(el("h1","SYSTEM CONSOLE"),card(connected?"[OK] Firestore connection":"[OFFLINE] Firestore not verified","[PENDING] Application integration / Notification gateway"));}
else if(key==="monitor"){main.append(el("h1","المراقبة"),publicHealthPanel());}
else {main.append(el("h1","الإعدادات"),card("حالة الخدمات","لا توجد بيانات تشغيلية متحققة بعد."));}}
for(const [key,label] of [["overview","الرئيسية"],["apps","التطبيقات"],["monitor","المراقبة"],["logs","السجل"],["settings","الإعدادات"]]){const b=el("button",label);b.dataset.key=key;b.onclick=()=>show(key);nav.append(b);}
document.querySelector("#theme").onclick=()=>document.body.classList.toggle("light");
window.addEventListener("appcore-data",e=>{apps=e.detail?.apps||[];connected=e.detail?.connected===true;show(!["overview","apps","monitor","logs","settings"].includes(active)&&!apps.some(a=>a.id===active)?"overview":active);});
show("overview");

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
function diagnosticSnapshotPanel(a){const p=card('Crashlytics / Performance — BigQuery','لقطة مجمعة لآخر 7 أيام مكتملة (UTC). لا تتضمن أسماء مستخدمين أو محتوى شخصياً؛ ليست لحظية.');const b=el('button','تحميل آخر استيراد'),out=el('pre','لم يتم التحميل','console-output');b.onclick=async()=>{b.disabled=true;try{const v=await window.appcoreDiagnosticSnapshot(a.id);out.textContent=v?JSON.stringify(v,null,2):'لا يوجد استيراد مؤكد بعد'}catch{out.textContent='تعذر التحميل'}finally{b.disabled=false}};p.append(b,out);return p;}

function externalStatusPanel(){
 const p=card('GitHub / Sentry','قراءة مباشرة من الخدمات الخارجية بعد تفعيل صلاحيات القراءة؛ النتائج عينات محدودة وليست إجمالي الأعطال.'),b=el('button','تحميل حالة التكاملات'),out=el('pre','لم يتم التحميل','console-output');
 b.onclick=async()=>{b.disabled=true;try{out.textContent=JSON.stringify(await window.appcoreExternalStatus(),null,2)}catch(e){out.textContent='تعذر التحميل: '+e.message}finally{b.disabled=false}};
 p.append(b,out);return p;
}

function pilotReleasePanel(a){
 const p=card('اختبار التحديثات المعزول','سجل اصطناعي منفصل لا يصل إلى مسار تحديث الإنتاج، ولا يشير إلى ملف APK.'),out=el('p','');
 out.setAttribute('role','status');
 for(const active of [true,false]){const b=el('button',active?'إنشاء سجل اختبار':'إزالة سجل الاختبار');b.onclick=async()=>{if(!confirm('تأكيد العملية في نطاق الاختبار فقط؟'))return;b.disabled=true;try{await window.appcorePilotReleaseFixture(a.id,active,true);out.textContent=active?'تم إنشاء PILOT-ONLY':'تم إزالة سجل الاختبار'}catch(e){out.textContent=e.message}finally{b.disabled=false}};p.append(b)}
 p.append(out);return p;
}
