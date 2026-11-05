// Presentation adapter only. Rules AND evidence replay live in nightfall.wasm.
import {t} from './i18n.js';
import {nightfallCase} from './nightfall-cases.js';
import {ERRORS as BASE_ERRORS} from './engine.js';
const ERRORS=[...BASE_ERRORS,
 'Only certified helpers may act in this investigation.',
 'Both nights are over. Reach your verdict before another night.',
 'Choose exactly three of the four suspects.',
 'Keep everyone alive through two nights before submitting a verdict.',
 'That trio has already been ruled out.'];
const int=n=>Number.isInteger(n)&&n>=-2147483648&&n<=2147483647;
export class NightfallEngine {
 constructor(api){
  for(const key of ['fn_version','fn_select','fn_reset','fn_command','fn_state','fn_person','fn_event','fn_entry','fn_analysis','fn_report_truth'])
   if(typeof api[key]!=='function')throw Error(t('Missing WASM export: {key}',{key}));
  if(api.fn_version()!==1)throw Error(t('Incompatible engine version.'));
  this.api=api;this.history=[];this.reset();
 }
 get caseId(){return this.api.fn_state(10)===2?'hollow-ward':'warded-lantern';}
 reset(caseId=this.caseId){
  const entry=nightfallCase(caseId);
  if(!entry)throw Error(t('Unknown Nightfall investigation.'));
  const error=this.api.fn_select(entry.number);
  if(error)throw Error(t('Unknown Nightfall investigation.'));
  this.history=[];return this.snapshot();
 }
 command(op,source=0,target=0){
  if(![op,source,target].every(int))throw Error(t('Actions require integer arguments.'));
  const error=this.api.fn_command(op,source,target);
  if(error)throw Error(t(ERRORS[error]||'The engine rejected this action.'));
  this.history.push([op,source,target]);return this.snapshot();
 }
 export(){return {version:1,kind:'nightfall',caseId:this.caseId,commands:this.history.map(c=>[...c])};}
 replay(data){
  if(!data||data.version!==1||data.kind!=='nightfall'||!nightfallCase(data.caseId)||
    !Array.isArray(data.commands)||data.commands.length>32||
    data.commands.some(c=>!Array.isArray(c)||c.length!==3||!c.every(int)))
   throw Error(t('This replay does not match Nightfall rules v1.'));
  const old=this.history.map(c=>[...c]),oldCase=this.caseId;this.reset(data.caseId);
  try{for(const c of data.commands)this.command(...c);}
  catch(error){this.reset(oldCase);for(const c of old)this.command(...c);throw error;}
  return this.snapshot();
 }
 analysis(){const a=this.api.fn_analysis;return {worlds:a(0),teams:a(1),good:a(2),evil:a(3),drunk:a(4),smoke:a(5)};}
 snapshot(){
  const a=this.api;
  return {day:a.fn_state(0),resolve:a.fn_state(1),actions:a.fn_state(2),status:a.fn_state(3),
   nightsLeft:a.fn_state(8),suspects:a.fn_state(9),
   people:Array.from({length:12},(_,i)=>({id:i,alive:!!a.fn_person(i,0),claim:a.fn_person(i,1),
    used:!!a.fn_person(i,3),marked:!!a.fn_person(i,4),ward:!!a.fn_person(i,5),role:a.fn_person(i,6),team:a.fn_person(i,7)})),
   events:Array.from({length:a.fn_state(5)},(_,i)=>({id:i,kind:a.fn_event(i,0),day:a.fn_event(i,1),source:a.fn_event(i,2),
    target:a.fn_event(i,3),value:a.fn_event(i,4),subjects:a.fn_event(i,5),truth:a.fn_report_truth(i)}))};
 }
}
export async function loadNightfall(){
 const response=await fetch(new URL('./nightfall.wasm',import.meta.url));
 if(!response.ok)throw Error(t('Engine download failed ({status}).',{status:response.status}));
 let module;try{module=await WebAssembly.instantiateStreaming(response.clone(),{});}
 catch{module=await WebAssembly.instantiate(await response.arrayBuffer(),{});}
 return new NightfallEngine(module.instance.exports);
}
