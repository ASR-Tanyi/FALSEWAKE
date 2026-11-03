import {t} from './i18n.js';
// Public ABI adapter. No game-rule fallback lives in the presentation layer.
export const ERRORS = ['', 'Invalid action or seat.', 'This case has ended.',
  'That villager is dead.', 'No investigations remain today.', 'That ability is already spent.',
  'This is a passive ability.', 'An execution has already been attempted today.',
  'Choose another villager.', 'That villager has no report to verify.', 'The case journal is full.'];
export class Engine {
  constructor(exports) {
    for (const key of ['fw_version','fw_reset','fw_command','fw_state','fw_person','fw_event'])
      if(typeof exports[key] !== 'function') throw new Error(t('Missing WASM export: {key}',{key}));
    if(exports.fw_version() !== 2) throw new Error(t('Incompatible engine version.'));
    this.api=exports; this.history=[]; this.api.fw_reset(0);
  }
  command(op, source=0, target=0) {
    if (![op,source,target].every(n=>Number.isInteger(n)&&n>=-2147483648&&n<=2147483647)) throw new Error(t('Actions require integer arguments.'));
    const result=this.api.fw_command(op,source,target);
    if(result) throw new Error(t(ERRORS[result] || 'The engine rejected this action.'));
    this.history.push([op,source,target]);
    return this.snapshot();
  }
  reset(seed=0) {
    if(!Number.isInteger(seed)||seed<0||seed>2147483647)throw new Error(t('Invalid disguise seed.'));
    const error=this.api.fw_reset(seed);if(error)throw new Error(t(ERRORS[error]));
    this.history=[];return this.snapshot();
  }
  replay(history,seed=0) {
    if(!Array.isArray(history)||history.length>200) throw new Error(t('Invalid saved history.'));
    this.reset(seed);
    try { for(const command of history) {
      if(!Array.isArray(command)||command.length!==3) throw new Error(t('Invalid saved action.'));
      this.command(...command);
    } } catch(error) { this.reset(seed); throw error; }
    return this.snapshot();
  }
  snapshot() {
    const a=this.api;
    return { seed:a.fw_state(6), day:a.fw_state(0), resolve:a.fw_state(1), actions:a.fw_state(2),
      status:a.fw_state(3), executed:!!a.fw_state(4),
      people:Array.from({length:12},(_,i)=>({ id:i, alive:!!a.fw_person(i,0),
        claim:a.fw_person(i,1), asked:!!a.fw_person(i,2), used:!!a.fw_person(i,3),
        marked:!!a.fw_person(i,4), ward:!!a.fw_person(i,5), role:a.fw_person(i,6),
        team:a.fw_person(i,7), spent:!!a.fw_person(i,8) })),
      events:Array.from({length:a.fw_state(5)},(_,i)=>({ id:i, kind:a.fw_event(i,0),
        day:a.fw_event(i,1), source:a.fw_event(i,2), target:a.fw_event(i,3), value:a.fw_event(i,4), subjects:a.fw_event(i,5) })) };
  }
}
export async function loadEngine() {
  const response=await fetch(new URL('./core.wasm',import.meta.url));
  if(!response.ok) throw new Error(t('Engine download failed ({status}).',{status:response.status}));
  let module;
  try { module=await WebAssembly.instantiateStreaming(response.clone(),{}); }
  catch { module=await WebAssembly.instantiate(await response.arrayBuffer(),{}); }
  return new Engine(module.instance.exports);
}
