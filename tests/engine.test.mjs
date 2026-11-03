import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat,readdir} from 'node:fs/promises';
import {Engine} from '../web/engine.js';
import {ROLES,eventText,isReport} from '../web/data.js';
import {SYMBOLS} from '../web/symbols.js';
const bytes=await readFile(new URL('../dist/core.wasm',import.meta.url));
const fresh=async()=>new Engine((await WebAssembly.instantiate(bytes,{})).instance.exports);
const last=e=>e.snapshot().events.at(-1);
const pop=n=>n.toString(2).replaceAll('0','').length;
test('real WASM ABI v2, no environment imports, distinct default claims and symbols',async()=>{
 assert.deepEqual([...bytes.slice(0,4)],[0,97,115,109]);
 assert.deepEqual(WebAssembly.Module.imports(await WebAssembly.compile(bytes)),[]);
 const e=await fresh();assert.equal(e.api.fw_version(),2);const s=e.snapshot();
 assert.equal(s.people.length,12);assert.equal(s.actions,4);assert.equal(s.events.length,1);
 assert.equal(new Set(s.people.map(p=>p.claim)).size,12);
 assert.equal(new Set(s.people.map(p=>ROLES[p.claim].icon)).size,12);
 for(const r of Object.values(ROLES))assert.ok(SYMBOLS[r.icon]);
 assert.equal(new Set(Object.values(SYMBOLS)).size,Object.keys(SYMBOLS).length);
});
test('public getters hide living true roles, team, impairment, and report truth',async()=>{
 const e=await fresh();for(const p of e.snapshot().people){assert.equal(p.role,0);assert.equal(p.team,-1);assert.ok(!('taint'in p));}
 assert.equal(e.api.fw_person(2,9),-1);assert.equal(e.api.fw_event(0,6),-1);
});
test('invalid input, duplicate use, self-targets, passive powers and seeds are atomic',async()=>{
 const e=await fresh();for(const args of [[0,0,0],[1,-1,0],[1,12,0],[2,1,1],[2,4,0],[2,8,0],[2,2,11],[2,11,11],[2,5,5],[1,2**32,0],[1,NaN,0],[1,1.1,0]]){
  const before=e.snapshot();assert.throws(()=>e.command(...args));assert.deepEqual(e.snapshot(),before);
 }
 const before=e.snapshot();for(const seed of [-1,2**32,NaN,1.2]){assert.throws(()=>e.reset(seed));assert.deepEqual(e.snapshot(),before);}
 e.command(1,1);const after=e.snapshot();assert.throws(()=>e.command(1,1));assert.deepEqual(e.snapshot(),after);
});
test('four actions per day and one execution attempt refresh at dawn',async()=>{
 const e=await fresh();for(const i of [1,2,3,4])e.command(1,i);
 assert.equal(e.snapshot().actions,0);assert.throws(()=>e.command(1,5));
 e.command(3,4);assert.throws(()=>e.command(3,2));e.command(4);
 assert.equal(e.snapshot().actions,4);assert.equal(e.snapshot().day,2);assert.equal(e.snapshot().executed,false);
});
test('Countkeeper skips dead seats; historical numbered neighbors remain frozen',async()=>{
 const e=await fresh(),opening=e.snapshot().events[0];
 assert.equal(opening.subjects,(1<<1)|(1<<11));e.command(3,1);e.command(2,0,0);
 assert.equal(last(e).subjects,(1<<2)|(1<<11));assert.equal(last(e).value,0);
 assert.deepEqual(e.snapshot().events[0],opening);e.command(4);assert.deepEqual(e.snapshot().events[0],opening);
});
test('ordinary scan sees an innocent Devilmask as Evil, never bypassing registration',async()=>{
 const e=await fresh();e.command(2,11,8);assert.equal(last(e).value,1);
 assert.match(eventText(last(e)),/#09 appears Evil/);e.command(3,8);
 assert.equal(e.snapshot().people[8].team,0);
});
test('a mark exposes Smokescreen to both appearance and role-consistency scans',async()=>{
 const e=await fresh();e.command(2,11,2);assert.equal(last(e).value,0);
 e.command(2,5,2);assert.equal(last(e).value,1);e.command(2,10,2);e.command(4);
 e.command(2,11,2);assert.equal(last(e).value,1);e.command(2,5,2);assert.equal(last(e).value,0);
});
test('broad information is boolean and excludes the source; Drunk is not curable',async()=>{
 const e=await fresh();e.command(2,3,4);assert.equal(last(e).kind,16);assert.equal(last(e).value,0);assert.equal(pop(last(e).subjects),3);
 assert.ok(!(last(e).subjects&(1<<3)));e.command(2,7,3);e.command(4);e.command(2,3,4);assert.equal(last(e).value,0);
 e.reset();e.command(2,6,4);assert.equal(last(e).kind,16);assert.equal(pop(last(e).subjects),6);assert.ok(!(last(e).subjects&(1<<6)));
 assert.ok([0,1].includes(last(e).value));assert.doesNotMatch(eventText(last(e)),/Mara|Thorne|truly/);
});
test('Neverdead survives while functional; Taint disables immunity',async()=>{
 const e=await fresh();e.command(3,4);assert.equal(e.snapshot().people[4].alive,true);assert.equal(e.snapshot().resolve,3);
 e.command(4);e.command(3,4);assert.equal(e.snapshot().people[4].alive,false);assert.equal(e.snapshot().resolve,2);
});
test('Ward blocks Whisperer, but the impaired Cleanser cannot then restore Neverdead',async()=>{
 const e=await fresh();e.command(2,1,7);e.command(4);assert.equal(e.snapshot().people[7].alive,true);
 assert.ok(e.snapshot().events.some(e=>e.kind===13&&e.target===7));e.command(2,7,4);e.command(3,4);
 assert.equal(e.snapshot().people[4].alive,false);assert.equal(e.snapshot().people[7].ward,false);
});
test('a Ward cannot prevent execution and death reveals true identity',async()=>{
 const e=await fresh();e.command(2,1,8);e.command(3,8);const p=e.snapshot().people[8];
 assert.equal(p.alive,false);assert.equal(p.role,10);assert.equal(p.team,0);assert.equal(e.snapshot().resolve,2);
});
test('verification is about the observation and can be forged by an enemy',async()=>{
 const e=await fresh();e.command(2,2,0);assert.equal(last(e).kind,8);assert.equal(last(e).value,0);
});
test('all enemies must die; terminal commands are rejected without mutation',async()=>{
 const e=await fresh();e.command(3,9);assert.equal(e.snapshot().status,0);e.command(4);e.command(3,2);e.command(4);e.command(3,6);
 assert.equal(e.snapshot().status,1);assert.equal(new Set(e.snapshot().people.map(p=>p.role)).size,12);
 const before=e.snapshot();assert.throws(()=>e.command(4));assert.deepEqual(e.snapshot(),before);
});
test('three wrongful deaths or twelve nights end the investigation',async()=>{
 const e=await fresh();e.command(3,0);e.command(4);e.command(3,3);e.command(4);e.command(3,8);assert.equal(e.snapshot().status,2);
 e.reset();e.command(3,9);for(let i=0;i<12;i++)e.command(4);assert.equal(e.snapshot().day,13);assert.equal(e.snapshot().status,2);
});
test('seeded bluffs favor unused claims; rare collisions copy a Good Citizen claim',async()=>{
 const e=await fresh();let duplicate=0,total=0;const enemies=new Set([2,6,9]);
 for(let seed=1;seed<=5000;seed++){
  e.reset(seed);const people=e.snapshot().people,good=people.filter(p=>!enemies.has(p.id)).map(p=>p.claim),used=new Set(good);
  for(const p of people.filter(p=>enemies.has(p.id))){total++;if(used.has(p.claim)){duplicate++;assert.ok(good.includes(p.claim));}used.add(p.claim);}
 }
 assert.ok(duplicate/total>.08&&duplicate/total<.12,`${duplicate}/${total}`);
 e.reset(241);const expected=e.snapshot();e.reset(241);assert.deepEqual(e.snapshot(),expected);
 console.log(`Bluff policy: ${duplicate}/${total} duplicated claims across 5,000 deterministic seeds.`);
});
test('accepted commands replay with their seed; invalid saved commands are rejected',async()=>{
 const e=await fresh();e.reset(317);for(const c of [[1,3,0],[2,10,2],[2,1,7],[3,2,0],[4,0,0]])e.command(...c);
 const other=await fresh();assert.deepEqual(other.replay(e.history,e.snapshot().seed),e.snapshot());
 for(const invalid of [null,Array(201).fill([1,1,0]),[[1,1]],[[1,'2',0]],[[1,1,0],[1,1,0]]])assert.throws(()=>other.replay(invalid,317));
});
test('5,000 seeded actions preserve bounds, snapshots, and believable numeric reports',async()=>{
 const e=await fresh();let seed=18;const random=n=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%n;};
 for(let i=0;i<5000;i++){
  if(e.snapshot().status)e.reset(random(1000));const before=e.snapshot();
  try{e.command(1+random(4),random(16)-2,random(16)-2);}catch{assert.deepEqual(e.snapshot(),before);}
  const s=e.snapshot();assert.ok(s.actions>=0&&s.actions<=4);assert.ok(s.resolve>=0&&s.resolve<=3);assert.ok(s.day>=1&&s.day<=13);assert.ok(s.events.length<512);
  for(const report of s.events.filter(isReport)){
   if(report.kind!==8)assert.equal(report.subjects&(1<<report.source),0);
   if(report.kind===16)assert.ok([0,1].includes(report.value));
   assert.equal(typeof eventText(report),'string');assert.doesNotMatch(eventText(report),/\{\w+\}/);
  }
 }
});
test('static build remains local, complete, and subpath-safe',async()=>{
 for(const f of ['index.html','casebook.html','app.js','characters.js','symbols.js','characters.css','core.wasm','cases.wasm','.nojekyll'])assert.ok((await stat(new URL('../dist/'+f,import.meta.url))).isFile());
 for(const f of await readdir(new URL('../dist/',import.meta.url)))if(/\.(js|css|html)$/.test(f)){
  const s=await readFile(new URL('../dist/'+f,import.meta.url),'utf8');assert.doesNotMatch(s,/(?:src|href)=["']\//);assert.doesNotMatch(s,/https:\/\/(?:fonts|cdn|unpkg)/);
 }
});
