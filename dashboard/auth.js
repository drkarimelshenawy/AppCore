import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithRedirect, getRedirectResult, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
const app = initializeApp({apiKey:"AIzaSyBWiaz4dP6aaJFLFxD7mj3J3CPaFaYJyM0",authDomain:"appcore-2026.web.app",projectId:"appcore-2026",appId:"1:316863421809:web:a57802628c500a9a4f2ad0"});
const auth = getAuth(app);
const button = document.querySelector("#login"), status = document.querySelector("#auth-status");
const report = e => { status.textContent = "تعذر تسجيل الدخول: " + (e.code || "unknown"); };
onAuthStateChanged(auth, user => {
 button.disabled = false;
 button.textContent = user ? "تسجيل الخروج" : "الدخول بحساب Google";
 status.textContent = user ? "تم تسجيل الدخول. صلاحيات الإدارة لم تُفعّل بعد." : "سجل الدخول لبدء إعداد حساب الإدارة.";
 button.onclick = async () => { try { if(user) await signOut(auth); else await signInWithRedirect(auth,new GoogleAuthProvider()); } catch(e){report(e);} };
}, report);
getRedirectResult(auth).catch(report);
