import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
const app = initializeApp({apiKey:"AIzaSyBWiaz4dP6aaJFlFxD7mj3J3CPaFaYJyM0",authDomain:"appcore-2026.web.app",projectId:"appcore-2026",storageBucket:"appcore-2026.firebasestorage.app",messagingSenderId:"316863421809",appId:"1:316863421809:web:a57802628c500a9a4f2ad0"});
import { getFirestore, collection, getDocs, doc, setDoc, serverTimestamp, runTransaction } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
const auth = getAuth(app);
const db = getFirestore(app);
const owner = "bnPCGBPKIcT0zbMlOcd6Z6ttGr22";
let generation = 0;
let ready = false;
const allowedModules = new Set(['releases','notifications','analytics','crashes','remote','alerts','web','content','database']);
window.appcoreCreateApp = async (id,name) => {
 if (!ready || auth.currentUser?.uid !== owner) throw new Error('Unauthorized');
 if (!/^[a-z0-9][a-z0-9-]{1,49}$/.test(id) || typeof name !== 'string' || !name.trim() || name.length>100) throw new Error('Invalid app');
 const ticket=generation;
 await runTransaction(db,async tx=>{const ref=doc(db,'apps',id);if((await tx.get(ref)).exists()) throw new Error('App already exists');tx.set(ref,{name:name.trim(),connected:false,modules:[],createdAt:serverTimestamp()});});
 if(ticket===generation) await connect(auth.currentUser,ticket);
};
window.appcoreSaveModules = async (id, modules) => {
 if (!ready || auth.currentUser?.uid !== owner) throw new Error('Unauthorized');
 if (!/^[a-z0-9][a-z0-9-]{1,49}$/.test(id) || !Array.isArray(modules) || modules.some(m=>!allowedModules.has(m))) throw new Error('Invalid configuration');
 const ticket = generation;
 await setDoc(doc(db,'apps',id),{modules:[...new Set(modules)],updatedAt:serverTimestamp()},{merge:true});
 if(ticket===generation) await connect(auth.currentUser,ticket);
};
async function connect(user, ticket) {
 if (!user || user.uid !== owner) return;
 const ref = collection(db,"apps");
 let snapshot = await getDocs(ref);
 if (ticket !== generation) return;
 if (snapshot.empty) {
  for (const [id,name] of [["exmore","ExMore"],["3al-tabloh","ع التابلوه"]]) {
   if(ticket !== generation) return;
   await setDoc(doc(ref,id),{name,connected:false,createdAt:serverTimestamp()},{merge:true});
  }
  snapshot = await getDocs(ref);
 }
 if(ticket !== generation) return;
 ready = true;
 document.querySelector("#notice").textContent = "متصل بقاعدة البيانات — نشر التحديثات وإرسال الإشعارات غير مفعّلين بعد.";
 status.textContent = "تم التحقق من صلاحيات الإدارة والاتصال بقاعدة البيانات.";
 window.dispatchEvent(new CustomEvent("appcore-data",{detail:snapshot.docs.map(d=>({id:d.id,...d.data()}))}));
}

const button = document.querySelector("#login"), status = document.querySelector("#auth-status");
const report = (stage, e) => { console.error("AppCore auth", stage, e); status.textContent = "تعذر تسجيل الدخول (" + stage + "): " + (e.code || e.message || "unknown"); };
onAuthStateChanged(auth, user => {
 ready = false;
 const ticket = ++generation;
 window.dispatchEvent(new CustomEvent("appcore-data",{detail:[]}));
 document.querySelector("#notice").textContent = "غير متصل بقاعدة البيانات — الإرسال والنشر غير مفعّلين.";
 button.disabled = false;
 button.textContent = user ? "تسجيل الخروج" : "الدخول بحساب Google";
 status.textContent = user ? (user.uid === owner ? "جارٍ التحقق من قاعدة البيانات..." : "هذا الحساب غير مصرح له بالإدارة.") : "سجل الدخول لبدء إعداد حساب الإدارة.";
 if(user?.uid === owner) connect(user,ticket).catch(e=>{if(ticket===generation) report("Firestore",e);});
 button.onclick = async () => { try { if(user) await signOut(auth); else await signInWithPopup(auth,new GoogleAuthProvider()); } catch(e){report("Google", e); } };
}, e => report("initialization", e));
