import assert from 'node:assert/strict';
import { test } from 'node:test';
import { changedUrls, submit, validateManifest } from '../indexnow-changed.mjs';
test('first baseline suppresses whole-site and subset includes add/update/delete', () => {
  const a='https://roomfeng.win/a/', b='https://roomfeng.win/b/', c='https://roomfeng.win/c/', d='https://roomfeng.win/d/';
  const one='a'.repeat(64), two='b'.repeat(64);
  assert.deepEqual(changedUrls(undefined, { [a]: one }), []);
  assert.deepEqual(changedUrls({ [a]:one, [b]:one, [c]:one }, { [a]:one, [b]:two, [d]:one }), [b,c,d]);
});
test('foreign hosts, state URLs, malformed hashes and keys fail closed', async () => {
  for (const value of [[], {'https://other.test/':'a'.repeat(64)}, {'https://roomfeng.win/?state=1':'a'.repeat(64)}, {'https://roomfeng.win/':'bad'}]) assert.throws(()=>validateManifest(value));
  await assert.rejects(submit(['https://other.test/'],'examplekey',async()=>{throw new Error('must not fetch');}),/Unsafe/);
  await assert.rejects(submit(['https://roomfeng.win/'],'bad'),/Invalid/);
});
test('verified key, small batches, retries and no key in logs', async () => {
  let posts=0; const bodies=[];
  const request=async (url, options) => {
    if (!options?.method) return { status:200, text:async ()=>'examplekey' };
    posts++; bodies.push(JSON.parse(options.body)); return { status:posts===1?429:202 };
  };
  const logs=await submit(Array.from({length:101},(_,i)=>`https://roomfeng.win/${i}/`),'examplekey',request,async()=>{});
  assert.equal(posts,3); assert.equal(bodies[0].urlList.length,100); assert.equal(bodies[2].urlList.length,1);
  assert.ok(!JSON.stringify(logs).includes('examplekey'));
});
test('failed production verification prevents submissions', async () => {
  await assert.rejects(submit(['https://roomfeng.win/'],'examplekey',async()=>({ status:404, text:async()=>'' }),async()=>{}), /verification failed/);
});
test('initial zero-URL baseline verifies the public key without POST', async () => {
  let gets=0;
  const logs=await submit([], 'examplekey', async (_url,options)=>{
    assert.equal(options?.method,undefined); gets++;
    return {status:200,text:async ()=>'examplekey'};
  });
  assert.equal(gets,1); assert.deepEqual(logs,[]);
  await assert.rejects(submit([], 'examplekey', async()=>({status:404,text:async()=>''})), /verification failed/);
});
