import express from "express";
import {initializeApp,applicationDefault} from "firebase-admin/app";
import {getAuth} from "firebase-admin/auth";
import {getMessaging} from "firebase-admin/messaging";
import {getFirestore,FieldValue} from "firebase-admin/firestore";
const owner=process.env.APPCORE_OWNER_UID;
if(!owner) throw new Error("APPCORE_OWNER_UID required");
initializeApp({credential:applicationDefault()});
const app=express(), db=getFirestore();
app.disable("x-powered-by");
app.use(express.json({limit:"16kb"}));
app.get("/health",(_,res)=>res.json({ok:true}));
app.use("/api",async(req,res,next)=>{
try{const match=/^Bearer (.+)$/.exec(req.headers.authorization||"");if(!match)return res.sendStatus(401);
const user=await getAuth().verifyIdToken(match[1],true);
if(user.uid!==owner)return res.sendStatus(403);
req.owner=user.uid;next();}catch{return res.sendStatus(401);}
});
app.get("/api/me",(req,res)=>res.json({uid:req.owner}));
app.post("/api/notifications",async(req,res)=>{
const {appId,title,body,audience,requestId}=req.body||{};
if(!["exmore","altabloh"].includes(appId)||audience!=="test"||typeof title!=="string"||!title.trim()||title.length>100||typeof body!=="string"||!body.trim()||body.length>1000||typeof requestId!=="string"||!/^[a-zA-Z0-9_-]{16,80}$/.test(requestId))return res.sendStatus(400);
const ref=db.collection("notificationAudit").doc(requestId);
try{await ref.create({appId,title,body,audience,owner:req.owner,status:"pending",createdAt:FieldValue.serverTimestamp()});}catch(e){return res.sendStatus(e.code===6?409:503);}
try{const messageId=await getMessaging().send({topic:appId+"_test",notification:{title,body}});
await ref.update({status:"sent",messageId});res.json({messageId});}catch{await ref.update({status:"unknown_or_failed"}).catch(()=>{});res.sendStatus(502);}
});
app.listen(Number(process.env.PORT||8080),"0.0.0.0");
