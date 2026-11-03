import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {CaseEngine} from '../web/cases-engine.js';
const bytes=await readFile(new URL('../dist/cases.wasm',import.meta.url));
const fixtures=JSON.parse(await readFile(new URL('./cases-fixtures.json',import.meta.url)));
const bit=i=>1<<i;
const bits=m=>Array.from({length:12},(_,i)=>i).filter(i=>m&bit(i));
// Independent reference model: arrays/set membership, not the C++ bit-count routine.
function enumerate(f,opened=0,rejected=[]) {
  const result=[];
  for(let a=0;a<10;++a)for(let b=a+1;b<11;++b)for(let c=b+1;c<12;++c) {
    const evil=[a,b,c],e=bit(a)|bit(b)|bit(c);if(rejected.includes(e))continue;
    const innocents=Array.from({length:12},(_,i)=>i).filter(i=>!evil.includes(i));
    for(const d of innocents)for(const m of f.masked?innocents.filter(i=>i!==d):[-1]) {
      const truth=clue=>bits(clue.targets).filter(i=>clue.type===1?evil.includes(i):clue.type===2?(evil.includes(i)||i===m):(i===d||i===m)).length;
      if(f.clues.every((clue,i)=>!(opened&bit(i))||evil.includes(i)||(i===d?clue.value!==truth(clue):clue.value===truth(clue)))) result.push({e,d,m});
    }
  }
  return result;
}
function summary(ws) {
  return {worlds:ws.length,teams:new Set(ws.map(w=>w.e)).size,
    good:ws.length?ws.reduce((m,w)=>m&(4095^w.e),4095):0,
    evil:ws.length?ws.reduce((m,w)=>m&w.e,4095):0,
    drunk:ws.length?ws.reduce((m,w)=>m&bit(w.d),4095):0,
    mask:ws.length?ws.reduce((m,w)=>m&(w.m<0?0:bit(w.m)),4095):0,
    support:Array.from({length:12},(_,i)=>[1,2,3,4].map(r=>ws.filter(w=>(w.e&bit(i)?4:i===w.d?2:i===w.m?3:1)===r).length))};
}
async function fresh(id=1){const e=new CaseEngine((await WebAssembly.instantiate(bytes,{})).instance.exports);e.reset(id);return e;}
const proof=[];
test('sealed cases use genuine environment-free WASM and expose no unopened identities',async()=>{
  assert.deepEqual([...bytes.subarray(0,4)],[0,97,115,109]);assert.deepEqual(WebAssembly.Module.imports(await WebAssembly.compile(bytes)),[]);
  for(const id of [1,2]){const e=await fresh(id),s=e.snapshot();assert.equal(e.api.fd_version(),1);assert.equal(s.opened,0);assert.equal(s.resolve,3);
    for(const c of s.clues){assert.equal(c.type,-1);assert.equal(c.targets,-1);assert.equal(c.value,-1);assert.equal(c.role,-1);assert.equal(c.actual,-1);assert.equal(c.truth,-1);}
    assert.equal(e.api.fd_clue(-1,0),-1);assert.equal(e.api.fd_reveal(12,0),-1);assert.equal(e.api.fd_entry(0,0),-1);
  }
});
for(const f of fixtures) {
  test(`case ${f.id}: independent exhaustive model agrees after every step and proves a unique complete solution`,async()=>{
    const e=await fresh(f.id);let opened=0;const route=[];
    assert.deepEqual(e.analysis(),summary(enumerate(f)));assert.equal(e.analysis().worlds,f.worlds);
    for(const [seat] of f.proof){e.command(1,seat);opened|=bit(seat);const expected=enumerate(f,opened),analysis=e.analysis();
      assert.deepEqual(analysis,summary(expected));route.push({read:seat+1,assignments:analysis.worlds,evilTrios:analysis.teams});
      const c=e.snapshot().clues[seat];assert.deepEqual([c.type,c.targets,c.value],[f.clues[seat].type,f.clues[seat].targets,f.clues[seat].value]);
    }
    assert.equal(e.analysis().worlds,1);assert.equal(e.analysis().evil,f.truth.e);assert.equal(e.analysis().drunk,bit(f.truth.d));
    assert.equal(e.analysis().mask,f.truth.m<0?0:bit(f.truth.m));
    assert.equal(e.theory(0,f.truth.e),1);
    assert.equal(e.api.fd_compatible(f.truth.e,f.truth.d,f.truth.m),1);
    // A proof is a winning, legal action sequence, not just an offline roster claim.
    e.command(2,e.analysis().evil);assert.equal(e.snapshot().status,1);assert.equal(e.snapshot().resolve,3);
    const reports=e.snapshot().clues;
    assert.equal(reports[f.truth.d].truth,0);assert.equal(reports[f.truth.d].role,2);
    assert.ok(reports.some(c=>c.role===4&&c.truth===1),'An Evil witness tells the truth.');
    assert.ok(reports.some(c=>c.role===4&&c.truth===0),'An Evil witness also lies.');
    for(const c of reports)if(c.role===1||c.role===3)assert.equal(c.truth,1);
    proof.push({caseId:f.id,initialAssignments:f.worlds,finalAssignments:1,uniqueEvilTrio:true,uniqueBurdenRoles:true,zeroPenaltyWinningRoute:route});
  });
}
test('invalid, duplicate, terminal, and non-integer commands are atomic',async()=>{
  const e=await fresh();for(const args of [[0,0],[1,-1],[1,12],[2,0],[2,4096],[2,3],[1,NaN],[1,1.5],[1,2**32]]) {
    const before=e.export(),s=e.snapshot();assert.throws(()=>e.command(...args));assert.deepEqual(e.export(),before);assert.deepEqual(e.snapshot(),s);
  }
  e.command(1,2);assert.throws(()=>e.command(1,2));assert.throws(()=>e.reset(3));assert.throws(()=>e.reset('1'));
  const before=e.export();assert.throws(()=>e.theory(-1,0));assert.throws(()=>e.theory(1,1));assert.throws(()=>e.theory(0,NaN));assert.deepEqual(e.export(),before);
  e.command(2,1154);const finished=e.snapshot();assert.throws(()=>e.command(1,0));assert.deepEqual(e.snapshot(),finished);
});
test('wrong accusations rule out whole trios without leaking any individual identity',async()=>{
  const e=await fresh(2);e.command(2,7);assert.equal(e.snapshot().resolve,2);
  assert.equal(e.theory(0,7),0);assert.deepEqual(e.analysis(),summary(enumerate(fixtures[1],0,[7])));
  assert.ok(e.snapshot().clues.every(c=>c.role===-1));assert.throws(()=>e.command(2,7));assert.equal(e.snapshot().resolve,2);
  e.command(2,11);e.command(2,13);assert.equal(e.snapshot().status,2);assert.equal(e.snapshot().resolve,0);
  assert.ok(e.snapshot().clues.every(c=>c.role>0&&c.type>0));assert.throws(()=>e.command(1,0));
});
test('theory checks use joint public constraints rather than individual guesses',async()=>{
  const e=await fresh(2);const f=fixtures[1];e.command(1,3);e.command(1,10);const ws=enumerate(f,bit(3)|bit(10));
  for(const [good,evil] of [[3,4],[0,64],[0,577],[0,7],[512,32]])assert.equal(e.theory(good,evil),ws.filter(w=>!(w.e&good)&&(w.e&evil)===evil).length);
  assert.equal(e.theory(0,15),0); // Four Evil contradict the public three-enemy roster, even with no private data.
});
test('analysis never opens statements, mutates the run, or treats a hypothesis as fact',async()=>{
  const e=await fresh();const before=e.snapshot(),history=e.export();e.analysis();e.theory(0,7);
  assert.deepEqual(e.snapshot(),before);assert.deepEqual(e.export(),history);
  assert.equal(e.analysis().evil,0);assert.equal(e.analysis().good,0);
});
test('accepted commands replay exactly; bad imports preserve the current case atomically',async()=>{
  const e=await fresh(2);e.command(1,4);e.command(2,7);e.command(1,9);
  const data=e.export(),other=await fresh();assert.deepEqual(other.replay(data),e.snapshot());assert.deepEqual(other.analysis(),e.analysis());
  for(const invalid of [null,{}, {...data,version:99},{...data,caseId:3},{...data,commands:Array(16).fill([1,1])},
    {...data,commands:[[1,0],[1,0]]},{...data,commands:[[1,'2']]},{...data,commands:[[1,0,0]]},
    {...data,commands:[[2,577],[1,0]]}]) {
    const before=other.snapshot(),history=other.export();assert.throws(()=>other.replay(invalid));assert.deepEqual(other.snapshot(),before);assert.deepEqual(other.export(),history);
  }
  const exported=other.export();exported.commands[0][1]=11;assert.notDeepEqual(other.export(),exported);
});
test('native-shaped boundary fuzzing preserves state on rejection',async()=>{
  const e=await fresh();let seed=19;
  const rand=n=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%n;};
  for(let i=0;i<2000;++i){if(e.snapshot().status)e.reset(1+rand(2));const before=e.snapshot();
    try{e.command(rand(4),rand(4200)-40);}catch{assert.deepEqual(e.snapshot(),before);}
    const s=e.snapshot();assert.ok(s.resolve>=0&&s.resolve<=3);assert.ok(s.journal.length<=15);assert.ok(s.opened>=0&&s.opened<=4095);
  }
});
test('casebook assets are local, CSP-compatible, and free of answer tables',async()=>{
  for(const file of ['casebook.html','casebook.css','casebook.js','cases-engine.js']){
    const text=await readFile(new URL('../web/'+file,import.meta.url),'utf8');
    assert.doesNotMatch(text,/(?:src|href)=["']\//);assert.doesNotMatch(text,/https:\/\/(?:fonts|cdn|unpkg)/);
    assert.doesNotMatch(text,/evil:\s*(1154|577)|"truth"\s*:/);
  }
  await mkdir(new URL('../.build/',import.meta.url),{recursive:true});
  await writeFile(new URL('../.build/case-validation.json',import.meta.url),JSON.stringify({scope:'Sealed dawn only; not the dynamic sandbox',cases:proof},null,2)+'\n');
});
