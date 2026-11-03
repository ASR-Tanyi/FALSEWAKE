import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat,readdir} from 'node:fs/promises';
import {Engine} from '../web/engine.js';
import {ROLES,eventText} from '../web/data.js';
const bytes=await readFile(new URL('../dist/core.wasm',import.meta.url));
async function fresh() {return new Engine((await WebAssembly.instantiate(bytes,{})).instance.exports);}
function last(e) {return e.snapshot().events.at(-1);}
test('genuine WASM with a versioned API and no environment imports',async()=>{
  assert.deepEqual([...bytes.slice(0,4)],[0,97,115,109]);
  const module=await WebAssembly.compile(bytes);
  assert.deepEqual(WebAssembly.Module.imports(module),[]);
  const e=await fresh();assert.equal(e.api.fw_version(),1);
  assert.equal(e.snapshot().people.length,12);assert.equal(e.snapshot().actions,4);
  assert.equal(e.snapshot().events.length,1);
});
test('public view hides living roles, team, Taint and report truth',async()=>{
  const e=await fresh();for(const p of e.snapshot().people) {assert.equal(p.role,0);assert.equal(p.team,-1);assert.ok(!('taint' in p));}
  assert.equal(e.api.fw_person(2,9),-1);assert.equal(e.api.fw_event(0,5),-1);
});
test('invalid inputs, repeats, wrong targets and passive powers are atomic',async()=>{
  const e=await fresh();
  for(const args of [[0,0,0],[1,-1,0],[1,12,0],[2,1,1],[2,4,0],[2,8,0],[2,2,11]]) {
    const before=e.snapshot();assert.throws(()=>e.command(...args));assert.deepEqual(e.snapshot(),before);
  }
  assert.throws(()=>e.command(1,2**32,0));assert.throws(()=>e.command(1,NaN,0));assert.throws(()=>e.command(1,1.1,0));
  e.command(1,1);const after=e.snapshot();assert.throws(()=>e.command(1,1));assert.deepEqual(e.snapshot(),after);
});
test('four actions per day, one execution, refreshed at dawn',async()=>{
  const e=await fresh();for(const i of [1,2,3,4]) e.command(1,i);
  assert.equal(e.snapshot().actions,0);assert.throws(()=>e.command(1,5),/No investigations/);
  e.command(3,4);assert.throws(()=>e.command(3,2),/execution/);
  e.command(4);assert.equal(e.snapshot().actions,4);assert.equal(e.snapshot().day,2);assert.equal(e.snapshot().executed,false);
});
test('Drunk information is false and cleansing cannot cure the role',async()=>{
  const e=await fresh();e.command(2,3,3);assert.equal(last(e).value,1);
  e.command(2,7,3);e.command(4);e.command(2,3,3);assert.equal(last(e).value,1);
});
test('Courier removes Smokescreen registration disguise, changing a neighbor count',async()=>{
  const e=await fresh();e.command(2,3,3);assert.equal(last(e).value,1);
  e.command(2,10,2);assert.equal(e.snapshot().people[2].marked,true);
  // Drunk's count rises from 1 to 2 as actual registered evil rises from 0 to 1.
  e.command(1,3);assert.equal(last(e).value,2);
});
test('Trueglass ignores masks, but is once per case',async()=>{
  const e=await fresh();e.command(2,11,8);assert.equal(last(e).value,0);
  assert.throws(()=>e.command(2,11,2));e.command(4);assert.throws(()=>e.command(2,11,2));
});
test('Auditor distinguishes true roles from claims, not good from evil',async()=>{
  const e=await fresh();e.command(2,5,3);assert.equal(last(e).value,0);
  e.command(4);e.command(2,5,0);assert.equal(last(e).value,1);
});
test('Neverdead survives execution without Resolve loss; Taint disables immunity',async()=>{
  const e=await fresh();e.command(3,4);assert.equal(e.snapshot().people[4].alive,true);assert.equal(e.snapshot().resolve,3);
  e.command(4); // Rotmonger taints Bram on first night.
  e.command(3,4);assert.equal(e.snapshot().people[4].alive,false);assert.equal(e.snapshot().resolve,2);
});
test('Ward blocks a night attack but Whisperer taints the survivor',async()=>{
  const e=await fresh();e.command(2,1,7);e.command(4);
  assert.equal(e.snapshot().people[7].alive,true);assert.equal(e.snapshot().people[7].ward,false);
  assert.ok(e.snapshot().events.some(e=>e.kind===13&&e.target===7));
  e.command(2,7,4); // Impaired Cleanser cannot restore tainted Neverdead.
  e.command(3,4);assert.equal(e.snapshot().people[4].alive,false);
});
test('a ward does not prevent execution; death reveals true identity',async()=>{
  const e=await fresh();e.command(2,1,8);e.command(3,8);
  const p=e.snapshot().people[8];assert.equal(p.alive,false);assert.equal(p.role,10);assert.equal(p.team,0);
  assert.equal(e.snapshot().resolve,2);
});
test('an evil Archivist claimant can falsely verify a truthful report',async()=>{
  const e=await fresh();e.command(2,2,0);assert.equal(last(e).kind,8);assert.equal(last(e).value,0);
});
test('historical reports retain original values across actions and nights',async()=>{
  const e=await fresh();e.command(2,3,3);const history=e.snapshot().events;
  e.command(2,10,2);e.command(4);assert.deepEqual(e.snapshot().events.slice(0,history.length),history);
});
test('all evil, not only the Tyrant, must die to win',async()=>{
  const e=await fresh();e.command(3,9);assert.equal(e.snapshot().status,0);
  e.command(4);e.command(3,2);e.command(4);e.command(3,6);assert.equal(e.snapshot().status,1);
  assert.ok(e.snapshot().people.every(p=>p.role>0&&p.team>=0));
  const before=e.snapshot();assert.throws(()=>e.command(4),/ended/);assert.deepEqual(e.snapshot(),before);
});
test('three wrongful executions lose; a run is bounded to twelve nights',async()=>{
  const e=await fresh();e.command(3,0);e.command(4);e.command(3,3);e.command(4);e.command(3,8);
  assert.equal(e.snapshot().resolve,0);assert.equal(e.snapshot().status,2);
  e.reset();e.command(3,9);for(let i=0;i<12;++i)e.command(4);
  assert.equal(e.snapshot().day,13);assert.equal(e.snapshot().status,2);
});
test('accepted commands replay deterministically; corrupt saves reset safely',async()=>{
  const e=await fresh();for(const c of [[1,3,0],[2,10,2],[2,1,7],[3,2,0],[4,0,0]])e.command(...c);
  const expected=e.snapshot(),replay=await fresh();assert.deepEqual(replay.replay(e.history),expected);
  assert.throws(()=>replay.replay([[1,1,0],[1,1,0]]));assert.equal(replay.snapshot().day,1);assert.equal(replay.snapshot().actions,4);
  for(const invalid of [null,Array(201).fill([1,1,0]),[[1,1]],[[1,'2',0]]]) assert.throws(()=>replay.replay(invalid));
});
test('seeded action fuzzing preserves bounds and rejected-action atomicity',async()=>{
  const e=await fresh();let seed=18;
  const random=n=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%n;};
  for(let i=0;i<2500;++i) {
    if(e.snapshot().status) e.reset();
    const before=e.snapshot();try {e.command(1+random(4),random(16)-2,random(16)-2);}catch{assert.deepEqual(e.snapshot(),before);}
    const s=e.snapshot();assert.ok(s.actions>=0&&s.actions<=4);assert.ok(s.resolve>=0&&s.resolve<=3);assert.ok(s.day>=1&&s.day<=13);
    assert.ok(s.events.length<512);assert.equal(s.people.length,12);
    for(const event of s.events) assert.equal(typeof eventText(event),'string');
  }
});
test('static bundle is self-contained and project-subpath safe',async()=>{
  for(const f of ['index.html','app.js','engine.js','data.js','art.js','style.css','favicon.svg','core.wasm','.nojekyll'])assert.ok((await stat(new URL('../dist/'+f,import.meta.url))).isFile());
  for(const f of await readdir(new URL('../dist/',import.meta.url))) if(/\.(js|css|html)$/.test(f)) {
    const s=await readFile(new URL('../dist/'+f,import.meta.url),'utf8');
    assert.doesNotMatch(s,/(?:src|href)=["']\//);assert.doesNotMatch(s,/https:\/\/(?:fonts|cdn|unpkg)/);
  }
  assert.equal(Object.keys(ROLES).length,13);
});
