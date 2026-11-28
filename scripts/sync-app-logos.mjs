import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const sources=JSON.parse(await fs.readFile('scripts/app-logo-sources.json','utf8'));
const token=process.env.APPCORE_GITHUB_READ_TOKEN||'';
const out='dashboard/app-logos',lockPath='docs/app-logo-lock.json';
const hash=b=>createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex');
const sha=/^[a-f0-9]{40}$/;
function validate(b,expected){
 assert.ok(Buffer.isBuffer(b)&&b.length>=33&&b.length<=1024*1024,'PNG size');
 assert.equal(b.subarray(0,8).toString('hex'),'89504e470d0a1a0a','PNG signature');
 assert.equal(b.toString('ascii',12,16),'IHDR');
 const w=b.readUInt32BE(16),h=b.readUInt32BE(20);assert.ok(w===h&&w>=48&&w<=2048,'square app icon');
 assert.equal(hash(b),expected,'Git blob mismatch');return b;
}
async function request(url,headers={}){
 const r=await fetch(url,{headers,redirect:'error',signal:AbortSignal.timeout(15000)});
 if(!r.ok){await r.body?.cancel();throw Error('HTTP '+r.status)}
 const limit=2*1024*1024,chunks=[];let size=0;
 for await(const chunk of r.body){size+=chunk.length;if(size>limit)throw Error('Oversized response');chunks.push(chunk)}
 return Buffer.concat(chunks);
}
async function api(path,auth=false){
 return JSON.parse(await request('https://api.github.com/repos/'+path,{Accept:'application/vnd.github+json','User-Agent':'AppCore-logo-sync',...(auth&&token?{Authorization:'Bearer '+token}:{})}));
}
let previous={};try{previous=JSON.parse(await fs.readFile(lockPath,'utf8'))}catch{}
const results=[],staged=[];
for(const source of sources){
 assert.match(source.id,/^[a-z0-9][a-z0-9-]{1,49}$/);
 assert.match(source.repo,/^drkarimelshenawy\/[A-Za-z0-9_.-]+$/);
 assert.match(source.branch,/^[A-Za-z0-9_./-]+$/);
 assert.match(source.path,/^[A-Za-z0-9_./-]+\.png$/);assert.ok(!source.path.includes('..'));
 assert.match(source.commit,sha);assert.match(source.blob,sha);
 const file=out+'/'+source.id+'.png';let commit=source.commit,blob=source.blob,bytes,method;
 const prior=previous[source.id];
 if(prior?.repo===source.repo&&prior?.path===source.path&&sha.test(prior.commit)&&sha.test(prior.blob)){
  commit=prior.commit;blob=prior.blob;
 }
 let current=false;
 try{
  const head=await api(source.repo+'/commits/'+encodeURIComponent(source.branch),true);
  assert.match(head.sha,sha);
  const meta=await api(source.repo+'/contents/'+source.path+'?ref='+head.sha,true);
  assert.equal(meta.type,'file');assert.match(meta.sha,sha);assert.equal(meta.encoding,'base64');
  bytes=validate(Buffer.from(meta.content,'base64'),meta.sha);commit=head.sha;blob=meta.sha;method='github';current=true;
 }catch(e){console.log(source.id+': source API unavailable; verifying pinned or cached bytes instead ('+e.message.slice(0,120)+')')}
 if(!bytes){
  const candidates=[['github-raw','https://raw.githubusercontent.com/'+source.repo+'/'+commit+'/'+source.path],...(source.mirrors||[]).map(url=>['verified-public-mirror',url])];
  for(const [kind,url] of candidates){
   try{bytes=validate(await request(url),blob);method=kind;break}catch(e){console.log(source.id+': '+kind+' rejected ('+e.message.slice(0,120)+')')}
  }
 }
 if(!bytes){try{bytes=validate(await fs.readFile(file),blob);method='verified-cache'}catch{}}
 if(!bytes)throw Error(source.id+': no verified icon bytes; deployment stopped');
 const receipt={repo:source.repo,branch:source.branch,path:source.path,commit,blob,sha256:createHash('sha256').update(bytes).digest('hex')};
 results.push([source.id,receipt]);staged.push([file,bytes]);console.log(source.id+': verified '+blob+' via '+method+(current?' (current branch)':' (last confirmed revision)'));
}
await fs.mkdir(out,{recursive:true});
for(const [file,bytes] of staged)await fs.writeFile(file,bytes);
await fs.writeFile(lockPath,JSON.stringify(Object.fromEntries(results),null,2)+'\n');
