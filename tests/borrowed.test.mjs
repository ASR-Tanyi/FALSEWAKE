import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {NightfallEngine} from '../web/nightfall-engine.js';
import {HollowReference,WORLDS,POOL,analyze} from './hollow-reference.mjs';

const caseId='borrowed-light';
const fixture=[11,20,13,9]; // The fixed arrangement uses a Drunk reader.
async function fresh(){
 const bytes=await readFile(new URL('../dist/nightfall.wasm',import.meta.url));
 const engine=new NightfallEngine((await WebAssembly.instantiate(bytes)).instance.exports);
 engine.reset(caseId);
 return engine;
}

function play(step){
 const read=(source,target)=>step(2,source,target).events.at(-1).value;
 step(2,10,4);
 const reversed=read(5,11)===0;
 const looksGood=target=>read(11,target)===Number(reversed);
 const firstLooksGood=looksGood(2);
 step(4,0,0);
 const firstMatches=read(5,2);
 step(2,10,6);
 const seventhIsGood=looksGood(6);
 step(4,0,0);
 step(2,10,3);
 const fourthIsGood=looksGood(3);
 const cleared=[];
 if(firstLooksGood&&!firstMatches)cleared.push(2);
 if(seventhIsGood)cleared.push(6);
 if(fourthIsGood)cleared.push(3);
 assert.ok(cleared.length<=1);
 const goodSeat=cleared[0]??9;
 const end=step(5,POOL^(1<<goodSeat),0);
 assert.equal(end.status,1);
 assert.equal(end.resolve,3);
 assert.ok(end.people.every(p=>p.alive));
}

test('the same evidence-based strategy wins all 48 arrangements in the independent model',()=>{
 const witnessed=new Set();
 for(const world of WORLDS)for(const drunk of [false,true]){
  const game=new HollowReference(world,drunk);
  witnessed.add(game.p.map(p=>p.role).join(','));
  play((...command)=>game.command(...command));
 }
 assert.equal(witnessed.size,48);
});

test('the authored watch and public analyst match the independent histories after every action',async()=>{
 const game=await fresh(),ref=new HollowReference(fixture,true);
 const before=game.snapshot();
 assert.deepEqual(before,ref.snapshot());
 assert.deepEqual(game.analysis(),{worlds:48,teams:4,good:4095^POOL,evil:0,drunk:0,smoke:0});
 assert.ok(before.people.every(p=>p.role===0&&p.team===-1));
 play((...command)=>{
  const state=game.command(...command);
  assert.deepEqual(state,ref.command(...command));
  const replay=game.export(),facts=game.analysis();
  assert.deepEqual(facts,analyze(replay.commands,state,[false,true]));
  assert.deepEqual(game.snapshot(),state);
  assert.deepEqual(game.export(),replay);
  if(command[0]===5){assert.equal(facts.teams,1);assert.equal(facts.evil,command[1]);}
  return state;
 });
 assert.equal(game.snapshot().people[11].role,9);
 assert.ok(game.snapshot().events.filter(e=>e.source===11&&e.kind===3).every(e=>e.truth===0));
});

test('an audit explains an earlier reading and cleansing cannot cure a Drunk',async()=>{
 const game=await fresh();
 game.command(2,11,4); // A certified, healthy Good reference seat.
 const first=game.snapshot().events.at(-1);
 assert.equal(first.value,1);assert.equal(first.truth,-1);
 game.command(2,5,11);assert.equal(game.snapshot().events.at(-1).value,0);
 assert.equal(game.analysis().drunk,1<<11);
 game.command(2,10,4);game.command(4);game.command(2,7,11);
 game.command(2,11,4);assert.equal(game.snapshot().events.at(-1).value,1);
 assert.deepEqual(game.snapshot().events[first.id],first);
});

test('chapter three replays round-trip and illegal cross-chapter imports restore every command',async()=>{
 const game=await fresh();
 game.command(2,10,4);game.command(2,5,11);
 const saved=game.export(),view=game.snapshot();
 assert.equal(saved.caseId,caseId);
 for(const other of ['warded-lantern','hollow-ward']){
  game.reset(other);game.command(2,1,11);
  const older=game.export(),olderView=game.snapshot();
  assert.throws(()=>game.replay({...saved,commands:[...saved.commands,[2,5,11]]}));
  assert.deepEqual(game.export(),older);assert.deepEqual(game.snapshot(),olderView);
  assert.deepEqual(game.replay(saved),view);
  assert.throws(()=>game.replay({...older,commands:[...older.commands,[2,1,11]]}));
  assert.deepEqual(game.export(),saved);assert.deepEqual(game.snapshot(),view);
  assert.deepEqual(game.replay(older),olderView);
 }
});
