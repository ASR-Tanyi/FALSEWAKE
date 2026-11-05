import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {NightfallEngine} from '../web/nightfall-engine.js';
import {NIGHTFALL_CASES} from '../web/nightfall-cases.js';
import {HollowReference,WORLDS,SUSPECTS,POOL,analyze} from './hollow-reference.mjs';
import {MESSAGE_ROWS,LOCALE_CODES,catalogs,setLocale,missingMessages} from '../web/i18n.js';
import {NIGHTFALL_ROLES as ROLES,eventText,eventLabel} from '../web/data.js';
const bytes=await readFile(new URL('../dist/nightfall.wasm',import.meta.url));
async function fresh(id='hollow-ward'){const e=new NightfallEngine((await WebAssembly.instantiate(bytes,{})).instance.exports);e.reset(id);return e;}
const actual=[20,13,9,11]; // Test fixture only; not used by the solver or UI.
const route=[[2,10,4],[2,11,2],[2,5,2],[2,1,4],[4,0,0],[2,11,3],[2,5,3],[2,1,4],[4,0,0],[2,11,6],[2,5,6]];
test('second Nightfall case uses a private shared-core WASM view and 24 public-roster possibilities',async()=>{
 const e=await fresh();assert.equal(e.caseId,'hollow-ward');assert.equal(e.api.fn_state(10),2);
 assert.equal(e.analysis().worlds,24);assert.equal(e.analysis().teams,4);
 assert.equal(new Set(e.snapshot().people.map(p=>p.claim)).size,12);
 assert.ok(e.snapshot().people.every(p=>p.role===0&&p.team===-1));
 assert.deepEqual(WebAssembly.Module.imports(await WebAssembly.compile(bytes)),[]);
 assert.equal(typeof e.api.fn_reset_world,'undefined');
});
test('second case matches an independent simulation and evidence analyst after every action',async()=>{
 const e=await fresh(),r=new HollowReference(actual),proof=[];
 for(const c of route){e.command(...c);r.command(...c);assert.deepEqual(e.snapshot(),r.snapshot());
  const saved=e.export(),view=e.snapshot();assert.deepEqual(e.analysis(),analyze(e.history,view));
  assert.deepEqual(e.snapshot(),view);assert.deepEqual(e.export(),saved);assert.equal(e.caseId,'hollow-ward');
  proof.push({command:c,worlds:e.analysis().worlds,teams:e.analysis().teams,actions:view.actions});}
 const a=e.analysis();assert.equal(a.teams,1);assert.equal(a.drunk,1<<6);
 e.command(5,a.evil);r.command(5,a.evil);assert.deepEqual(e.snapshot(),r.snapshot());
 assert.equal(e.snapshot().status,1);assert.equal(e.snapshot().resolve,3);assert.ok(e.snapshot().people.every(p=>p.alive));
 await mkdir(new URL('../.build/',import.meta.url),{recursive:true});
 await writeFile(new URL('../.build/hollow-validation.json',import.meta.url),JSON.stringify({caseId:'hollow-ward',permittedWorlds:24,proof},null,2));
});
test('an observation-only policy wins in all 24 independent worlds within budget',()=>{
 for(const w of WORLDS){const m=new HollowReference(w);m.command(2,10,4);let drunk=-1;
  for(let day=1;day<=3;++day){const target=SUSPECTS[day-1];m.command(2,11,target);const visible=m.events.at(-1).value;
   m.command(2,5,target);if(visible===0&&m.events.at(-1).value===0)drunk=target;
   if(day<3){m.command(2,1,4);m.command(4);assert.equal(m.status,0);}}
  if(drunk<0)drunk=SUSPECTS[3];m.command(5,POOL^(1<<drunk));
  assert.equal(m.status,1);assert.equal(m.resolve,3);assert.ok(m.p.every(p=>p.alive));
 }
});
test('a removed Ward is not a blocked attack and cannot save the original victim',async()=>{
 const e=await fresh();e.command(2,1,11);const before=e.snapshot().events.length;e.command(4);
 const night=e.snapshot().events.slice(before);assert.deepEqual(night.map(x=>x.kind),[11,23,12,14,15]);
 assert.equal(night[1].target,11);assert.equal(night[1].source,-1);assert.equal(night[1].truth,-1);
 assert.equal(e.snapshot().status,2);assert.equal(e.snapshot().people[11].alive,false);
});
test('expiry, removal and immunity resolve in order without rewriting historical evidence',async()=>{
 const e=await fresh();e.command(2,10,4);e.command(2,1,4);e.command(4);
 const first=e.snapshot().events;assert.ok(first.some(x=>x.kind===23));assert.ok(first.some(x=>x.kind===13&&x.value===1));
 // No cleansing is needed: old Taint expires, and this chapter has no Rotmonger.
 e.command(4);assert.equal(e.snapshot().status,0);assert.ok(e.snapshot().people.every(p=>p.alive));
 assert.deepEqual(e.snapshot().events.slice(0,first.length),first);
 assert.equal(e.snapshot().events.filter(x=>x.kind===23).length,1); // No ward => no removal event.
});
test('marking the Good suspect instead can be lethal; hypotheses never protect a target',async()=>{
 const e=await fresh();e.command(2,10,6);e.command(2,1,11);e.command(4);
 assert.equal(e.snapshot().status,2);assert.equal(e.snapshot().people[6].alive,false);
});
test('case selection, restarts and cross-case replays are atomic and preserve the old replay format',async()=>{
 const e=await fresh('warded-lantern');e.command(2,1,11);e.command(4);const old=e.export(),view=e.snapshot();
 assert.equal(old.caseId,'warded-lantern');assert.equal(old.version,1);
 for(const id of ['unknown',null,2]){assert.throws(()=>e.reset(id));assert.deepEqual(e.snapshot(),view);}
 assert.equal(e.api.fn_select(3),1);assert.deepEqual(e.snapshot(),view);
 assert.throws(()=>e.replay({version:1,kind:'nightfall',caseId:'hollow-ward',commands:[[2,10,4],[2,10,4]]}));
 assert.equal(e.caseId,'warded-lantern');assert.deepEqual(e.snapshot(),view);assert.deepEqual(e.export(),old);
 e.reset('hollow-ward');e.command(2,10,4);const second=e.export(),secondView=e.snapshot();
 e.replay(old);assert.deepEqual(e.snapshot(),view);e.replay(second);assert.deepEqual(e.snapshot(),secondView);
 e.reset();assert.equal(e.caseId,'hollow-ward');assert.equal(e.history.length,0);
 for(const bad of [null,{...second,version:2},{...second,caseId:'other'},{...second,commands:[[2,10,'4']]},{...second,commands:Array(33).fill([4,0,0])}]){const before=e.export();assert.throws(()=>e.replay(bad));assert.deepEqual(e.export(),before);}
});
test('1,500 seeded second-case actions agree with the independent model, including rejections',async()=>{
 const e=await fresh();let r=new HollowReference(actual),seed=123;
 const random=n=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%n;};
 for(let i=0;i<1500;++i){if(e.snapshot().status){e.reset();r=new HollowReference(actual);}
  const c=[random(3)===0?4:2,random(14)-1,random(14)-1],before=e.snapshot();let errA=false,errB=false;
  try{e.command(...c);}catch{errA=true;}try{r.command(...c);}catch{errB=true;}
  assert.equal(errA,errB);if(errA)assert.deepEqual(e.snapshot(),before);assert.deepEqual(e.snapshot(),r.snapshot());}
});
test('new chapter metadata, hints, Wardbreaker and removal events are translated in all four languages',()=>{
 assert.equal(new Set(MESSAGE_ROWS.map(r=>r[0])).size,MESSAGE_ROWS.length);
 for(const row of MESSAGE_ROWS){assert.equal(row.length,4);for(const txt of row){assert.ok(txt.trim());assert.deepEqual([...txt.matchAll(/\{\w+\}/g)].map(m=>m[0]).sort(),[...row[0].matchAll(/\{\w+\}/g)].map(m=>m[0]).sort());}}
 for(const lang of LOCALE_CODES){setLocale(lang);missingMessages.clear();
  for(const c of NIGHTFALL_CASES)for(const key of [c.title,c.caption,c.subtitle,c.roster,c.description,c.order,c.policy,c.planning,...c.hints])assert.ok(catalogs[lang][key],key);
  for(const k of ['name','text','hint'])assert.ok(catalogs[lang][ROLES[20][k]]);
  assert.ok(eventText({kind:23,target:4}));assert.ok(eventLabel({kind:23}));assert.equal(missingMessages.size,0);
 }setLocale('en');
});
