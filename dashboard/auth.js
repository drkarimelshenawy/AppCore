import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithRedirect, getRedirectResult, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
const response = await fetch("/__/firebase/init.json", {cache:"no-store"});
if (!response.ok) throw new Error("Firebase Hosting configuration unavailable");
const config = await response.json();
if (config.projectId !== "appcore-2026" || !config.apiKey) throw new Error("Invalid Firebase project configuration");
const app = initializeApp({...config, authDomain:location.hostname});
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
