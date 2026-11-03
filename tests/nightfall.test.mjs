import test from 'node:test';import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {NightfallEngine} from '../web/nightfall-engine.js';
import {Reference,WORLDS,publicAnalysis,POOL} from './nightfall-reference.mjs';
import {LOCALE_CODES,setLocale,MESSAGE_ROWS,catalogs} from '../web/i18n.js';
const bytes=await readFile(new URL('../dist/nightfall.wasm',import.meta.url));
const fresh=async()=>new NightfallEngine((await WebAssembly.instantiate(bytes,{})).instance.exports);
export const ROUTE=[[2,11,2],[2,5,2],[2,10,2],[2,1,11],[4,0,0],[2,7,11],[2,11,3],[2,5,3],[2,1,11],[4,0,0],[2,7,11],[2,11,2]];
test('Nightfall is shared-core WASM, with public initial premises and no private getters',async()=>{
 const m=await WebAssembly.compile(bytes);assert.deepEqual(WebAssembly.Module.imports(m),[]);
 assert.ok(WebAssembly.Module.exports(m).every(e=>e.name==='memory'||e.name.startsWith('fn_')));
 const e=await fresh();assert.equal(e.snapshot().people.length,12);assert.equal(e.snapshot().people[11].marked,true);
 assert.equal(new Set(e.snapshot().people.map(p=>p.claim)).size,12);assert.equal(e.snapshot().suspects,POOL);
 assert.equal(e.analysis().worlds,24);assert.equal(e.analysis().teams,4);
 assert.ok(e.snapshot().people.every(p=>p.role===0&&p.team===-1));
 assert.equal(e.api.fn_event(0,6),-1);assert.equal(e.api.fn_report_truth(0),-1);
});
test('independent dynamic model matches every public state and all 24-history deductions',async()=>{
 const e=await fresh(),r=new Reference([11,9,12,13]),proof=[];
 const check=()=>{assert.deepEqual(e.snapshot(),r.snapshot());const before=e.export();assert.deepEqual(e.analysis(),publicAnalysis(e.history,e.snapshot()));assert.deepEqual(e.export(),before);proof.push({commands:e.history.length,...e.analysis()});};
 check();for(const c of ROUTE){e.command(...c);r.command(...c);check();}
 assert.equal(e.analysis().teams,1);assert.equal(e.analysis().worlds,2);assert.equal(e.analysis().drunk,8);
 e.command(5,e.analysis().evil);r.command(5,580);check();assert.equal(e.snapshot().status,1);assert.equal(e.snapshot().resolve,3);
 assert.ok(e.snapshot().people.every(p=>p.alive));
 await mkdir('.build',{recursive:true});await writeFile('.build/nightfall-validation.json',JSON.stringify({caseId:'warded-lantern',initialWorlds:24,finalWorlds:2,finalEnemyTeams:1,allAlive:true,resolve:3,proof},null,2));
});
test('the evidence-only decision policy wins for every public-roster world in the independent model',()=>{
 for(const w of WORLDS){const r=new Reference(w);let drunk=-1;
  for(let day=1;day<=3;day++){if(day>1)r.command(2,7,11);const subject=[2,3,6][day-1];r.command(2,11,subject);const evil=r.events.at(-1).value;r.command(2,5,subject);if(!evil&&!r.events.at(-1).value)drunk=subject;if(day<3){r.command(2,1,11);r.command(4);}}
  if(drunk<0)drunk=9;r.command(5,POOL^(1<<drunk));assert.equal(r.status,1);assert.equal(r.resolve,3);assert.ok(r.p.every(p=>p.alive));
 }
});
test('invalid and repeated actions, guesses before Day 3, and passive actors are atomic',async()=>{
 const e=await fresh();for(const c of [[1,0,0],[3,2,0],[2,2,0],[2,-1,1],[2,12,1],[2,1,1],[2,4,1],[2,8,1],[4,1,0],[5,580,0],[2,NaN,1],[2,2**32,1]]){const before=e.snapshot(),history=e.export();assert.throws(()=>e.command(...c));assert.deepEqual(e.snapshot(),before);assert.deepEqual(e.export(),history);}
 e.command(2,11,2);const before=e.snapshot();assert.throws(()=>e.command(2,11,3));assert.deepEqual(e.snapshot(),before);
});
test('a Ward saves the reader but Taint corrupts the next reading; cleansing is not retroactive',async()=>{
 const e=await fresh();e.command(2,1,11);e.command(4);assert.ok(e.snapshot().people[11].alive);
 e.command(2,11,3);const old=e.snapshot().events.at(-1);assert.equal(old.value,1);assert.equal(old.truth,-1);
 e.command(2,7,11);e.command(2,1,11);e.command(4);e.command(2,7,11);e.command(2,11,3);
 assert.equal(e.snapshot().events.at(-1).value,0);assert.deepEqual(e.snapshot().events[old.id],old);
 assert.deepEqual(e.analysis(),publicAnalysis(e.history,e.snapshot()));
 e.command(5,580);assert.equal(e.snapshot().events[old.id].truth,0);
});
test('an extra Good mark redirects the attack; death fails immediately, not at the next verdict',async()=>{
 const e=await fresh();e.command(2,10,3);e.command(2,1,11);e.command(4);
 assert.equal(e.snapshot().status,2);assert.equal(e.snapshot().people[3].alive,false);assert.equal(e.snapshot().people[11].alive,true);
 const before=e.snapshot();assert.throws(()=>e.command(4));assert.deepEqual(e.snapshot(),before);
});
test('wrong verdicts exclude only whole trios, repeated verdicts and third nights are rejected',async()=>{
 const e=await fresh();for(let i=0;i<2;i++){e.command(2,1,11);e.command(4);}
 assert.throws(()=>e.command(4));assert.throws(()=>e.command(5,7));
 const before=e.analysis();e.command(5,POOL^4);assert.equal(e.snapshot().resolve,2);assert.ok(e.snapshot().people.every(p=>p.role===0));
 assert.ok(e.analysis().teams<before.teams);assert.deepEqual(e.analysis(),publicAnalysis(e.history,e.snapshot()));
 const after=e.snapshot();assert.throws(()=>e.command(5,POOL^4));assert.deepEqual(e.snapshot(),after);
});
test('replay roundtrips exactly, and malformed imports preserve the current investigation',async()=>{
 const e=await fresh();for(const c of ROUTE)e.command(...c);const s=e.snapshot(),data=e.export();
 assert.deepEqual((await fresh()).replay(data),s);
 for(const invalid of [null,{...data,version:2},{...data,kind:'sealed'},{...data,commands:[[2,11,2],[2,11,2]]},{...data,commands:[[2,1]]},{...data,commands:[[2,'11',2]]},{...data,commands:Array(33).fill([4,0,0])}]){assert.throws(()=>e.replay(invalid));assert.deepEqual(e.snapshot(),s);assert.deepEqual(e.export(),data);}
});
test('localized presentation cannot alter dynamics, evidence analysis, or accepted command replay',async()=>{
 const e=await fresh();for(const c of ROUTE.slice(0,8))e.command(...c);const data=e.export(),s=e.snapshot(),analysis=e.analysis();
 for(const code of LOCALE_CODES){setLocale(code);assert.deepEqual(e.replay(data),s);assert.deepEqual(e.analysis(),analysis);}setLocale('en');
 const placeholder=s=>[...s.matchAll(/\{\w+\}/g)].map(x=>x[0]).sort();
 for(const row of MESSAGE_ROWS){assert.equal(row.length,4);for(const v of row){assert.ok(v.trim());assert.deepEqual(placeholder(v),placeholder(row[0]));}}
 assert.equal(new Set(MESSAGE_ROWS.map(r=>r[0])).size,MESSAGE_ROWS.length);
 for(const code of LOCALE_CODES)assert.ok(catalogs[code]['The warded lantern']);
});
test('seeded action fuzzing agrees with the independent model and preserves rejected commands',async()=>{
 let seed=72;const random=n=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%n;};
 let e=await fresh(),r=new Reference([11,9,12,13]);
 for(let i=0;i<900;i++){
  if(e.snapshot().status){e.reset();r=new Reference([11,9,12,13]);}
  const op=[2,2,2,4,5][random(5)],c=op===4?[4,0,0]:op===5?[5,POOL^(1<<[2,3,6,9][random(4)]),0]:[2,random(14)-1,random(14)-1];
  const before=e.snapshot();let a=true,b=true;try{e.command(...c);}catch{a=false;}try{r.command(...c);}catch{b=false;}
  assert.equal(a,b);if(!a)assert.deepEqual(e.snapshot(),before);assert.deepEqual(e.snapshot(),r.snapshot());
  if(i%30===0)assert.deepEqual(e.analysis(),publicAnalysis(e.history,e.snapshot()));
 }
});
