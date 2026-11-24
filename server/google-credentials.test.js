import {test} from "node:test";
import assert from "node:assert/strict";
import {createGoogleCredentialProvider} from "./google-credentials.js";
test("concurrent calls share acquisition and refresh near expiry", async () => {
  let time = 0, calls = 0;
  const provider = createGoogleCredentialProvider({now:()=>time, acquire:async()=>({accessToken:"token-"+ ++calls,expiresAt:time+120000})});
  assert.deepEqual(await Promise.all([provider.getAccessToken(),provider.getAccessToken()]),["token-1","token-1"]);
  assert.equal(await provider.getAccessToken(),"token-1");
  time=60000;
  assert.equal(await provider.getAccessToken(),"token-2");
  assert.equal(calls,2);
});
test("invalid credential fails closed and permits retry",async()=>{
  let calls=0;
  const provider=createGoogleCredentialProvider({now:()=>0,acquire:async()=>++calls===1?{accessToken:"bad",expiresAt:1}:{accessToken:"valid",expiresAt:120000}});
  await assert.rejects(provider.getAccessToken(),/Invalid/);
  assert.equal(await provider.getAccessToken(),"valid");
});
test("acquisition failure propagates",async()=>{
  const provider=createGoogleCredentialProvider({acquire:async()=>{throw new Error("unavailable")}});
  await assert.rejects(provider.getAccessToken(),/unavailable/);
});
