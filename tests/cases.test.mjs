import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {CaseEngine} from '../web/cases-engine.js';
import {CASE_CHARACTERS,clueText} from '../web/characters.js';
const bytes=await readFile(new URL('../dist/cases.wasm',import.meta.url));
const fixtures=JSON.parse(await readFile(new URL('./cases-fixtures.json',import.meta.url),'utf8'));
const bit=i=>i<0?0:1<<i, pop=m=>Array.from({length:12},(_,i)=>!!(m&bit(i))).filter(Boolean).length;
const fresh=async(id=1)=>{const e=new CaseEngine((await WebAssembly.instantiate(bytes,{})).instance.exports);e.reset(id);return e;};
// Independent, test-only evaluator: use arrays of observed people, not WASM's predicate code.
function observation(q,e,d,m){
 const observed=Array.from({length:12},(_,i)=>Boolean(e&bit(i))||i===m);
 const indices=Array.from({length:12},(_,i)=>i).filter(i=>q.targets&bit(i));
 const values=indices.map(i=>observed[i]);
 switch(q.type){
  case 1:case 3:return Number(values.some(Boolean));
  case 2:return values.filter(Boolean).length;
  case 4:return Number(values[0]===values[1]);
  case 5:return Number(values.every(Boolean));
  case 6:return Number(indices.some(i=>i===d||i===m));
  case 7:return Number(indices.includes(d));
  case 8:return Number(values.filter(Boolean).length===1);
  default:throw Error('Unknown observation');
 }
}
function worlds(id,clues,rejected=[]){
 const result=[];
 for(let e=0;e<4096;e++)if(pop(e)===3&&!rejected.includes(e))for(let d=0;d<12;d++)if(!(e&bit(d)))
  for(let m=id===1?-1:0;m<(id===1?0:12);m++)if(m!==d&&!(e&bit(m))){
   if(clues.every(c=>!!(e&bit(c.id))||(d===c.id?c.value!==observation(c,e,d,m):c.value===observation(c,e,d,m))))result.push([e,d,m]);
  }
 return result;
}
test('genuine sealed WASM v2 exposes claims, never unopened statements or true identities',async()=>{
 assert.deepEqual(WebAssembly.Module.imports(await WebAssembly.compile(bytes)),[]);const e=await fresh();assert.equal(e.api.fd_version(),2);
 for(const c of e.snapshot().clues){assert.ok(c.claim>0);for(const f of ['type','targets','value','role','actual','truth','character'])assert.equal(c[f],-1);}
});
for(const id of [1,2])test(`case ${id}: independent exhaustive proof agrees at every reading and yields a zero-loss win`,async()=>{
 const e=await fresh(id),record=[];assert.equal(e.analysis().worlds,id===1?1980:15840);
 for(let i=0;i<12;i++){
  e.command(1,i);const s=e.snapshot(),possible=worlds(id,s.clues.filter(c=>c.read)),a=e.analysis();
  assert.equal(a.worlds,possible.length);assert.equal(a.teams,new Set(possible.map(w=>w[0])).size);
  for(const [field,index] of [['evil',0],['drunk',1],['mask',2]])assert.equal(a[field],possible.reduce((m,w)=>m&(index?bit(w[index]):w[0]),4095));
  for(let seat=0;seat<12;seat++){
   const support=[0,0,0,0];for(const [enemy,drunk,mask]of possible)support[enemy&bit(seat)?3:drunk===seat?1:mask===seat?2:0]++;
   assert.deepEqual(a.support[seat],support);
  }
  record.push(a.worlds);
 }
 const a=e.analysis();assert.equal(a.worlds,1);assert.equal(a.evil,fixtures[id-1].evil);
 assert.equal(a.drunk,bit(fixtures[id-1].drunk));assert.equal(a.mask,bit(fixtures[id-1].mask));
 e.command(2,a.evil);assert.equal(e.snapshot().status,1);assert.equal(e.snapshot().resolve,3);
 for(const c of e.snapshot().clues){assert.ok(c.character>0);assert.equal(c.actual,observation(c,a.evil,fixtures[id-1].drunk,fixtures[id-1].mask));}
 assert.equal(new Set(e.snapshot().clues.map(c=>c.character)).size,12);
 await mkdir('.build',{recursive:true});await writeFile(`.build/case-${id}-validation.json`,JSON.stringify({case:id,worlds:record,unique:true,resolve:3}));
});
test('all authored skills are simple, bounded, unique, and exclude their speaker',async()=>{
 for(const id of [1,2]){
  const e=await fresh(id);assert.equal(new Set(e.snapshot().clues.map(c=>c.claim)).size,12);
  for(let i=0;i<12;i++)e.command(1,i);
  for(const c of e.snapshot().clues){
   assert.equal(c.targets&bit(c.id),0);assert.ok(pop(c.targets)>=1&&pop(c.targets)<=6);
   if(pop(c.targets)>2)assert.equal(c.type,1);
   if(c.type===2){assert.equal(pop(c.targets),2);assert.equal(c.targets,bit((c.id+11)%12)|bit((c.id+1)%12));}
   else assert.ok(c.value===0||c.value===1);
   if([3,6,7].includes(c.type))assert.equal(pop(c.targets),1);
   if([4,5,8].includes(c.type))assert.equal(pop(c.targets),2);
   const text=clueText(c);assert.match(text,/#\d\d/);assert.doesNotMatch(text,/Mara|Silas|truly|true team/);
   assert.ok(CASE_CHARACTERS[c.claim]);
  }
 }
});
test('an enemy can be truthful, a Good character can be wrong, and mask is not an enemy',async()=>{
 const e=await fresh(2);for(let i=0;i<12;i++)e.command(1,i);const a=e.analysis();e.command(2,a.evil);
 const s=e.snapshot();assert.ok(s.clues.some(c=>c.role===4&&c.truth===1));assert.ok(s.clues.some(c=>c.role===2&&c.truth===0));
 assert.ok(s.clues.some(c=>c.role===3&&c.truth===1));
});
test('invalid, repeated, non-integer and terminal actions are atomic',async()=>{
 const e=await fresh();for(const args of [[0,0],[1,-1],[1,12],[2,0],[2,4096],[1,NaN],[1,1.5],[1,2**32]]){
  const before=e.snapshot();assert.throws(()=>e.command(...args));assert.deepEqual(e.snapshot(),before);
 }
 e.command(1,0);assert.throws(()=>e.command(1,0));
 e.command(2,7);const rejected=e.snapshot();assert.throws(()=>e.command(2,7));assert.deepEqual(e.snapshot(),rejected);
 e.command(2,11);e.command(2,13);assert.equal(e.snapshot().status,2);const ended=e.snapshot();assert.throws(()=>e.command(1,1));assert.deepEqual(e.snapshot(),ended);
});
test('wrong accusations exclude whole trios without leaking individual identities',async()=>{
 const e=await fresh();e.command(2,7);assert.equal(e.analysis().teams,219);assert.equal(e.snapshot().resolve,2);
 assert.ok(e.snapshot().clues.every(c=>c.role===-1));assert.equal(e.analysis().evil,0);
});
test('theory checks use joint public constraints and do not mutate evidence',async()=>{
 const e=await fresh(2);const before=e.snapshot();assert.equal(e.theory(4095,0),0);assert.equal(e.theory(0,15),0);
 assert.throws(()=>e.theory(1,1));assert.equal(e.theory(0,0),15840);assert.deepEqual(e.snapshot(),before);
 for(let i=0;i<12;i++)e.command(1,i);const a=e.analysis();assert.equal(e.theory(a.good,a.evil),1);assert.equal(e.theory(a.evil,0),0);
});
test('replays are v2 and atomic; old solutions and malformed imports never reinterpret a run',async()=>{
 const e=await fresh(2);e.command(1,5);e.command(1,7);const data=e.export(),snapshot=e.snapshot();assert.equal(data.version,2);
 const other=await fresh();assert.deepEqual(other.replay(data),snapshot);
 for(const bad of [null,{...data,version:1},{...data,caseId:99},{...data,commands:[[1,1],[1,1]]},{...data,commands:[[1,'2']]},{...data,commands:[[2,7],[1,99]]}]){
  assert.throws(()=>e.replay(bad));assert.deepEqual(e.snapshot(),snapshot);assert.deepEqual(e.export(),data);
 }
});
test('3,000 boundary actions preserve case state on rejection',async()=>{
 const e=await fresh();let seed=42;const random=n=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%n;};
 for(let i=0;i<3000;i++){if(e.snapshot().status)e.reset(random(2)+1);const before=e.snapshot();try{e.command(random(4),random(4200)-20);}catch{assert.deepEqual(e.snapshot(),before);}assert.ok(e.snapshot().journal.length<=15);}
});
